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
const { router: conversationRouter } = await import("../controllers/conversation.js");

describe("Conversation Controller", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock session middleware
    app.use((req, res, next) => {
      req.session = { user_id: "user-123" };
      next();
    });
    
    app.use("/conversations", conversationRouter);
    jest.clearAllMocks();
  });

  describe("GET /conversations", () => {
    it("should return all conversations for the authenticated user", async () => {
      const mockConversations = [
        {
          id: "conv-1",
          match_id: "match-1",
          user1_id: "user-123",
          user2_id: "user-456",
          user1_name: "User One",
          user2_name: "User Two",
          last_message: "Hello!",
          last_message_at: "2024-01-01T12:00:00.000Z",
          created_at: "2024-01-01T10:00:00.000Z",
        },
      ];

      mockDbPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockConversations),
      });

      const response = await request(app).get("/conversations");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: "conv-1",
        match_id: "match-1",
        other_user_id: "user-456",
        other_user_name: "User Two",
        last_message: "Hello!",
        last_message_at: "2024-01-01T12:00:00.000Z",
      });
    });

    it("should return empty array when no conversations exist", async () => {
      mockDbPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue([]),
      });

      const response = await request(app).get("/conversations");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should handle database errors", async () => {
      mockDbPrepare.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/conversations");

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe("could not retrieve conversations");
    });
  });

  describe("GET /conversations/:conversationId", () => {
    it("should return a specific conversation with messages", async () => {
      const mockConversation = {
        id: "conv-1",
        match_id: "match-1",
        user1_id: "user-123",
        user2_id: "user-456",
        created_at: "2024-01-01T10:00:00.000Z",
      };

      const mockMessages = [
        {
          id: "msg-1",
          sender_id: "user-123",
          sender_name: "User One",
          content: "Hello!",
          created_at: "2024-01-01T10:01:00.000Z",
        },
      ];

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockConversation),
        })
        .mockReturnValueOnce({
          all: jest.fn().mockReturnValue(mockMessages),
        });

      const response = await request(app).get("/conversations/conv-1");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: "conv-1",
        match_id: "match-1",
        other_user_id: "user-456",
        messages: mockMessages,
      });
    });

    it("should return 403 when conversation ID is invalid", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app).get("/conversations/invalid-id");

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("you do not have access to this conversation");
    });

    it("should return 403 when user does not have access", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app).get("/conversations/conv-1");

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("you do not have access to this conversation");
    });

    it("should handle database errors", async () => {
      mockDbPrepare.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/conversations/conv-1");

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe("could not retrieve conversation");
    });
  });

  describe("POST /conversations", () => {
    it("should create a new conversation", async () => {
      const mockMatch = {
        id: "match-1",
        user1_id: "user-123",
        user2_id: "user-456",
      };

      const mockConversation = {
        id: "conv-1",
        match_id: "match-1",
        created_at: "2024-01-01T10:00:00.000Z",
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockMatch),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(null), // No existing conversation
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockConversation),
        });

      const response = await request(app)
        .post("/conversations")
        .send({ match_id: "match-1" });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("conversation created");
      expect(response.body.conversation).toMatchObject({
        id: "conv-1",
        match_id: "match-1",
      });
    });

    it("should return 400 when match_id is missing", async () => {
      const response = await request(app).post("/conversations").send({});

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("match_id required");
    });

    it("should return 403 when user is not part of the match", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app)
        .post("/conversations")
        .send({ match_id: "match-1" });

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("you are not part of this match");
    });

    it("should return 409 when conversation already exists", async () => {
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
          get: jest.fn().mockReturnValue({ id: "existing-conv" }),
        });

      const response = await request(app)
        .post("/conversations")
        .send({ match_id: "match-1" });

      expect(response.status).toBe(409);
      expect(response.body.detail).toBe("conversation already exists for this match");
    });

    it("should handle database errors", async () => {
      mockDbPrepare.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .post("/conversations")
        .send({ match_id: "match-1" });

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe("could not create conversation");
    });
  });

  describe("DELETE /conversations/:conversationId", () => {
    it("should delete a conversation", async () => {
      const mockConversation = {
        id: "conv-1",
        match_id: "match-1",
        user1_id: "user-123",
        user2_id: "user-456",
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockConversation),
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }), // soft delete messages
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }), // delete conversation
        });

      const response = await request(app).delete("/conversations/conv-1");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("conversation deleted");
    });

    it("should return 403 when user does not have access", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app).delete("/conversations/conv-1");

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("you do not have access to this conversation");
    });
  });
});
