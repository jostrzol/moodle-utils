package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	qm "github.com/Ogurczak/moodle-utils/server/quizmap"
	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
)

type QuizMapHandler func(http.ResponseWriter, *http.Request, *qm.QuizMap) error

func gatherFormHandler(w http.ResponseWriter, r *http.Request, quizMap *qm.QuizMap) error {
	vars := mux.Vars(r)
	err := r.ParseForm()
	if err != nil {
		return fmt.Errorf("gatherFormHandler: parse form: %w", err)
	}

	var answers map[string][]string
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
		quizMap.UpdateAnswer(vars["cmid"], k, v, vars["attempt"])
	}
	return nil
}

func getAnswersHandler(w http.ResponseWriter, r *http.Request, quizMap *qm.QuizMap) error {
	vars := mux.Vars(r)
	err := r.ParseForm()
	if err != nil {
		return fmt.Errorf("getAnswersHandler: parse form: %w", err)
	}

	questionsAnswers := quizMap.GetAnswerCounts(vars["cmid"], vars["attempt"], r.Form["q"])
	encoder := json.NewEncoder(w)
	err = encoder.Encode(questionsAnswers)
	if err != nil {
		return fmt.Errorf("getAnswersHandler: json encode: %w", err)
	}
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

func handlerWrapper(quizMap *qm.QuizMap, f QuizMapHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log := logrus.WithFields(logrus.Fields{
			"ip":       r.RemoteAddr,
			"endpoint": r.URL.Path,
		})

		log.Info("resolving query")
		err := f(w, r, quizMap)
		if err == nil {
			log.Info("query resolved successfully")
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
			errLog.WithFields(logrus.Fields{
				"header":  r.Header,
				"form":    r.Form,
				"raw-uri": r.RequestURI,
			})
		}
		errLog.Error("handler error")
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

func injectHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}
