Packster is a collaborative packing list application with web-based rooms, shared item management, and a real-time backend.

Repository structure:
- `go-backend`: Go-based WebSocket server, room persistence, and database integration.
- `frontend`: Next.js application for the main web client.
- `archive`: older client and server versions retained for reference.

Quick start:
1. Start the database and backend services.
2. Run the Go backend from `go-backend`.
3. Start the `frontend` application and open the room UI in the browser.

Key features:
- Shared room state with live updates for packing entries.
- Item creation, assignment, and claiming.
- Room persistence via the backend database.

Development notes:
- The main frontend is in `frontend` using Next.js.
- WebSocket messaging is handled in `go-backend/internal/ws`.
- Shared entry types and message contracts are defined in `frontend/types/messages.ts`.
