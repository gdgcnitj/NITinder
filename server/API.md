# Nitinder Backend API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Status Codes](#status-codes)

---

## Overview

Nitinder is a dating application backend built with Node.js Express and SQLite. The API provides endpoints for user authentication, profile management, swiping, matching, and messaging functionality.

### Base URL
```
http://localhost:3000
```

### Environment Variables
- `PORT` - Server port (default: 3000)
- `ALGORITHM` - JWT algorithm (default: HS256)
- `SECRET_KEY` - JWT signing key (default: SECRET_KEY)

---

## Authentication

### Overview
The API uses JWT (JSON Web Token) based authentication with Bearer tokens. All sensitive operations require an `Authorization` header with a Bearer token obtained from the login endpoint.

### Public Routes
The following routes do **not** require authentication:
- `GET /` - Health check
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Protected Routes
All other routes require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

### Session Management
- Sessions are stored in the database with an expiration time
- JWT tokens are valid for 7 days from creation
- Sessions can be revoked via logout
- Expired or revoked sessions will be rejected

### Password Security
- Passwords are hashed using **Argon2** algorithm
- Never store or transmit plain-text passwords
- Always hash passwords before storage

---

## Data Models

### User
```json
{
  "id": "uuid",
  "email": "string (unique)",
  "password_hash": "string (argon2 hash)",
  "created_at": "ISO 8601 timestamp",
  "deleted_at": "ISO 8601 timestamp or null"
}
```

### Profile
```json
{
  "id": "uuid",
  "user_id": "uuid (foreign key)",
  "name": "string",
  "age": "integer",
  "bio": "string",
  "gender": "character ('M' | 'F')",
  "looking_for": "character ('M' | 'F' | 'A')",
  "latitude": "float",
  "longitude": "float",
  "profile_image": "binary (image data)",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

### Session
```json
{
  "id": "uuid",
  "user_id": "uuid (foreign key)",
  "session_token": "string (JWT)",
  "created_at": "ISO 8601 timestamp",
  "expires_at": "ISO 8601 timestamp",
  "revoked_at": "ISO 8601 timestamp or null"
}
```

### Swipe
```json
{
  "id": "uuid",
  "swiper_id": "uuid (foreign key - user performing swipe)",
  "swipee_id": "uuid (foreign key - user being swiped on)",
  "direction": "character ('L' | 'R')",
  "created_at": "ISO 8601 timestamp"
}
```

**Swipe Logic:**
- `L` = Left swipe (pass/reject)
- `R` = Right swipe (like)
- **Mutual swipes create a match** (triggered by database trigger)

### Match
```json
{
  "id": "uuid",
  "user1_id": "uuid (foreign key)",
  "user2_id": "uuid (foreign key)",
  "notes": "string or null",
  "archived": "boolean",
  "created_at": "ISO 8601 timestamp"
}
```

### Conversation
```json
{
  "id": "uuid",
  "match_id": "uuid (foreign key)",
  "created_at": "ISO 8601 timestamp"
}
```

### Message
```json
{
  "id": "uuid",
  "conversation_id": "uuid (foreign key)",
  "sender_id": "uuid (foreign key)",
  "content": "string",
  "created_at": "ISO 8601 timestamp",
  "deleted_at": "ISO 8601 timestamp or null (soft delete)"
}
```

---

## API Endpoints

### Authentication Routes (`/auth`)

#### Register a New User
```
POST /auth/register
```

**Authentication:** Not required (public route)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Success Response (201):**
```json
{
  "message": "Registered user: John Doe"
}
```

**Error Responses:**
- `400` - Missing required fields
- `409` - Email already exists
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "myPassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

#### Login
```
POST /auth/login
```

**Authentication:** Not required (public route)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Welcome back John Doe!"
}
```

**Response Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "myPassword123"
  }'
```

---

#### Logout
```
GET /auth/logout
```

**Authentication:** Required

**Success Response (200):**
```json
{
  "message": "Goodbye!"
}
```

**Error Responses:**
- `401` - Unauthorized (missing/invalid token)
- `404` - Session not found
- `500` - Server error

**Example:**
```bash
curl -X GET http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <jwt_token>"
```

---

### Profile Routes (`/profiles`)

#### Get Profiles
```
GET /profiles
```

**Authentication:** Required

**Query Parameters:**
- `user_id` (optional) - Filter profiles by user ID

**Success Response (200):**
```json
{
  "profiles": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe",
      "age": 28,
      "bio": "Coffee enthusiast and travel lover",
      "gender": "M",
      "looking_for": "F",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "profile_image": "base64_encoded_image_data_or_buffer",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Unauthorized (missing/invalid token)
- `500` - Server error

**Examples:**
```bash
# Get all profiles
curl -X GET http://localhost:3000/profiles \
  -H "Authorization: Bearer <jwt_token>"

# Get specific user's profile
curl -X GET "http://localhost:3000/profiles?user_id=550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer <jwt_token>"
```

---

#### Get Profile by ID
```
GET /profiles/:id
```

**Authentication:** Required

**URL Parameters:**
- `id` (required) - Profile ID

**Success Response (200):**
```json
{
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "John Doe",
    "age": 28,
    "bio": "Coffee enthusiast and travel lover",
    "gender": "M",
    "looking_for": "F",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "profile_image": "base64_encoded_image_data_or_buffer",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized (missing/invalid token)
- `404` - Profile not found
- `500` - Server error

**Example:**
```bash
curl -X GET http://localhost:3000/profiles/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <jwt_token>"
```

---

#### Create Profile
```
POST /profiles
```

**Authentication:** Required

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 28,
  "bio": "Coffee enthusiast and travel lover",
  "gender": "M",
  "looking_for": "F",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "profile_image": "base64_encoded_image_or_binary_data"
}
```

**Success Response (201):**
```json
{
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "John Doe",
    "age": 28,
    "bio": "Coffee enthusiast and travel lover",
    "gender": "M",
    "looking_for": "F",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "profile_image": "base64_encoded_image_data_or_buffer",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized (missing/invalid token or session)
- `409` - Profile already exists for this user
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "name": "John Doe",
    "age": 28,
    "bio": "Coffee enthusiast",
    "gender": "M",
    "looking_for": "F",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

---

#### Update Profile
```
PUT /profiles/:id
```

**Authentication:** Required

**URL Parameters:**
- `id` (required) - Profile ID

**Request Body:**
```json
{
  "name": "Jane Doe",
  "age": 26,
  "bio": "Updated bio",
  "gender": "F",
  "looking_for": "M",
  "latitude": 40.7200,
  "longitude": -74.0100,
  "profile_image": "base64_encoded_image_or_binary_data"
}
```

**Success Response (200):**
```json
{
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Jane Doe",
    "age": 26,
    "bio": "Updated bio",
    "gender": "F",
    "looking_for": "M",
    "latitude": 40.7200,
    "longitude": -74.0100,
    "profile_image": "base64_encoded_image_data_or_buffer",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:45:00Z"
  }
}
```

**Error Responses:**
- `400` - No fields to update
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not your profile)
- `404` - Profile not found
- `500` - Server error

**Example:**
```bash
curl -X PUT http://localhost:3000/profiles/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "age": 29,
    "bio": "Updated bio"
  }'
```

---

#### Delete Profile
```
DELETE /profiles/:id
```

**Authentication:** Required

**URL Parameters:**
- `id` (required) - Profile ID

**Success Response (200):**
```json
{
  "message": "profile deleted"
}
```

**Error Responses:**
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not your profile)
- `404` - Profile not found
- `500` - Server error

**Example:**
```bash
curl -X DELETE http://localhost:3000/profiles/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <jwt_token>"
```

---

### Swipe Routes (`/swipes`)

#### Get Swipes
```
GET /swipes
```

**Authentication:** Required

**Query Parameters:**
- `swiper_id` (optional) - Filter by user who performed the swipe
- `swipee_id` (optional) - Filter by user who was swiped on

**Success Response (200):**
```json
{
  "swipes": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "swiper_id": "550e8400-e29b-41d4-a716-446655440001",
      "swipee_id": "550e8400-e29b-41d4-a716-446655440002",
      "direction": "R",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Unauthorized (missing/invalid token)
- `500` - Server error

**Examples:**
```bash
# Get all swipes
curl -X GET http://localhost:3000/swipes \
  -H "Authorization: Bearer <jwt_token>"

# Get swipes by specific swiper
curl -X GET "http://localhost:3000/swipes?swiper_id=550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer <jwt_token>"

# Get swipes for a specific swipee
curl -X GET "http://localhost:3000/swipes?swipee_id=550e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer <jwt_token>"
```

---

#### Get Swipe by ID
```
GET /swipes/:id
```

**Authentication:** Required

**URL Parameters:**
- `id` (required) - Swipe ID

**Success Response (200):**
```json
{
  "swipe": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "swiper_id": "550e8400-e29b-41d4-a716-446655440001",
    "swipee_id": "550e8400-e29b-41d4-a716-446655440002",
    "direction": "R",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized (missing/invalid token)
- `404` - Swipe not found
- `500` - Server error

---

#### Create Swipe
```
POST /swipes
```

**Authentication:** Required

**Request Body:**
```json
{
  "swipee_id": "550e8400-e29b-41d4-a716-446655440002",
  "direction": "R"
}
```

**Success Response (201):**
```json
{
  "swipe": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "swiper_id": "550e8400-e29b-41d4-a716-446655440001",
    "swipee_id": "550e8400-e29b-41d4-a716-446655440002",
    "direction": "R",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Note:** When a mutual swipe occurs (both users swipe right on each other), a match is automatically created via a database trigger.

**Error Responses:**
- `400` - Missing swipee_id or direction / Invalid direction (must be 'L' or 'R')
- `401` - Unauthorized (missing/invalid token or session)
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/swipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "swipee_id": "550e8400-e29b-41d4-a716-446655440002",
    "direction": "R"
  }'
```

---

#### Delete Swipe
```
DELETE /swipes/:id
```

**Authentication:** Required

**URL Parameters:**
- `id` (required) - Swipe ID

**Success Response (200):**
```json
{
  "message": "swipe deleted"
}
```

**Error Responses:**
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not your swipe)
- `404` - Swipe not found
- `500` - Server error

**Example:**
```bash
curl -X DELETE http://localhost:3000/swipes/550e8400-e29b-41d4-a716-446655440010 \
  -H "Authorization: Bearer <jwt_token>"
```

---

### Match Routes (`/matches`)

#### Get All Matches for Current User
```
GET /matches
```

**Authentication:** Required

**Success Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "created_at": "2024-01-15T10:35:00Z",
    "user1": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "john@example.com",
      "name": "John Doe",
      "age": 28,
      "bio": "Coffee enthusiast",
      "gender": "M"
    },
    "user2": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "email": "jane@example.com",
      "name": "Jane Doe",
      "age": 26,
      "bio": "Adventure seeker",
      "gender": "F"
    }
  }
]
```

**Error Responses:**
- `401` - Unauthorized (missing/invalid token)
- `500` - Server error

---

#### Create a Match
```
POST /matches
```

**Authentication:** Required

**Request Body:**
```json
{
  "user1_id": "550e8400-e29b-41d4-a716-446655440001",
  "user2_id": "550e8400-e29b-41d4-a716-446655440002"
}
```

**Success Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440020",
  "created_at": "2024-01-15T10:35:00Z",
  "user1": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "john@example.com",
    "name": "John Doe",
    "age": 28,
    "bio": "Coffee enthusiast",
    "gender": "M"
  },
  "user2": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "age": 26,
    "bio": "Adventure seeker",
    "gender": "F"
  }
}
```

**Error Responses:**
- `400` - Missing user1_id or user2_id / Cannot match with yourself
- `401` - Unauthorized (missing/invalid token)
- `404` - One or both users not found
- `409` - Match already exists between these users
- `500` - Server error

---

#### Get Match by ID
```
GET /matches/:matchId
```

**Authentication:** Required

**URL Parameters:**
- `matchId` (required) - Match ID

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440020",
  "created_at": "2024-01-15T10:35:00Z",
  "user1": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "john@example.com",
    "name": "John Doe",
    "age": 28,
    "bio": "Coffee enthusiast",
    "gender": "M"
  },
  "user2": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "age": 26,
    "bio": "Adventure seeker",
    "gender": "F"
  }
}
```

**Error Responses:**
- `400` - Match ID required
- `401` - Unauthorized (missing/invalid token)
- `404` - Match not found
- `500` - Server error

---

#### Update Match
```
PUT /matches/:matchId
```

**Authentication:** Required

**URL Parameters:**
- `matchId` (required) - Match ID

**Request Body:**
```json
{
  "notes": "Great conversation!",
  "archived": false
}
```

**Success Response (200):**
```json
{
  "message": "match updated successfully",
  "match": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "created_at": "2024-01-15T10:35:00Z",
    "user1": { /* ... */ },
    "user2": { /* ... */ }
  }
}
```

**Error Responses:**
- `400` - Match ID required
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not part of this match)
- `404` - Match not found
- `500` - Server error

---

### Conversation Routes (`/conversations`)

**Note:** Conversation endpoints are implemented but not currently registered in the server router. These endpoints are documented for future implementation.

#### Get All Conversations
```
GET /conversations
```

**Authentication:** Required

**Success Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "match_id": "550e8400-e29b-41d4-a716-446655440020",
    "other_user_id": "550e8400-e29b-41d4-a716-446655440002",
    "other_user_name": "Jane Doe",
    "last_message": "Looking forward to meeting you!",
    "last_message_at": "2024-01-15T11:20:00Z",
    "created_at": "2024-01-15T10:35:00Z"
  }
]
```

**Error Responses:**
- `401` - Unauthorized (missing/invalid token)
- `500` - Server error

---

#### Get Conversation by ID
```
GET /conversations/:conversationId
```

**Authentication:** Required

**URL Parameters:**
- `conversationId` (required) - Conversation ID

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440030",
  "match_id": "550e8400-e29b-41d4-a716-446655440020",
  "other_user_id": "550e8400-e29b-41d4-a716-446655440002",
  "created_at": "2024-01-15T10:35:00Z",
  "messages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440040",
      "sender_id": "550e8400-e29b-41d4-a716-446655440001",
      "sender_name": "John Doe",
      "content": "Hey! How are you doing?",
      "created_at": "2024-01-15T11:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440041",
      "sender_id": "550e8400-e29b-41d4-a716-446655440002",
      "sender_name": "Jane Doe",
      "content": "Doing great! You?",
      "created_at": "2024-01-15T11:05:00Z"
    }
  ]
}
```

**Error Responses:**
- `400` - Conversation ID required
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (no access to this conversation)
- `404` - Conversation not found
- `500` - Server error

---

#### Create Conversation
```
POST /conversations
```

**Authentication:** Required

**Request Body:**
```json
{
  "match_id": "550e8400-e29b-41d4-a716-446655440020"
}
```

**Success Response (201):**
```json
{
  "message": "conversation created",
  "conversation": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "match_id": "550e8400-e29b-41d4-a716-446655440020",
    "created_at": "2024-01-15T10:35:00Z"
  }
}
```

**Error Responses:**
- `400` - Match ID required
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not part of this match)
- `409` - Conversation already exists for this match
- `500` - Server error

---

#### Delete Conversation
```
DELETE /conversations/:conversationId
```

**Authentication:** Required

**URL Parameters:**
- `conversationId` (required) - Conversation ID

**Success Response (200):**
```json
{
  "message": "conversation deleted"
}
```

**Note:** Deleting a conversation soft-deletes all associated messages (sets `deleted_at` timestamp).

**Error Responses:**
- `400` - Conversation ID required
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (no access to this conversation)
- `404` - Conversation not found
- `500` - Server error

---

### Message Routes (`/messages`)

**Note:** Message endpoints are implemented but not currently registered in the server router. These endpoints are documented for future implementation.

#### Get Messages in Conversation
```
GET /messages/:conversationId/messages
```

**Authentication:** Required

**URL Parameters:**
- `conversationId` (required) - Conversation ID

**Query Parameters:**
- `limit` (optional) - Maximum number of messages to return (default: 50, max: 100)
- `offset` (optional) - Number of messages to skip (default: 0)

**Success Response (200):**
```json
{
  "messages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440040",
      "sender_id": "550e8400-e29b-41d4-a716-446655440001",
      "sender_name": "John Doe",
      "content": "Hey! How are you doing?",
      "created_at": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

**Error Responses:**
- `400` - Conversation ID required
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (no access to this conversation)
- `500` - Server error

---

#### Send Message
```
POST /messages/:conversationId/messages
```

**Authentication:** Required

**URL Parameters:**
- `conversationId` (required) - Conversation ID

**Request Body:**
```json
{
  "content": "Hey! How are you doing?"
}
```

**Success Response (201):**
```json
{
  "message": "message sent",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "conversation_id": "550e8400-e29b-41d4-a716-446655440030",
    "sender_id": "550e8400-e29b-41d4-a716-446655440001",
    "sender_name": "John Doe",
    "content": "Hey! How are you doing?",
    "created_at": "2024-01-15T11:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Missing conversation ID or content
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (no access to this conversation)
- `500` - Server error

---

#### Update Message
```
PUT /messages/:messageId
```

**Authentication:** Required

**URL Parameters:**
- `messageId` (required) - Message ID

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Success Response (200):**
```json
{
  "message": "message updated",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "sender_id": "550e8400-e29b-41d4-a716-446655440001",
    "sender_name": "John Doe",
    "content": "Updated message content",
    "created_at": "2024-01-15T11:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Message ID or content required
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (only sender can edit)
- `500` - Server error

**Notes:**
- Only the message sender can edit a message
- Cannot edit deleted messages

---

#### Delete Message
```
DELETE /messages/:messageId
```

**Authentication:** Required

**URL Parameters:**
- `messageId` (required) - Message ID

**Success Response (200):**
```json
{
  "message": "message deleted"
}
```

**Error Responses:**
- `400` - Message ID required
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (only sender can delete)
- `500` - Server error

**Notes:**
- Messages are soft-deleted (a `deleted_at` timestamp is set, but the record is not removed)
- Only the message sender can delete their own messages

---

## Error Handling

All endpoints return error responses in a consistent JSON format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Error Messages

| Error | Meaning |
|-------|---------|
| `Missing or invalid Authorization header` | Bearer token missing or malformed |
| `Invalid or expired token` | JWT token is invalid or expired |
| `missing session` | Session not found in database |
| `forbidden` | User is not authorized to perform this action |
| `user already exists` | Email address is already registered |
| `invalid credentials` | Email or password is incorrect |
| `profile already exists` | User already has a profile |
| `profile not found` | Requested profile does not exist |
| `swipe not found` | Requested swipe does not exist |
| `match not found` | Requested match does not exist |
| `conversation not found` | Requested conversation does not exist |
| `unexpected server error` | Generic server error |

---

## Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET, PUT, or DELETE request |
| `201` | Created | Successful POST request (resource created) |
| `400` | Bad Request | Invalid request parameters or missing required fields |
| `401` | Unauthorized | Missing or invalid authentication token |
| `403` | Forbidden | User lacks permissions to access resource |
| `404` | Not Found | Requested resource does not exist |
| `409` | Conflict | Resource already exists or conflicts with existing data |
| `500` | Internal Server Error | Server-side error |

---

## Database Schema

### Indexes

For optimal query performance, the following indexes are created:

**Users:**
- `idx_users_email` - Email lookup optimization

**Sessions:**
- `idx_sessions_session_token` - Token validation optimization
- `idx_sessions_user_id` - User session lookup optimization
- `idx_sessions_expires_at` - Session expiration checks

**Profiles:**
- `idx_profiles_geo` - Geolocation queries

**Conversations:**
- `idx_conversations_match_id` - Match-based conversation lookups

**Messages:**
- `idx_messages_conversation_created` - Message retrieval by conversation and timestamp
- `idx_messages_sender_id` - Sender identification

### Database Triggers

**Automatic Match Creation:**
```sql
CREATE TRIGGER match_on_mutual_swipe
AFTER INSERT ON swipes
FOR EACH ROW
WHEN NEW.direction = 'R'
```

This trigger automatically creates a match when two users swipe right on each other (mutual swipe).

---

## Best Practices

### Authentication
- Store the JWT token securely (e.g., in httpOnly cookies)
- Include the Bearer token in all protected endpoint requests
- Handle token expiration (7 days) by prompting user to login again
- Implement token refresh mechanism if needed

### API Usage
- Always include the `Content-Type: application/json` header for POST/PUT requests
- Validate input data on the client side before sending requests
- Implement error handling for all API responses
- Use query parameters for filtering and pagination

### Profile Management
- Profile creation should include reasonable defaults
- Always use HTTPS in production
- Validate geographic coordinates before storing
- Implement image compression/resizing on client side

### Swiping & Matching
- Implement debouncing on swipe button to prevent duplicate submissions
- Cache profile list to improve performance
- Handle mutual swipe logic on client side for UX feedback
- Implement pagination for large profile lists

### Messaging
- Implement message formatting/validation with length limits
- Support message editing with timestamp updates
- Handle soft-deleted messages gracefully on client
- Implement real-time messaging with WebSockets (future enhancement)

---

## Future Enhancements

- [ ] WebSocket support for real-time messaging
- [ ] Message read receipts and typing indicators
- [ ] Video/image streaming in messages
- [ ] User blocking functionality
- [ ] Match recommendations algorithm
- [ ] Advanced geolocation search filters
- [ ] Test coverage and integration tests
- [ ] API rate limiting
- [ ] Admin dashboard endpoints

