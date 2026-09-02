import { CandidatePoi } from "./llm/generateCandidates";
import { Poi } from "./geo/types";

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

/**
 * Geocodes each LLM-suggested place name into a real lat/lng coordinate
 * (via the Mapbox Geocoding API). Points that fail to resolve are simply
 * dropped, rather than letting the LLM guess a coordinate — this is the
 * key safeguard that ensures the clustering algorithm always runs on real
 * coordinates, never hallucinated ones.
 */
export async function geocodeCandidates(
  candidates: CandidatePoi[],
  destination: string
): Promise<Poi[]> {
  const results = await Promise.all(
    candidates.map(async (c, idx) => {
      const query = encodeURIComponent(`${c.name}, ${destination}`);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?limit=1&access_token=${MAPBOX_TOKEN}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature) return null;

        const [lng, lat] = feature.center;
        const poi: Poi = {
          id: `poi-${idx}`,
          name: c.name,
          lat,
          lng,
          durationMin: c.durationMin,
          category: c.category,
        };
        return poi;
      } catch {
        return null;
      }
    })
  );

  return results.filter((p): p is Poi => p !== null);
}
