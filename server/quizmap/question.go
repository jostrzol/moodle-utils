package quizmap

import (
	"errors"
	"reflect"
)

type void struct{}

var setMember void

type AttemptSet map[string]void
type AnswerMap map[string]AttemptSet
type QuestionMap map[string]*Question

type Question struct {
	SubQuestions QuestionMap
	Answers      AnswerMap
}

func deepElem(value reflect.Value) reflect.Value {
	for value.Kind() == reflect.Ptr || value.Kind() == reflect.Interface {
		value = value.Elem()
	}
	return value
}

var ErrAnswerMalformed = errors.New("answer map malformed")
var ErrNotFinalSubquestion = errors.New("not final subquestion - can't edit answers")
var ErrFinalSubquestion = errors.New("final subquestion - can't edit it's subquestions")

func (q *Question) Update(attempt string, newAnswers interface{}) error {
	value := deepElem(reflect.ValueOf(newAnswers))
	switch value.Kind() {
	case reflect.Map:
		if q.Answers != nil {
			return ErrFinalSubquestion
		}
		if q.SubQuestions == nil {
			q.SubQuestions = QuestionMap{}
		}
		for _, subQNameValue := range value.MapKeys() {
			if subQNameValue.Kind() != reflect.String {
				return ErrAnswerMalformed
			}

			subQName := subQNameValue.String()
			subQAnswers := value.MapIndex(subQNameValue).Interface()

			subQuestion := q.SubQuestions[subQName]
			if subQuestion == nil {
				subQuestion = &Question{}
				q.SubQuestions[subQName] = subQuestion
			}
			err := subQuestion.Update(attempt, subQAnswers)
			if err != nil {
				return err
			}
		}
	case reflect.Slice, reflect.Array:
		if q.SubQuestions != nil {
			return ErrNotFinalSubquestion
		}
		if q.Answers == nil {
			q.Answers = AnswerMap{}
		}

		// opt out from previous answers
		for answer, answerSet := range q.Answers {
			delete(answerSet, attempt)
			if len(answerSet) == 0 {
				delete(q.Answers, answer)
			}
		}

		// opt in for the selected answers
		for i := 0; i < value.Len(); i++ {
			answerValue := deepElem(value.Index(i))
			if answerValue.Kind() != reflect.String {
				return ErrAnswerMalformed
			}
			answer := answerValue.String()

			if answer == "" {
				continue
			}
			stringSet := q.Answers[answer]
			if stringSet == nil {
				stringSet = make(AttemptSet)
				q.Answers[answer] = stringSet
			}
			stringSet[attempt] = setMember
		}
	default:
		return ErrAnswerMalformed
	}
	return nil
}

func (q *Question) ToCounts() map[string]interface{} {
	result := make(map[string]interface{})
	if q.SubQuestions != nil {
		// has sub question(s), call ToCounts on them
		for subQName, subQ := range q.SubQuestions {
			result[subQName] = subQ.ToCounts()
		}
		return result
	} else if q.Answers != nil {
		// last sub question, return answers
		for answer, answerSet := range q.Answers {
			result[answer] = len(answerSet)
		}
		return result
	}
	// both are nil - dangling question
	return result
}

func (q *Question) Reset(attempt string) {
	if q.SubQuestions != nil {
		// has sub question(s), call Reset on them
		for _, subQ := range q.SubQuestions {
			subQ.Reset(attempt)
		}
	} else if q.Answers != nil {
		// last sub question, reset answers
		for _, answerSet := range q.Answers {
			delete(answerSet, attempt)
		}
	}
	// both are nil - dangling question
}
