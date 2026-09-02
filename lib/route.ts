import { Poi } from "./types";
import { haversineKm } from "./distance";

/**
 * 单日内景点访问顺序排序（简化版TSP）。
 * 先用最近邻贪心算法给出一个初始顺序，再用 2-opt 做局部优化，
 * 减少"来回穿插"的情况。景点数量在个位数（单日一般3-6个点），
 * 这个复杂度完全够用，不需要引入更重的求解器。
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

/** 2-opt：反复尝试交换两段路径，只要能缩短总距离就采纳，直到没有改进为止 */
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
