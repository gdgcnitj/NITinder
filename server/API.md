## Overview

This document describes the HTTP API exposed by the backend server.

- Base URL (local development): `http://localhost:3000`
- All request and response bodies are JSON unless otherwise specified.
- Authentication for protected routes uses a Bearer JWT in the `Authorization` header.

---
## Database Setup
In order to create database tables and seed random user accounts use:
```zsh
npm run db:seed
```

---

## Authentication & Sessions

- Public routes (no token required):
	- `GET /`
	- `POST /auth/register`
	- `POST /auth/login`
- Protected routes (token required):
	- `GET /auth/logout`

### JWT format

After a successful login, the server returns a JWT access token in the `Authorization` response header:

```http
Authorization: Bearer <JWT>
```

The token payload contains at least:

```json
{
	"username": "John Doe",
	"user_id": 1,
	"session_id": 42
}
```

The token is linked to a row in the `sessions` table via `session_id`. The middleware considers a token invalid if there is no matching session or if the session is marked as expired.

### Sending the token

For protected routes, send the token in the `Authorization` header:

```http
Authorization: Bearer <JWT>
```

If the header is missing, malformed, or the token/session is invalid or expired, the server responds with:

- `401 Unauthorized` and body:

```json
{ "detail": "Invalid or expired token" }
```

---

## Routes

### GET /

**Description**  
Health-check endpoint to verify that the server is running.

**Auth**  
Public – no token required.

**Request**

- Method: `GET`
- Path: `/`

**Responses**

- `200 OK`

	```json
	{ "message": "Hello, World!" }
	```

---

### POST /auth/register

**Description**  
Registers a new user account.

**Auth**  
Public – no token required.

**Request**

- Method: `POST`
- Path: `/auth/register`
- Headers:
	- `Content-Type: application/json`
- Body:

	```json
	{
		"email": "john@doe.com",
		"password": "password123",
		"firstName": "John",
		"lastName": "Doe"
	}
	```

	- `email` (string, required) – user email, must be unique.
	- `password` (string, required) – plain-text password.
	- `firstName` (string, required).
	- `lastName` (string, required).

**Responses**

- `200 OK`

	```json
	{ "message": "Registered user: John Doe" }
	```

- `409 Conflict` – user already exists (unique email constraint)

	```json
	{ "detail": "user already exists" }
	```

- `500 Internal Server Error` – unexpected database or server error

	```json
	{ "detail": "could not register user" }
	```

---

### POST /auth/login

**Description**  
Authenticates a user by email and password, creates a new session, and returns a JWT access token in the response headers.

**Auth**  
Public – no token required.

**Request**

- Method: `POST`
- Path: `/auth/login`
- Headers:
	- `Content-Type: application/json`
- Body:

	```json
	{
		"email": "john@doe.com",
		"password": "password123"
	}
	```

	- `email` (string, required).
	- `password` (string, required).

**Responses**

- `200 OK` – login successful

	Headers:

	```http
	Authorization: Bearer <JWT>
	```

	Body:

	```json
	{ "message": "Welcome back John Doe!" }
	```

- `401 Unauthorized` – invalid credentials

	```json
	{ "detail": "invalid credentials" }
	```

- `500 Internal Server Error` – unexpected server error

	```json
	{ "detail": "unexpected server error" }
	```

---

### GET /auth/logout

**Description**  
Logs out the current user by expiring their session.

**Auth**  
Protected – requires a valid Bearer JWT whose `session_id` corresponds to a non-expired session.

**Request**

- Method: `GET`
- Path: `/auth/logout`
- Headers:
	- `Authorization: Bearer <JWT>`

**Behavior**

- Uses `req.session.session_id` (populated by the auth middleware) to:
	- Set `expired = 1` on the corresponding row in the `sessions` table.
	- Optionally query the updated session record.
- Only sends a response if the update affected at least one row.

**Responses**

- `200 OK` – when a session was successfully marked as expired

	```json
	{ "message": "Goodbye!" }
	```

- `401 Unauthorized` – when:
	- The `Authorization` header is missing or malformed, or
	- The token is invalid/expired, or
	- The session is missing or already expired.

	```json
	{ "detail": "Invalid or expired token" }
	```

