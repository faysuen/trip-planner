export interface RiskAdvisory {
  level: "none" | "caution" | "high";
  summary: string;
  sourceUrl: string;
}

/**
 * 对应PRD 5.5：高风险等级必须来自官方数据源，不能由LLM自行判断。
 * 这里先留一个清晰的接口，实现时替换成真实的数据源调用，例如：
 * - 美国国务院 Travel Advisories: https://travel.state.gov/
 * - 英国 FCDO Travel Advice: https://www.gov.uk/foreign-travel-advice
 * 建议做法：定期（如每日）抓取并缓存到数据库，接口直接查缓存，
 * 避免每次用户请求都实时调用外部数据源导致延迟或限流。
 */
export async function getRiskAdvisory(
  destination: string
): Promise<RiskAdvisory> {
  // TODO: 替换为真实数据源查询。当前返回占位结果，方便前端先把
  // 提醒条/警示横幅的UI和交互跑通。
  return {
    level: "none",
    summary: "",
    sourceUrl: "",
  };
}
