package main

import (
	"crypto/tls"
	"net/http"
	"time"

	"github.com/mattn/go-colorable"
	"github.com/sirupsen/logrus"
	"github.com/snowzach/rotatefilehook"
)

func initConsoleLogger(logLevel logrus.Level) {
	logrus.SetLevel(logLevel)
	logrus.SetOutput(colorable.NewColorableStdout())
	logrus.SetFormatter(&logrus.TextFormatter{
		ForceColors:     true,
		FullTimestamp:   true,
		TimestampFormat: time.RFC822,
	})
}

func initFileLogger(filename string, logLevel logrus.Level) {

	rotateFileHook, err := rotatefilehook.NewRotateFileHook(rotatefilehook.RotateFileConfig{
		Filename:   filename,
		MaxSize:    50, // megabytes
		MaxBackups: 3,
		MaxAge:     28, //days
		Level:      logLevel,
		Formatter: &logrus.JSONFormatter{
			TimestampFormat: time.RFC822,
		},
	})

	if err != nil {
		logrus.Fatalf("Failed to initialize file rotate hook: %v", err)
	}

	logrus.AddHook(rotateFileHook)
}

func initServer(port string, certificate string, key string) (*http.Server, bool) {
	isTLS := false
	if certificate != "" || key != "" {
		if certificate != "" && key != "" {
			isTLS = true
		} else {
			logrus.Fatal("both certificate and key must be set for a tls server")
		}
	}

	if port == "" {
		if isTLS {
			port = "443"
		} else {
			port = "80"
		}
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: nil,
	}

	if isTLS {
		cert, err := tls.LoadX509KeyPair(certificate, key)
		if err != nil {
			logrus.WithError(err).Fatal("error parsing the certificate")
		}
		server.TLSConfig = &tls.Config{
			Certificates: []tls.Certificate{cert},
		}
	}

	return server, isTLS
}
