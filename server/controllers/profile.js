import { Router } from "express";
import { v4 as uuid } from "uuid";

import { db } from "../db/index.js";

export const router = Router({});

const profileFields = [
  "name",
  "age",
  "bio",
  "gender",
  "looking_for",
  "latitude",
  "longitude",
  "profile_image",
];

// GET: all profiles
router.get("/", (req, res) => {
  const { user_id: userId } = req.query;
  let query;
  let params = {};
  
  if (userId) {
    query = db.prepare(`SELECT * FROM profiles WHERE user_id = @user_id`);
    params.user_id = userId;
  } else {
    // Return all profiles except the current user's
    const currentUserId = req.session?.user_id;
    if (currentUserId) {
      query = db.prepare(`SELECT * FROM profiles WHERE user_id != @user_id`);
      params.user_id = currentUserId;
    } else {
      query = db.prepare(`SELECT * FROM profiles`);
    }
  }
  
  const profiles = query.all(params);
  return res.json({ profiles });
});

// GET: current user's profile
router.get("/me", (req, res) => {
  const userId = req.session?.user_id;
  if (!userId) {
    return res.status(401).json({ detail: "missing session" });
  }

  const profile = db
    .prepare(`SELECT * FROM profiles WHERE user_id = @user_id`)
    .get({ user_id: userId });

  if (!profile) {
    return res.status(404).json({ detail: "profile not found" });
  }

  return res.json({ profile });
});

// GET: specific profile
router.get("/:id", (req, res) => {
  const profile = db
    .prepare(`SELECT * FROM profiles WHERE id = @id`)
    .get({ id: req.params.id });
  if (!profile) {
    return res.status(404).json({ detail: "profile not found" });
  }
  return res.json({ profile });
});

// POST: create profile (with optional image upload)
router.post("/", (req, res) => {
  const userId = req.session?.user_id;
  if (!userId) {
    return res.status(401).json({ detail: "missing session" });
  }

  const existing = db
    .prepare(`SELECT id FROM profiles WHERE user_id = @user_id`)
    .get({ user_id: userId });
  if (existing) {
    return res.status(409).json({ detail: "profile already exists" });
  }

  const payload = {
    id: uuid(),
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  for (const field of profileFields) {
    if (req.body[field] !== undefined) {
      payload[field] = req.body[field];
    }
  }

  db.prepare(
    `INSERT INTO profiles (
      id, user_id, name, age, bio, gender, looking_for,
      latitude, longitude, profile_image, created_at, updated_at
    ) VALUES (
      @id, @user_id, @name, @age, @bio, @gender, @looking_for,
      @latitude, @longitude, @profile_image, @created_at, @updated_at
    )`,
  ).run(payload);

  return res.status(201).json({ profile: payload });
});

// PUT: update profile (with optional image upload)
router.put("/:id", (req, res) => {
  const userId = req.session?.user_id;
  if (!userId) {
    return res.status(401).json({ detail: "missing session" });
  }

  const profile = db
    .prepare(`SELECT * FROM profiles WHERE id = @id`)
    .get({ id: req.params.id });
  if (!profile) {
    return res.status(404).json({ detail: "profile not found" });
  }
  if (profile.user_id !== userId) {
    return res.status(403).json({ detail: "forbidden" });
  }

  const updates = [];
  const params = {
    id: req.params.id,
    updated_at: new Date().toISOString(),
  };

  for (const field of profileFields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = @${field}`);
      params[field] = req.body[field];
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ detail: "no fields to update" });
  }

  updates.push("updated_at = @updated_at");

  db.prepare(
    `UPDATE profiles SET ${updates.join(", ")} WHERE id = @id`,
  ).run(params);

  const updated = db
    .prepare(`SELECT * FROM profiles WHERE id = @id`)
    .get({ id: req.params.id });
  return res.json({ profile: updated });
});

// DELETE: delete profile
router.delete("/:id", (req, res) => {
  const userId = req.session?.user_id;
  if (!userId) {
    return res.status(401).json({ detail: "missing session" });
  }

  const profile = db
    .prepare(`SELECT * FROM profiles WHERE id = @id`)
    .get({ id: req.params.id });
  if (!profile) {
    return res.status(404).json({ detail: "profile not found" });
  }
  if (profile.user_id !== userId) {
    return res.status(403).json({ detail: "forbidden" });
  }

  db.prepare(`DELETE FROM profiles WHERE id = @id`).run({
    id: req.params.id,
  });

  return res.json({ message: "profile deleted" });
});
