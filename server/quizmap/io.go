package quizmap

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
)

func (q *QuizMap) Save(filename string, bakFilename string) error {
	saveFile, err := os.OpenFile(filename, os.O_RDWR|os.O_CREATE, 0755)
	if err != nil {
		return fmt.Errorf("save: cannot open save file: %w", err)
	}
	defer saveFile.Close()

	bakFile, err := os.Create(bakFilename)
	if err != nil {
		return fmt.Errorf("save: cannot open backup file: %w", err)
	}
	defer bakFile.Close()

	_, err = io.Copy(bakFile, saveFile)
	if err != nil {
		return fmt.Errorf("save: cannot open backup old save file: %w", err)
	}
	bakFile.Close()

	err = saveFile.Truncate(0)
	if err != nil {
		return fmt.Errorf("save: cannot truncate save file: %w", err)
	}
	_, err = saveFile.Seek(0, 0)
	if err != nil {
		return fmt.Errorf("save: cannot truncate save file: %w", err)
	}

	encoder := json.NewEncoder(saveFile)
	encoder.SetIndent("", "")
	err = encoder.Encode(q)
	if err != nil {
		return fmt.Errorf("save: cannot save quiz map to file: %w", err)
	}
	return nil
}

func (q *QuizMap) Load(filename string) error {
	saveFile, err := os.Open(filename)
	if err != nil {
		return fmt.Errorf("load: cannot open save file: %w", err)
	}
	defer saveFile.Close()

	decoder := json.NewDecoder(saveFile)
	err = decoder.Decode(q)
	if err != nil {
		return fmt.Errorf("load: cannot decode save file: %w", err)
	}
	return nil
}
