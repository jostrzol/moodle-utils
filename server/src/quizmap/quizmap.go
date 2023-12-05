package quizmap

type QuizMap map[string]QuestionMap

func (q QuizMap) UpdateAnswer(quiz string, attempt string, questionName string, newAnswers interface{}) error {
	questionMap := q[quiz]
	if questionMap == nil {
		questionMap = make(QuestionMap)
		q[quiz] = questionMap
	}
	question := questionMap[questionName]
	if question == nil {
		question = &Question{}
		questionMap[questionName] = question
	}

	return question.Update(attempt, newAnswers)
}

func (q QuizMap) GetAnswerCounts(quiz string, questionNames []string) map[string]interface{} {
	result := make(map[string]interface{}, len(questionNames))

	questionMap := q[quiz]
	if questionMap == nil {
		// not even question map is present
		// return blank map
		return result
	}

	for _, questionName := range questionNames {
		question := questionMap[questionName]
		if question == nil {
			continue
		}
		result[questionName] = question.ToCounts()
	}
	return result
}

func (q QuizMap) ResetAnswer(quiz string, attempt string, questionNames []string) {
	questionMap := q[quiz]
	if questionMap == nil {
		// not even question map is present
		return
	}

	for _, questionName := range questionNames {
		question := questionMap[questionName]
		if question == nil {
			continue
		}
		question.Reset(attempt)
	}
}
