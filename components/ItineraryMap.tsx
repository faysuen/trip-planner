"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ItineraryPlan } from "@/lib/geo/types";

const DAY_COLORS = [
  "#2F6F5E", "#B0512B", "#3A5A9B", "#8A4B8C",
  "#B08900", "#5E5E5E", "#A0392F",
];

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function ItineraryMap({
  itinerary,
  activeDay,
}: {
  itinerary: ItineraryPlan;
  activeDay: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // 初始化地图，只跑一次
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const firstDay = itinerary.days.find((d) => d.stops.length > 0);
    const center = firstDay ? firstDay.center : { lat: 0, lng: 0 };

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [center.lng, center.lat],
      zoom: 12,
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 每次行程或选中天数变化时，重新画标记点和连线
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    itinerary.days.forEach((day, dayIndex) => {
      const isActive = dayIndex === activeDay;
      const color = DAY_COLORS[dayIndex % DAY_COLORS.length];

      day.stops.forEach((stop, i) => {
        const el = document.createElement("div");
        el.style.width = "26px";
        el.style.height = "26px";
        el.style.borderRadius = "50%";
        el.style.background = color;
        el.style.opacity = isActive ? "1" : "0.25";
        el.style.color = "#FAFAF8";
        el.style.fontSize = "12px";
        el.style.fontWeight = "600";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.textContent = String(i + 1);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);
        markersRef.current.push(marker);
      });

      const sourceId = `route-day-${dayIndex}`;
      const coords = day.stops.map((s) => [s.lng, s.lat]);
      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      };

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojson);
        map.setPaintProperty(sourceId, "line-opacity", isActive ? 0.9 : 0.15);
      } else if (coords.length > 1) {
        map.addSource(sourceId, { type: "geojson", data: geojson });
        map.addLayer({
          id: sourceId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": color,
            "line-width": 2,
            "line-dasharray": [1, 1.5],
            "line-opacity": isActive ? 0.9 : 0.15,
          },
        });
      }
    });

    const activeStops = itinerary.days[activeDay]?.stops ?? [];
    if (activeStops.length > 0) {
      const bounds = activeStops.reduce(
        (b, s) => b.extend([s.lng, s.lat]),
        new mapboxgl.LngLatBounds(
          [activeStops[0].lng, activeStops[0].lat],
          [activeStops[0].lng, activeStops[0].lat]
        )
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 });
    }
  }, [itinerary, activeDay]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[50vh] min-h-[320px] rounded-lg overflow-hidden"
    />
  );
}
