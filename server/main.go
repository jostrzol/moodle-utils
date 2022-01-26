package main

import (
	"crypto/tls"
	"flag"
	"fmt"
	"net/http"
	"os"

	log "github.com/sirupsen/logrus"
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
	var port = flag.String("p", "", "port")
	var isTLS = flag.Bool("s", false, "run a https server instead of http")
	var certificate = flag.String("c", "", "tls certificate for https server (*.crt) filename")
	var key = flag.String("k", "", "tls private key for https server (*.key) filename")

	flag.Parse()

	s := &http.Server{
		Addr:    ":" + *port,
		Handler: nil,
	}

	if *port == "" {
		if *isTLS {
			*port = "443"
		} else {
			*port = "80"
		}
	}

	if *isTLS {

		if *certificate == "" {
			fmt.Fprintln(os.Stderr, "-c is required")
			flag.Usage()
			os.Exit(1)

		} else if *key == "" {
			fmt.Fprintln(os.Stderr, "-k is required")
			flag.Usage()
			os.Exit(1)
		}
		cert, err := tls.LoadX509KeyPair(*certificate, *key)
		if err != nil {
			log.Fatal(err)
		}
		s.TLSConfig = &tls.Config{
			Certificates: []tls.Certificate{cert},
		}
	}

	http.HandleFunc("/", errHandlerWrapper(rootHandler))
	http.HandleFunc("/gather-form", errHandlerWrapper(gatherFormHandler))
	http.HandleFunc("/get-answers", errHandlerWrapper(getAnswersHandler))

	if *isTLS {
		log.Fatal(s.ListenAndServeTLS("", ""))
	} else {
		log.Fatal(s.ListenAndServe())
	}
}
