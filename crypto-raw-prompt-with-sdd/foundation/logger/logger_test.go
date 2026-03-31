package logger

import (
	"context"
	"log/slog"
	"testing"
)

func TestNew(t *testing.T) {
	tests := []struct {
		name  string
		level slog.Level
	}{
		{name: "debug level", level: slog.LevelDebug},
		{name: "info level", level: slog.LevelInfo},
		{name: "warn level", level: slog.LevelWarn},
		{name: "error level", level: slog.LevelError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			log := New(tt.level)
			if log == nil {
				t.Fatal("expected non-nil logger")
			}
			if !log.Handler().Enabled(context.Background(), tt.level) {
				t.Errorf("logger should be enabled for level %v", tt.level)
			}
		})
	}
}
