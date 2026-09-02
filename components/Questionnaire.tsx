"use client";

import { useState } from "react";

export interface QuestionnaireValues {
  destination: string;
  days: number;
  preference: string;
  origin: string;
  departDate: string;
}

const PREFERENCES = [
  { id: "family", label: "Family-friendly" },
  { id: "speed", label: "Fast-paced" },
  { id: "slow", label: "Slow travel" },
  { id: "food", label: "Foodie" },
];

export default function Questionnaire({
  onSubmit,
  loading,
}: {
  onSubmit: (values: QuestionnaireValues) => void;
  loading: boolean;
}) {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [preference, setPreference] = useState("");
  const [origin, setOrigin] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!destination.trim()) {
      setError("Please enter a destination");
      return;
    }
    if (!preference) {
      setError("Please pick a travel style");
      return;
    }
    setError("");
    onSubmit({ destination: destination.trim(), days, preference, origin, departDate });
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 py-8">
      <h1 className="font-display text-2xl mb-6">Where to, and how?</h1>

      <label className="block text-sm text-ink/60 mb-2">Destination</label>
      <input
        type="text"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="e.g. Kyoto"
        className="w-full rounded-lg border border-ink/15 px-4 py-3 mb-5 text-base"
      />

      <label className="block text-sm text-ink/60 mb-2">
        Trip length: <span className="text-ink font-medium">{days}</span> day{days > 1 ? "s" : ""}
      </label>
      <input
        type="range"
        min={1}
        max={14}
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        className="w-full mb-5"
      />

      <label className="block text-sm text-ink/60 mb-2">Travel style</label>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {PREFERENCES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreference(p.id)}
            className={`rounded-lg border px-3 py-3 text-sm transition-colors ${
              preference === p.id
                ? "border-route-1 bg-route-1/10 text-route-1"
                : "border-ink/15 text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <details className="mb-6">
        <summary className="text-sm text-ink/60 cursor-pointer">
          Optional: add departure city and date to see a flight price estimate
        </summary>
        <div className="mt-3 space-y-3">
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Departure city, e.g. Los Angeles"
            className="w-full rounded-lg border border-ink/15 px-4 py-3 text-base"
          />
          <input
            type="date"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
            className="w-full rounded-lg border border-ink/15 px-4 py-3 text-base"
          />
        </div>
      </details>

      {error && <p className="text-sm text-risk mb-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full rounded-lg bg-ink text-paper py-3.5 text-base font-medium disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate itinerary"}
      </button>
    </div>
  );
}
