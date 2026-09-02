import { NextRequest, NextResponse } from "next/server";
import { planItinerary } from "@/lib/geo";
import { Poi } from "@/lib/geo/types";

// ⚠️ MOCK VERSION — for local testing without any API keys.
// Skips the real LLM + geocoding calls and uses fake POIs instead,
// but still runs the REAL clustering/ordering algorithm from lib/geo.

const MOCK_CATEGORIES = ["sightseeing", "food", "nature", "culture", "shopping"];
const MOCK_NAMES = [
  "Old Town Square", "Riverside Market", "Hilltop Viewpoint", "Central Museum",
  "Harborfront Promenade", "Botanical Garden", "Night Market", "Cathedral District",
  "Artisan Quarter", "Lakeside Park", "Heritage Temple", "Rooftop Café",
  "Local Bakery", "Craft Market", "Sunset Terrace", "Historic Bridge",
  "Coastal Trail", "Design District", "Family Aquarium", "Street Food Alley",
];

function buildMockPois(days: number): Poi[] {
  const baseLat = 38.7223; // fake city center (roughly Lisbon)
  const baseLng = -9.1393;
  const count = Math.min(MOCK_NAMES.length, days * 4 + 2);
  const pois: Poi[] = [];

  for (let i = 0; i < count; i++) {
    const clusterIndex = i % days;
    const clusterOffsetLat = (clusterIndex - days / 2) * 0.02;
    const clusterOffsetLng = (clusterIndex - days / 2) * 0.025;
    const jitterLat = (Math.random() - 0.5) * 0.01;
    const jitterLng = (Math.random() - 0.5) * 0.01;

    pois.push({
      id: `mock-${i}`,
      name: MOCK_NAMES[i % MOCK_NAMES.length],
      lat: baseLat + clusterOffsetLat + jitterLat,
      lng: baseLng + clusterOffsetLng + jitterLng,
      durationMin: 60 + Math.floor(Math.random() * 4) * 30,
      category: MOCK_CATEGORIES[i % MOCK_CATEGORIES.length],
    });
  }
  return pois;
}

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

    const pois = buildMockPois(Number(days));
    const itinerary = planItinerary(destination, pois, Number(days));

    const risk = { level: "none" as const, summary: "", sourceUrl: "" };

    const flight =
      origin && departDate
        ? { priceRange: "$420 - $610", currency: "USD", note: "Mock price for local testing — not a real quote." }
        : null;

    return NextResponse.json({ itinerary, risk, flight });
  } catch (err) {
    console.error("generate-itinerary (mock) error:", err);
    return NextResponse.json(
      { error: "Itinerary generation failed, please try again later" },
      { status: 500 }
    );
  }
}
