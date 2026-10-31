# Packster

Packster is a collaborative packing-list application with shared rooms, item assignment, and a real-time backend.

## Project structure

- `frontend`: Next.js web application.
- `go-backend`: Go WebSocket server, Google sign-in, and PostgreSQL persistence.
- `archive`: older client and server versions retained for reference.

## Account and room access

Anyone can join an existing room with a username and browse its contents. A Google account is required to create a room or change its packing list (add, claim, unclaim, or delete items). These permissions are enforced by the backend as well as the interface.

## Local setup

1. Copy `.env.example` to `.env` in the repository root and fill in the Google OAuth credentials.
2. Start PostgreSQL with `docker compose up -d`.
3. In Google Cloud Console, create an OAuth client and add this authorized redirect URI:
   `http://localhost:8080/api/auth/google/callback`
4. Start the Go server from `go-backend`.
5. Start the Next.js application from `frontend` and open `http://localhost:3000`.

The backend loads `.env` from its working directory or the repository root (one directory above `go-backend`). Variables already set in the process environment take precedence. It reads `DATABASE_URL`, `FRONTEND_ORIGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URL`. `GOOGLE_REDIRECT_URL` must exactly match the redirect URI configured in Google Cloud Console. If the backend is not at `http://localhost:8080`, set `NEXT_PUBLIC_API_URL` in the frontend environment.

Room guest identities and Google account identities use distinct IDs. Reusing the same username in a room does not claim another participant's identity. When a previous password account has the same verified Google email, Google sign-in reuses that account identity.
