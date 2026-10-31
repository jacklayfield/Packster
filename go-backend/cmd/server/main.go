package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"go-backend/internal/auth"
	"go-backend/internal/db"
	"go-backend/internal/ws"

	"github.com/joho/godotenv"
)

func main() {
	if err := loadEnvironment(); err != nil {
		log.Fatal(err)
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://packster:packster@localhost:5432/packster?sslmode=disable"
	}

	store, err := db.NewStore(context.Background(), databaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer store.Close()

	hub := ws.NewHub(store)
	go hub.Run()

	mux := http.NewServeMux()
	authHandler := auth.NewHandler(store)
	mux.Handle("/api/auth/", authHandler)
	mux.Handle("/ws/", ws.ServeWS(hub, authHandler))

	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func loadEnvironment() error {
	workingDirectory, err := os.Getwd()
	if err != nil {
		return err
	}

	for _, directory := range []string{workingDirectory, filepath.Dir(workingDirectory)} {
		envPath := filepath.Join(directory, ".env")
		_, err := os.Stat(envPath)
		if errors.Is(err, os.ErrNotExist) {
			continue
		}
		if err != nil {
			return err
		}
		if err := godotenv.Load(envPath); err != nil {
			return err
		}
		log.Printf("Loaded environment from %s", envPath)
		return nil
	}

	return nil
}
