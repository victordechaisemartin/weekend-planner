"use client";

import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// ── geo bounds ────────────────────────────────────────────────

const W_MIN   = 1.6875;
const W_MAX   = 1.7085;
const LAT_MAX = 48.6935;
const LAT_MIN = 48.6862;

function toPercent(lat: number, lng: number) {
  return {
    x: ((lng - W_MIN) / (W_MAX - W_MIN)) * 100,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100,
  };
}

// ── pins ──────────────────────────────────────────────────────

type Pin = { lat: number; lng: number; emoji: string; name: string; color: string };

const PINS: Pin[] = [
  { lat: 48.68918, lng: 1.69503, emoji: "🏠", name: "Maison d'Yves",  color: "#F4A7B9" },
  { lat: 48.68845, lng: 1.69600, emoji: "🚢", name: "Maison Titanic", color: "#C9B8E8" },
  { lat: 48.68866, lng: 1.69520, emoji: "🎣", name: "Rambouboat",     color: "#7EC8E3" },
  { lat: 48.68967, lng: 1.70323, emoji: "🪵", name: "Grange",         color: "#D4A574" },
  { lat: 48.68905, lng: 1.70455, emoji: "🎾", name: "Tennis",         color: "#8FBC5A" },
  { lat: 48.69028, lng: 1.70499, emoji: "🔴", name: "Maison Rouge",   color: "#FF6B6B" },
  { lat: 48.68966, lng: 1.70424, emoji: "🏝️", name: "Étang 2 îlots", color: "#7EC8E3" },
  { lat: 48.69153, lng: 1.69923, emoji: "🛖", name: "Cabane",         color: "#D4A574" },
  { lat: 48.68881, lng: 1.69681, emoji: "⛺", name: "Camping",        color: "#8FBC5A" },
  { lat: 48.68873, lng: 1.69599, emoji: "🎧", name: "Yves Stage",     color: "#F4A7B9" },
  { lat: 48.69126, lng: 1.69098, emoji: "🌸", name: "Entrée 1",       color: "#F4A7B9" },
  { lat: 48.69156, lng: 1.70608, emoji: "🌸", name: "Entrée 2",       color: "#F4A7B9" },
];

// ── component ─────────────────────────────────────────────────

export default function FestivalSVGMap() {
  const [activePin, setActivePin] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full bg-[#FFF8F0]">
      <TransformWrapper
        initialScale={1}
        minScale={0.8}
        maxScale={5}
        centerOnInit={true}
        wheel={{ disabled: false }}
        pinch={{ disabled: false }}
        doubleClick={{ disabled: false }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%", height: "100%" }}
            >
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/map-lola.svg"
                  alt="Festival Map"
                  style={{ width: "100%", height: "auto", display: "block" }}
                  draggable={false}
                />

                {/* ── Pins overlay ── */}
                {PINS.map((pin) => {
                  const { x, y } = toPercent(pin.lat, pin.lng);
                  const isStage  = pin.name === "Yves Stage";
                  const isActive = activePin === pin.name;

                  return (
                    <div
                      key={pin.name}
                      style={{
                        position:  "absolute",
                        left:      `${x}%`,
                        top:       `${y}%`,
                        transform: "translate(-50%, -100%)",
                        zIndex:    10,
                        cursor:    "pointer",
                      }}
                      onClick={() => setActivePin(isActive ? null : pin.name)}
                    >
                      {/* Pulsing ring for main stage */}
                      {isStage && (
                        <div
                          className="animate-ping absolute inset-0 rounded-full bg-pink/40"
                          style={{ width: 32, height: 32 }}
                        />
                      )}

                      {/* Pin circle */}
                      <div style={{
                        width:          32,
                        height:         32,
                        borderRadius:   "50%",
                        background:     pin.color,
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        fontSize:       16,
                        boxShadow:      "0 2px 6px rgba(0,0,0,0.3)",
                        border:         "2px solid white",
                        position:       "relative",
                      }}>
                        {pin.emoji}
                      </div>

                      {/* Tooltip on tap */}
                      {isActive && (
                        <div style={{
                          position:   "absolute",
                          bottom:     "110%",
                          left:       "50%",
                          transform:  "translateX(-50%)",
                          background: "rgba(0,0,0,0.75)",
                          color:      "white",
                          padding:    "3px 8px",
                          borderRadius: 99,
                          fontSize:   11,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}>
                          {pin.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TransformComponent>

            {/* ── Zoom controls ── */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
              <button
                onClick={() => zoomIn()}
                className="w-8 h-8 bg-white/90 rounded-full shadow text-charcoal font-bold text-lg flex items-center justify-center"
              >
                +
              </button>
              <button
                onClick={() => zoomOut()}
                className="w-8 h-8 bg-white/90 rounded-full shadow text-charcoal font-bold text-lg flex items-center justify-center"
              >
                −
              </button>
              <button
                onClick={() => resetTransform()}
                className="w-8 h-8 bg-white/90 rounded-full shadow text-sm text-charcoal flex items-center justify-center"
              >
                ↺
              </button>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
