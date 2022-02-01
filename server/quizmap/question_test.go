package quizmap

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func sampleQuestion() *Question {
	return &Question{
		SubQuestions: QuestionMap{
			"sub1": &Question{
				Answers: AnswerMap{
					"ans1": StringSet{
						"att1": setMember,
						"att2": setMember,
						"att3": setMember,
					},
					"ans2": StringSet{
						"att4": setMember,
						"att5": setMember,
					},
				},
			},
			"sub2": &Question{
				Answers: AnswerMap{
					"ans1": StringSet{
						"att1": setMember,
						"att5": setMember,
					},
					"ans2": StringSet{
						"att4": setMember,
						"att6": setMember,
						"att7": setMember,
					},
				},
			},
		},
	}
}

func TestQuestionUpdate(t *testing.T) {
	q := sampleQuestion()
	expected := sampleQuestion()
	delete(expected.SubQuestions["sub1"].Answers["ans1"], "att1")
	expected.SubQuestions["sub1"].Answers["ans2"]["att1"] = setMember
	err := q.Update("att1", map[string][]string{
		"sub1": {"ans2"},
		"sub2": {"ans1"},
	})
	if err != nil {
		t.Errorf("update: %s", err)
	}
	assert.Equal(t, expected, q)
}

func TestQuestionCounts(t *testing.T) {
	q := sampleQuestion()
	expected := map[string]interface{}{
		"sub1": map[string]interface{}{
			"ans1": 3,
			"ans2": 2,
		},
		"sub2": map[string]interface{}{
			"ans1": 2,
			"ans2": 3,
		},
	}
	assert.Equal(t, expected, q.ToCounts())
}
