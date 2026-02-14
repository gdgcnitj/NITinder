import { Router } from "express";
import {
  createAccessToken,
  getPasswordHash,
  verifyPasswordHash,
} from "../utils.js";
import { db } from "../db.js";
import { SqliteError } from "better-sqlite3";

export const router = Router({});

router.post("/login", async (req, res) => {
  try {
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    const user = db
      .prepare(`SELECT * FROM users WHERE email = @email`)
      .get({ email });
    if (!verifyPasswordHash(user.password, password)) {
      res.status(401).json({ detail: "invalid credentials" });
    }

    res
      .header({
        Authorization: `Bearer ${createAccessToken(user)}`,
      })
      .json({
        message: `Welcome back ${user.name}!`,
      });
  } catch (error) {
    console.error(`[ERROR] unexpected error: ${error}`);
    res.status(500).json({ detail: "unexpected server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    const firstName = req.body.firstName.trim();
    const lastName = req.body.lastName.trim();

    const query = db.prepare(`
    INSERT INTO users(name, email, password)
    VALUES (@name, @email, @password) RETURNING (name)`);
    const { name } = query.run({
      name: `${firstName} ${lastName}`.trim(),
      email,
      password: getPasswordHash(password),
    });

    res.json({ message: `Registered user: ${name}` });
  } catch (error) {
    if (error instanceof SqliteError) {
      console.error(`[ERROR] (${error.code}) ${error.message}`);
      if (error.code == "SQLITE_CONSTRAINT_UNIQUE") {
        res.status(409).json({ detail: "user already exists" });
        return;
      }
    }

    console.error(`[ERROR] unexpected server error: ${error}`);
    res.status(500).json({ detail: "could not register user" });
  }
});

router.get("/logout", async (req, res) => {
  if (
    db.prepare(`UPDATE sessions SET expired = 1 WHERE id = @session_id`).run({
      session_id: req.session.session_id,
    }).changes !== 0
  ) {
    db.prepare(`SELECT * FROM sessions WHERE id = @session_id`).get({
      session_id: req.session.session_id,
    });
    res.json({ message: "Goodbye!" });
  }
});
