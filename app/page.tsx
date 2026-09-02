"use client";

import { useState } from "react";
import Questionnaire, { QuestionnaireValues } from "@/components/Questionnaire";
import ItineraryMap from "@/components/ItineraryMap";
import DayList, { dayColorClass } from "@/components/DayList";
import RiskBanner from "@/components/RiskBanner";
import FlightQuoteCard from "@/components/FlightQuoteCard";
import { ItineraryPlan } from "@/lib/geo/types";
import { RiskAdvisory } from "@/lib/risk";
import { FlightQuote } from "@/lib/flights";

interface GenerateResponse {
  itinerary: ItineraryPlan;
  risk: RiskAdvisory;
  flight: FlightQuote | null;
}

export default function Home() {
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [flightRequested, setFlightRequested] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(values: QuestionnaireValues) {
    setLoading(true);
    setError("");
    setFlightRequested(!!(values.origin && values.departDate));

    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");

      setResult(data);
      setActiveDay(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  if (!result) {
    return (
      <main>
        <Questionnaire onSubmit={handleSubmit} loading={loading} />
        {error && (
          <p className="text-center text-sm text-risk px-5">{error}</p>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl">
          {result.itinerary.destination} · {result.itinerary.days.length}天行程
        </h1>
        <button
          onClick={() => setResult(null)}
          className="text-sm text-ink/60 border border-ink/15 rounded-lg px-3 py-1.5"
        >
          修改
        </button>
      </div>

      <RiskBanner risk={result.risk} />
      <FlightQuoteCard quote={result.flight} requested={flightRequested} />

      <div className="flex gap-2 mb-4 flex-wrap">
        {result.itinerary.days.map((d, i) => (
          <button
            key={d.day}
            onClick={() => setActiveDay(i)}
            className={`text-sm rounded-lg px-3 py-1.5 border flex items-center gap-1.5 ${
              i === activeDay
                ? "border-ink bg-ink text-paper"
                : "border-ink/15 text-ink"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${dayColorClass(i)}`} />
            第{d.day}天
          </button>
        ))}
      </div>

      <div className="mb-5">
        <ItineraryMap itinerary={result.itinerary} activeDay={activeDay} />
      </div>

      <DayList day={result.itinerary.days[activeDay]} dayIndex={activeDay} />

      <p className="text-xs text-ink/40 mt-6">
        同色点位已按辐射圈聚类，虚线为建议访问顺序
      </p>
    </main>
  );
}
