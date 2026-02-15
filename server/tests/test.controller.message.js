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
const { router: messageRouter } = await import("../controllers/message.js");

describe("Message Controller", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock session middleware
    app.use((req, res, next) => {
      req.session = { user_id: "user-123" };
      next();
    });
    
    app.use("/conversations", messageRouter);
    jest.clearAllMocks();
  });

  describe("POST /conversations/:conversationId/messages", () => {
    it("should send a message successfully", async () => {
      const mockConversation = {
        id: "conv-1",
        match_id: "match-1",
      };

      const mockMessage = {
        id: "msg-1",
        conversation_id: "conv-1",
        sender_id: "user-123",
        sender_name: "Test User",
        content: "Hello!",
        created_at: "2024-01-01T10:00:00.000Z",
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockConversation),
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockMessage),
        });

      const response = await request(app)
        .post("/conversations/conv-1/messages")
        .send({ content: "Hello!" });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("message sent");
      expect(response.body.data).toMatchObject({
        id: "msg-1",
        conversation_id: "conv-1",
        sender_id: "user-123",
        sender_name: "Test User",
        content: "Hello!",
      });
    });

    it("should return 400 when conversation ID is missing", async () => {
      const response = await request(app)
        .post("/conversations/   /messages")
        .send({ content: "Hello!" });

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("conversation ID required");
    });

    it("should return 400 when message content is missing", async () => {
      const response = await request(app)
        .post("/conversations/conv-1/messages")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("message content required");
    });

    it("should return 403 when user does not have access to conversation", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app)
        .post("/conversations/conv-1/messages")
        .send({ content: "Hello!" });

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("you do not have access to this conversation");
    });

    it("should handle database errors", async () => {
      mockDbPrepare.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .post("/conversations/conv-1/messages")
        .send({ content: "Hello!" });

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe("could not send message");
    });
  });

  describe("GET /conversations/:conversationId/messages", () => {
    it("should retrieve messages with pagination", async () => {
      const mockConversation = {
        id: "conv-1",
        match_id: "match-1",
      };

      const mockMessages = [
        {
          id: "msg-1",
          sender_id: "user-123",
          sender_name: "User One",
          content: "Hello!",
          created_at: "2024-01-01T10:00:00.000Z",
        },
        {
          id: "msg-2",
          sender_id: "user-456",
          sender_name: "User Two",
          content: "Hi there!",
          created_at: "2024-01-01T10:01:00.000Z",
        },
      ];

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockConversation),
        })
        .mockReturnValueOnce({
          all: jest.fn().mockReturnValue(mockMessages),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue({ count: 2 }),
        });

      const response = await request(app).get("/conversations/conv-1/messages");

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        limit: 50,
        offset: 0,
        total: 2,
      });
    });

    it("should respect pagination parameters", async () => {
      const mockConversation = {
        id: "conv-1",
        match_id: "match-1",
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockConversation),
        })
        .mockReturnValueOnce({
          all: jest.fn().mockReturnValue([]),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue({ count: 100 }),
        });

      const response = await request(app).get("/conversations/conv-1/messages?limit=10&offset=20");

      expect(response.status).toBe(200);
      expect(response.body.pagination).toMatchObject({
        limit: 10,
        offset: 20,
        total: 100,
      });
    });

    it("should cap limit at 100", async () => {
      const mockConversation = {
        id: "conv-1",
        match_id: "match-1",
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockConversation),
        })
        .mockReturnValueOnce({
          all: jest.fn().mockReturnValue([]),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue({ count: 0 }),
        });

      const response = await request(app).get("/conversations/conv-1/messages?limit=200");

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(100);
    });

    it("should return 400 when conversation ID is missing", async () => {
      const response = await request(app).get("/conversations/   /messages");

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("conversation ID required");
    });

    it("should return 403 when user does not have access", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app).get("/conversations/conv-1/messages");

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("you do not have access to this conversation");
    });
  });

  describe("PUT /conversations/:messageId (update message)", () => {
    it("should update a message successfully", async () => {
      const mockMessage = {
        id: "msg-1",
        sender_id: "user-123",
        content: "Old content",
        deleted_at: null,
      };

      const mockUpdatedMessage = {
        id: "msg-1",
        sender_id: "user-123",
        sender_name: "Test User",
        content: "New content",
        created_at: "2024-01-01T10:00:00.000Z",
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockMessage),
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockUpdatedMessage),
        });

      const response = await request(app)
        .put("/conversations/msg-1")
        .send({ content: "New content" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("message updated");
      expect(response.body.data.content).toBe("New content");
    });

    it("should return 403 when message ID is empty after trim", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app)
        .put("/conversations/invalid-id")
        .send({ content: "New content" });

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("you cannot edit this message");
    });

    it("should return 400 when content is missing", async () => {
      const response = await request(app)
        .put("/conversations/msg-1")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("message content required");
    });

    it("should return 403 when user is not the sender", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app)
        .put("/conversations/msg-1")
        .send({ content: "New content" });

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("you cannot edit this message");
    });

    it("should handle database errors", async () => {
      mockDbPrepare.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .put("/conversations/msg-1")
        .send({ content: "New content" });

      expect(response.status).toBe(500);
    });
  });
});
