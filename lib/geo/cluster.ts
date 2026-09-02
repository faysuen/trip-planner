import { Poi } from "./types";
import { haversineKm, centroid, maxPairwiseDistanceKm } from "./distance";

/**
 * 核心地理聚类算法。
 *
 * 设计原则（对应PRD 5.2）：
 * LLM 只负责给出候选景点清单，绝不负责决定"哪几个点位算一天"——
 * 地理分组必须由这个独立、可单元测试的模块来做，
 * 这样才能保证「同一天景点在合理辐射圈内、不折返」这个核心承诺。
 *
 * 算法分两步：
 * 1. K-means 按 numDays 分组（用 haversine 距离代替欧氏距离）
 * 2. 校验每组的最大跨度是否超过 maxRadiusKm；超过则把跨度最大的组
 *    拆成两组，并从点数最多的组里借一个点位给点数最少的组，
 *    保持总天数不变、尽量让每天点位数量均衡。
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

/** K-means聚类，用haversine距离，随机初始化质心 + 若干次迭代收敛 */
function kMeans(pois: Poi[], k: number, maxIterations = 20): Poi[][] {
  let centroids = pickInitialCentroids(pois, k);
  let assignment = new Array(pois.length).fill(-1);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // 分配每个点到最近的质心
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

    // 重新计算质心
    centroids = centroids.map((_, idx) => {
      const members = pois.filter((_, i) => assignment[i] === idx);
      return members.length > 0 ? centroid(members) : centroids[idx];
    });
  }

  const clusters: Poi[][] = Array.from({ length: k }, () => []);
  pois.forEach((p, i) => clusters[assignment[i]].push(p));
  return clusters;
}

/** 用 k-means++ 思路选初始质心，避免随机选到太近的点导致收敛差 */
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
 * 校验每组的最大跨度，超过 maxRadiusKm 的组拆成两个更小的子组，
 * 并把最小的组和最新拆出的组合并，保持总组数等于 numDays。
 * （简化启发式，不追求全局最优，只保证不出现"整天大折返"这个硬伤）
 */
function enforceRadiusConstraint(
  clusters: Poi[][],
  maxRadiusKm: number,
  numDays: number
): Poi[][] {
  let result = [...clusters];
  let safety = numDays * 3; // 防止极端数据下死循环

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

  // 保证组数不多不少等于 numDays
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

/** 让每天点位数量不要过于悬殊（最多最少相差不超过2个），从最多的组挪给最少的组 */
function balanceClusterSizes(clusters: Poi[][]): Poi[][] {
  const result = clusters.map((c) => [...c]);
  let safety = 20;

  while (safety-- > 0) {
    const sizes = result.map((c) => c.length);
    const maxIdx = sizes.indexOf(Math.max(...sizes));
    const minIdx = sizes.indexOf(Math.min(...sizes));
    if (sizes[maxIdx] - sizes[minIdx] <= 2) break;

    // 从最多的一组里，挑离最少组的中心最近的点位挪过去
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
