package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"runtime/debug"

	qm "github.com/Ogurczak/moodle-utils/server/quizmap"
	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
)

type QuizMapHandler func(http.ResponseWriter, *http.Request, qm.QuizMap) error

func gatherFormHandler(w http.ResponseWriter, r *http.Request, quizMap qm.QuizMap) error {
	vars := mux.Vars(r)
	err := r.ParseForm()
	if err != nil {
		return fmt.Errorf("gatherFormHandler: parse form: %w", err)
	}

	var answers map[string]interface{}
	d := json.NewDecoder(r.Body)
	err = d.Decode(&answers)
	if err != nil {
		return &ErrHTTP{
			error:       fmt.Errorf("gatherFormHandler: json decode: %w", err),
			HTTPMessage: "cannot parse data",
			HTTPStatus:  http.StatusBadRequest,
		}
	}

	for k, v := range answers {
		err := quizMap.UpdateAnswer(vars["cmid"], vars["attempt"], k, v)
		if err != nil {
			return &ErrHTTP{
				error:       fmt.Errorf("gatherFormHandler: update answer: %w", err),
				HTTPMessage: "malformed answer map passed",
				HTTPStatus:  http.StatusBadRequest,
			}
		}
	}
	return nil
}

func getAnswersHandler(w http.ResponseWriter, r *http.Request, quizMap qm.QuizMap) error {
	vars := mux.Vars(r)
	err := r.ParseForm()
	if err != nil {
		return fmt.Errorf("getAnswersHandler: parse form: %w", err)
	}

	questionsAnswers := quizMap.GetAnswerCounts(vars["cmid"], r.Form["q"])
	encoder := json.NewEncoder(w)
	err = encoder.Encode(questionsAnswers)
	if err != nil {
		return fmt.Errorf("getAnswersHandler: json encode: %w", err)
	}
	return nil
}

func resetAnswersHandler(w http.ResponseWriter, r *http.Request, quizMap qm.QuizMap) error {
	vars := mux.Vars(r)
	err := r.ParseForm()
	if err != nil {
		return fmt.Errorf("resetAnswersHandler: parse form: %w", err)
	}

	quizMap.ResetAnswer(vars["cmid"], vars["attempt"], r.Form["q"])
	return nil
}

// ErrHTTP represtents an error that can be replied to HTTP client
type ErrHTTP struct {
	error
	HTTPMessage string
	HTTPStatus  int
}

// Reply writes a response describing this error to the client
func (e *ErrHTTP) Reply(w http.ResponseWriter) {
	http.Error(w, e.HTTPMessage, e.HTTPStatus)
}

func withRequestDetails(log *logrus.Entry, r *http.Request) *logrus.Entry {
	log = log.WithFields(logrus.Fields{
		"raw-uri": r.RequestURI,
		"header":  r.Header,
	})
	err := r.ParseForm()
	if err != nil {
		log.WithError(err).Error("request parse form error")
	}
	return log.WithField("form", r.Form)
}

func handlerWrapper(quizMap qm.QuizMap, f QuizMapHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log := logrus.WithFields(logrus.Fields{
			"ip":       r.RemoteAddr,
			"endpoint": r.URL.Path,
		})

		log.Debug("resolving request")
		defer func() {
			if err := recover(); err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				errLog := withRequestDetails(log, r)
				if errReal, ok := err.(error); ok {
					errLog = errLog.WithError(errReal)
				}
				errLog.Errorf("PANIC during request reselvement!: %v\nstacktrace: %s\n", err, debug.Stack())
			}
		}()
		err := f(w, r, quizMap)
		if err == nil {
			log.Debug("request resolved successfully")
			return
		}

		var errHTTP *ErrHTTP
		if !errors.As(err, &errHTTP) {
			errHTTP = &ErrHTTP{
				error:       err,
				HTTPMessage: "Internal server error",
				HTTPStatus:  http.StatusInternalServerError,
			}
		}

		errHTTP.Reply(w)
		errLog := log.WithError(errHTTP)
		if errHTTP.HTTPStatus == http.StatusInternalServerError {
			// add details if error is internal
			errLog = withRequestDetails(errLog, r)
		}
		errLog.Errorf("request resolvement error")
	}
}

func handleOptions(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
		} else {
			next.ServeHTTP(w, r)
		}
	})
}

func injectCORSHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		next.ServeHTTP(w, r)
	})
}

func injectContentTypeHeader(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}
