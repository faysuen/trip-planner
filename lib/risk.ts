export interface RiskAdvisory {
  level: "none" | "caution" | "high";
  summary: string;
  sourceUrl: string;
}

/**
 * Maps to PRD section 5.5: risk level must come from an official data
 * source — the LLM must never decide this on its own. This leaves a clean
 * interface for now; wire it up to a real source when implementing, e.g.:
 * - US State Department Travel Advisories: https://travel.state.gov/
 * - UK FCDO Travel Advice: https://www.gov.uk/foreign-travel-advice
 * Suggested approach: fetch and cache on a schedule (e.g. daily), and have
 * this endpoint just read the cache — avoid calling the external source on
 * every single user request, which would add latency and risk rate limits.
 */
export async function getRiskAdvisory(
  destination: string
): Promise<RiskAdvisory> {
  // TODO: replace with a real data source lookup. Currently returns a
  // placeholder so the frontend banner/warning UI and interactions can be
  // wired up and tested first.
  return {
    level: "none",
    summary: "",
    sourceUrl: "",
  };
}
