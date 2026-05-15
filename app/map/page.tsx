"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "@/components/ui/PageHeader";
import FestivalSVGMap from "@/components/features/map/FestivalSVGMap";

// ── dynamic imports (Leaflet requires ssr:false) ──────────────

const MapClient = dynamic(
  () => import("@/components/features/map/MapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <span className="animate-pulse text-4xl">🌸</span>
      </div>
    ),
  }
);

// ── page ──────────────────────────────────────────────────────

type Tab = "travel" | "festival";

export default function MapPage() {
  const [tab, setTab] = useState<Tab>("travel");

  return (
    <div className="flex flex-col bg-cream" style={{ height: "100dvh" }}>
      <div className="shrink-0">
        <PageHeader
          title="Map 🗺️"
          subtitle="See where everyone's coming from"
          className="pb-3"
        />

        {/* ── Tab switcher ── */}
        <div className="flex gap-2 px-4 pb-3">
          <button
            onClick={() => setTab("travel")}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 ${
              tab === "travel"
                ? "bg-pink text-white shadow-[0_4px_14px_0_rgba(244,167,185,0.45)]"
                : "border border-pink text-pink bg-transparent hover:bg-pink/10"
            }`}
          >
            🚗 Travel Map
          </button>
          <button
            onClick={() => setTab("festival")}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 ${
              tab === "festival"
                ? "bg-pink text-white shadow-[0_4px_14px_0_rgba(244,167,185,0.45)]"
                : "border border-pink text-pink bg-transparent hover:bg-pink/10"
            }`}
          >
            🌸 Festival Map
          </button>
        </div>
      </div>

      {/* ── Map area ── */}
      {tab === "travel" ? (
        <div className="flex-1 px-4 pb-20 min-h-0">
          <div className="h-full rounded-3xl overflow-hidden shadow-[0_2px_20px_0_rgba(45,45,45,0.1)]">
            <MapClient />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-hidden min-h-0">
            <FestivalSVGMap />
          </div>

          {/* Download button */}
          <div className="text-center shrink-0 py-2 pb-20">
            <button
              onClick={() => {
                const a = document.createElement("a");
                a.href = "/map-lola.png";
                a.download = "lolapabouillet-map.png";
                a.click();
              }}
              className="text-xs text-charcoal/40 underline underline-offset-2"
            >
              📥 Télécharger la carte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
