import { Poi } from "./types";
import { haversineKm, centroid, maxPairwiseDistanceKm } from "./distance";

/**
 * Core geographic clustering algorithm.
 *
 * Design principle (maps to PRD section 5.2):
 * The LLM is only ever responsible for suggesting candidate points of
 * interest — it must NEVER decide "which points belong on which day."
 * That grouping has to come from this independent, unit-testable module,
 * which is the only way to actually guarantee the core promise: stops on
 * the same day stay within a sane radius and the route doesn't backtrack.
 *
 * The algorithm has two steps:
 * 1. K-means grouping into `numDays` clusters (using haversine distance
 *    instead of Euclidean distance)
 * 2. Check whether each cluster's max span exceeds maxRadiusKm; if so,
 *    split the widest cluster into two and borrow one point from the
 *    largest cluster to give to the smallest, keeping the total number
 *    of days fixed and the daily point count roughly balanced.
 */
export function clusterPoisByDay(
  pois: Poi[],
  numDays: number,
  maxRadiusKm = 5
): Poi[][] {
  if (pois.length === 0) return Array.from({ length: numDays }, () => []);
  if (numDays <= 1) return [pois];

  let clusters = kMeans(pois, numDays);
  clusters = enforceRadiusConstraint(clusters, maxRadiusKm, numDays);
  clusters = balanceClusterSizes(clusters);

  return clusters;
}

/** K-means clustering using haversine distance, with k-means++-style centroid initialization + iterative convergence */
function kMeans(pois: Poi[], k: number, maxIterations = 20): Poi[][] {
  let centroids = pickInitialCentroids(pois, k);
  let assignment = new Array(pois.length).fill(-1);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // Assign each point to its nearest centroid
    const newAssignment = pois.map((p) => {
      let best = 0;
      let bestDist = Infinity;
      centroids.forEach((c, idx) => {
        const d = haversineKm(p, c);
        if (d < bestDist) {
          bestDist = d;
          best = idx;
        }
      });
      return best;
    });

    changed = newAssignment.some((v, i) => v !== assignment[i]);
    assignment = newAssignment;
    if (!changed && iter > 0) break;

    // Recompute centroids
    centroids = centroids.map((_, idx) => {
      const members = pois.filter((_, i) => assignment[i] === idx);
      return members.length > 0 ? centroid(members) : centroids[idx];
    });
  }

  const clusters: Poi[][] = Array.from({ length: k }, () => []);
  pois.forEach((p, i) => clusters[assignment[i]].push(p));
  return clusters;
}

/** k-means++-style initial centroid selection, to avoid picking initial centroids too close together and getting poor convergence */
function pickInitialCentroids(
  pois: Poi[],
  k: number
): { lat: number; lng: number }[] {
  const centroids: { lat: number; lng: number }[] = [];
  const first = pois[Math.floor(Math.random() * pois.length)];
  centroids.push({ lat: first.lat, lng: first.lng });

  while (centroids.length < k) {
    let farthest = pois[0];
    let farthestDist = -1;
    for (const p of pois) {
      const minDistToExisting = Math.min(
        ...centroids.map((c) => haversineKm(p, c))
      );
      if (minDistToExisting > farthestDist) {
        farthestDist = minDistToExisting;
        farthest = p;
      }
    }
    centroids.push({ lat: farthest.lat, lng: farthest.lng });
  }
  return centroids;
}

/**
 * Checks each cluster's max span; any cluster exceeding maxRadiusKm gets
 * split into two smaller sub-clusters, and the smallest existing cluster
 * absorbs the newly split-off group, keeping the total cluster count equal
 * to numDays. (This is a simplified heuristic — it doesn't aim for a
 * global optimum, just for avoiding the hard failure of "one day with a
 * huge backtrack.")
 */
function enforceRadiusConstraint(
  clusters: Poi[][],
  maxRadiusKm: number,
  numDays: number
): Poi[][] {
  let result = [...clusters];
  let safety = numDays * 3; // guards against infinite loops on extreme data

  while (safety-- > 0) {
    const spans = result.map((c) => maxPairwiseDistanceKm(c));
    const worstIdx = spans.indexOf(Math.max(...spans));
    if (spans[worstIdx] <= maxRadiusKm || result[worstIdx].length <= 1) break;

    const [subA, subB] = kMeans(result[worstIdx], 2);
    const smallestIdx = result
      .map((c, i) => ({ i, len: c.length }))
      .filter((c) => c.i !== worstIdx)
      .sort((a, b) => a.len - b.len)[0]?.i;

    result[worstIdx] = subA;
    if (smallestIdx !== undefined) {
      result[smallestIdx] = [...result[smallestIdx], ...subB];
    } else {
      result.push(subB);
    }
  }

  // Ensure the cluster count is exactly numDays, no more, no less
  while (result.length > numDays) {
    const smallest = result.reduce(
      (minI, c, i, arr) => (c.length < arr[minI].length ? i : minI),
      0
    );
    const donor = result[smallest];
    result.splice(smallest, 1);
    const target = result.reduce(
      (minI, c, i, arr) => (c.length < arr[minI].length ? i : minI),
      0
    );
    result[target] = [...result[target], ...donor];
  }
  while (result.length < numDays) result.push([]);

  return result;
}

/** Keeps daily stop counts from getting too lopsided (max/min difference capped at 2) by moving points from the largest group to the smallest */
function balanceClusterSizes(clusters: Poi[][]): Poi[][] {
  const result = clusters.map((c) => [...c]);
  let safety = 20;

  while (safety-- > 0) {
    const sizes = result.map((c) => c.length);
    const maxIdx = sizes.indexOf(Math.max(...sizes));
    const minIdx = sizes.indexOf(Math.min(...sizes));
    if (sizes[maxIdx] - sizes[minIdx] <= 2) break;

    // From the largest group, move the point closest to the smallest group's centroid
    const minCentroid = centroid(result[minIdx].length ? result[minIdx] : [{ lat: 0, lng: 0 }]);
    const donorGroup = result[maxIdx];
    let bestPoiIdx = 0;
    let bestDist = Infinity;
    donorGroup.forEach((p, i) => {
      const d = haversineKm(p, minCentroid);
      if (d < bestDist) {
        bestDist = d;
        bestPoiIdx = i;
      }
    });
    const [moved] = donorGroup.splice(bestPoiIdx, 1);
    result[minIdx].push(moved);
  }

  return result;
}
