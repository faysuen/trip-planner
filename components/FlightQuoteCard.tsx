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
          <p className="text-route-3 font-medium mb-1">机票参考报价</p>
          <p className="text-ink/80">
            {quote.priceRange} {quote.currency}
          </p>
          <p className="text-ink/50 text-xs mt-1">{quote.note}</p>
        </>
      ) : (
        <p className="text-ink/50">暂无法获取报价，可稍后在预订平台查看</p>
      )}
    </div>
  );
}
