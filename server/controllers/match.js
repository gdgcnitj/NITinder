import { Router } from "express";
import { db } from "../db/index.js";

export const router = Router({});

// GET /matches/:matchId
// Retrieve a match by ID with profile information for both users
router.get("/:matchId", async (req, res) => {
  try {
    const matchId = req.params.matchId?.trim();
    if (!matchId) {
      return res.status(400).json({ detail: "match ID required" });
    }

    const match = db
      .prepare(
        `SELECT m.*, 
                u1.email as user1_email, 
                p1.name as user1_name, 
                p1.age as user1_age,
                p1.bio as user1_bio,
                p1.gender as user1_gender,
                u2.email as user2_email,
                p2.name as user2_name,
                p2.age as user2_age,
                p2.bio as user2_bio,
                p2.gender as user2_gender
         FROM matches m
         JOIN users u1 ON m.user1_id = u1.id
         JOIN profiles p1 ON u1.id = p1.user_id
         JOIN users u2 ON m.user2_id = u2.id
         JOIN profiles p2 ON u2.id = p2.user_id
         WHERE m.id = @matchId`,
      )
      .get({ matchId });

    if (!match) {
      return res.status(404).json({ detail: "match not found" });
    }

    return res.json({
      id: match.id,
      created_at: match.created_at,
      user1: {
        id: match.user1_id,
        email: match.user1_email,
        name: match.user1_name,
        age: match.user1_age,
        bio: match.user1_bio,
        gender: match.user1_gender,
      },
      user2: {
        id: match.user2_id,
        email: match.user2_email,
        name: match.user2_name,
        age: match.user2_age,
        bio: match.user2_bio,
        gender: match.user2_gender,
      },
    });
  } catch (error) {
    console.error(`[ERROR] retrieving match: ${error}`);
    return res.status(500).json({ detail: "could not retrieve match" });
  }
});

// PUT /matches/:matchId
// Update a match (verify user is part of the match, then allow updates)
router.put("/:matchId", async (req, res) => {
  try {
    const matchId = req.params.matchId?.trim();
    if (!matchId) {
      return res.status(400).json({ detail: "match ID required" });
    }

    const userId = req.session.user_id;

    // Verify user is part of this match
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

    // Get updated fields from request body
    const { notes, archived } = req.body;

    if (notes !== undefined || archived !== undefined) {
      const updates = [];
      const params = { matchId };

      if (notes !== undefined) {
        updates.push(`notes = @notes`);
        params.notes = notes ? notes.trim() : null;
      }

      if (archived !== undefined) {
        updates.push(`archived = @archived`);
        params.archived = archived ? 1 : 0;
      }

      if (updates.length > 0) {
        const updateQuery = `UPDATE matches SET ${updates.join(", ")} WHERE id = @matchId`;
        db.prepare(updateQuery).run(params);
      }
    }

    // Retrieve updated match
    const updatedMatch = db
      .prepare(
        `SELECT m.*, 
                u1.email as user1_email, 
                p1.name as user1_name, 
                p1.age as user1_age,
                p1.bio as user1_bio,
                p1.gender as user1_gender,
                u2.email as user2_email,
                p2.name as user2_name,
                p2.age as user2_age,
                p2.bio as user2_bio,
                p2.gender as user2_gender
         FROM matches m
         JOIN users u1 ON m.user1_id = u1.id
         JOIN profiles p1 ON u1.id = p1.user_id
         JOIN users u2 ON m.user2_id = u2.id
         JOIN profiles p2 ON u2.id = p2.user_id
         WHERE m.id = @matchId`,
      )
      .get({ matchId });

    return res.json({
      message: "match updated successfully",
      match: {
        id: updatedMatch.id,
        created_at: updatedMatch.created_at,
        user1: {
          id: updatedMatch.user1_id,
          email: updatedMatch.user1_email,
          name: updatedMatch.user1_name,
          age: updatedMatch.user1_age,
          bio: updatedMatch.user1_bio,
          gender: updatedMatch.user1_gender,
        },
        user2: {
          id: updatedMatch.user2_id,
          email: updatedMatch.user2_email,
          name: updatedMatch.user2_name,
          age: updatedMatch.user2_age,
          bio: updatedMatch.user2_bio,
          gender: updatedMatch.user2_gender,
        },
      },
    });
  } catch (error) {
    console.error(`[ERROR] updating match: ${error}`);
    return res.status(500).json({ detail: "could not update match" });
  }
});
