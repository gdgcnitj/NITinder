# NITinder Backend Server

A Node.js/Express backend API for the NITinder dating application demonstration. Built with modern JavaScript (ESM), SQLite database, and JWT-based authentication.

## Overview

NITinder is a Tinder-like application created for Google Developer Groups on Campus (GDGC) at National Institute of Technology Jalandhar (NITJ). This backend serves as the core API providing user authentication, profile management, swiping functionality, and matching capabilities.

## Tech Stack

- **Framework:** Express.js (v5.2.1)
- **Runtime:** Node.js (ESM modules)
- **Database:** SQLite (better-sqlite3)
- **Authentication:** JWT with Argon2 password hashing
- **Security:** Helmet, CORS
- **Testing:** Jest with Supertest
- **Development:** Nodemon for hot reloading

## Prerequisites

- **Node.js** v18+ (ESM support required)
- **npm** or **yarn** package manager
- A terminal/command line interface

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js and dependencies (cors, helmet, morgan)
- Database driver (better-sqlite3)
- Authentication utilities (jsonwebtoken, argon2)
- Testing framework (jest, supertest)

### 2. Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Server Port (default: 3000)
PORT=3000

# JWT Configuration (defaults provided, customize for production)
ALGORITHM=HS256
SECRET_KEY=your_secure_secret_key_here
```

You can also use the defaults without creating a `.env` file:
- `PORT` defaults to `3000`
- `ALGORITHM` defaults to `HS256`
- `SECRET_KEY` defaults to `SECRET_KEY` (change for production)

### 3. Database Setup

The project uses SQLite for data persistence. Set up the database in two steps:

#### Step 1: Create Tables

```bash
npm run db:push
```

This initializes the database schema with the following tables:
- `users` - User accounts with email and password hash
- `sessions` - JWT session management
- `profiles` - User profiles with personal information
- `swipes` - Swipe history (left/right)
- `matches` - Mutual match records
- `conversations` - Messaging conversations
- `messages` - Individual messages

#### Step 2: Seed Demo Data

```bash
npm run db:seed
```

This populates the database with demo users and profiles for testing. Demo credentials:
```
Email: john@doe.com | Password: john_password
Email: jane@doe.com | Password: jane_password
Email: juan@rodri.com | Password: juan_password
```

## Running the Application

### Development Server

Start the development server with hot reloading:

```bash
npm start
```

The server will start at `http://localhost:3000` (or your configured PORT).

You should see output like:
```
Server started at: http://localhost:3000
```

The development server uses Nodemon to automatically restart when file changes are detected.

### CORS Configuration

The server is configured to accept requests from:
- `http://localhost:5173` (Vite default dev server)
- `http://127.0.0.1:5173`

Update the `corsOrigin` array in [server.js](server.js#L10-L13) if your frontend runs on a different origin.

## Testing

The project includes comprehensive test coverage using Jest and Supertest.

### Run All Tests

```bash
npm test
```

### Watch Mode (Recommended for Development)

```bash
npm run test:watch
```

Runs tests in watch mode, re-running on file changes.

### Coverage Report

```bash
npm run test:coverage
```

Generates a code coverage report showing test coverage metrics.

**Test Files Location:** `tests/` directory contains test suites for all controllers:
- `test.controller.auth.js` - Authentication endpoints
- `test.controller.profile.js` - Profile management
- `test.controller.swipe.js` - Swiping functionality
- `test.controller.match.js` - Match logic
- `test.controller.message.js` - Messaging
- `test.controller.conversation.js` - Conversations

## API Endpoints

### Authentication Routes (`/auth`)

All auth endpoints are publicly accessible without JWT:
- `POST /auth/register` - Create a new user account
- `POST /auth/login` - Authenticate and receive JWT token

### Profile Routes (`/profiles`)

Protected endpoints requiring valid JWT:
- `GET /profiles` - Get user's own profile
- `PUT /profiles` - Update user's profile
- `GET /profiles/:userId` - Get another user's profile

### Swipe Routes (`/swipes`)

Protected endpoints:
- `POST /swipes` - Record a swipe (left/right)
- `GET /swipes/matches` - Get mutual matches

### Additional Routes

- `GET /` - Health check endpoint (public)

**For detailed API contract and request/response shapes, see [API.md](API.md)**

## Project Structure

```
.
├── controllers/          # Route handlers and business logic
│   ├── auth.js          # Authentication logic
│   ├── profile.js       # Profile management
│   ├── swipe.js         # Swiping functionality
│   ├── match.js         # Match logic
│   ├── message.js       # Messaging
│   └── conversation.js  # Conversations
├── db/                  # Database configuration
│   ├── index.js         # Database connection
│   ├── setup.js         # Schema definitions
│   └── seed.js          # Demo data seeding
├── static/              # Static assets (images, etc.)
│   └── img/             # Profile images
├── tests/               # Test suites
│   └── test.controller.*.js
├── middleware.js        # Express middlewares (auth, CORS, etc.)
├── server.js            # Main server entry point
├── utils.js             # Utility functions (JWT, password hashing)
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## Key Features

### Authentication & Security
- JWT-based stateless authentication
- Argon2 password hashing for secure storage
- Helmet.js for HTTP security headers
- CORS protection with origin whitelist
- Session tracking in database

### Data Management
- Synchronous SQLite queries with `better-sqlite3`
- Transaction support for data consistency
- Soft deletes on user accounts
- Foreign key relationships between tables

### Development Experience
- Hot reload with Nodemon
- ESM modules throughout (no CommonJS)
- Morgan HTTP request logging
- Comprehensive test coverage with Jest

## Common Development Tasks

### Reset Database

If you need a fresh database, delete the `test.db` file and re-run:
```bash
npm run db:push && npm run db:seed
```

### View Database

To explore the database directly using a SQLite client:
```bash
# Using sqlite3 CLI (if installed)
sqlite3 test.db

# Or use a GUI tool like DbBrowser for SQLite
```

### Debug Authentication Issues

Check the auth middleware in [middleware.js](middleware.js) and ensure:
1. JWT token is being sent in `Authorization: Bearer <token>` header
2. Session exists in the database for the user
3. Token hasn't expired

### Monitor Server Logs

The server uses Morgan for HTTP logging. Logs show:
- Request method and path
- Response status code
- Response time
- Request size

## Troubleshooting

### Port Already in Use
```bash
# Use a different port
PORT=3001 npm start
```

### Database Locked Error
Better-sqlite3 may lock if another process has the database open. Ensure only one server instance is running.

### JWT Verification Fails
- Verify `ALGORITHM` and `SECRET_KEY` match between server and any other services
- Check token hasn't expired in the session table
- Ensure Bearer token format: `Authorization: Bearer <token>`

### Tests Fail
- Run `npm run db:seed` to ensure demo data exists
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Use `npm run test:watch` for detailed error messages

## Contributing

When making changes:
1. Keep database schema changes in `db/setup.js`
2. Add corresponding seed data to `db/seed.js`
3. Update controller logic in `controllers/`
4. Write tests for new features in `tests/`
5. Update [API.md](API.md) if endpoints change

## License

MIT

## Support

For issues or questions about this project, please refer to the [API.md](API.md) for detailed endpoint documentation.

---

**Created for Google Developer Groups on Campus (GDGC) at NITJ**
