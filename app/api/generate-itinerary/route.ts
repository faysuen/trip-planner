import { NextRequest, NextResponse } from "next/server";
import { generateCandidatePois } from "@/lib/llm/generateCandidates";
import { geocodeCandidates } from "@/lib/geocode";
import { planItinerary } from "@/lib/geo";
import { getRiskAdvisory } from "@/lib/risk";
import { getFlightQuote } from "@/lib/flights";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, days, preference, origin, departDate } = body;

    if (!destination || !days || !preference) {
      return NextResponse.json(
        { error: "Missing required field: destination / days / preference" },
        { status: 400 }
      );
    }

    // 1. LLM suggests a candidate POI list (no coordinates)
    const candidates = await generateCandidatePois({
      destination,
      days,
      preference,
    });

    // 2. Geocode to get real coordinates; points that fail to resolve are dropped
    const pois = await geocodeCandidates(candidates, destination);

    if (pois.length === 0) {
      return NextResponse.json(
        { error: "Couldn't resolve any valid locations — try a different destination" },
        { status: 422 }
      );
    }

    // 3. Core geo clustering + within-day route ordering (independent of the LLM)
    const itinerary = planItinerary(destination, pois, Number(days));

    // 4. High-risk area advisory (PRD 5.5 — checked right after questionnaire submission)
    const risk = await getRiskAdvisory(destination);

    // 5. Optional flight price estimate (PRD 5.4 — only queried if origin/date were provided)
    const flight =
      origin && departDate
        ? await getFlightQuote({ origin, destination, departDate })
        : null;

    return NextResponse.json({ itinerary, risk, flight });
  } catch (err) {
    console.error("generate-itinerary error:", err);
    return NextResponse.json(
      { error: "Itinerary generation failed, please try again later" },
      { status: 500 }
    );
  }
}
