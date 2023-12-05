package quizmap

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func sampleQuizMap() QuizMap {
	return QuizMap{
		"quiz1": {
			"que1": sampleQuestion(),
			"que2": sampleQuestion(),
		},
	}
}

func TestQuizMapUpdateAnswer(t *testing.T) {
	qm := sampleQuizMap()
	expected := sampleQuizMap()
	delete(expected["quiz1"]["que1"].SubQuestions["sub1"].Answers["ans1"], "att1")
	expected["quiz1"]["que1"].SubQuestions["sub1"].Answers["ans2"]["att1"] = setMember
	err := qm.UpdateAnswer("quiz1", "att1", "que1", map[string][]string{
		"sub1": {"ans2"},
		"sub2": {"ans1"},
	})
	if err != nil {
		t.Errorf("update answer: %s", err)
	}
	assert.Equal(t, expected, qm)
}

func TestQuizMapGetAnswers(t *testing.T) {
	qm := sampleQuizMap()
	err := qm.UpdateAnswer("quiz1", "att1", "que2", map[string][]string{
		"sub2": {"ans2"},
	})
	if err != nil {
		t.Errorf("update answer: %s", err)
	}
	expected := map[string]interface{}{
		"que1": map[string]interface{}{
			"sub1": map[string]interface{}{
				"ans1": 3,
				"ans2": 2,
			},
			"sub2": map[string]interface{}{
				"ans1": 2,
				"ans2": 3,
			},
		},
		"que2": map[string]interface{}{
			"sub1": map[string]interface{}{
				"ans1": 3,
				"ans2": 2,
			},
			"sub2": map[string]interface{}{
				"ans1": 1,
				"ans2": 4,
			},
		},
	}
	assert.Equal(t, expected, qm.GetAnswerCounts("quiz1", []string{"que1", "que2"}))
}
