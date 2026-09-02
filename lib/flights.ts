export interface FlightQuote {
  priceRange: string;
  currency: string;
  note: string;
}

/**
 * Maps to PRD section 5.4: origin + departure date are optional and only
 * used to show a reference price estimate — no booking flow. When
 * implementing, pick one of Skyscanner / Amadeus / Google Flights API;
 * start with whichever has the broadest route coverage and a usable free
 * tier, rather than integrating several at once.
 */
export async function getFlightQuote(params: {
  origin: string;
  destination: string;
  departDate: string;
}): Promise<FlightQuote | null> {
  // TODO: replace with a real flight pricing API call. When this returns
  // null, the frontend shows "couldn't fetch a price right now" and does
  // not block the main flow (per the PRD acceptance criteria).
  return null;
}
