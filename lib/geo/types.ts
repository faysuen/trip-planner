export interface Poi {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Suggested time on site, in minutes */
  durationMin: number;
  /** Simple opening hours string, e.g. "09:00-18:00"; leave blank if unknown */
  openHours?: string;
  category?: string;
}

export interface DayPlan {
  day: number;
  /** Stops already ordered by suggested visiting sequence */
  stops: Poi[];
  /** Geographic center of this day's stops (used for map centering/display) */
  center: { lat: number; lng: number };
  /** Max straight-line spread (km) between this day's stops — used to verify the 3-5km radius constraint */
  maxSpanKm: number;
}

export interface ItineraryPlan {
  destination: string;
  days: DayPlan[];
}
