# NITinder Server Tests

Comprehensive Jest test suite for all NITinder server controllers.

## Test Files

- **test.controller.auth.js** - Tests for authentication endpoints (login, register, logout)
- **test.controller.profile.js** - Tests for profile CRUD operations
- **test.controller.swipe.js** - Tests for swipe functionality
- **test.controller.match.js** - Tests for match retrieval and updates
- **test.controller.conversation.js** - Tests for conversation management
- **test.controller.message.js** - Tests for messaging functionality

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a specific test file
npm test tests/test.controller.auth.js
```

## Test Coverage

All controllers have comprehensive test coverage including:
- ✅ Happy path scenarios
- ✅ Validation error handling
- ✅ Authorization/permission checks
- ✅ Database error handling
- ✅ Edge cases

## Test Structure

Each test file follows this pattern:
1. Mock database and utility functions using Jest's ESM module mocking
2. Set up Express app with the controller router
3. Use supertest to make HTTP requests
4. Assert expected responses and behavior

## Notes

- Tests use mock database connections, not a real database
- Session middleware is mocked for protected routes
- Tests are isolated and can run in any order
- ESM (ES Modules) syntax is used throughout
