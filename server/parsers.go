package main

import (
	"flag"
	"fmt"
	"strconv"

	"github.com/sirupsen/logrus"
)

func logLevelParser(result *logrus.Level, defaultLevel logrus.Level) func(string) error {
	return func(raw string) error {
		if raw == "" {
			*result = defaultLevel
			return nil
		} else if parsed, err := strconv.ParseUint(raw, 10, 32); err == nil {
			if parsed <= 6 {
				*result = logrus.Level(parsed)
				return err
			} else {
				return fmt.Errorf("Log level bust be an integer in range 0..6")
			}
		} else {
			parsed, err := logrus.ParseLevel(raw)
			*result = parsed
			return err
		}
	}
}

func flagLogLevelVar(dst *logrus.Level, name string, defaultLevel logrus.Level, usage string) {
	*dst = defaultLevel
	flag.Func(name, usage+" (0..6 or level name)", logLevelParser(dst, defaultLevel))
}

//nolint:deadcode,unused // This function is here to provide similar interface to flag package
func flagLogLevel(name string, defaultLevel logrus.Level, usage string) *logrus.Level {
	logLevel := defaultLevel
	flagLogLevelVar(&logLevel, name, defaultLevel, usage)
	return &logLevel
}
