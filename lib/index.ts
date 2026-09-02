import { Poi, DayPlan, ItineraryPlan } from "./types";
import { clusterPoisByDay } from "./cluster";
import { orderStopsWithinDay } from "./route";
import { centroid, maxPairwiseDistanceKm } from "./distance";

export * from "./types";

/**
 * 把 LLM 给出的候选景点列表，转换成按天分组、组内排好顺序的最终行程。
 * 这是整个地理智能模块对外暴露的唯一入口——
 * app层（问卷提交后的生成流程）只需要调这一个函数。
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
