import { jest } from "@jest/globals";
import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

process.env.TEST = "true";

const mockDbPrepare = jest.fn();

jest.unstable_mockModule("../db/index.js", () => ({
  db: { prepare: mockDbPrepare },
}));

const { router: dateSuggestionRouter } = await import(
  "../controllers/date-suggestions.js"
);

describe("Date Suggestions Controller", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    app.use((req, res, next) => {
      req.session = { user_id: "user-123" };
      next();
    });

    app.use("/date-suggestions", dateSuggestionRouter);
    jest.clearAllMocks();
  });

  it("should return suggestions using the mock LLM", async () => {
    const mockMatch = {
      id: "match-1",
      user1_id: "user-123",
      user2_id: "user-456",
    };

    const profile1 = {
      user_id: "user-123",
      name: "User One",
      bio: "likes hiking and coffee",
      latitude: 10,
      longitude: 20,
    };

    const profile2 = {
      user_id: "user-456",
      name: "User Two",
      bio: "coffee and live music",
      latitude: 11,
      longitude: 21,
    };

    mockDbPrepare
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue(mockMatch),
      })
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue(profile1),
      })
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue(profile2),
      })
      .mockReturnValueOnce({
        all: jest.fn().mockReturnValue([]),
      });

    const response = await request(app)
      .post("/date-suggestions")
      .send({ match_id: "match-1", suggestion_count: 3 });

    expect(response.status).toBe(200);
    expect(response.body.match_id).toBe("match-1");
    expect(response.body.suggestions).toHaveLength(3);
    expect(response.body.suggestions[0].title).toMatch(/Mock date idea/);
  });

  it("should return 400 when match_id is missing", async () => {
    const response = await request(app).post("/date-suggestions").send({});

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe("match_id required");
  });

  it("should return 403 when user is not part of the match", async () => {
    mockDbPrepare.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });

    const response = await request(app)
      .post("/date-suggestions")
      .send({ match_id: "match-1" });

    expect(response.status).toBe(403);
    expect(response.body.detail).toBe("you are not in this match");
  });

  it("should return 404 when profiles are missing", async () => {
    const mockMatch = {
      id: "match-1",
      user1_id: "user-123",
      user2_id: "user-456",
    };

    mockDbPrepare
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue(mockMatch),
      })
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue(null),
      });

    const response = await request(app)
      .post("/date-suggestions")
      .send({ match_id: "match-1" });

    expect(response.status).toBe(404);
    expect(response.body.detail).toBe("profiles not found");
  });

  it("should handle database errors", async () => {
    mockDbPrepare.mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await request(app)
      .post("/date-suggestions")
      .send({ match_id: "match-1" });

    expect(response.status).toBe(500);
    expect(response.body.detail).toBe("could not generate suggestions");
  });
});
