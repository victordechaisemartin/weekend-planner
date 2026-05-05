"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { DJ } from "@/lib/types";
import { cn } from "@/lib/utils";
import FlowerDivider from "@/components/ui/FlowerDivider";
import DJCard from "@/components/features/lineup/DJCard";

// ── Schedule data ─────────────────────────────────────────────

const SCHEDULE = [
  {
    day: "23",
    badge: "VEN",
    slots: [
      { time: "18h",     activity: "Ouverture du festival" },
      { time: "19h",     activity: "Atelier Drapeau"       },
      { time: "20h",     activity: "Joe's Pizza"           },
      { time: "22h",     activity: "Cocktail Bar"          },
    ],
  },
  {
    day: "24",
    badge: "SAM",
    slots: [
      { time: "12h",     activity: "Vicar's Burgers"    },
      { time: "13h-16h", activity: "Capture the Flag"   },
      { time: "16h",     activity: "Bouille Pong"        },
      { time: "19h",     activity: "Cochon"              },
      { time: "20h",     activity: "Flower Party"        },
      { time: "22h",     activity: "Début Happening"     },
    ],
  },
  {
    day: "25",
    badge: "DIM",
    slots: [
      { time: "12h",     activity: "Brunch"          },
      { time: "13h-16h", activity: "Alcoolympics"    },
      { time: "18h",     activity: "Apéro"            },
      { time: "19h",     activity: "Tacos Sunday"     },
      { time: "20h",     activity: "Outdoor Cinema"   },
      { time: "22h",     activity: "Game Night"       },
    ],
  },
];

// ── Garland header ────────────────────────────────────────────

function GarlandHeader() {
  const garland = ["🌸", "🌼", "🌺", "🌼", "🌸", "🌼", "🌺", "🌼", "🌸"];

  return (
    <header className="relative bg-gradient-to-b from-pink/25 via-lavender/15 to-cream overflow-hidden pt-10 pb-7">
      {/* Scattered background flowers */}
      <span className="absolute top-3 left-5 text-3xl opacity-20 -rotate-12 select-none" aria-hidden>🌸</span>
      <span className="absolute top-6 right-6 text-2xl opacity-15 rotate-12 select-none" aria-hidden>🌺</span>
      <span className="absolute bottom-4 left-10 text-xl opacity-15 rotate-6 select-none" aria-hidden>🌼</span>
      <span className="absolute bottom-3 right-8 text-2xl opacity-20 -rotate-6 select-none" aria-hidden>🌸</span>
      <span className="absolute top-1/2 left-2 text-lg opacity-10 select-none" aria-hidden>🌺</span>
      <span className="absolute top-1/2 right-2 text-lg opacity-10 select-none" aria-hidden>🌼</span>

      {/* Top garland */}
      <p
        className="text-center text-lg select-none mb-3 tracking-[0.2em]"
        aria-hidden
      >
        {garland.join(" ")}
      </p>

      {/* Title */}
      <div className="px-4 text-center space-y-0.5 relative z-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-charcoal/40">
          presents
        </p>
        <h1
          className="text-4xl leading-none uppercase font-[family-name:var(--font-lilita)]"
          style={{ WebkitTextStroke: "2px #2D2D2D", color: "white" }}
        >
          Lolapabouillet
        </h1>
        <p className="text-xl font-bold text-charcoal/75 tracking-wide">
          🎧 Planning 🌸
        </p>
        <p className="text-xs font-semibold text-charcoal/35 uppercase tracking-[0.2em] pt-1">
          22 May 2026 · Orphin
        </p>
      </div>

      {/* Bottom garland */}
      <p
        className="text-center text-lg select-none mt-4 tracking-[0.2em]"
        aria-hidden
      >
        {[...garland].reverse().join(" ")}
      </p>
    </header>
  );
}

// ── Page ──────────────────────────────────────────────────────

type Tab = "artists" | "planning";

export default function PlanningPage() {
  const [tab, setTab] = useState<Tab>("artists");
  const [djs, setDjs] = useState<DJ[]>([]);

  useEffect(() => {
    supabase
      .from("djs")
      .select("*")
      .order("set_time", { ascending: true, nullsFirst: false })
      .then(({ data }) => setDjs(data ?? []));
  }, []);

  const revealed = djs.filter((d) => d.revealed);
  const hidden   = djs.filter((d) => !d.revealed);

  return (
    <div className="min-h-screen bg-cream">
      <GarlandHeader />

      {/* ── Tab toggles ── */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        {(["artists", "planning"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-150",
              tab === t
                ? "bg-pink text-white shadow-[0_4px_14px_0_rgba(244,167,185,0.45)]"
                : "border border-pink text-pink bg-transparent hover:bg-pink/10"
            )}
          >
            {t === "artists" ? "🎧 Artists" : "📅 Planning"}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Artists ── */}
      {tab === "artists" && (
        <div className="px-4 pb-10 space-y-6 pt-2">
          {djs.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <p className="text-4xl">🎧</p>
              <p className="text-sm text-charcoal/40">Planning dropping soon. Stay tuned! 🌸</p>
            </div>
          )}

          {revealed.length > 0 && (
            <section className="space-y-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-charcoal/35 text-center pt-2">
                Confirmed artists
              </p>
              <div className="grid grid-cols-2 gap-3">
                {revealed.map((dj) => (
                  <DJCard key={dj.id} dj={dj} />
                ))}
              </div>
            </section>
          )}

          {revealed.length > 0 && hidden.length > 0 && (
            <FlowerDivider />
          )}

          {hidden.length > 0 && (
            <section className="space-y-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-charcoal/35 text-center">
                🌸 More to be announced
              </p>
              <div className="grid grid-cols-2 gap-3">
                {hidden.map((dj) => (
                  <DJCard key={dj.id} dj={dj} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Tab 2: Planning ── */}
      {tab === "planning" && (
        <div className="relative px-3 pb-10 pt-3">
          {/* Scattered flower decorations */}
          <span className="absolute top-4 left-2 text-2xl opacity-10 select-none -rotate-12" aria-hidden>🌸</span>
          <span className="absolute top-8 right-2 text-xl opacity-10 select-none rotate-12" aria-hidden>🌺</span>
          <span className="absolute bottom-20 left-1 text-2xl opacity-10 select-none rotate-6" aria-hidden>🌼</span>
          <span className="absolute bottom-32 right-2 text-xl opacity-10 select-none -rotate-6" aria-hidden>🌸</span>

          <div className="grid grid-cols-3 gap-2.5">
            {SCHEDULE.map(({ day, badge, slots }) => (
              <div key={day} className="flex flex-col">
                {/* Day header */}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-black text-pink leading-none">{day}</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-pink text-white rounded-full px-1.5 py-0.5">
                    {badge}
                  </span>
                </div>

                {/* Pink card */}
                <div className="flex-1 bg-pink rounded-2xl p-2 space-y-1.5">
                  {slots.map((slot) => (
                    <div key={slot.time} className="bg-white rounded-xl px-2 py-2">
                      <p className="text-[11px] font-black text-pink leading-none">{slot.time}</p>
                      <p className="text-[10px] text-charcoal/65 leading-tight mt-0.5 break-words">
                        {slot.activity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
