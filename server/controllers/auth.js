import { Router } from "express";
import {
  createAccessToken,
  getPasswordHash,
  verifyPasswordHash,
} from "../utils.js";
import { db } from "../db/index.js";
import { SqliteError } from "better-sqlite3";
import { v4 as uuid } from "uuid";

export const router = Router({});

router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    if (!email || !password)
      return res.status(400).json({ detail: "email and password required" });

    const user = db
      .prepare(`SELECT * FROM users WHERE email = @email`)
      .get({ email });
    if (!user) return res.status(401).json({ detail: "invalid credentials" });

    if (!(await verifyPasswordHash(user.password_hash, password)))
      return res.status(401).json({ detail: "invalid credentials" });
    const profile = db
      .prepare(`SELECT name FROM profiles WHERE user_id = @user_id`)
      .get({ user_id: user.id });
    const name = profile?.name || user.email;
    return res
      .header({
        Authorization: `Bearer ${createAccessToken(user)}`,
      })
      .json({
        message: `Welcome back ${name}!`,
      });
  } catch (error) {
    console.error(`[ERROR] unexpected error: ${error}`);
    return res.status(500).json({ detail: "unexpected server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    const firstName = req.body.firstName?.trim();
    const lastName = req.body.lastName?.trim();

    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ detail: "missing required fields" });

    const userId = uuid();
    const now = new Date().toISOString();

    // Create the user
    db.prepare(`
      INSERT INTO users(id, email, password_hash, created_at, deleted_at)
      VALUES (@id, @email, @password_hash, @created_at, NULL)`,
    ).run({
      id: userId,
      email,
      password_hash: await getPasswordHash(password),
      created_at: now,
    });

    // Create a profile for the user
    const profileId = uuid();
    const fullName = `${firstName} ${lastName}`.trim();
    db.prepare(`
      INSERT INTO profiles (id, user_id, name, age, bio, gender, looking_for,
        latitude, longitude, profile_image, created_at, updated_at)
      VALUES (@id, @user_id, @name, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, @created_at, @updated_at)`,
    ).run({
      id: profileId,
      user_id: userId,
      name: fullName,
      created_at: now,
      updated_at: now,
    });

    const user = { id: userId, email };
    return res
      .header({
        Authorization: `Bearer ${createAccessToken(user)}`,
      })
      .json({
        message: `Registered user: ${fullName}`,
      });
  } catch (error) {
    if (error instanceof SqliteError) {
      console.error(`[ERROR] (${error.code}) ${error.message}`);
      if (error.code == "SQLITE_CONSTRAINT_UNIQUE") {
        res.status(409).json({ detail: "user already exists" });
        return;
      }
    }

    console.error(`[ERROR] unexpected server error: ${error}`);
    return res.status(500).json({ detail: "could not register user" });
  }
});

router.get("/logout", async (req, res) => {
  if (
    db
      .prepare(
        `UPDATE sessions SET revoked_at = @revoked_at WHERE id = @session_id`,
      )
      .run({
        session_id: req.session.session_id,
        revoked_at: new Date().toISOString(),
      }).changes !== 0
  ) {
    return res.json({ message: "Goodbye!" });
  }
  return res.status(404).json({ detail: "session not found" });
});
