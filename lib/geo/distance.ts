/**
 * Computes the straight-line distance (km) between two lat/lng coordinates
 * using the Haversine formula. This is the base distance function used by
 * the clustering and route-ordering algorithms — note it's only a straight-line
 * approximation, not real road/walking distance. It's fine for MVP-stage
 * clustering and rough ordering; later, key legs can be cross-checked against
 * real commute times from a maps API.
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius, km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Max pairwise distance (km) among a set of points — used to check whether a day's stops exceed the target radius */
export function maxPairwiseDistanceKm(
  points: { lat: number; lng: number }[]
): number {
  let max = 0;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = haversineKm(points[i], points[j]);
      if (d > max) max = d;
    }
  }
  return max;
}

/** Geographic centroid of a set of points (simple arithmetic mean — accurate enough over small areas) */
export function centroid(
  points: { lat: number; lng: number }[]
): { lat: number; lng: number } {
  const n = points.length || 1;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / n, lng: sum.lng / n };
}
