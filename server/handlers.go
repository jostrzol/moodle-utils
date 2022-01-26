package main

import (
	"encoding/json"
	"net/http"
)

func gatherFormHandler(w http.ResponseWriter, r *http.Request) (error, int) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return nil, 0
	}

	err := parseForm(r, "cmid", "attempt")
	if err != nil {
		return err, http.StatusBadRequest
	}

	var answers map[string][]string
	d := json.NewDecoder(r.Body)
	err = d.Decode(&answers)
	if err != nil {
		return err, http.StatusBadRequest
	}

	for k, v := range answers {
		quizMap.updateAnswer(r.Form["cmid"][0], k, v, r.Form["attempt"][0])
	}
	return nil, 0
}

func getAnswersHandler(w http.ResponseWriter, r *http.Request) (error, int) {
	enableCors(&w)
	err := parseForm(r, "cmid", "attempt", "q")
	if err != nil {
		return err, http.StatusBadRequest
	}
	questionsAnswers := quizMap.getAnswerCounts(r.Form["cmid"][0], r.Form["attempt"][0], r.Form["q"])
	encoder := json.NewEncoder(w)
	return encoder.Encode(questionsAnswers), http.StatusInternalServerError
}

func rootHandler(w http.ResponseWriter, r *http.Request) (error, int) {
	http.NotFound(w, r)
	return nil, 0
}

func errHandlerWrapper(f func(w http.ResponseWriter, r *http.Request) (error, int)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		err, status := f(w, r)
		if err != nil {
			http.Error(w, err.Error(), status)
		}
	}
}
