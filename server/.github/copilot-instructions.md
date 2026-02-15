# Copilot instructions for this repo

## Project snapshot
- Node.js Express API (ESM) with SQLite via better-sqlite3; entrypoint is server.js.
- Auth is the only router right now (controllers/auth.js); auth middleware is global and runs before all routes (middleware.js).
- API behavior and auth contract are documented in API.md; treat it as source of truth for request/response shape.
- Database is a local SQLite file (test.db) with tables and seed data created by seed.js.
- Static assets are served from static/ (e.g., placeholder profile images).

## Runtime / workflow
- Start dev server with nodemon: `npm run start` (defaults to PORT=3000).
- Initialize/seed the DB (creates tables + inserts demo users/profiles): `npm run db:seed`.
- Environment variables are loaded from .env via dotenv; ALGORITHM and SECRET_KEY drive JWT signing/verification.

## Key architecture / data flow
- Request pipeline: helmet + cors + morgan + json + static + authMiddleware (see server.js).
- Public routes bypass auth: GET /, POST /auth/login, POST /auth/register (middleware.js).
- Protected routes rely on `req.session` populated by JWT payload (middleware.js).
- JWT creation is centralized in utils.js (createAccessToken) and uses a sessions table record.

## Conventions and patterns
- Database access is synchronous (better-sqlite3). Reuse the shared db handle from db.js.
- SQL is embedded inline in route handlers and utilities; no ORM layer.
- Auth controller uses `Authorization: Bearer <JWT>` response header on login (controllers/auth.js).
- ESM imports are used everywhere (`type: "module"` in package.json).

## Data model references
- Table creation + seed data live in seed.js; use it to understand schema expectations.
- Auth/session validation reads from the sessions table and expects a notion of session expiry in middleware.js.

## Integration points
- CORS is restricted to the local frontend dev origins in server.js.
- Images are read from static/img in seed.js (profile_image field).

## Gotchas to keep in mind
- There are schema/field naming differences between auth code and seed.js (users.password vs users.password_hash; sessions columns), so validate the current schema before making auth/session changes.
- Auth middleware checks DB session state in addition to JWT validity; keep both in sync if you adjust auth behavior.
