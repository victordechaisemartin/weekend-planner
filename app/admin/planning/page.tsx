"use client";

// Requires a settings table. Run in Supabase SQL editor:
//
// create table if not exists settings (
//   key   text primary key,
//   value text not null
// );
// alter table settings enable row level security;
// create policy "settings: authenticated read"
//   on settings for select to authenticated using (true);
// create policy "settings: admin write"
//   on settings for all to authenticated
//   using ((select is_admin from users where id = auth.uid()))
//   with check ((select is_admin from users where id = auth.uid()));

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ── types ─────────────────────────────────────────────────────

type Slot     = { time: string; activity: string };
type Schedule = { fri: Slot[]; sat: Slot[]; sun: Slot[] };
type DayKey   = keyof Schedule;

const DEFAULT_SCHEDULE: Schedule = {
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
    { time: "12h",     activity: "Brunch"        },
    { time: "13h-16h", activity: "Secret"        },
    { time: "18h",     activity: "Apéro"         },
    { time: "19h",     activity: "Tacos Sunday"  },
    { time: "20h",     activity: "Chill Night?"  },
  ],
};

const DAYS: { key: DayKey; label: string; day: string }[] = [
  { key: "fri", label: "VEN", day: "23" },
  { key: "sat", label: "SAM", day: "24" },
  { key: "sun", label: "DIM", day: "25" },
];

// ── component ─────────────────────────────────────────────────

export default function AdminPlanningPage() {
  const [planningEnabled, setPlanningEnabled] = useState(false);
  const [schedule,        setSchedule]        = useState<Schedule>(DEFAULT_SCHEDULE);
  const [loading,         setLoading]         = useState(true);
  const [toast,           setToast]           = useState("");
  const toastTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef = useRef<Schedule>(DEFAULT_SCHEDULE);

  // Keep ref in sync so the debounced save always uses latest value
  scheduleRef.current = schedule;

  // ── fetch ──────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["planning_enabled", "schedule"]);

      const rows = data ?? [];
      const enabled  = rows.find((r) => r.key === "planning_enabled");
      const sched    = rows.find((r) => r.key === "schedule");

      if (enabled) setPlanningEnabled(enabled.value === "true");
      if (sched) {
        try {
          setSchedule(JSON.parse(sched.value) as Schedule);
        } catch { /* keep default */ }
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── toast helper ──────────────────────────────────────────────

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }

  // ── toggle planning visibility ────────────────────────────────

  async function handleToggle() {
    const next = !planningEnabled;
    setPlanningEnabled(next);
    const { error } = await supabase.from("settings").upsert(
      { key: "planning_enabled", value: String(next) },
      { onConflict: "key" }
    );
    if (error) {
      setPlanningEnabled(!next); // revert optimistic update
      showToast("Erreur : " + error.message);
    } else {
      showToast(next ? "Planning activé pour tous 🌸" : "Planning masqué 🌸");
    }
  }

  // ── schedule mutations (all debounce to auto-save) ─────────────

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await supabase.from("settings").upsert(
        { key: "schedule", value: JSON.stringify(scheduleRef.current) },
        { onConflict: "key" }
      );
      showToast("Sauvegardé ✓");
    }, 500);
  }, []);

  function updateSlot(day: DayKey, idx: number, field: keyof Slot, val: string) {
    const next = { ...schedule, [day]: schedule[day].map((s, i) =>
      i === idx ? { ...s, [field]: val } : s
    )};
    setSchedule(next);
    scheduleSave();
  }

  function addSlot(day: DayKey) {
    const next = { ...schedule, [day]: [...schedule[day], { time: "", activity: "" }] };
    setSchedule(next);
    scheduleSave();
  }

  function removeSlot(day: DayKey, idx: number) {
    const next = { ...schedule, [day]: schedule[day].filter((_, i) => i !== idx) };
    setSchedule(next);
    scheduleSave();
  }

  // ── render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg whitespace-nowrap"
          style={{ background: "#F4A7B9", color: "#2D2D2D" }}
        >
          {toast}
        </div>
      )}

      {/* ── Visibility toggle ── */}
      <div
        className="rounded-3xl p-5 shadow-sm space-y-4"
        style={{ background: "white" }}
      >
        <div>
          <p className="font-bold text-base" style={{ color: "#2D2D2D" }}>
            🗓️ Onglet Planning
          </p>
          <p className="text-sm mt-0.5" style={{ color: "#2D2D2D66" }}>
            Actuellement :{" "}
            <span className="font-semibold" style={{ color: planningEnabled ? "#3a8c78" : "#2D2D2D44" }}>
              {loading ? "…" : planningEnabled ? "Visible" : "Caché"}
            </span>
          </p>
        </div>

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className="relative flex items-center gap-3 disabled:opacity-50"
          aria-label="Toggle planning visibility"
        >
          <span
            className="relative inline-flex w-14 h-7 rounded-full transition-colors duration-200 shrink-0"
            style={{ background: planningEnabled ? "#F4A7B9" : "#2D2D2D22" }}
          >
            <span
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: planningEnabled ? "translateX(32px)" : "translateX(2px)" }}
            />
          </span>
          <span className="text-sm font-semibold" style={{ color: "#2D2D2D" }}>
            {planningEnabled ? "Désactiver" : "Activer pour tous"}
          </span>
        </button>
      </div>

      {/* ── Schedule editor ── */}
      <div>
        <p
          className="text-xs font-extrabold uppercase tracking-widest mb-3"
          style={{ color: "#2D2D2D66" }}
        >
          Programme
        </p>

        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl animate-pulse"
                style={{ background: "#F4A7B933" }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {DAYS.map(({ key, label, day }) => (
              <div key={key} className="flex flex-col gap-1.5">
                {/* Day header */}
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span
                    className="text-2xl font-black leading-none"
                    style={{ color: "#F4A7B9" }}
                  >
                    {day}
                  </span>
                  <span
                    className="text-[9px] font-extrabold uppercase tracking-wider rounded-full px-1.5 py-0.5 text-white"
                    style={{ background: "#F4A7B9" }}
                  >
                    {label}
                  </span>
                </div>

                {/* Slot rows */}
                {schedule[key].map((slot, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-1.5 space-y-1"
                    style={{ background: "white" }}
                  >
                    <input
                      type="text"
                      value={slot.time}
                      onChange={(e) => updateSlot(key, idx, "time", e.target.value)}
                      placeholder="18h"
                      className="w-full rounded-lg px-1.5 py-1 text-[11px] font-black outline-none focus:ring-1 focus:ring-[#F4A7B9]"
                      style={{
                        background: "#FFF8F0",
                        color: "#F4A7B9",
                        fontSize: 13,
                      }}
                    />
                    <input
                      type="text"
                      value={slot.activity}
                      onChange={(e) => updateSlot(key, idx, "activity", e.target.value)}
                      placeholder="Activité"
                      className="w-full rounded-lg px-1.5 py-1 text-[10px] outline-none focus:ring-1 focus:ring-[#F4A7B9]"
                      style={{
                        background: "#FFF8F0",
                        color: "#2D2D2D",
                        fontSize: 13,
                      }}
                    />
                    <button
                      onClick={() => removeSlot(key, idx)}
                      className="text-[10px] font-semibold w-full text-right pr-0.5 transition-opacity hover:opacity-70"
                      style={{ color: "#2D2D2D44" }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}

                {/* Add slot */}
                <button
                  onClick={() => addSlot(key)}
                  className="rounded-xl py-1.5 text-[11px] font-bold transition-colors"
                  style={{
                    background: "#F4A7B922",
                    color: "#F4A7B9",
                  }}
                >
                  + Ajouter
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
