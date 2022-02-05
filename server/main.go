package main

import (
	"context"
	"errors"
	"flag"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
)

type ServerConfig struct {
	port             string
	certificate      string
	key              string
	autosaveInterval time.Duration
	saveFilename     string
	bakFilename      string
	logFilename      string
	consoleLogLevel  logrus.Level
	fileLogLevel     logrus.Level
}

func main() {
	// parse arguments

	config := &ServerConfig{}
	flag.StringVar(&config.port, "p", "", "port")
	flag.StringVar(&config.certificate, "c", "", "tls certificate for https server (*.crt) filename")
	flag.StringVar(&config.key, "k", "", "tls private key for https server (*.key) filename")
	flag.DurationVar(&config.autosaveInterval, "autosave-interval", 0, "autosave interval (with unit)")
	flag.StringVar(&config.saveFilename, "save-file", "", "file to save quiz map to (if empty won't save)")
	flag.StringVar(&config.bakFilename, "bak-file", "", "file to backup last saved quiz map to (defaults to <save-file>.bak)")
	flag.StringVar(&config.logFilename, "log-file", "", "file to save logs to (if empty won't save)")
	flagLogLevelVar(&config.consoleLogLevel, "console-log-level", logrus.WarnLevel, "log level of console")
	flagLogLevelVar(&config.fileLogLevel, "file-log-level", logrus.InfoLevel, "log level of logfile")

	flag.Parse()

	// init loggers
	initConsoleLogger(config)
	if config.logFilename != "" {
		initFileLogger(config)
	}
	logrus.Debug("loggers initialized")

	// init server
	logrus.Debug("initializing server")
	server, isTLS := initServer(config)

	// init quiz map
	logrus.Debug("initializing quiz map")

	quizMap, save := initQuizMap(config)
	defer save()

	// init router
	logrus.Debug("initializing router")

	r := mux.NewRouter()

	sWithQuiz := r.Queries("cmid", "{cmid:[0-9]+}").Subrouter()
	sWithQuiz.Use(injectHeaders)
	sWithQuiz.Use(mux.CORSMethodMiddleware(sWithQuiz))
	sWithQuiz.Use(handleOptions)

	sWithQuiz.HandleFunc("/gather-form", handlerWrapper(quizMap, gatherFormHandler)).
		Methods(http.MethodPost, http.MethodOptions).
		Queries("attempt", "{attempt:[0-9]+}")
	sWithQuiz.HandleFunc("/get-answers", handlerWrapper(quizMap, getAnswersHandler)).
		Methods(http.MethodGet, http.MethodOptions)
	sWithQuiz.HandleFunc("/reset-answers", handlerWrapper(quizMap, resetAnswersHandler)).
		Methods(http.MethodDelete, http.MethodOptions).
		Queries("attempt", "{attempt:[0-9]+}")

	http.HandleFunc("/", r.ServeHTTP)

	// start server
	cShutdown := make(chan error, 1)
	logrus.Info("starting server")
	go func() {
		if isTLS {
			cShutdown <- server.ListenAndServeTLS("", "")
		} else {
			cShutdown <- server.ListenAndServe()
		}
	}()

	// handling shutdown
	logrus.Debug("registering interrupt handler")
	cInterrupt := make(chan os.Signal, 1)
	signal.Notify(cInterrupt, os.Interrupt)
	logrus.Debug("interrupt handler registered")

	select {
	case err := <-cShutdown:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			logrus.WithError(err).Fatal("fatal server error")
		}
	case <-cInterrupt:
		logrus.Debug("received interrupt signal")
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()

		logrus.Debug("shutting down server")
		err := server.Shutdown(ctx)
		if err != nil {
			logrus.WithError(err).Fatal("server shutdown error")
		}
	}
	logrus.Info("server shut down")
}
