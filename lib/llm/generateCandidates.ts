import Anthropic from "@anthropic-ai/sdk";

export interface CandidatePoi {
  name: string;
  category: string;
  durationMin: number;
  reason: string;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * 让LLM只做它擅长的事：根据目的地+偏好给出候选景点清单和推荐理由。
 * 明确不要求LLM给出经纬度或访问顺序——这两件事分别交给地图API的
 * geocoding服务和 lib/geo 的聚类/排序算法处理，避免LLM编造坐标。
 */
export async function generateCandidatePois(params: {
  destination: string;
  days: number;
  preference: string;
}): Promise<CandidatePoi[]> {
  const { destination, days, preference } = params;

  // 候选点数量留一些冗余，方便聚类阶段筛选和地理分组，
  // 经验值：每天3-5个点，总数按天数*4再加缓冲
  const targetCount = Math.min(30, days * 4 + 4);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `你是一个旅行行程规划助手。目的地：${destination}，行程天数：${days}天，
人群偏好：${preference}。

请给出约${targetCount}个候选景点/餐厅/体验点，只返回JSON数组，不要有任何其他文字、不要markdown代码块标记。
每个元素格式：
{"name": "地点名称（用当地通用英文名或官方名，方便后续做地图geocoding）", "category": "sightseeing|food|nature|culture|shopping", "durationMin": 建议停留分钟数, "reason": "一句话推荐理由"}

只输出JSON数组本身。`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("LLM未返回文本内容");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as CandidatePoi[];
}
