package quizmap

import (
	"encoding/json"
	"fmt"
	"io"
)

type void struct{}

var setMember void

type StringSet map[string]void
type AnswerMap map[string]StringSet
type QuestionMap map[string]AnswerMap
type QuizMap map[string]QuestionMap

type AnswerCounts map[string]int
type QuestionsAnswers map[string]AnswerCounts

func New() *QuizMap {
	q := make(QuizMap)
	return &q
}

func (q *QuizMap) UpdateAnswer(quiz string, question string, answers []string, attempt string) {
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

func (q *QuizMap) GetAnswerCounts(quiz string, attempt string, questions []string) QuestionsAnswers {
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

func (q *QuizMap) Save(dst io.Writer) error {
	encoder := json.NewEncoder(dst)
	encoder.SetIndent("", "")
	err := encoder.Encode(q)
	if err != nil {
		return fmt.Errorf("quiz map save: %w", err)
	}
	return nil
}
