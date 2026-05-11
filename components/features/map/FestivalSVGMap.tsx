"use client";

import { useState, useRef, useEffect } from "react";
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
  icon:       string | null;
  emoji?:     string;
  labelColor: string;
};

const PINS: Pin[] = [
  { name: "Entrée 1",      xPct: 18, yPct: 35, icon: null,                      emoji: "🌸", labelColor: "#F4A7B9" },
  { name: "Entrée 2",      xPct: 96, yPct: 48, icon: null,                      emoji: "🌸", labelColor: "#F4A7B9" },
  { name: "Maison d'Yves", xPct: 33, yPct: 62, icon: null,                      emoji: "🏠", labelColor: "#C9B8E8" },
  { name: "Maison Titanic",xPct: 42, yPct: 75, icon: null,                      emoji: "🏠", labelColor: "#C9B8E8" },
  { name: "Yves Stage",    xPct: 40, yPct: 65, icon: null,                      emoji: "🎤", labelColor: "#F4A7B9" },
  { name: "Camping",       xPct: 48, yPct: 75, icon: null,                      emoji: "⛺", labelColor: "#8FBC5A" },
  { name: "Grange",        xPct: 80, yPct: 70, icon: null,                      emoji: "🚜", labelColor: "#C9B8E8" },
  { name: "Maison Rouge",  xPct: 88, yPct: 59, icon: null,                      emoji: "🏠", labelColor: "#FF6B6B" },
  { name: "Cabane",        xPct: 80, yPct: 65, icon: null,                      emoji: "🛖", labelColor: "#D4A574" },
  { name: "Étang 2 îlots", xPct: 82, yPct: 68, icon: null,                      emoji: "🐟", labelColor: "#7EC8E3" },
  { name: "Tennis",        xPct: 80, yPct: 84, icon: null,                      emoji: "🎾", labelColor: "#8FBC5A" },
  { name: "Cabane",        xPct: 67, yPct: 40, icon: null,                      emoji: "🛖", labelColor: "#D4A574" },
  { name: "Davy Jones",    xPct: 37, yPct: 70, icon: null,                      emoji: "🐟", labelColor: "#7EC8E3" },
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
        transform:       `translate(-50%, -100%) scale(${1 / scale})`,
        transformOrigin: "bottom center",
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
        filter:         "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
      }}>
        {pin.icon ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={pin.icon}
            alt={pin.name}
            style={{
              width:           36,
              height:          36,
              objectFit:       "contain",
              imageRendering:  "crisp-edges",
            }}
            draggable={false}
          />
        ) : (
          <span style={{ fontSize: 28, lineHeight: 1 }}>{pin.emoji}</span>
        )}
      </div>

      {/* Label — always visible */}
      <div style={{
        marginTop:    2,
        background:   pin.labelColor,
        color:        "white",
        fontSize:     9,
        fontWeight:   700,
        padding:      "2px 6px",
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
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (imgRef.current) {
        setImgSize({
          w: imgRef.current.offsetWidth,
          h: imgRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
              <div style={{
                position:       "relative",
                width:          imgSize.w || "100%",
                height:         imgSize.h || "auto",
                display:        "inline-block",
                imageRendering: "crisp-edges",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src="/map-lola.png"
                  alt="Festival Map"
                  style={{
                    width:          "100%",
                    height:         "auto",
                    display:        "block",
                    imageRendering: "crisp-edges",
                  }}
                  draggable={false}
                  onLoad={() => {
                    if (imgRef.current) {
                      setImgSize({
                        w: imgRef.current.offsetWidth,
                        h: imgRef.current.offsetHeight,
                      });
                    }
                  }}
                />

                {/* Pin overlay — same dimensions as the image */}
                <div style={{
                  position:      "absolute",
                  top:           0,
                  left:          0,
                  width:         imgSize.w,
                  height:        imgSize.h,
                  pointerEvents: "none",
                }}>
                  {PINS.map((pin) => (
                    <MapPin key={pin.name} pin={pin} scale={currentScale} />
                  ))}
                </div>
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
