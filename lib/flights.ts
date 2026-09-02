export interface FlightQuote {
  priceRange: string;
  currency: string;
  note: string;
}

/**
 * 对应PRD 5.4：出发地+出发时间为可选项，仅展示参考报价，不做预订闭环。
 * 实现时可接 Skyscanner / Amadeus / Google Flights API 中的一个，
 * 建议先选一个覆盖航线广、免费额度够用的做验证，不用一开始就多接。
 */
export async function getFlightQuote(params: {
  origin: string;
  destination: string;
  departDate: string;
}): Promise<FlightQuote | null> {
  // TODO: 替换为真实机票API调用。返回 null 时前端展示
  // "暂无法获取报价"，不阻塞主流程（对应PRD验收标准）。
  return null;
}
