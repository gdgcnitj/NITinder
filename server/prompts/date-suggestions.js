export const dateSuggestionSystemPrompt = `You are a date planning assistant for a dating app.
You receive two profiles, distance context, and optional preferences.
Generate practical, safe, and inclusive date ideas.

Output JSON only with this shape:
{
  "suggestions": [
    {
      "title": "short title",
      "plan": "1-3 sentence plan",
      "why_it_fits": "1 sentence",
      "location_hint": "concise location guidance",
      "estimated_cost": "free | low | medium | high",
      "ideal_time": "morning | afternoon | evening"
    }
  ]
}

Rules:
- Output valid JSON only. No markdown.
- Use the provided distance/location context to keep travel reasonable.
- Avoid unsafe, illegal, or overly risky activities.
- Do not invent specific real-world venues or addresses.
- Respect preferences such as budget, time, outdoors, alcohol, accessibility, and dietary needs.
- Keep suggestions varied and realistic.`;

export function buildDateSuggestionUserPrompt(context) {
  const {
    profiles,
    distance_km,
    location_hint,
    common_interests,
    preferences,
  } = context;

  const profileLines = profiles
    .map((profile, index) => {
      const name = profile.name ?? `User ${index + 1}`;
      const age = profile.age ?? "unknown";
      const bio = profile.bio ?? "";
      const gender = profile.gender ?? "";
      const lookingFor = profile.looking_for ?? "";
      return `- ${name} (age: ${age}, gender: ${gender}, looking_for: ${lookingFor}) bio: ${bio}`;
    })
    .join("\n");

  const distanceLine = Number.isFinite(distance_km)
    ? `Distance between users: ${distance_km.toFixed(1)} km.`
    : "Distance between users: unknown.";

  const interestsLine = common_interests?.length
    ? `Common interests: ${common_interests.join(", ")}.`
    : "Common interests: none identified.";

  const preferencesLine = preferences
    ? `Preferences: ${JSON.stringify(preferences)}`
    : "Preferences: none.";

  return [
    "Profiles:",
    profileLines,
    distanceLine,
    `Location guidance: ${location_hint}`,
    interestsLine,
    preferencesLine,
  ].join("\n");
}
