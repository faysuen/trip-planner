import { Poi, DayPlan, ItineraryPlan } from "./types";
import { clusterPoisByDay } from "./cluster";
import { orderStopsWithinDay } from "./route";
import { centroid, maxPairwiseDistanceKm } from "./distance";

export * from "./types";

/**
 * Converts the LLM's candidate POI list into a final itinerary: grouped by
 * day, with each day's stops already put in visiting order. This is the
 * single entry point the geo module exposes — the app layer (the
 * post-questionnaire generation flow) only ever needs to call this one function.
 */
export function planItinerary(
  destination: string,
  candidatePois: Poi[],
  numDays: number,
  maxRadiusKm = 5
): ItineraryPlan {
  const clustered = clusterPoisByDay(candidatePois, numDays, maxRadiusKm);

  const days: DayPlan[] = clustered.map((stops, idx) => {
    const ordered = orderStopsWithinDay(stops);
    return {
      day: idx + 1,
      stops: ordered,
      center: centroid(ordered),
      maxSpanKm: Math.round(maxPairwiseDistanceKm(ordered) * 10) / 10,
    };
  });

  return { destination, days };
}
