package main

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
)

type void struct{}

var setMember void

type stringSetT map[string]void
type answerMapT map[string]stringSetT
type questionMapT map[string]answerMapT
type quizMapT map[string]questionMapT

var quizMap = make(quizMapT)

type answerCountsT map[string]int

func (q *quizMapT) updateAnswer(quiz string, question string, answer string, attempt string) {
	questionMap := (*q)[quiz]
	if questionMap == nil {
		questionMap = make(questionMapT)
		(*q)[quiz] = questionMap
	}
	answerMap := questionMap[question]
	if answerMap == nil {
		answerMap = make(answerMapT)
		questionMap[question] = answerMap
	}

	// opt out from previous answers if any
	for _, v := range answerMap {
		delete(v, attempt)
	}

	// opt in for the selected answer
	if answer != "" {
		stringSet := answerMap[answer]
		if stringSet == nil {
			stringSet = make(stringSetT)
			answerMap[answer] = stringSet
		}
		stringSet[attempt] = setMember
	}
}

func (q *quizMapT) getAnswerCounts(quiz string, question string, attempt string) answerCountsT {
	questionMap := (*q)[quiz]
	if questionMap == nil {
		questionMap = make(questionMapT)
		(*q)[quiz] = questionMap
	}
	answerMap := questionMap[question]
	if answerMap == nil {
		answerMap = make(answerMapT)
		questionMap[question] = answerMap
	}
	answerCounts := make(answerCountsT, len(answerMap))
	for k, v := range answerMap {
		count := len(v)
		// if _, exists := v[attempt]; exists {
		// 	count -= 1
		// }
		answerCounts[k] = count
	}
	return answerCounts
}

func parseForm(r *http.Request, required ...string) error {
	err := r.ParseForm()
	if err != nil {
		return err
	}
	for _, req := range required {
		if r.Form[req] == nil {
			return fmt.Errorf("No required urlencoded value '%s' found", req)
		}
	}
	return nil
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "*")
	(*w).Header().Set("Access-Control-Allow-Headers", "*")
	(*w).Header().Set("Content-Type", "application/json")
}

func main() {

	cert, _ := tls.LoadX509KeyPair("tls/ogurczak.crt", "tls/ogurczak.key")

	s := &http.Server{
		Addr:    ":8080",
		Handler: nil,
		TLSConfig: &tls.Config{
			Certificates: []tls.Certificate{cert},
		},
	}

	http.HandleFunc("/", errHandlerWrapper(rootHandler))
	http.HandleFunc("/gather-form", errHandlerWrapper(gatherFormHandler))
	http.HandleFunc("/get-answers", errHandlerWrapper(getAnswersHandler))

	log.Fatal(s.ListenAndServeTLS("", ""))
}
