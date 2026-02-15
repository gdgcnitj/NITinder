import { jest } from "@jest/globals";
import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

// Create a mock SqliteError class that matches better-sqlite3
class SqliteError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "SqliteError";
    this.code = code;
  }
}

// Create mock functions
const mockDbPrepare = jest.fn();
const mockGetPasswordHash = jest.fn();
const mockVerifyPasswordHash = jest.fn();
const mockCreateAccessToken = jest.fn();

// Mock modules before importing
jest.unstable_mockModule("../db/index.js", () => ({
  db: { prepare: mockDbPrepare },
}));

jest.unstable_mockModule("../utils.js", () => ({
  getPasswordHash: mockGetPasswordHash,
  verifyPasswordHash: mockVerifyPasswordHash,
  createAccessToken: mockCreateAccessToken,
}));

jest.unstable_mockModule("better-sqlite3", () => ({
  SqliteError: SqliteError,
  default: class Database {},
}));

// Import router after mocking
const { router: authRouter } = await import("../controllers/auth.js");

describe("Auth Controller", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/auth", authRouter);
    jest.clearAllMocks();
  });

  describe("POST /auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password_hash: "hashed_password",
      };

      const mockProfile = { name: "Test User" };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockUser),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockProfile),
        });

      mockVerifyPasswordHash.mockResolvedValue(true);
      mockCreateAccessToken.mockReturnValue("fake-jwt-token");

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.headers.authorization).toBe("Bearer fake-jwt-token");
      expect(response.body.message).toContain("Welcome back Test User!");
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("email and password required");
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("email and password required");
    });

    it("should return 401 when user not found", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        });

      expect(response.status).toBe(401);
      expect(response.body.detail).toBe("invalid credentials");
    });

    it("should return 401 when password is incorrect", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password_hash: "hashed_password",
      };

      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockUser),
      });

      mockVerifyPasswordHash.mockResolvedValue(false);

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "wrong_password",
        });

      expect(response.status).toBe(401);
      expect(response.body.detail).toBe("invalid credentials");
    });

    it("should handle server errors", async () => {
      mockDbPrepare.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe("unexpected server error");
    });
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      mockDbPrepare.mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 1 }),
      });

      mockGetPasswordHash.mockResolvedValue("hashed_password");

      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "newuser@example.com",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Registered user: John Doe");
    });

    it("should return 400 when required fields are missing", async () => {
      const testCases = [
        { password: "password123", firstName: "John", lastName: "Doe" },
        { email: "test@example.com", firstName: "John", lastName: "Doe" },
        { email: "test@example.com", password: "password123", lastName: "Doe" },
        { email: "test@example.com", password: "password123", firstName: "John" },
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post("/auth/register")
          .send(testCase);

        expect(response.status).toBe(400);
        expect(response.body.detail).toBe("missing required fields");
      }
    });

    it("should return 409 when user already exists", async () => {
      const sqliteError = new SqliteError("UNIQUE constraint failed", "SQLITE_CONSTRAINT_UNIQUE");

      mockDbPrepare.mockReturnValue({
        run: jest.fn().mockImplementation(() => {
          throw sqliteError;
        }),
      });

      mockGetPasswordHash.mockResolvedValue("hashed_password");

      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "existing@example.com",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
        });

      expect(response.status).toBe(409);
      expect(response.body.detail).toBe("user already exists");
    });

    it("should handle database errors", async () => {
      mockDbPrepare.mockReturnValue({
        run: jest.fn().mockImplementation(() => {
          throw new Error("Database error");
        }),
      });

      mockGetPasswordHash.mockResolvedValue("hashed_password");

      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
        });

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe("could not register user");
    });
  });

  describe("GET /auth/logout", () => {
    it("should return 404 when session not found without proper middleware", async () => {
      const appWithSession = express();
      appWithSession.use(express.json());
      // Add middleware to set req.session
      appWithSession.use((req, res, next) => {
        req.session = { session_id: "test-session-123", user_id: "user-123" };
        next();
      });
      appWithSession.use("/auth", authRouter);

      mockDbPrepare.mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 0 }),
      });

      const response = await request(appWithSession).get("/auth/logout");

      expect(response.status).toBe(404);
      expect(response.body.detail).toBe("session not found");
    });
  });
});

