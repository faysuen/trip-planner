/**
 * 用 Haversine 公式计算两个经纬度坐标之间的直线距离（公里）。
 * 这是聚类和路线排序算法的基础距离函数——注意这只是直线距离的近似值，
 * 不是真实道路/步行距离；MVP阶段先用它做聚类和粗排，
 * 后续可以把关键路段换成地图API返回的真实通勤时间做二次校验。
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371; // 地球半径，公里
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

/** 一组点位中任意两点间的最大距离（公里），用于校验是否超出辐射圈 */
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

/** 一组点位的地理中心（简单算术平均，小范围内足够准确） */
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
