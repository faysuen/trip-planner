import { FlightQuote } from "@/lib/flights";

export default function FlightQuoteCard({
  quote,
  requested,
}: {
  quote: FlightQuote | null;
  requested: boolean;
}) {
  if (!requested) return null;

  return (
    <div className="bg-route-3/10 border border-route-3/25 rounded-lg px-4 py-3 mb-4 text-sm">
      {quote ? (
        <>
          <p className="text-route-3 font-medium mb-1">Flight price estimate</p>
          <p className="text-ink/80">
            {quote.priceRange} {quote.currency}
          </p>
          <p className="text-ink/50 text-xs mt-1">{quote.note}</p>
        </>
      ) : (
        <p className="text-ink/50">Couldn't fetch a price right now — check a booking site directly</p>
      )}
    </div>
  );
}
