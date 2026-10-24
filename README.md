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
- Optional email/password accounts; creating and joining rooms remains available to guests.

Development notes:
- The main frontend is in `frontend` using Next.js.
- WebSocket messaging is handled in `go-backend/internal/ws`.
- Shared entry types and message contracts are defined in `frontend/types/messages.ts`.
- The account API uses `FRONTEND_ORIGIN` (defaults to `http://localhost:3000`). Set `NEXT_PUBLIC_API_URL` when the backend is not at `http://localhost:8080`.
- Email addresses are not verified in this first version. Password reset and email verification require a configured mail provider. Account identities are stored separately from users so Google sign-in can be added later without changing room guest identities.

TODO:
- User persistence. Right now you can join a room with the SAME name as someone already in the room and confirm it is you / continue. However, once you create an account with a displayname this doesn't exactly make sense or even work correctly. It is currently not providing the normal "hey is this you?" prompt when entering with the same name as a registered account with a display name but it IS assuming that users name / items (not the login though). If someone attempts to join with the SAME displayname as someone in the room who has ALREADY created an account, they should either A. Be allowed to however, the registered user gets a UUID tied to their objects distinct from the seperate non account user. OR B. we do NOT allow users to choose the same displayname if someone in the room with an account registered has that display name. In the case of A. we need to ensure that the assigned to section is distinct in some way (undecided). Also, this goes for displayname in general even for users who created accounts. For example two users could have the same displayname registered to their account... need a way to distinguish them in the context of a room...