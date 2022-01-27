package quizmap

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/sirupsen/logrus"
)

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

func (q *QuizMap) GatherFormHandler(w http.ResponseWriter, r *http.Request) error {
	logrus.WithField("ip", r.RemoteAddr).Info("gathering form")
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return nil
	}

	err := parseForm(r, "cmid", "attempt")
	if err != nil {
		return fmt.Errorf("gatherFormHandler: %w", err)
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
		q.UpdateAnswer(r.Form["cmid"][0], k, v, r.Form["attempt"][0])
	}
	logrus.WithField("ip", r.RemoteAddr).Info("gathering form successfull")
	return nil
}

func (q *QuizMap) GetAnswersHandler(w http.ResponseWriter, r *http.Request) error {
	logrus.WithField("ip", r.RemoteAddr).Info("returning answers")
	enableCors(&w)
	err := parseForm(r, "cmid", "attempt", "q")
	if err != nil {
		return fmt.Errorf("getAnswersHandler: %w", err)
	}
	questionsAnswers := q.GetAnswerCounts(r.Form["cmid"][0], r.Form["attempt"][0], r.Form["q"])
	encoder := json.NewEncoder(w)
	err = encoder.Encode(questionsAnswers)
	if err != nil {
		return fmt.Errorf("getAnswersHandler: json encode: %w", err)
	}
	logrus.WithField("ip", r.RemoteAddr).Info("returning answers successfull")
	return nil
}

func (q *QuizMap) RootHandler(w http.ResponseWriter, r *http.Request) error {
	logrus.WithField("ip", r.RemoteAddr).Info("handling root")
	http.NotFound(w, r)
	logrus.WithField("ip", r.RemoteAddr).Info("handling root successfull")
	return nil
}
