"use client";

import { useState } from "react";

// ── data ──────────────────────────────────────────────────────

type Location = {
  x: number;
  y: number;
  emoji: string;
  name: string;
  color?: string;
  size?: number;
};

const LOCATIONS: Location[] = [
  { x: 185, y: 290, emoji: "🏠", name: "Maison d'Yves",  color: "#F4A7B9" },
  { x: 215, y: 325, emoji: "🚢", name: "Maison Titanic", color: "#C9B8E8" },
  { x: 195, y: 308, emoji: "🎣", name: "Rambouboat",     color: "#7EC8E3" },
  { x: 520, y: 265, emoji: "🪵", name: "Grange",         color: "#D4A574" },
  { x: 572, y: 308, emoji: "🎾", name: "Tennis",         color: "#8FBC5A" },
  { x: 592, y: 248, emoji: "🔴", name: "Maison Rouge",   color: "#FF6B6B" },
  { x: 555, y: 302, emoji: "🏝️", name: "Étang 2 îlots", color: "#7EC8E3" },
  { x: 378, y: 198, emoji: "🛖", name: "Cabane",         color: "#D4A574" },
  { x: 242, y: 308, emoji: "⛺", name: "Camping",        color: "#8FBC5A", size: 32 },
  { x: 222, y: 342, emoji: "🎧", name: "Yves Stage",     color: "#F4A7B9", size: 36 },
  { x: 118, y: 382, emoji: "🌸", name: "Entrée 1",       color: "#F4A7B9", size: 32 },
  { x: 660, y: 292, emoji: "🌸", name: "Entrée 2",       color: "#F4A7B9", size: 32 },
];

const TREES = [
  { x: 44,  y: 72  }, { x: 88,  y: 46  }, { x: 148, y: 62  }, { x: 212, y: 42  },
  { x: 282, y: 56  }, { x: 352, y: 36  }, { x: 422, y: 52  }, { x: 492, y: 42  },
  { x: 558, y: 62  }, { x: 628, y: 46  }, { x: 698, y: 56  }, { x: 758, y: 76  },
  { x: 748, y: 148 }, { x: 762, y: 202 }, { x: 742, y: 382 }, { x: 756, y: 454 },
  { x: 64,  y: 158 }, { x: 54,  y: 232 }, { x: 62,  y: 422 }, { x: 76,  y: 488 },
  { x: 118, y: 128 }, { x: 682, y: 132 }, { x: 322, y: 122 }, { x: 452, y: 102 },
];

const FLOWERS = [
  { x: 162, y: 248 }, { x: 222, y: 246 }, { x: 282, y: 243 },
  { x: 342, y: 246 }, { x: 402, y: 243 }, { x: 462, y: 246 },
  { x: 522, y: 248 }, { x: 582, y: 246 },
];

const LEGEND_ITEMS = [
  { emoji: "🌸", label: "Entrées"       },
  { emoji: "🎧", label: "Scène"         },
  { emoji: "⛺", label: "Camping"       },
  { emoji: "🏠", label: "Hébergements"  },
];

// ── LocationPin ───────────────────────────────────────────────

type PinProps = Location & {
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

function LocationPin({
  x, y, emoji, name,
  color = "#F4A7B9",
  size = 28,
  hovered,
  onMouseEnter,
  onMouseLeave,
}: PinProps) {
  const r = size / 2;
  const scale = hovered ? 1.2 : 1;
  const labelW = Math.max(name.length * 5.4 + 14, 38);
  const isStage = name === "Yves Stage";
  const isEntry = name.startsWith("Entrée");

  return (
    <g
      transform={`translate(${x},${y}) scale(${scale})`}
      style={{ cursor: "pointer" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <title>{name}</title>

      {/* Pulsing ring — Yves Stage only */}
      {isStage && (
        <>
          <circle cx={0} cy={0} r={22} fill="none" stroke="#F4A7B9" strokeWidth={2} opacity={0.6}>
            <animate attributeName="r"       values="22;28;22"     dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.1;0.6"  dur="2s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* Entry arrows — pointing toward map center */}
      {isEntry && name === "Entrée 1" && (
        <polygon points="18,0 10,-5 10,5" fill={color} opacity={0.8}/>
      )}
      {isEntry && name === "Entrée 2" && (
        <polygon points="-18,0 -10,-5 -10,5" fill={color} opacity={0.8}/>
      )}

      {/* Marker circle */}
      <circle cx={0} cy={0} r={r} fill={color} opacity={0.92} filter="url(#pshadow)" />

      {/* Emoji */}
      <text
        x={0} y={r * 0.4}
        textAnchor="middle"
        fontSize={size * 0.54}
        style={{ userSelect: "none", pointerEvents: "none" }}
      >
        {emoji}
      </text>

      {/* Name pill */}
      <rect
        x={-labelW / 2} y={r + 3}
        width={labelW} height={16}
        rx={8} fill="rgba(0,0,0,0.62)"
      />
      <text
        x={0} y={r + 13.5}
        textAnchor="middle"
        fill="white"
        fontSize={isEntry ? 10 : 9}
        fontWeight="600"
        style={{ userSelect: "none", pointerEvents: "none" }}
      >
        {name}
      </text>
    </g>
  );
}

// ── component ─────────────────────────────────────────────────

export default function FestivalIllustrationMap() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <svg
      viewBox="0 0 800 600"
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      <defs>
        <filter id="pshadow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* ── Base background ── */}
      <rect width={800} height={600} fill="#2D5A27" />

      {/* ── Forest texture blobs ── */}
      <ellipse cx={80}  cy={100} rx={120} ry={80}  fill="#1F4A1C" opacity={0.85} />
      <ellipse cx={300} cy={80}  rx={160} ry={70}  fill="#3A6B32" opacity={0.75} />
      <ellipse cx={580} cy={88}  rx={150} ry={75}  fill="#1F4A1C" opacity={0.82} />
      <ellipse cx={752} cy={200} rx={80}  ry={165} fill="#3A6B32" opacity={0.72} />
      <ellipse cx={48}  cy={355} rx={90}  ry={200} fill="#1F4A1C" opacity={0.72} />
      <ellipse cx={718} cy={432} rx={110} ry={155} fill="#3A6B32" opacity={0.65} />
      <ellipse cx={400} cy={522} rx={255} ry={92}  fill="#1F4A1C" opacity={0.82} />
      <ellipse cx={158} cy={482} rx={132} ry={82}  fill="#3A6B32" opacity={0.62} />
      <ellipse cx={602} cy={502} rx={142} ry={82}  fill="#1F4A1C" opacity={0.72} />

      {/* ── Central meadow ── */}
      <rect   x={148} y={248} width={484} height={122} rx={42} fill="#8FBC5A" opacity={0.22} />
      <ellipse cx={380} cy={310} rx={262} ry={82} fill="#8FBC5A" opacity={0.18} />

      {/* ── Left pond ── */}
      <ellipse cx={128} cy={292} rx={72} ry={46} fill="#7EC8E3" opacity={0.82} />
      <text x={128} y={295} textAnchor="middle" fill="white" fontSize={7} fontWeight="700" opacity={0.9}
        style={{ pointerEvents: "none", userSelect: "none" }}>
        Étang Rambouboat
      </text>

      {/* ── Right pond ── */}
      <ellipse cx={575} cy={342} rx={52} ry={33} fill="#7EC8E3" opacity={0.82} />
      <ellipse cx={572} cy={340} rx={7}  ry={5}  fill="#8FBC5A" opacity={0.95} />

      {/* ── Right-edge road ── */}
      <rect x={708} y={98} width={18} height={404} rx={5} fill="#D4C5A0" opacity={0.55} />
      <text
        x={717} y={300}
        textAnchor="middle"
        fill="#D4C5A0"
        fontSize={9}
        fontWeight={600}
        opacity={0.75}
        transform="rotate(-90,717,300)"
        style={{ userSelect: "none", pointerEvents: "none" }}
      >
        Route des Meuniers
      </text>

      {/* ── Camping tinted zone ── */}
      <ellipse cx={242} cy={310} rx={52} ry={36} fill="#8FBC5A" opacity={0.18} />

      {/* ── Dashed paths ── */}
      <path d="M118 382 L242 310"     stroke="#FFF8F0" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.48} fill="none" />
      <path d="M242 310 L222 342"     stroke="#FFF8F0" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.48} fill="none" />
      <path d="M242 310 L185 290"     stroke="#FFF8F0" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.42} fill="none" />
      <path d="M185 290 L378 198"     stroke="#FFF8F0" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.38} fill="none" />
      <path d="M378 198 L520 265"     stroke="#FFF8F0" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.38} fill="none" />
      <path d="M520 265 L660 292"     stroke="#FFF8F0" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.48} fill="none" />

      {/* ── Trees ── */}
      {TREES.map(({ x, y }, i) => (
        <text key={i} x={x} y={y} fontSize={16} opacity={0.28}
          style={{ userSelect: "none", pointerEvents: "none" }}>🌲</text>
      ))}

      {/* ── Meadow flowers ── */}
      {FLOWERS.map(({ x, y }, i) => (
        <text key={i} x={x} y={y} fontSize={11} opacity={0.38}
          style={{ userSelect: "none", pointerEvents: "none" }}>🌸</text>
      ))}

      {/* ── Location pins ── */}
      {LOCATIONS.map((loc) => (
        <LocationPin
          key={loc.name}
          x={loc.x}
          y={loc.y}
          emoji={loc.emoji}
          name={loc.name}
          color={loc.color}
          size={loc.size}
          hovered={hovered === loc.name}
          onMouseEnter={() => setHovered(loc.name)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}

      {/* ── Title card ── */}
      <rect x={14} y={14} width={218} height={54} rx={12} fill="rgba(0,0,0,0.55)" />
      <text x={24} y={38} fill="#F4A7B9" fontSize={17} fontWeight="900"
        fontFamily="var(--font-lilita)"
        style={{ userSelect: "none", pointerEvents: "none" }}>
        🌸 LOLAPABOUILLET
      </text>
      <text x={24} y={56} fill="rgba(255,255,255,0.65)" fontSize={10}
        style={{ userSelect: "none", pointerEvents: "none" }}>
        Forêt de Rambouillet · Mai 2026
      </text>

      {/* ── Legend ── */}
      <rect x={14} y={488} width={175} height={98} rx={10} fill="rgba(0,0,0,0.55)" />
      {LEGEND_ITEMS.map(({ emoji, label }, i) => (
        <g key={label} transform={`translate(24,${506 + i * 20})`}>
          <text x={0} y={12} fontSize={13}
            style={{ userSelect: "none", pointerEvents: "none" }}>{emoji}</text>
          <text x={22} y={12} fill="white" fontSize={11} fontWeight="600"
            style={{ userSelect: "none", pointerEvents: "none" }}>{label}</text>
        </g>
      ))}

      {/* ── Compass rose ── */}
      <g transform="translate(752,548)">
        <circle cx={0} cy={0} r={22} fill="rgba(0,0,0,0.55)"
          stroke="rgba(255,255,255,0.28)" strokeWidth={0.8} />
        <text x={0} y={-8}  textAnchor="middle" fill="white"
          fontSize={9} fontWeight="700"
          style={{ userSelect: "none", pointerEvents: "none" }}>N</text>
        <text x={0} y={17}  textAnchor="middle" fill="rgba(255,255,255,0.55)"
          fontSize={7}
          style={{ userSelect: "none", pointerEvents: "none" }}>S</text>
        <text x={-14} y={4} textAnchor="middle" fill="rgba(255,255,255,0.55)"
          fontSize={7}
          style={{ userSelect: "none", pointerEvents: "none" }}>O</text>
        <text x={14}  y={4} textAnchor="middle" fill="rgba(255,255,255,0.55)"
          fontSize={7}
          style={{ userSelect: "none", pointerEvents: "none" }}>E</text>
        <polygon points="0,-6 -3,2 0,0 3,2" fill="white" />
        <line x1={0} y1={0} x2={0} y2={7}
          stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
      </g>
    </svg>
  );
}
