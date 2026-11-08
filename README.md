# Packster

Packster is a collaborative packing-list application with shared rooms, item assignment, and a real-time backend.

## Project structure

- `frontend`: Next.js web application.
- `go-backend`: Go WebSocket server, Google sign-in, and PostgreSQL persistence.
- `archive`: older client and server versions retained for reference.

## Account and room access

Anyone can join an existing room with a username and browse its contents. A Google account is required to create a room or change its packing list (add, claim, unclaim, or delete items). These permissions are enforced by the backend as well as the interface.

## Local setup

1. Optionally copy `.env.example` to `.env` in the repository root and add Google OAuth credentials. Without them, the app runs locally but Google sign-in is unavailable.
2. Start all three containers from the repository root:

   ```powershell
   docker compose up --build
   ```

3. Open `http://localhost:3000`. The backend is available at `http://localhost:8080`.

To enable Google sign-in, create an OAuth client in Google Cloud Console and add this authorized redirect URI:
`http://localhost:8080/api/auth/google/callback`

Stop the containers with `Ctrl+C`; use `docker compose down` to stop and remove them. PostgreSQL data is kept in the `packster_pg_data` volume.

The backend loads `.env` from its working directory or the repository root (one directory above `go-backend`). Variables already set in the process environment take precedence. It reads `DATABASE_URL`, `FRONTEND_ORIGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URL`. `GOOGLE_REDIRECT_URL` must exactly match the redirect URI configured in Google Cloud Console. If the backend is not at `http://localhost:8080`, set `NEXT_PUBLIC_API_URL` in the frontend environment.

Room guest identities and Google account identities use distinct IDs. Reusing the same username in a room does not claim another participant's identity. When a previous password account has the same verified Google email, Google sign-in reuses that account identity.

## GCP deployment

The Terraform/OpenTofu configuration and staged Cloud Run deployment instructions are in [`infra/`](./infra/README.md). It creates Artifact Registry and Secret Manager resources and can deploy the Next.js frontend and Go backend to Cloud Run. PostgreSQL is external to keep the always-on database cost out of this minimal setup.
