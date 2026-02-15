import { Router } from "express";
import { db } from "../db/index.js";
import { v4 as uuid } from "uuid";

export const router = Router({});

// GET /conversations
// List all conversations for the authenticated user
router.get("/", async (req, res) => {
  try {
    const userId = req.session.user_id;

    const conversations = db
      .prepare(
        `SELECT c.*, 
                m.user1_id, 
                m.user2_id,
                p1.name as user1_name,
                p2.name as user2_name,
                (SELECT content FROM messages 
                 WHERE conversation_id = c.id AND deleted_at IS NULL
                 ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages 
                 WHERE conversation_id = c.id AND deleted_at IS NULL
                 ORDER BY created_at DESC LIMIT 1) as last_message_at
         FROM conversations c
         JOIN matches m ON c.match_id = m.id
         JOIN profiles p1 ON m.user1_id = p1.user_id
         JOIN profiles p2 ON m.user2_id = p2.user_id
         WHERE m.user1_id = @userId OR m.user2_id = @userId
         ORDER BY c.created_at DESC`,
      )
      .all({ userId });

    const formattedConversations = conversations.map((conv) => {
      const otherUserId =
        conv.user1_id === userId ? conv.user2_id : conv.user1_id;
      const otherUserName =
        conv.user1_id === userId ? conv.user2_name : conv.user1_name;

      return {
        id: conv.id,
        match_id: conv.match_id,
        other_user_id: otherUserId,
        other_user_name: otherUserName,
        last_message: conv.last_message,
        last_message_at: conv.last_message_at,
        created_at: conv.created_at,
      };
    });

    return res.json(formattedConversations);
  } catch (error) {
    console.error(`[ERROR] retrieving conversations: ${error}`);
    return res.status(500).json({ detail: "could not retrieve conversations" });
  }
});

// GET /conversations/:conversationId
// Get a specific conversation with messages
router.get("/:conversationId", async (req, res) => {
  try {
    const conversationId = req.params.conversationId?.trim();
    const userId = req.session.user_id;

    if (!conversationId) {
      return res.status(400).json({ detail: "conversation ID required" });
    }

    // Verify user is part of this conversation's match
    const conversation = db
      .prepare(
        `SELECT c.*, m.user1_id, m.user2_id
         FROM conversations c
         JOIN matches m ON c.match_id = m.id
         WHERE c.id = @conversationId AND (m.user1_id = @userId OR m.user2_id = @userId)`,
      )
      .get({ conversationId, userId });

    if (!conversation) {
      return res.status(403).json({
        detail: "you do not have access to this conversation",
      });
    }

    const otherUserId =
      conversation.user1_id === userId
        ? conversation.user2_id
        : conversation.user1_id;

    const messages = db
      .prepare(
        `SELECT m.*, p.name as sender_name
         FROM messages m
         JOIN profiles p ON m.sender_id = p.user_id
         WHERE m.conversation_id = @conversationId AND m.deleted_at IS NULL
         ORDER BY m.created_at ASC`,
      )
      .all({ conversationId });

    return res.json({
      id: conversation.id,
      match_id: conversation.match_id,
      other_user_id: otherUserId,
      created_at: conversation.created_at,
      messages: messages.map((msg) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        content: msg.content,
        created_at: msg.created_at,
      })),
    });
  } catch (error) {
    console.error(`[ERROR] retrieving conversation: ${error}`);
    return res.status(500).json({ detail: "could not retrieve conversation" });
  }
});

// POST /conversations
// Create a new conversation for a match
router.post("/", async (req, res) => {
  try {
    const matchId = req.body.match_id?.trim();
    const userId = req.session.user_id;

    if (!matchId) {
      return res.status(400).json({ detail: "match_id required" });
    }

    // Verify match exists and user is part of it
    const match = db
      .prepare(
        `SELECT * FROM matches 
         WHERE id = @matchId AND (user1_id = @userId OR user2_id = @userId)`,
      )
      .get({ matchId, userId });

    if (!match) {
      return res.status(403).json({
        detail: "you are not part of this match",
      });
    }

    // Check if conversation already exists for this match
    const existingConversation = db
      .prepare(`SELECT id FROM conversations WHERE match_id = @matchId`)
      .get({ matchId });

    if (existingConversation) {
      return res.status(409).json({
        detail: "conversation already exists for this match",
      });
    }

    const conversationId = uuid();
    db.prepare(
      `INSERT INTO conversations (id, match_id, created_at)
       VALUES (@id, @match_id, @created_at)`,
    ).run({
      id: conversationId,
      match_id: matchId,
      created_at: new Date().toISOString(),
    });

    const conversation = db
      .prepare(`SELECT * FROM conversations WHERE id = @id`)
      .get({ id: conversationId });

    return res.status(201).json({
      message: "conversation created",
      conversation: {
        id: conversation.id,
        match_id: conversation.match_id,
        created_at: conversation.created_at,
      },
    });
  } catch (error) {
    console.error(`[ERROR] creating conversation: ${error}`);
    return res.status(500).json({ detail: "could not create conversation" });
  }
});

// DELETE /conversations/:conversationId
// Delete/archive a conversation
router.delete("/:conversationId", async (req, res) => {
  try {
    const conversationId = req.params.conversationId?.trim();
    const userId = req.session.user_id;

    if (!conversationId) {
      return res.status(400).json({ detail: "conversation ID required" });
    }

    // Verify user is part of this conversation
    const conversation = db
      .prepare(
        `SELECT c.* FROM conversations c
         JOIN matches m ON c.match_id = m.id
         WHERE c.id = @conversationId AND (m.user1_id = @userId OR m.user2_id = @userId)`,
      )
      .get({ conversationId, userId });

    if (!conversation) {
      return res.status(403).json({
        detail: "you do not have access to this conversation",
      });
    }

    // Delete all messages in conversation (soft delete)
    db.prepare(
      `UPDATE messages SET deleted_at = @deleted_at 
       WHERE conversation_id = @conversationId AND deleted_at IS NULL`,
    ).run({
      conversationId,
      deleted_at: new Date().toISOString(),
    });

    // Delete conversation
    db.prepare(`DELETE FROM conversations WHERE id = @conversationId`).run({
      conversationId,
    });

    return res.json({ message: "conversation deleted" });
  } catch (error) {
    console.error(`[ERROR] deleting conversation: ${error}`);
    return res.status(500).json({ detail: "could not delete conversation" });
  }
});
