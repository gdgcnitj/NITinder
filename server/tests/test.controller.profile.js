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
const { router: profileRouter } = await import("../controllers/profile.js");

describe("Profile Controller", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock session middleware
    app.use((req, res, next) => {
      req.session = { user_id: "user-123" };
      next();
    });
    
    app.use("/profiles", profileRouter);
    jest.clearAllMocks();
  });

  describe("GET /profiles", () => {
    it("should return all profiles", async () => {
      const mockProfiles = [
        { id: "profile-1", name: "User One", age: 25 },
        { id: "profile-2", name: "User Two", age: 30 },
      ];

      mockDbPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockProfiles),
      });

      const response = await request(app).get("/profiles");

      expect(response.status).toBe(200);
      expect(response.body.profiles).toEqual(mockProfiles);
    });

    it("should return profiles filtered by user_id", async () => {
      const mockProfile = [{ id: "profile-1", user_id: "user-123", name: "Test User" }];

      mockDbPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockProfile),
      });

      const response = await request(app).get("/profiles?user_id=user-123");

      expect(response.status).toBe(200);
      expect(response.body.profiles).toEqual(mockProfile);
    });
  });

  describe("GET /profiles/:id", () => {
    it("should return a specific profile", async () => {
      const mockProfile = {
        id: "profile-1",
        name: "Test User",
        age: 25,
        bio: "Test bio",
      };

      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockProfile),
      });

      const response = await request(app).get("/profiles/profile-1");

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual(mockProfile);
    });

    it("should return 404 when profile not found", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app).get("/profiles/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.detail).toBe("profile not found");
    });
  });

  describe("POST /profiles", () => {
    it("should create a new profile", async () => {
      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(null), // No existing profile
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }),
        });

      const response = await request(app)
        .post("/profiles")
        .send({
          name: "New User",
          age: 25,
          bio: "Test bio",
          gender: "M",
          looking_for: "F",
        });

      expect(response.status).toBe(201);
      expect(response.body.profile).toMatchObject({
        name: "New User",
        age: 25,
        bio: "Test bio",
        gender: "M",
        looking_for: "F",
      });
    });

    it("should return 409 when profile already exists", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue({ id: "existing-profile" }),
      });

      const response = await request(app)
        .post("/profiles")
        .send({
          name: "Test User",
          age: 25,
        });

      expect(response.status).toBe(409);
      expect(response.body.detail).toBe("profile already exists");
    });
  });

  describe("PUT /profiles/:id", () => {
    it("should update a profile", async () => {
      const mockProfile = {
        id: "profile-1",
        user_id: "user-123",
        name: "Old Name",
      };

      const updatedProfile = {
        id: "profile-1",
        user_id: "user-123",
        name: "New Name",
        age: 26,
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockProfile),
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(updatedProfile),
        });

      const response = await request(app)
        .put("/profiles/profile-1")
        .send({
          name: "New Name",
          age: 26,
        });

      expect(response.status).toBe(200);
      expect(response.body.profile.name).toBe("New Name");
      expect(response.body.profile.age).toBe(26);
    });

    it("should return 404 when profile not found", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app)
        .put("/profiles/nonexistent")
        .send({ name: "New Name" });

      expect(response.status).toBe(404);
      expect(response.body.detail).toBe("profile not found");
    });

    it("should return 403 when user does not own the profile", async () => {
      const mockProfile = {
        id: "profile-1",
        user_id: "different-user",
        name: "Test User",
      };

      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockProfile),
      });

      const response = await request(app)
        .put("/profiles/profile-1")
        .send({ name: "New Name" });

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("forbidden");
    });

    it("should return 400 when no fields to update", async () => {
      const mockProfile = {
        id: "profile-1",
        user_id: "user-123",
        name: "Test User",
      };

      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockProfile),
      });

      const response = await request(app)
        .put("/profiles/profile-1")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("no fields to update");
    });
  });

  describe("DELETE /profiles/:id", () => {
    it("should delete a profile", async () => {
      const mockProfile = {
        id: "profile-1",
        user_id: "user-123",
        name: "Test User",
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockProfile),
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }),
        });

      const response = await request(app).delete("/profiles/profile-1");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("profile deleted");
    });

    it("should return 404 when profile not found", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app).delete("/profiles/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.detail).toBe("profile not found");
    });

    it("should return 403 when user does not own the profile", async () => {
      const mockProfile = {
        id: "profile-1",
        user_id: "different-user",
        name: "Test User",
      };

      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockProfile),
      });

      const response = await request(app).delete("/profiles/profile-1");

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("forbidden");
    });
  });
});
