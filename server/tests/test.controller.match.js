import { jest } from "@jest/globals";
import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

// Create mock functions
const mockDbPrepare = jest.fn();

// Mock modules before importing
jest.unstable_mockModule("../db/index.js", () => ({
  db: { prepare: mockDbPrepare },
}));

// Import router after mocking
const { router: matchRouter } = await import("../controllers/match.js");

describe("Match Controller", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock session middleware
    app.use((req, res, next) => {
      req.session = { user_id: "user-123" };
      next();
    });
    
    app.use("/matches", matchRouter);
    jest.clearAllMocks();
  });

  describe("GET /matches", () => {
    it("should return all matches for the authenticated user", async () => {
      const mockMatches = [
        {
          id: "match-1",
          user1_id: "user-123",
          user2_id: "user-2",
          created_at: "2024-01-01T00:00:00.000Z",
          user1_email: "user1@example.com",
          user1_name: "User One",
          user1_age: 25,
          user1_bio: "Bio 1",
          user1_gender: "M",
          user2_email: "user2@example.com",
          user2_name: "User Two",
          user2_age: 27,
          user2_bio: "Bio 2",
          user2_gender: "F",
        },
      ];

      mockDbPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockMatches),
      });

      const response = await request(app).get("/matches");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe("match-1");
      expect(response.body[0].user1.id).toBe("user-123");
      expect(response.body[0].user2.id).toBe("user-2");
    });

    it("should return empty array when user has no matches", async () => {
      mockDbPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue([]),
      });

      const response = await request(app).get("/matches");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should handle database errors", async () => {
      mockDbPrepare.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/matches");

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe("could not retrieve matches");
    });
  });

  describe("POST /matches", () => {
    it("should create a match between two users", async () => {
      const mockUser1 = { id: "user-aaa" };
      const mockUser2 = { id: "user-bbb" };

      const mockCreatedMatch = {
        id: "match-new",
        user1_id: "user-aaa",
        user2_id: "user-bbb",
        created_at: "2024-01-01T00:00:00.000Z",
        user1_email: "a@example.com",
        user1_name: "User A",
        user1_age: 25,
        user1_bio: "Bio A",
        user1_gender: "M",
        user2_email: "b@example.com",
        user2_name: "User B",
        user2_age: 28,
        user2_bio: "Bio B",
        user2_gender: "F",
      };

      mockDbPrepare
        .mockReturnValueOnce({ get: jest.fn().mockReturnValue(mockUser1) }) // user1 exists
        .mockReturnValueOnce({ get: jest.fn().mockReturnValue(mockUser2) }) // user2 exists
        .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })      // no existing match
        .mockReturnValueOnce({ run: jest.fn() })                            // insert
        .mockReturnValueOnce({ get: jest.fn().mockReturnValue(mockCreatedMatch) }); // fetch created

      const response = await request(app)
        .post("/matches")
        .send({ user1_id: "user-aaa", user2_id: "user-bbb" });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe("match-new");
      expect(response.body.user1.id).toBe("user-aaa");
      expect(response.body.user2.id).toBe("user-bbb");
    });

    it("should return 400 when user IDs are missing", async () => {
      const response = await request(app)
        .post("/matches")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("user1_id and user2_id are required");
    });

    it("should return 400 when matching with yourself", async () => {
      const response = await request(app)
        .post("/matches")
        .send({ user1_id: "user-123", user2_id: "user-123" });

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("cannot create a match with yourself");
    });

    it("should return 404 when a user does not exist", async () => {
      mockDbPrepare
        .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ id: "user-aaa" }) })
        .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) });

      const response = await request(app)
        .post("/matches")
        .send({ user1_id: "user-aaa", user2_id: "user-nonexistent" });

      expect(response.status).toBe(404);
      expect(response.body.detail).toBe("one or both users not found");
    });

    it("should return 409 when match already exists", async () => {
      mockDbPrepare
        .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ id: "user-aaa" }) })
        .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ id: "user-bbb" }) })
        .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ id: "existing-match" }) });

      const response = await request(app)
        .post("/matches")
        .send({ user1_id: "user-aaa", user2_id: "user-bbb" });

      expect(response.status).toBe(409);
      expect(response.body.detail).toBe("match already exists between these users");
    });

    it("should handle database errors", async () => {
      mockDbPrepare.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .post("/matches")
        .send({ user1_id: "user-aaa", user2_id: "user-bbb" });

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe("could not create match");
    });
  });

  describe("GET /matches/:matchId", () => {
    it("should return a match with full user details", async () => {
      const mockMatch = {
        id: "match-1",
        user1_id: "user-1",
        user2_id: "user-2",
        created_at: "2024-01-01T00:00:00.000Z",
        user1_email: "user1@example.com",
        user1_name: "User One",
        user1_age: 25,
        user1_bio: "Bio 1",
        user1_gender: "M",
        user2_email: "user2@example.com",
        user2_name: "User Two",
        user2_age: 27,
        user2_bio: "Bio 2",
        user2_gender: "F",
      };

      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockMatch),
      });

      const response = await request(app).get("/matches/match-1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: "match-1",
        created_at: "2024-01-01T00:00:00.000Z",
        user1: {
          id: "user-1",
          email: "user1@example.com",
          name: "User One",
          age: 25,
          bio: "Bio 1",
          gender: "M",
        },
        user2: {
          id: "user-2",
          email: "user2@example.com",
          name: "User Two",
          age: 27,
          bio: "Bio 2",
          gender: "F",
        },
      });
    });

    it("should return matches list when no matchId param", async () => {
      mockDbPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue([]),
      });

      const response = await request(app).get("/matches/");

      expect(response.status).toBe(200); // Now hits GET /matches list endpoint
      expect(response.body).toEqual([]);
    });

    it("should return 404 when match not found", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app).get("/matches/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.detail).toBe("match not found");
    });

    it("should handle database errors", async () => {
      mockDbPrepare.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/matches/match-1");

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe("could not retrieve match");
    });
  });

  describe("PUT /matches/:matchId", () => {
    it("should update match notes", async () => {
      const mockMatch = {
        id: "match-1",
        user1_id: "user-123",
        user2_id: "user-2",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      const mockUpdatedMatch = {
        ...mockMatch,
        notes: "Updated notes",
        user1_email: "user1@example.com",
        user1_name: "User One",
        user1_age: 25,
        user1_bio: "Bio 1",
        user1_gender: "M",
        user2_email: "user2@example.com",
        user2_name: "User Two",
        user2_age: 27,
        user2_bio: "Bio 2",
        user2_gender: "F",
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockMatch),
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockUpdatedMatch),
        });

      const response = await request(app)
        .put("/matches/match-1")
        .send({ notes: "Updated notes" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("match updated successfully");
      expect(response.body.match).toBeDefined();
    });

    it("should update match archived status", async () => {
      const mockMatch = {
        id: "match-1",
        user1_id: "user-123",
        user2_id: "user-2",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      const mockUpdatedMatch = {
        ...mockMatch,
        archived: 1,
        user1_email: "user1@example.com",
        user1_name: "User One",
        user1_age: 25,
        user1_bio: "Bio 1",
        user1_gender: "M",
        user2_email: "user2@example.com",
        user2_name: "User Two",
        user2_age: 27,
        user2_bio: "Bio 2",
        user2_gender: "F",
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockMatch),
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockUpdatedMatch),
        });

      const response = await request(app)
        .put("/matches/match-1")
        .send({ archived: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("match updated successfully");
    });

    it("should update both notes and archived status", async () => {
      const mockMatch = {
        id: "match-1",
        user1_id: "user-123",
        user2_id: "user-2",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      const mockUpdatedMatch = {
        ...mockMatch,
        notes: "New notes",
        archived: 1,
        user1_email: "user1@example.com",
        user1_name: "User One",
        user1_age: 25,
        user1_bio: "Bio 1",
        user1_gender: "M",
        user2_email: "user2@example.com",
        user2_name: "User Two",
        user2_age: 27,
        user2_bio: "Bio 2",
        user2_gender: "F",
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockMatch),
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockUpdatedMatch),
        });

      const response = await request(app)
        .put("/matches/match-1")
        .send({ notes: "New notes", archived: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("match updated successfully");
    });

    it("should return 403 when user is not part of the match", async () => {
      const mockMatch = {
        id: "match-1",
        user1_id: "different-user-1",
        user2_id: "different-user-2",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app)
        .put("/matches/match-1")
        .send({ notes: "Updated notes" });

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("you are not part of this match");
    });

    it("should handle database errors", async () => {
      mockDbPrepare.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .put("/matches/match-1")
        .send({ notes: "Updated notes" });

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe("could not update match");
    });
  });
});
