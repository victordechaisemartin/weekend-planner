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

// ── types & data ──────────────────────────────────────────────

type Pin = {
  name:       string;
  xPct:       number;
  yPct:       number;
  icon?:      string;
  emoji?:     string;
  labelColor: string;
};

const PINS: Pin[] = [
  { name: "Entrée 1",      xPct: 15, yPct: 22, emoji: "🌸", labelColor: "#F4A7B9" },
  { name: "Entrée 2",      xPct: 96, yPct: 36, emoji: "🌸", labelColor: "#F4A7B9" },
  { name: "Maison d'Yves", xPct: 27, yPct: 40, emoji: "🏠", labelColor: "#F4A7B9" },
  { name: "Maison Titanic",xPct: 38, yPct: 57, emoji: "🏠", labelColor: "#C9B8E8" },
  { name: "Yves Stage",    xPct: 38, yPct: 49, emoji: "🎤", labelColor: "#F4A7B9" },
  { name: "Camping",       xPct: 45, yPct: 50, emoji: "⛺", labelColor: "#8FBC5A" },
  { name: "Grange",        xPct: 72, yPct: 50, emoji: "🚜", labelColor: "#D4A574" },
  { name: "Maison Rouge",  xPct: 87, yPct: 44, emoji: "🏠", labelColor: "#FF6B6B" },
  { name: "Étang 2 îlots", xPct: 82, yPct: 50, emoji: "🐟", labelColor: "#7EC8E3" },
  { name: "Tennis",        xPct: 81, yPct: 60, emoji: "🎾", labelColor: "#8FBC5A" },
  { name: "Cabane",        xPct: 65, yPct: 27, emoji: "🛖", labelColor: "#D4A574" },
  { name: "Rambouboat",    xPct: 32, yPct: 48, emoji: "🐟", labelColor: "#7EC8E3" },
];

// ── MapPin ────────────────────────────────────────────────────

function MapPin({ pin, scale }: { pin: Pin; scale: number }) {
  const isStage = pin.name === "Yves Stage";

  return (
    <div
      style={{
        position:        "absolute",
        left:            `${pin.xPct}%`,
        top:             `${pin.yPct}%`,
        transform:       `translate(-50%, -100%) scale(${1 / scale}) translateZ(0)`,
        transformOrigin: "bottom center",
        willChange:      "transform",
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        cursor:          "pointer",
        zIndex:          10,
        pointerEvents:   "auto",
      }}
    >
      {/* Pulsing ring — Yves Stage only */}
      {isStage && (
        <div style={{
          position:      "absolute",
          top:           -4,
          left:          -4,
          right:         -4,
          bottom:        -4,
          borderRadius:  "50%",
          border:        "2px solid #F4A7B9",
          animation:     "ping 2s infinite",
          opacity:       0.6,
          pointerEvents: "none",
        }} />
      )}

      {/* Icon or emoji */}
      <div style={{
        width:          36,
        height:         36,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
      }}>
        {pin.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
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

      {/* Label */}
      <div style={{
        marginTop:    2,
        background:   pin.labelColor,
        color:        "white",
        fontSize:     9,
        fontWeight:   700,
        padding:      "10px 15px",
        borderRadius: 99,
        whiteSpace:   "nowrap",
        textAlign:    "center",
        boxShadow:    "0 1px 3px rgba(0,0,0,0.3)",
        textShadow:   "0 1px 2px rgba(0,0,0,0.3)",
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
              {/* Image and overlay are siblings inside one container — both scale together */}
              <div style={{ position: "relative", display: "inline-block", lineHeight: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/map-lola.png"
                  alt="Festival Map"
                  style={{ width: "100%", height: "auto", display: "block" }}
                  draggable={false}
                />

                {/* Overlay — covers image exactly; no JS sizing needed */}
                <div style={{
                  position:      "absolute",
                  top:           0,
                  left:          0,
                  right:         0,
                  bottom:        0,
                  pointerEvents: "none",
                }}>
                  {PINS.map((pin) => (
                    <MapPin key={pin.name + pin.xPct} pin={pin} scale={currentScale} />
                  ))}
                </div>
              </div>
            </TransformComponent>

            {/* Zoom controls — outside TransformComponent so they don't move */}
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
