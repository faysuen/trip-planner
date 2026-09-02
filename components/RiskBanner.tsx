import { RiskAdvisory } from "@/lib/risk";

export default function RiskBanner({ risk }: { risk: RiskAdvisory }) {
  if (risk.level === "none") return null;

  return (
    <div className="bg-risk/10 border border-risk/30 rounded-lg px-4 py-3 mb-4 text-sm">
      <p className="text-risk font-medium mb-1">
        {risk.level === "high" ? "High-risk area notice" : "Travel advisory"}
      </p>
      <p className="text-ink/80 mb-1">{risk.summary}</p>
      {risk.sourceUrl && (
        <a
          href={risk.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-risk underline"
        >
          View official advisory
        </a>
      )}
    </div>
  );
}
