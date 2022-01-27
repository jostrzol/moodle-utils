package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"

	qm "github.com/Ogurczak/moodle-utils/quizmap"
	"github.com/sirupsen/logrus"
)

func logLevelParser(result *logrus.Level, defaultLevel logrus.Level) func(string) error {
	return func(raw string) error {
		if raw == "" {
			*result = defaultLevel
			return nil
		} else if parsed, err := strconv.ParseUint(raw, 10, 32); err == nil {
			if parsed <= 6 {
				*result = logrus.Level(parsed)
				return err
			} else {
				return fmt.Errorf("Log level bust be an integer in range 0..6")
			}
		} else {
			parsed, err := logrus.ParseLevel(raw)
			*result = parsed
			return err
		}
	}
}

func flagLogLevel(name string, defaultLevel logrus.Level, usage string) *logrus.Level {
	var logLevel logrus.Level
	flag.Func(name, usage+" (0..6 or level name)", logLevelParser(&logLevel, defaultLevel))
	return &logLevel
}

func saveQuizMapWrapper(quizMap qm.QuizMap, filename string, bakFilename string) func() {
	return func() {
		logrus.Info("beginning quiz map save procedure")
		logrus.Info("opening save file")
		saveFile, err := os.OpenFile(filename, os.O_RDWR|os.O_CREATE, 0755)
		if err != nil {
			logrus.WithError(err).WithField("filename", filename).
				Error("cannot open save file")
			return
		}
		defer saveFile.Close()

		logrus.Info("opening backup file")
		bakFile, err := os.Create(bakFilename)
		if err != nil {
			logrus.WithError(err).WithField("bakFilename", bakFilename).
				Error("cannot open backup file")
			return
		}
		defer bakFile.Close()

		logrus.Info("backing up old save file")
		_, err = io.Copy(bakFile, saveFile)
		if err != nil {
			logrus.WithError(err).WithFields(logrus.Fields{
				"filename":    filename,
				"bakFilename": bakFilename,
			}).Error("cannot open backup old save file")
			return
		}
		bakFile.Close()

		logrus.Info("truncating save file")
		err = saveFile.Truncate(0)
		if err != nil {
			logrus.WithError(err).WithField("filename", filename).
				Error("cannot truncate save file")
			return
		}
		_, err = saveFile.Seek(0, 0)
		if err != nil {
			logrus.WithError(err).WithField("filename", filename).
				Error("cannot truncate save file")
			return
		}

		logrus.Info("saving")
		err = quizMap.Save(saveFile)
		if err != nil {
			logrus.WithError(err).WithField("filename", filename).
				Error("cannot save quiz map to file")
		} else {
			logrus.Info("quiz map saved successfully")
		}
	}
}
func tryLoadQuizMap(quizMap *qm.QuizMap, filename string) bool {
	logrus.Info("beggining quiz map load precedure")

	logrus.Info("opening save file")
	saveFile, err := os.Open(filename)
	switch err {
	case os.ErrNotExist:
		logrus.Info("save file doesn't exist")
		logrus.Info("abort quiz map load procedure")
		return false
	default:
		if err != nil {
			logrus.WithError(err).WithField("filename", filename).
				Fatal("cannot open save file")
		}
	}
	defer saveFile.Close()

	logrus.Info("decoding save file")
	decoder := json.NewDecoder(saveFile)
	err = decoder.Decode(quizMap)
	if err != nil {
		logrus.WithError(err).WithField("filename", filename).
			Fatal("cannot decode save file")
	}
	logrus.Info("quiz map loaded successfully")

	return true
}

func main() {
	var (
		port             = flag.String("p", "", "port")
		certificate      = flag.String("c", "", "tls certificate for https server (*.crt) filename")
		key              = flag.String("k", "", "tls private key for https server (*.key) filename")
		autosaveInterval = flag.Duration("autosave-interval", 0, "autosave interval (with unit)")
		saveFilename     = flag.String("save-file", "", "file to save quiz map to (if empty won't save)")
		bakFilename      = flag.String("bak-file", "", "file to backup last saved quiz map to (defaults to <save-file>.bak)")
		logFilename      = flag.String("log-file", "", "file to save logs to (if empty won't save)")
		consoleLogLevel  = flagLogLevel("console-log-level", logrus.WarnLevel, "log level of console")
		fileLogLevel     = flagLogLevel("file-log-level", logrus.InfoLevel, "log level of logfile")
	)

	flag.Parse()

	initConsoleLogger(*consoleLogLevel)
	if *logFilename != "" {
		initFileLogger(*logFilename, *fileLogLevel)
	}
	logrus.Info("initialized loggers")

	server, isTLS := initServer(*port, *certificate, *key)
	logrus.Info("initialized server")

	quizMap := qm.New()
	if *saveFilename != "" {
		tryLoadQuizMap(quizMap, *saveFilename)

		if *bakFilename == "" {
			*bakFilename = *saveFilename + ".bak"
		}
		saveQuizMap := saveQuizMapWrapper(*quizMap, *saveFilename, *bakFilename)

		defer saveQuizMap()
		logrus.DeferExitHandler(saveQuizMap)
		if *autosaveInterval > 0 {
			go func() {
				for {
					time.Sleep(*autosaveInterval)
					logrus.Info("autosaving...")
					saveQuizMap()
				}
			}()
		}
	}
	logrus.Info("initialized quiz map")

	http.HandleFunc("/", qm.HandlerWrapper(quizMap.RootHandler))
	http.HandleFunc("/gather-form", qm.HandlerWrapper(quizMap.GatherFormHandler))
	http.HandleFunc("/get-answers", qm.HandlerWrapper(quizMap.GetAnswersHandler))

	logrus.Info("starting server")
	var err error
	if isTLS {
		err = server.ListenAndServeTLS("", "")
	} else {
		err = server.ListenAndServe()
	}

	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		logrus.WithField("error", err).Fatal("fatal server error")
	}
}
