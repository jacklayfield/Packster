package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadEnvironmentFindsRepositoryRootFile(t *testing.T) {
	tempDirectory := t.TempDir()
	backendDirectory := filepath.Join(tempDirectory, "go-backend")
	if err := os.Mkdir(backendDirectory, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tempDirectory, ".env"), []byte("PACKSTER_ENV_TEST=loaded-from-root\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	originalDirectory, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(backendDirectory); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := os.Chdir(originalDirectory); err != nil {
			t.Errorf("restore working directory: %v", err)
		}
	})

	originalValue, hadOriginalValue := os.LookupEnv("PACKSTER_ENV_TEST")
	if err := os.Unsetenv("PACKSTER_ENV_TEST"); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if hadOriginalValue {
			_ = os.Setenv("PACKSTER_ENV_TEST", originalValue)
		} else {
			_ = os.Unsetenv("PACKSTER_ENV_TEST")
		}
	})

	if err := loadEnvironment(); err != nil {
		t.Fatalf("load repository root .env: %v", err)
	}
	if got := os.Getenv("PACKSTER_ENV_TEST"); got != "loaded-from-root" {
		t.Fatalf("expected value from repository root .env, got %q", got)
	}
}

func TestLoadEnvironmentPreservesProcessEnvironment(t *testing.T) {
	tempDirectory := t.TempDir()
	envPath := filepath.Join(tempDirectory, ".env")
	if err := os.WriteFile(envPath, []byte("PACKSTER_ENV_TEST=file-value\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	originalDirectory, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(tempDirectory); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := os.Chdir(originalDirectory); err != nil {
			t.Errorf("restore working directory: %v", err)
		}
	})
	t.Setenv("PACKSTER_ENV_TEST", "process-value")

	if err := loadEnvironment(); err != nil {
		t.Fatalf("load .env: %v", err)
	}
	if got := os.Getenv("PACKSTER_ENV_TEST"); got != "process-value" {
		t.Fatalf("expected process environment to take precedence, got %q", got)
	}
}
