import { Router } from "express";
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { db } from "../db/index.js";
import {
  dateSuggestionSystemPrompt,
  buildDateSuggestionUserPrompt,
} from "../prompts/date-suggestions.js";

export const router = Router({});

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "you",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "but",
  "not",
  "all",
  "any",
  "can",
  "just",
  "like",
  "love",
  "into",
  "about",
  "they",
  "them",
  "their",
  "our",
  "out",
  "get",
  "got",
  "too",
]);

function extractKeywords(text) {
  if (!text) return new Set();
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
  return new Set(cleaned);
}

function intersectKeywords(first, second) {
  const result = [];
  for (const word of first) {
    if (second.has(word)) result.push(word);
  }
  return result.slice(0, 10);
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return null;
  }

  const radiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusKm * c;
}

function normalizeSuggestions(result, fallbackCount) {
  if (!result || !Array.isArray(result.suggestions)) {
    return [];
  }

  return result.suggestions.slice(0, fallbackCount).map((item) => ({
    title: item.title ?? "Date idea",
    plan: item.plan ?? "",
    why_it_fits: item.why_it_fits ?? "",
    location_hint: item.location_hint ?? "Nearby",
    estimated_cost: item.estimated_cost ?? "medium",
    ideal_time: item.ideal_time ?? "evening",
  }));
}

const useMockLlm = process.env.TEST === "true";
const modelName = process.env.LANGGRAPH_MODEL ?? "openai/gpt-oss-20b";
const llm = useMockLlm
  ? null
  : new ChatGroq({ model: modelName, temperature: 0.25 });

const graph = new StateGraph({
  channels: {
    input: { value: (value) => value, default: null },
    output: { value: (value) => value, default: null },
  },
});

graph.addNode("suggestions", async (state) => {
  const { system, user } = state.input;

  if (useMockLlm) {
    const match = user?.match(/Suggestions requested:\s*(\d+)/i);
    const count = Math.min(Math.max(parseInt(match?.[1]) || 3, 1), 10);
    const suggestions = Array.from({ length: count }, (_, index) => ({
      title: `Mock date idea ${index + 1}`,
      plan: "Meet somewhere casual, chat, and keep it low-pressure.",
      why_it_fits: "Good for testing and easy to tweak.",
      location_hint: "Choose a convenient midpoint area.",
      estimated_cost: "low",
      ideal_time: "evening",
    }));
    return { output: JSON.stringify({ suggestions }) };
  }

  const response = await llm.invoke([
    new SystemMessage(system),
    new HumanMessage(user),
  ]);
  return { output: response.content };
});

graph.addEdge(START, "suggestions");
graph.addEdge("suggestions", END);

const dateSuggestionAgent = graph.compile();

// POST /date-suggestions
// Generate date suggestions for a match
router.post("/", async (req, res) => {
  try {
    if (!useMockLlm && !process.env.GROQ_API_KEY) {
      return res.status(500).json({ detail: "GROQ_API_KEY is not configured" });
    }

    const userId = req.session.user_id;
    const matchId = req.body.match_id?.trim();

    if (!matchId) {
      return res.status(400).json({ detail: "match_id required" });
    }

    const match = db
      .prepare(
        `SELECT * FROM matches
         WHERE id = @matchId AND (user1_id = @userId OR user2_id = @userId)`,
      )
      .get({ matchId, userId });

    if (!match) {
      return res.status(403).json({ detail: "you are not in this match" });
    }

    const profile1 = db
      .prepare(`SELECT * FROM profiles WHERE user_id = @user_id`)
      .get({ user_id: match.user1_id });
    const profile2 = db
      .prepare(`SELECT * FROM profiles WHERE user_id = @user_id`)
      .get({ user_id: match.user2_id });

    if (!profile1 || !profile2) {
      return res.status(404).json({ detail: "profiles not found" });
    }

    const suggestionCount = Math.min(
      Math.max(parseInt(req.body.suggestion_count) || 5, 1),
      10,
    );

    const preferences = req.body.preferences ?? null;

    const distanceKm = getDistanceKm(
      profile1.latitude,
      profile1.longitude,
      profile2.latitude,
      profile2.longitude,
    );

    const locationHint = Number.isFinite(distanceKm)
      ? `Meet near the midpoint; keep travel under ${Math.round(
          Math.max(distanceKm / 2, 5),
        )} km.`
      : "Choose a nearby, easy-to-reach area for both people.";

    const commonInterests = intersectKeywords(
      extractKeywords(profile1.bio ?? ""),
      extractKeywords(profile2.bio ?? ""),
    );

    const recentMessages = db
      .prepare(
        `SELECT m.content
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE c.match_id = @matchId AND m.deleted_at IS NULL
         ORDER BY m.created_at DESC
         LIMIT 10`,
      )
      .all({ matchId })
      .map((row) => row.content)
      .filter(Boolean);

    const promptContext = {
      profiles: [profile1, profile2],
      distance_km: distanceKm,
      location_hint: locationHint,
      common_interests: commonInterests,
      preferences,
      recent_messages: recentMessages,
      suggestion_count: suggestionCount,
    };

    const userPrompt = buildDateSuggestionUserPrompt(promptContext);

    const result = await dateSuggestionAgent.invoke({
      input: {
        system: dateSuggestionSystemPrompt,
        user: `${userPrompt}\nSuggestions requested: ${suggestionCount}`,
      },
    });

    let parsed = null;
    try {
      parsed = JSON.parse(result.output ?? "");
    } catch (error) {
      console.error(`[ERROR] parsing suggestions: ${error}`);
    }

    const suggestions = normalizeSuggestions(parsed, suggestionCount);

    return res.json({
      match_id: matchId,
      generated_at: new Date().toISOString(),
      suggestions,
      context: {
        distance_km: distanceKm,
        common_interests: commonInterests,
        preferences_used: preferences ?? {},
      },
    });
  } catch (error) {
    console.error(`[ERROR] generating suggestions: ${error}`);
    return res.status(500).json({ detail: "could not generate suggestions" });
  }
});
