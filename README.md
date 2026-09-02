# Trip Planner — MVP Skeleton

Covers the P0 scope from the PRD: minimal questionnaire → LLM-suggested
candidate POIs → geographic clustering/ordering algorithm → interactive map
→ high-risk area advisory → optional flight price estimate.

## Directory structure

```
app/
  page.tsx                       Main page (toggles between questionnaire and results state)
  api/generate-itinerary/route.ts Orchestrates the whole generation pipeline
  layout.tsx / globals.css
components/
  Questionnaire.tsx    Three-step questionnaire + optional origin/date
  ItineraryMap.tsx      Mapbox map, renders markers and lines per day
  DayList.tsx           Day-by-day list view of the itinerary
  RiskBanner.tsx         High-risk area advisory banner
  FlightQuoteCard.tsx    Flight price estimate card
lib/
  geo/
    types.ts       Poi / DayPlan / ItineraryPlan type definitions
    distance.ts     Haversine distance, centroid, max-span calculations
    cluster.ts       ★ Core algorithm: K-means day grouping + 3-5km radius constraint
    route.ts          Within-day visiting order: nearest-neighbor + 2-opt optimization
    index.ts          Single entry point: planItinerary()
  llm/generateCandidates.ts   Calls Claude to suggest candidate POIs (no coordinates)
  geocode.ts                   Calls Mapbox Geocoding to turn candidates into real coordinates
  risk.ts                      High-risk area data source interface (currently a placeholder)
  flights.ts                    Flight price data source interface (currently a placeholder)
```

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY and the Mapbox tokens
npm run dev
```

## Core design principle (maps to PRD section 5.2)

The LLM is only responsible for "suggesting candidate POIs + writing
copy" — it is **never** responsible for deciding geographic groupings or
visiting order. Both of those are handled entirely by the independent
`lib/geo` module. Benefits:
- It can be unit-tested completely separately from the LLM (feed it fake
  POI coordinates to verify clustering quality)
- If you later want to swap in a different algorithm (e.g. using real
  road-network data for a tighter commute-time constraint), you only need
  to touch this one module — the LLM call and UI layers stay untouched

## Currently stubbed / not yet wired to a real data source

- `lib/risk.ts`: high-risk area detection — needs to connect to an
  official source like the US State Department or UK FCDO advisories
- `lib/flights.ts`: flight price estimates — needs a Skyscanner/Amadeus/
  similar API
- The geocoding in `lib/geocode.ts` currently calls the Mapbox API
  sequentially per point, which will be slow for larger candidate lists;
  consider batching or adding a cache layer later

## Suggested next steps (matches the build order discussed earlier)

1. First get the questionnaire → map interaction working end to end with
   fake data (the current skeleton is already wired to real APIs — if you
   want to see the pure frontend behavior first, temporarily swap the real
   API call in `app/api/generate-itinerary/route.ts` for a hardcoded mock
   JSON response)
2. Wire up a real `ANTHROPIC_API_KEY` and check the quality of the
   suggested candidates; iterate on the prompt
3. Run `lib/geo/cluster.ts` against real city data repeatedly to check
   clustering quality (start with POI-dense, well-documented cities like
   Tokyo or Paris)
4. Wire up a real Mapbox token and check the geocoding success rate
5. Replace `lib/risk.ts` and `lib/flights.ts` with real data sources
