import { NextRequest, NextResponse } from "next/server";
import { generateCandidatePois } from "@/lib/llm/generateCandidates";
import { geocodeCandidates } from "@/lib/geocode";
import { planItinerary } from "@/lib/geo";
import { getRiskAdvisory } from "@/lib/risk";
import { getFlightQuote } from "@/lib/flights";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, days, preference, origin, departDate } = body;

    if (!destination || !days || !preference) {
      return NextResponse.json(
        { error: "缺少必填字段：destination / days / preference" },
        { status: 400 }
      );
    }

    // 1. LLM给候选点清单（不含坐标）
    const candidates = await generateCandidatePois({
      destination,
      days,
      preference,
    });

    // 2. 地理编码，拿真实坐标，解析失败的点位会被丢弃
    const pois = await geocodeCandidates(candidates, destination);

    if (pois.length === 0) {
      return NextResponse.json(
        { error: "未能解析出任何有效地点，请换个目的地重试" },
        { status: 422 }
      );
    }

    // 3. 核心地理聚类 + 单日路线排序（与LLM解耦的独立算法模块）
    const itinerary = planItinerary(destination, pois, Number(days));

    // 4. 高风险地区提醒（对应PRD 5.5，问卷提交后即检测）
    const risk = await getRiskAdvisory(destination);

    // 5. 可选机票参考报价（对应PRD 5.4，仅在用户填写出发地/时间时查询）
    const flight =
      origin && departDate
        ? await getFlightQuote({ origin, destination, departDate })
        : null;

    return NextResponse.json({ itinerary, risk, flight });
  } catch (err) {
    console.error("generate-itinerary error:", err);
    return NextResponse.json(
      { error: "行程生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
