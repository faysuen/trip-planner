import { CandidatePoi } from "./llm/generateCandidates";
import { Poi } from "./geo/types";

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

/**
 * 把LLM给出的候选点名称逐个做地理编码，拿到真实经纬度。
 * 解析失败的点位直接丢弃（而不是让LLM瞎猜坐标），
 * 这一步是保证"聚类算法基于真实坐标而非幻觉坐标"的关键防线。
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
