import { DayPlan } from "@/lib/geo/types";

const DAY_COLOR_CLASSES = [
  "bg-route-1", "bg-route-2", "bg-route-3", "bg-route-4",
  "bg-route-5", "bg-route-6", "bg-route-7",
];

export function dayColorClass(dayIndex: number) {
  return DAY_COLOR_CLASSES[dayIndex % DAY_COLOR_CLASSES.length];
}

export default function DayList({ day, dayIndex }: { day: DayPlan; dayIndex: number }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full ${dayColorClass(dayIndex)}`} />
        <p className="text-sm text-ink/60">
          第{day.day}天 · 当日辐射跨度约 {day.maxSpanKm} 公里
        </p>
      </div>
      <div className="space-y-3">
        {day.stops.map((stop, i) => (
          <div key={stop.id} className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full ${dayColorClass(
                dayIndex
              )} text-paper text-xs flex items-center justify-center flex-shrink-0 mt-0.5`}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base">{stop.name}</p>
              <p className="text-xs text-ink/50">
                建议停留 {stop.durationMin} 分钟
                {stop.category ? ` · ${stop.category}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
