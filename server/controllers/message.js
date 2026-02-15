import { Router } from "express";
import { db } from "../db/index.js";
import { v4 as uuid } from "uuid";

export const router = Router({});

// POST /conversations/:conversationId/messages
// Send a message in a conversation
router.post("/:conversationId/messages", async (req, res) => {
  try {
    const conversationId = req.params.conversationId?.trim();
    const userId = req.session.user_id;
    const content = req.body.content?.trim();

    if (!conversationId) {
      return res.status(400).json({ detail: "conversation ID required" });
    }

    if (!content) {
      return res.status(400).json({ detail: "message content required" });
    }

    // Verify user has access to this conversation
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

    const messageId = uuid();
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO messages (id, conversation_id, sender_id, content, created_at, deleted_at)
       VALUES (@id, @conversation_id, @sender_id, @content, @created_at, NULL)`,
    ).run({
      id: messageId,
      conversation_id: conversationId,
      sender_id: userId,
      content,
      created_at: createdAt,
    });

    const message = db
      .prepare(
        `SELECT m.*, p.name as sender_name
         FROM messages m
         JOIN profiles p ON m.sender_id = p.user_id
         WHERE m.id = @id`,
      )
      .get({ id: messageId });

    return res.status(201).json({
      message: "message sent",
      data: {
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        sender_name: message.sender_name,
        content: message.content,
        created_at: message.created_at,
      },
    });
  } catch (error) {
    console.error(`[ERROR] sending message: ${error}`);
    return res.status(500).json({ detail: "could not send message" });
  }
});

// GET /conversations/:conversationId/messages
// Get messages in a conversation with pagination
router.get("/:conversationId/messages", async (req, res) => {
  try {
    const conversationId = req.params.conversationId?.trim();
    const userId = req.session.user_id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    if (!conversationId) {
      return res.status(400).json({ detail: "conversation ID required" });
    }

    // Verify user has access to this conversation
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

    const messages = db
      .prepare(
        `SELECT m.*, p.name as sender_name
         FROM messages m
         JOIN profiles p ON m.sender_id = p.user_id
         WHERE m.conversation_id = @conversationId AND m.deleted_at IS NULL
         ORDER BY m.created_at DESC
         LIMIT @limit OFFSET @offset`,
      )
      .all({ conversationId, limit, offset });

    const totalCount = db
      .prepare(
        `SELECT COUNT(*) as count FROM messages 
         WHERE conversation_id = @conversationId AND deleted_at IS NULL`,
      )
      .get({ conversationId });

    return res.json({
      messages: messages.map((msg) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        content: msg.content,
        created_at: msg.created_at,
      })),
      pagination: {
        limit,
        offset,
        total: totalCount.count,
      },
    });
  } catch (error) {
    console.error(`[ERROR] retrieving messages: ${error}`);
    return res.status(500).json({ detail: "could not retrieve messages" });
  }
});

// PUT /messages/:messageId
// Update a message (only sender can edit, only if not deleted)
router.put("/:messageId", async (req, res) => {
  try {
    const messageId = req.params.messageId?.trim();
    const userId = req.session.user_id;
    const content = req.body.content?.trim();

    if (!messageId) {
      return res.status(400).json({ detail: "message ID required" });
    }

    if (!content) {
      return res.status(400).json({ detail: "message content required" });
    }

    // Verify user is the sender and message is not deleted
    const message = db
      .prepare(
        `SELECT * FROM messages WHERE id = @messageId AND sender_id = @userId AND deleted_at IS NULL`,
      )
      .get({ messageId, userId });

    if (!message) {
      return res.status(403).json({
        detail: "you cannot edit this message",
      });
    }

    db.prepare(`UPDATE messages SET content = @content WHERE id = @messageId`).run(
      {
        messageId,
        content,
      },
    );

    const updatedMessage = db
      .prepare(
        `SELECT m.*, p.name as sender_name
         FROM messages m
         JOIN profiles p ON m.sender_id = p.user_id
         WHERE m.id = @id`,
      )
      .get({ id: messageId });

    return res.json({
      message: "message updated",
      data: {
        id: updatedMessage.id,
        sender_id: updatedMessage.sender_id,
        sender_name: updatedMessage.sender_name,
        content: updatedMessage.content,
        created_at: updatedMessage.created_at,
      },
    });
  } catch (error) {
    console.error(`[ERROR] updating message: ${error}`);
    return res.status(500).json({ detail: "could not update message" });
  }
});

// DELETE /messages/:messageId
// Delete a message (soft delete - only sender can delete)
router.delete("/:messageId", async (req, res) => {
  try {
    const messageId = req.params.messageId?.trim();
    const userId = req.session.user_id;

    if (!messageId) {
      return res.status(400).json({ detail: "message ID required" });
    }

    // Verify user is the sender and message is not already deleted
    const message = db
      .prepare(
        `SELECT * FROM messages WHERE id = @messageId AND sender_id = @userId AND deleted_at IS NULL`,
      )
      .get({ messageId, userId });

    if (!message) {
      return res.status(403).json({
        detail: "you cannot delete this message",
      });
    }

    db.prepare(
      `UPDATE messages SET deleted_at = @deleted_at WHERE id = @messageId`,
    ).run({
      messageId,
      deleted_at: new Date().toISOString(),
    });

    return res.json({ message: "message deleted" });
  } catch (error) {
    console.error(`[ERROR] deleting message: ${error}`);
    return res.status(500).json({ detail: "could not delete message" });
  }
});
