// Package logger provides structured logging configuration using slog.
package logger

import (
	"log/slog"
	"os"
)

// New creates a configured slog.Logger with JSON output to stdout.
func New(level slog.Level) *slog.Logger {
	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: level,
	})
	return slog.New(handler)
}
