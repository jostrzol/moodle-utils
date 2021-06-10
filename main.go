package main

import (
	"crypto/tls"
	"flag"
	"fmt"
	"log"
	"net/http"
)

type void struct{}

var setMember void

type StringSet map[string]void
type AnswerMap map[string]StringSet
type QuestionMap map[string]AnswerMap
type QuizMap map[string]QuestionMap

var quizMap = make(QuizMap)

type AnswerCounts map[string]int
type QuestionsAnswers map[string]AnswerCounts

func (q *QuizMap) updateAnswer(quiz string, question string, answers []string, attempt string) {
	questionMap := (*q)[quiz]
	if questionMap == nil {
		questionMap = make(QuestionMap)
		(*q)[quiz] = questionMap
	}
	answerMap := questionMap[question]
	if answerMap == nil {
		answerMap = make(AnswerMap)
		questionMap[question] = answerMap
	}

	// opt out from previous answers if any
	for _, v := range answerMap {
		delete(v, attempt)
	}

	// opt in for the selected answers
	for _, answer := range answers {
		if answer == "" {
			continue
		}
		stringSet := answerMap[answer]
		if stringSet == nil {
			stringSet = make(StringSet)
			answerMap[answer] = stringSet
		}
		stringSet[attempt] = setMember
	}
}

func (q *QuizMap) getAnswerCounts(quiz string, attempt string, questions []string) QuestionsAnswers {
	questionsAnswers := make(QuestionsAnswers, len(questions))

	questionMap := (*q)[quiz]
	if questionMap == nil {
		questionMap = make(QuestionMap)
		(*q)[quiz] = questionMap
	}

	for _, question := range questions {
		answerMap := questionMap[question]
		if answerMap == nil {
			continue
		}
		questionsAnswers[question] = make(AnswerCounts)
		answerCounts := questionsAnswers[question]
		for k, v := range answerMap {
			count := len(v)
			// if _, exists := v[attempt]; exists {
			// 	count -= 1
			// }
			if count == 0 {
				delete(answerMap, k)
			} else {
				answerCounts[k] = count
			}
		}
	}
	return questionsAnswers
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
	var certificate = flag.String("c", "", "tls certificate (*.crt) filename")
	var key = flag.String("k", "", "tls private key (*.key) filename")
	var port = flag.String("p", "443", "port, dafaults to 443")

	flag.Parse()
	if *certificate == "" {
		log.Fatal("-c is required")

	} else if *key == "" {
		log.Fatal("-k is required")
	}

	cert, err := tls.LoadX509KeyPair(*certificate, *key)
	if err != nil {
		log.Fatal(err)
	}

	s := &http.Server{
		Addr:    ":" + *port,
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
