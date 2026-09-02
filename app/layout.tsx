import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "One-Click Trip Planner",
  description: "Enter your destination and travel style — AI lays out a day-by-day itinerary with no backtracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
