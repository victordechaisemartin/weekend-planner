"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// ── Schedule types ────────────────────────────────────────────

type Slot = { time: string; activity: string };
type ScheduleData = { fri: Slot[]; sat: Slot[]; sun: Slot[] };

const DEFAULT_SCHEDULE: ScheduleData = {
  fri: [
    { time: "18h",     activity: "Ouverture du festival" },
    { time: "19h",     activity: "Atelier"               },
    { time: "20h",     activity: "Joe's Pizza"           },
    { time: "22h",     activity: "Cocktail Bar"          },
  ],
  sat: [
    { time: "12h",     activity: "Vicar's Burgers"   },
    { time: "13h-16h", activity: "Secret"            },
    { time: "18h",     activity: "Bouille Pong"       },
    { time: "19h",     activity: "Cochon"             },
    { time: "20h",     activity: "Flower Party"       },
    { time: "22h",     activity: "Début Happening"    },
  ],
  sun: [
    { time: "12h",     activity: "Brunch"       },
    { time: "13h-16h", activity: "Secret"       },
    { time: "18h",     activity: "Apéro"        },
    { time: "19h",     activity: "Tacos Sunday" },
    { time: "20h",     activity: "Chill Night?" },
  ],
};

// Map DB schedule shape to the 3-column array the UI needs
function toColumns(s: ScheduleData) {
  return [
    { day: "23", badge: "VEN", slots: s.fri },
    { day: "24", badge: "SAM", slots: s.sat },
    { day: "25", badge: "DIM", slots: s.sun },
  ];
}

// ── DJ data ───────────────────────────────────────────────────

type DJEntry = {
  id: string;
  name: string;
  alias: string;
  style: string;
  photo: string | null;
};

const CLOUDS = [
  { top: "5%",  duration: "40s", delay: "0s",    width: 180 },
  { top: "18%", duration: "62s", delay: "-25s",  width: 140 },
  { top: "33%", duration: "55s", delay: "-18s",  width: 240 },
  { top: "48%", duration: "75s", delay: "-40s",  width: 170 },
  { top: "62%", duration: "70s", delay: "-35s",  width: 160 },
  { top: "74%", duration: "48s", delay: "-12s",  width: 210 },
  { top: "88%", duration: "45s", delay: "-10s",  width: 200 },
];

// ── Garland header ────────────────────────────────────────────

function GarlandHeader() {
  const garland = ["🌸", "🌼", "🌺", "🌼", "🌸", "🌼", "🌺", "🌼", "🌸"];

  return (
    <header className="relative bg-gradient-to-b from-pink/25 via-lavender/15 to-cream overflow-hidden pt-10 pb-7">
      <span className="absolute top-3 left-5 text-3xl opacity-20 -rotate-12 select-none" aria-hidden>🌸</span>
      <span className="absolute top-6 right-6 text-2xl opacity-15 rotate-12 select-none" aria-hidden>🌺</span>
      <span className="absolute bottom-4 left-10 text-xl opacity-15 rotate-6 select-none" aria-hidden>🌼</span>
      <span className="absolute bottom-3 right-8 text-2xl opacity-20 -rotate-6 select-none" aria-hidden>🌸</span>
      <span className="absolute top-1/2 left-2 text-lg opacity-10 select-none" aria-hidden>🌺</span>
      <span className="absolute top-1/2 right-2 text-lg opacity-10 select-none" aria-hidden>🌼</span>

      <p className="text-center text-lg select-none mb-3 tracking-[0.2em]" aria-hidden>
        {garland.join(" ")}
      </p>

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

      <p className="text-center text-lg select-none mt-4 tracking-[0.2em]" aria-hidden>
        {[...garland].reverse().join(" ")}
      </p>
    </header>
  );
}

// ── Page ──────────────────────────────────────────────────────

type Tab = "artists" | "planning";

export default function PlanningPage() {
  const [tab,             setTab]             = useState<Tab>("artists");
  const [planningEnabled, setPlanningEnabled] = useState(false);
  const [scheduleData,    setScheduleData]    = useState<ScheduleData>(DEFAULT_SCHEDULE);
  const [lineup,          setLineup]          = useState<DJEntry[]>([]);

  // Fetch planning_enabled + schedule from settings on mount
  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .in("key", ["planning_enabled", "schedule"])
      .then(({ data }) => {
        const rows = data ?? [];
        const enabled = rows.find((r) => r.key === "planning_enabled");
        const sched   = rows.find((r) => r.key === "schedule");
        if (enabled) setPlanningEnabled(enabled.value === "true");
        if (sched) {
          try { setScheduleData(JSON.parse(sched.value) as ScheduleData); }
          catch { /* keep default */ }
        }
      });
  }, []);

  // Fetch DJ lineup from DB on mount
  useEffect(() => {
    async function loadLineup() {
      // Import here to avoid circular dep with getEventId
      const { getEventId } = await import("@/lib/constants");
      const eventId = await getEventId();
      if (!eventId) return;
      const { data } = await supabase
        .from("djs")
        .select("id, name, alias, style, photo, revealed")
        .eq("event_id", eventId)
        .order("display_order", { ascending: true, nullsFirst: false });
      setLineup(
        (data ?? []).map((dj) =>
          dj.revealed
            ? { id: dj.id, name: dj.name, alias: dj.alias ?? "", style: dj.style ?? "", photo: dj.photo }
            : { id: dj.id, name: "???",   alias: "",             style: "🌸 Reveal coming soon",         photo: null }
        )
      );
    }
    loadLineup();
  }, []);

  // Fade-in observer: cards start hidden via CSS class, revealed when scrolled into view.
  // Depends on lineup so it re-runs after DB data arrives.
  useEffect(() => {
    if (tab !== "artists" || lineup.length === 0) return;
    const cards = document.querySelectorAll(".dj-card");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("revealed");
        }),
      { threshold: 0.1 }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [tab, lineup]);

  return (
    <div className="min-h-screen bg-cream">
      <GarlandHeader />

      {/* ── Tab toggles ── */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        <button
          onClick={() => setTab("artists")}
          className={cn(
            "flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-150",
            tab === "artists"
              ? "bg-pink text-white shadow-[0_4px_14px_0_rgba(244,167,185,0.45)]"
              : "border border-pink text-pink bg-transparent hover:bg-pink/10"
          )}
        >
          🎧 Artists
        </button>
        <button
          onClick={() => planningEnabled && setTab("planning")}
          disabled={!planningEnabled}
          className={cn(
            "flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-150",
            tab === "planning"
              ? "bg-pink text-white shadow-[0_4px_14px_0_rgba(244,167,185,0.45)]"
              : "border border-pink text-pink bg-transparent",
            !planningEnabled && "opacity-40 cursor-not-allowed"
          )}
        >
          📅 Planning
        </button>
      </div>

      {/* ── Tab 1: Artists — festival poster ── */}
      {tab === "artists" && (
        <div
          className="relative overflow-x-hidden scroll-smooth bg-cream"
        >
          <style>{`
            @keyframes drift {
              0%   { transform: translateX(-300px); }
              100% { transform: translateX(calc(100vw + 300px)); }
            }
            .dj-card {
              opacity: 0;
              transform: translateY(1rem);
              transition: opacity 500ms ease, transform 500ms ease;
            }
            .dj-card.revealed {
              opacity: 1;
              transform: translateY(0);
            }
          `}</style>

          {/* Drifting clouds */}
          {CLOUDS.map((cloud, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={i}
              src="/cloud.png"
              alt=""
              aria-hidden
              style={{
                position: "absolute",
                top: cloud.top,
                left: 0,
                width: cloud.width,
                opacity: 0.6,
                pointerEvents: "none",
                animation: `drift ${cloud.duration} linear ${cloud.delay} infinite`,
              }}
            />
          ))}

          {/* DJ cards */}
          <div className="relative z-10 pb-28 pt-6">
            {lineup.map((dj, i) => {
              const photoLeft = i % 2 === 0;

              const photoEl = dj.photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={dj.photo}
                  alt={dj.name}
                  style={{ width: 200, flexShrink: 0, objectFit: "contain" }}
                />
              ) : (
                <div
                  aria-hidden
                  style={{
                    width: 200,
                    height: 200,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: "#d1d5db",
                    filter: "blur(6px)",
                  }}
                />
              );

              const textEl = (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2
                    style={{
                      fontWeight: 900,
                      fontSize: "clamp(1.75rem, 9vw, 3rem)",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                      textTransform: "uppercase",
                      color: "#2D2D2D",
                      wordBreak: "break-word",
                      margin: 0,
                    }}
                  >
                    {dj.name}
                  </h2>
                  {dj.alias && (
                    <p
                      style={{
                        fontSize: "1rem",
                        color: "rgba(45,45,45,0.6)",
                        fontStyle: "italic",
                        marginTop: "0.3rem",
                        marginBottom: 0,
                      }}
                    >
                      {dj.alias}
                    </p>
                  )}
                  <hr
                    style={{
                      margin: "0.75rem 0",
                      border: "none",
                      borderTop: "1px solid rgba(45,45,45,0.18)",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "rgba(45,45,45,0.5)",
                      margin: 0,
                    }}
                  >
                    STYLE : {dj.style}
                  </p>
                </div>
              );

              return (
                <div key={dj.id}>
                  <div
                    className="dj-card"
                    style={{
                      display: "flex",
                      flexDirection: photoLeft ? "row" : "row-reverse",
                      alignItems: "center",
                      gap: "1.25rem",
                      padding: "2rem 1.25rem",
                    }}
                  >
                    {photoEl}
                    {textEl}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab 2: Planning ── */}
      {tab === "planning" && (
        <div className="relative px-3 pb-10 pt-3">
          <span className="absolute top-4 left-2 text-2xl opacity-10 select-none -rotate-12" aria-hidden>🌸</span>
          <span className="absolute top-8 right-2 text-xl opacity-10 select-none rotate-12" aria-hidden>🌺</span>
          <span className="absolute bottom-20 left-1 text-2xl opacity-10 select-none rotate-6" aria-hidden>🌼</span>
          <span className="absolute bottom-32 right-2 text-xl opacity-10 select-none -rotate-6" aria-hidden>🌸</span>

          <div className="grid grid-cols-3 gap-2.5">
            {toColumns(scheduleData).map(({ day, badge, slots }) => (
              <div key={day} className="flex flex-col">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-black text-pink leading-none">{day}</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-pink text-white rounded-full px-1.5 py-0.5">
                    {badge}
                  </span>
                </div>
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
