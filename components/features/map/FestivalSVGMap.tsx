"use client";

import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// ── ping animation ────────────────────────────────────────────

const pingKeyframes = `
  @keyframes ping {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(1.8); opacity: 0;   }
  }
`;

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

// ── types & data ──────────────────────────────────────────────

type Pin = {
  lat:        number;
  lng:        number;
  icon:       string | null;
  emoji?:     string;
  name:       string;
  labelColor: string;
};

const PINS: Pin[] = [
  { lat: 48.68918, lng: 1.69503, icon: "/icons/house.png",     name: "Maison d'Yves",  labelColor: "#F4A7B9" },
  { lat: 48.68845, lng: 1.69600, icon: "/icons/house.png",     name: "Maison Titanic", labelColor: "#C9B8E8" },
  { lat: 48.68866, lng: 1.69520, icon: null, emoji: "🎣",      name: "Rambouboat",     labelColor: "#7EC8E3" },
  { lat: 48.68967, lng: 1.70323, icon: "/icons/barn.png",      name: "Grange",         labelColor: "#D4A574" },
  { lat: 48.68905, lng: 1.70455, icon: "/icons/tennis.png",    name: "Tennis",         labelColor: "#8FBC5A" },
  { lat: 48.69028, lng: 1.70499, icon: "/icons/house.png",     name: "Maison Rouge",   labelColor: "#FF6B6B" },
  { lat: 48.68966, lng: 1.70424, icon: null, emoji: "🏝️",     name: "Étang 2 îlots",  labelColor: "#7EC8E3" },
  { lat: 48.69153, lng: 1.69923, icon: "/icons/treehouse.png", name: "Cabane",         labelColor: "#D4A574" },
  { lat: 48.68881, lng: 1.69681, icon: "/icons/tent.png",      name: "Camping",        labelColor: "#8FBC5A" },
  { lat: 48.68873, lng: 1.69599, icon: "/icons/stage.png",     name: "Yves Stage",     labelColor: "#F4A7B9" },
  { lat: 48.69126, lng: 1.69098, icon: null, emoji: "🌸",      name: "Entrée 1",       labelColor: "#F4A7B9" },
  { lat: 48.69156, lng: 1.70608, icon: null, emoji: "🌸",      name: "Entrée 2",       labelColor: "#F4A7B9" },
];

// ── MapPin ────────────────────────────────────────────────────

function MapPin({ pin, scale }: { pin: Pin; scale: number }) {
  const { x, y } = toPercent(pin.lat, pin.lng);
  const isStage  = pin.name === "Yves Stage";

  return (
    <div
      style={{
        position:        "absolute",
        left:            `${x}%`,
        top:             `${y}%`,
        transform:       `translate(-50%, -100%) scale(${1 / scale})`,
        transformOrigin: "bottom center",
        cursor:          "pointer",
        zIndex:          10,
      }}
    >
      {/* Pulsing ring — Yves Stage only */}
      {isStage && (
        <div style={{
          position:     "absolute",
          top:          -4,
          left:         -4,
          right:        -4,
          bottom:       -4,
          borderRadius: "50%",
          border:       "2px solid #F4A7B9",
          animation:    "ping 2s infinite",
          opacity:      0.6,
          pointerEvents:"none",
        }} />
      )}

      {/* Icon or emoji */}
      <div style={{
        width:          36,
        height:         36,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        filter:         "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
      }}>
        {pin.icon ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={pin.icon}
            alt={pin.name}
            style={{ width: 36, height: 36, objectFit: "contain" }}
            draggable={false}
          />
        ) : (
          <span style={{ fontSize: 28, lineHeight: 1 }}>{pin.emoji}</span>
        )}
      </div>

      {/* Label — always visible */}
      <div style={{
        marginTop:  2,
        background: pin.labelColor,
        color:      "white",
        fontSize:   9,
        fontWeight: 700,
        padding:    "2px 6px",
        borderRadius: 99,
        whiteSpace: "nowrap",
        textAlign:  "center",
        boxShadow:  "0 1px 3px rgba(0,0,0,0.3)",
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}>
        {pin.name}
      </div>
    </div>
  );
}

// ── FestivalSVGMap ────────────────────────────────────────────

export default function FestivalSVGMap() {
  const [currentScale, setCurrentScale] = useState(1);

  return (
    <div className="relative w-full h-full bg-[#FFF8F0]">
      <style>{pingKeyframes}</style>

      <TransformWrapper
        initialScale={1}
        minScale={0.8}
        maxScale={5}
        centerOnInit={true}
        wheel={{ disabled: false }}
        pinch={{ disabled: false }}
        doubleClick={{ disabled: false }}
        onTransform={(_, state) => setCurrentScale(state.scale)}
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
                  src="/map-lola.png"
                  alt="Festival Map"
                  style={{ width: "100%", height: "auto", display: "block" }}
                  draggable={false}
                />

                {/* Pins — scale-invariant via inverse transform */}
                {PINS.map((pin) => (
                  <MapPin key={pin.name} pin={pin} scale={currentScale} />
                ))}
              </div>
            </TransformComponent>

            {/* Zoom controls */}
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
