package main

import (
	"crypto/tls"
	"errors"
	"io/fs"
	"net/http"
	"time"

	qm "github.com/krisboorger/moodle-utils/server/quizmap"
	"github.com/mattn/go-colorable"
	"github.com/sirupsen/logrus"
	"github.com/snowzach/rotatefilehook"
)

// initConsoleLogger initializes the console logger
func initConsoleLogger(config *ServerConfig) {
	logrus.SetLevel(config.consoleLogLevel)
	logrus.SetOutput(colorable.NewColorableStdout())
	logrus.SetFormatter(&logrus.TextFormatter{
		ForceColors:     true,
		FullTimestamp:   true,
		TimestampFormat: time.RFC822,
	})
}

// initFileLogger initializes the file logger
func initFileLogger(config *ServerConfig) {
	rotateFileHook, err := rotatefilehook.NewRotateFileHook(rotatefilehook.RotateFileConfig{
		Filename:   config.logFilename,
		MaxSize:    50,
		MaxBackups: 3,
		MaxAge:     28,
		Level:      config.fileLogLevel,
		Formatter: &logrus.JSONFormatter{
			TimestampFormat: time.RFC822,
		},
	})

	if err != nil {
		logrus.WithError(err).Fatal("failed to initialize file rotate hook")
	}

	logrus.AddHook(rotateFileHook)
}

// initServer initializes the server (without handlers)
func initServer(config *ServerConfig) (*http.Server, bool) {
	isTLS := false
	if config.certificate != "" || config.key != "" {
		if config.certificate != "" && config.key != "" {
			isTLS = true
		} else {
			logrus.Fatal("both certificate and key must be set for a tls server")
		}
	}

	if config.port == "" {
		if isTLS {
			config.port = "443"
		} else {
			config.port = "80"
		}
	}

	server := &http.Server{
		Addr:         ":" + config.port,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	if isTLS {
		cert, err := tls.LoadX509KeyPair(config.certificate, config.key)
		if err != nil {
			logrus.WithError(err).Fatal("error parsing the certificate")
		}
		server.TLSConfig = &tls.Config{
			Certificates: []tls.Certificate{cert},
		}
		logrus.Info("server will run in tls mode")
	}

	return server, isTLS
}

// initQuizMap initializes QuizMap, enables autosave and registers
// logrus defer exit handler to save the QuizMap
// returns the QuizMap and function for saving the QuizMap
func initQuizMap(config *ServerConfig) (qm.QuizMap, func()) {
	quizMap := qm.QuizMap{}
	save := func() {}

	if config.saveFilename != "" {
		logEntry := logrus.WithField("save-file", config.saveFilename)

		logrus.Info("loading quiz map")
		err := quizMap.Load(config.saveFilename)
		switch {
		case errors.Is(err, fs.ErrNotExist):
			logEntry.Warn("save file doesn't exist - new blank quiz map is created")
		case errors.Is(err, qm.ErrFileEmpty):
			logEntry.Warn("save file is empty - new blank quiz map is created")
		case err != nil:
			logEntry.WithError(err).Fatal("could not load quiz map")
		}

		if config.bakFilename == "" {
			config.bakFilename = config.saveFilename + ".bak"
		}

		save = func() {
			logEntry = logEntry.WithField("bak-file", config.bakFilename)
			logEntry.Info("saving quiz map")
			err = quizMap.Save(config.saveFilename, config.bakFilename)
			if err != nil {
				// dont fatal to avoid call cycle,
				// bacause save is called on logrus fatal too
				// (see below line: logrus.DeferExitHandler(save))
				logrus.WithError(err).Error("could not save quiz map")
			}
		}

		logrus.DeferExitHandler(save)
		if config.autosaveInterval > 0 {
			go func() {
				for {
					time.Sleep(config.autosaveInterval)
					save()
				}
			}()
		}
	}
	return quizMap, save
}
