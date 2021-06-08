package main

import (
	"encoding/json"
	"net/http"
	"text/template"
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

	var answers map[string]string
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
	err := parseForm(r)
	if err != nil {
		return err, http.StatusBadRequest
	}
	answerCounts := quizMap.getAnswerCounts(r.Form["cmid"][0], r.Form["question"][0], r.Form["attempt"][0])
	encoder := json.NewEncoder(w)
	return encoder.Encode(answerCounts), http.StatusInternalServerError
}

func rootHandler(w http.ResponseWriter, r *http.Request) (error, int) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return nil, 0
	}

	t, err := template.ParseFiles("dump/test.html")
	if err != nil {
		return err, http.StatusInternalServerError
	}

	return t.Execute(w, nil), http.StatusInternalServerError
}

func errHandlerWrapper(f func(w http.ResponseWriter, r *http.Request) (error, int)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		err, status := f(w, r)
		if err != nil {
			http.Error(w, err.Error(), status)
		}
	}
}
