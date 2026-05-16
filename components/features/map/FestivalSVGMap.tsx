"use client";

import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// ── types & data ──────────────────────────────────────────────

type Pin = {
  name:       string;
  x:          number;
  y:          number;
  icon?:      string;
  emoji?:     string;
  labelColor: string;
};

// Pixel coordinates: x = Math.round(xPct/100 × 9355)
//                   y = Math.round(yPct/100 × 6616)
const PINS: Pin[] = [
  { name: "Entrée 1",       x: 1403, y: 1456, emoji: "🌸",  labelColor: "#F4A7B9" },
  { name: "Entrée 2",       x: 8981, y: 2582, emoji: "🌸",  labelColor: "#F4A7B9" },
  { name: "Dutch House",  x: 2526, y: 3246, emoji: "🏠",  labelColor: "#F4A7B9" },
  { name: "Maison Titanic", x: 3555, y: 4471, emoji: "🏠",  labelColor: "#C9B8E8" },
  { name: "Yves Stage",     x: 3555, y: 3842, emoji: "🎤",  labelColor: "#F4A7B9" },
  { name: "Camping",        x: 4210, y: 4108, emoji: "🏕️",  labelColor: "#8FBC5A" },
  { name: "Grange",         x: 6736, y: 4008, emoji: "🚜", labelColor: "#D4A574" },
  { name: "Rambouboat",     x: 6630, y: 4118, emoji: "🏴‍☠️", labelColor: "#7EC8E3" },
  { name: "Maison Rouge",   x: 8139, y: 3411, emoji: "🏠", labelColor: "#FF6B6B" },
  { name: "Étang 2 îlots",  x: 7671, y: 4008, emoji: "🎣", labelColor: "#7EC8E3" },
  { name: "Tennis",         x: 7578, y: 4870, emoji: "🎾", labelColor: "#8FBC5A" },
  { name: "Cabane",         x: 6081, y: 2086, emoji: "🛖", labelColor: "#D4A574" },
  { name: "Ramboulac",     x: 2900, y: 3876, emoji: "🎣",  labelColor: "#7EC8E3" },
  { name: "Tongs de Sev",   x: 3050, y: 3956, emoji: "🩴",  labelColor: "#7EC8E3" },
];

// ── LabelPill ─────────────────────────────────────────────────

function LabelPill({ name, color, yOffset }: {
  name:    string;
  color:   string;
  yOffset: number;
}) {
  const charWidth = 140;
  const pillW     = name.length * charWidth + 140;
  const pillH     = 200;
  const pillR     = 100;

  return (
    <g transform={`translate(0, ${yOffset})`}>
      <rect
        x={-pillW / 2}
        y={0}
        width={pillW}
        height={pillH}
        rx={pillR}
        ry={pillR}
        fill={color}
        opacity={1}
        stroke="white"
        strokeWidth={12}
        style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.4))" }}
      />
      <text
        x={0}
        y={pillH / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={180}
        fontWeight="800"
        fill="white"
        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
      >
        {name}
      </text>
    </g>
  );
}

// ── PinGroup ──────────────────────────────────────────────────

function PinGroup({ pin, scale }: { pin: Pin; scale: number }) {
  const ICON_SIZE = 900;
  const isStage   = pin.name === "Yves Stage";

  return (
    <g
      transform={`translate(${pin.x}, ${pin.y})`}
      style={{ pointerEvents: "auto", cursor: "pointer" }}
    >
      {/* Counter-scale: keeps visual size constant while zooming */}
      <g transform={`scale(${1 / scale})`}>

        {/* Pulsing ring — Yves Stage only */}
        {isStage && (
          <circle
            r={ICON_SIZE * 0.7}
            fill="none"
            stroke="#F4A7B9"
            strokeWidth={40}
            opacity={0.5}
          >
            <animate
              attributeName="r"
              values={`${ICON_SIZE * 0.6};${ICON_SIZE * 1.0};${ICON_SIZE * 0.6}`}
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.5;0;0.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Icon (PNG) or emoji */}
        {pin.icon ? (
          <image
            href={pin.icon}
            x={-ICON_SIZE / 2}
            y={-ICON_SIZE}
            width={ICON_SIZE}
            height={ICON_SIZE}
          />
        ) : (
          <>
            {/* White halo behind emoji */}
            <text
              x={0}
              y={-(ICON_SIZE * 0.1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={ICON_SIZE * 0.85}
              style={{
                paintOrder:     "stroke",
                stroke:         "white",
                strokeWidth:    60,
                strokeLinejoin: "round",
                fill:           "transparent",
              }}
            >
              {pin.emoji}
            </text>
            {/* Emoji on top */}
            <text
              x={0}
              y={-(ICON_SIZE * 0.1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={ICON_SIZE * 0.85}
            >
              {pin.emoji}
            </text>
          </>
        )}

        {/* Label pill anchored just below the icon */}
        <LabelPill
          name={pin.name}
          color={pin.labelColor}
          yOffset={ICON_SIZE * 0.15}
        />

      </g>
    </g>
  );
}

// ── FestivalSVGMap ────────────────────────────────────────────

export default function FestivalSVGMap() {
  const [currentScale, setCurrentScale] = useState(1);

  return (
    <div className="relative w-full overflow-hidden">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={6}
        centerOnInit={true}
        wheel={{ disabled: false, step: 0.1 }}
        pinch={{ disabled: false }}
        doubleClick={{ disabled: false }}
        onTransform={(_, state) => setCurrentScale(state.scale)}
        panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: "100%" }}
              contentStyle={{ width: "100%" }}
            >
              {/*
                Single SVG containing both the map image and all pins.
                One coordinate system (0 0 9355 6616) shared by everything —
                perfect alignment on every screen size and device pixel ratio.
              */}
              <svg
                viewBox="0 0 9355 6616"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width:       "100%",
                  height:      "auto",
                  display:     "block",
                  touchAction: "none",
                }}
              >
                <image
                  href="/map-lola.png"
                  x={0}
                  y={0}
                  width={9355}
                  height={6616}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ imageRendering: "auto" }}
                />

                {PINS.map((pin) => (
                  <PinGroup
                    key={pin.name}
                    pin={pin}
                    scale={currentScale}
                  />
                ))}
              </svg>
            </TransformComponent>

            {/* Zoom controls — outside TransformComponent so they don't pan */}
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
