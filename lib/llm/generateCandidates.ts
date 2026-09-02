import Anthropic from "@anthropic-ai/sdk";

export interface CandidatePoi {
  name: string;
  category: string;
  durationMin: number;
  reason: string;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Lets the LLM do only what it's good at: given a destination + travel
 * style, suggest a list of candidate points of interest with reasoning.
 * Deliberately does NOT ask the LLM for coordinates or visiting order —
 * those are handled separately by the maps API's geocoding service and by
 * the lib/geo clustering/ordering algorithm, to avoid the LLM hallucinating
 * coordinates.
 */
export async function generateCandidatePois(params: {
  destination: string;
  days: number;
  preference: string;
}): Promise<CandidatePoi[]> {
  const { destination, days, preference } = params;

  // Leave some buffer in the candidate count so the clustering step has
  // room to filter and group geographically. Rule of thumb: 3-5 per day,
  // total = days * 4 + a small buffer.
  const targetCount = Math.min(30, days * 4 + 4);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a travel itinerary assistant. Destination: ${destination}, trip length: ${days} days,
travel style: ${preference}.

Suggest about ${targetCount} candidate sights/restaurants/experiences. Return ONLY a JSON array, no other text, no markdown code fences.
Each element format:
{"name": "place name (use the commonly used English or official name, to make later map geocoding easier)", "category": "sightseeing|food|nature|culture|shopping", "durationMin": suggested minutes on site, "reason": "one-sentence reason to recommend it"}

Output only the JSON array itself.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("LLM did not return any text content");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as CandidatePoi[];
}
