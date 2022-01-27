package quizmap

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/sirupsen/logrus"
)

// ErrMissingFormValue represtents failure in parsing a form because required value is missing
type ErrMissingFormValue struct {
	FormValueName string
}

// NewErrMissingFormValue returns a pointer to a new instance of ErrMissingFormValue
func NewErrMissingFormValue(FormValueName string) *ErrMissingFormValue {
	return &ErrMissingFormValue{
		FormValueName: FormValueName,
	}
}
func (e *ErrMissingFormValue) Error() string {
	return fmt.Sprintf("missing form value '%s'", e.FormValueName)
}

func HandlerWrapper(f func(w http.ResponseWriter, r *http.Request) error) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		err := f(w, r)
		if err == nil {
			return
		}

		var errHTTP *ErrHTTP
		if !errors.As(err, &errHTTP) {
			errHTTP = &ErrHTTP{
				error:       err,
				HTTPMessage: "Internal server error",
				HTTPStatus:  http.StatusInternalServerError,
			}
		}
		errHTTP.Reply(w)
		entry := logrus.WithError(errHTTP)
		if errHTTP.HTTPStatus == http.StatusInternalServerError {
			// add details if error is internal
			entry.WithFields(logrus.Fields{
				"header": r.Header,
				"body":   r.Body,
				"uri":    r.RequestURI,
				"ip":     r.RemoteAddr,
			})
		}
		entry.Error("handler error")
	}
}

func parseForm(r *http.Request, required ...string) error {
	err := r.ParseForm()
	if err != nil {
		return fmt.Errorf("ParseForm: %w", err)
	}
	for _, req := range required {
		if r.Form[req] == nil {
			errParse := NewErrMissingFormValue(req)
			return &ErrHTTP{
				error:       errParse,
				HTTPMessage: errParse.Error(),
				HTTPStatus:  http.StatusBadRequest,
			}
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
