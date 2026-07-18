package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"go-backend/internal/db"
	"go-backend/internal/ws"
)

func main() {
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
	mux.Handle("/ws/", ws.ServeWS(hub))

	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
