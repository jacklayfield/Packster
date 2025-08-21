package main

import (
	"log"
	"net/http"

	"go-backend/internal/ws"
)

func main() {
	hub := ws.NewHub()
	go hub.Run()

	mux := http.NewServeMux()
	mux.Handle("/ws", ws.ServeWS(hub))

	log.Println("Server listening on port 8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
