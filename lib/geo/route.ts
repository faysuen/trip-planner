import { Poi } from "./types";
import { haversineKm } from "./distance";

/**
 * Orders a single day's stops into a visiting sequence (a simplified TSP).
 * Starts with a nearest-neighbor greedy pass for an initial order, then
 * runs 2-opt local optimization to cut down on "zig-zagging." Since a
 * single day usually only has a handful of stops (3-6), this complexity
 * is more than enough — no need for a heavier solver.
 */
export function orderStopsWithinDay(stops: Poi[]): Poi[] {
  if (stops.length <= 2) return stops;

  const nearestNeighborOrder = nearestNeighbor(stops);
  return twoOpt(nearestNeighborOrder);
}

function nearestNeighbor(stops: Poi[]): Poi[] {
  const remaining = [...stops];
  const route: Poi[] = [remaining.shift() as Poi];

  while (remaining.length > 0) {
    const last = route[route.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((p, i) => {
      const d = haversineKm(last, p);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    route.push(remaining.splice(bestIdx, 1)[0]);
  }
  return route;
}

function routeLength(route: Poi[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += haversineKm(route[i], route[i + 1]);
  }
  return total;
}

/** 2-opt: repeatedly tries swapping two path segments, keeping the swap whenever it shortens the total distance, until no more improvement is found */
function twoOpt(route: Poi[]): Poi[] {
  let best = [...route];
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        if (routeLength(candidate) < routeLength(best)) {
          best = candidate;
          improved = true;
        }
      }
    }
  }
  return best;
}
