export interface Poi {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** 建议停留时长（分钟） */
  durationMin: number;
  /** 简单的开放时段，如 "09:00-18:00"；不确定时留空 */
  openHours?: string;
  category?: string;
}

export interface DayPlan {
  day: number;
  /** 已按访问顺序排好的点位 */
  stops: Poi[];
  /** 该天所有点位的地理中心（用于地图定位/展示） */
  center: { lat: number; lng: number };
  /** 该天点位之间的最大直线跨度（公里），用于校验是否超出3-5km辐射圈 */
  maxSpanKm: number;
}

export interface ItineraryPlan {
  destination: string;
  days: DayPlan[];
}
