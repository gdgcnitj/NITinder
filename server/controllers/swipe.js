import { Router } from "express";
import { v4 as uuid } from "uuid";

import { db } from "../db/index.js";

export const router = Router({});

const validDirections = new Set(["L", "R"]);

router.get("/", (req, res) => {
  const { swiper_id: swiperId, swipee_id: swipeeId } = req.query;

  let query = "SELECT * FROM swipes";
  const params = {};
  const filters = [];

  if (swiperId) {
    filters.push("swiper_id = @swiper_id");
    params.swiper_id = swiperId;
  }

  if (swipeeId) {
    filters.push("swipee_id = @swipee_id");
    params.swipee_id = swipeeId;
  }

  if (filters.length > 0) {
    query += ` WHERE ${filters.join(" AND ")}`;
  }

  const swipes = db.prepare(query).all(params);
  return res.json({ swipes });
});

router.get("/:id", (req, res) => {
  const swipe = db
    .prepare(`SELECT * FROM swipes WHERE id = @id`)
    .get({ id: req.params.id });

  if (!swipe) {
    return res.status(404).json({ detail: "swipe not found" });
  }

  return res.json({ swipe });
});

router.post("/", (req, res) => {
  const userId = req.session?.user_id;
  if (!userId) {
    return res.status(401).json({ detail: "missing session" });
  }

  const swipeeId = req.body.swipee_id?.trim();
  const direction = req.body.direction?.trim()?.toUpperCase();

  if (!swipeeId || !direction) {
    return res.status(400).json({ detail: "swipee_id and direction required" });
  }

  if (!validDirections.has(direction)) {
    return res.status(400).json({ detail: "direction must be 'L' or 'R'" });
  }

  const payload = {
    id: uuid(),
    swiper_id: userId,
    swipee_id: swipeeId,
    direction,
    created_at: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO swipes (id, swiper_id, swipee_id, direction, created_at)
     VALUES (@id, @swiper_id, @swipee_id, @direction, @created_at)`,
  ).run(payload);

  return res.status(201).json({ swipe: payload });
});

router.delete("/:id", (req, res) => {
  const userId = req.session?.user_id;
  if (!userId) {
    return res.status(401).json({ detail: "missing session" });
  }

  const swipe = db
    .prepare(`SELECT * FROM swipes WHERE id = @id`)
    .get({ id: req.params.id });

  if (!swipe) {
    return res.status(404).json({ detail: "swipe not found" });
  }

  if (swipe.swiper_id !== userId) {
    return res.status(403).json({ detail: "forbidden" });
  }

  db.prepare(`DELETE FROM swipes WHERE id = @id`).run({ id: req.params.id });
  return res.json({ message: "swipe deleted" });
});
