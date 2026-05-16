"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ── types ─────────────────────────────────────────────────────

type MomentKey =
  | "present_fri_evening"
  | "present_sat_midday"
  | "present_sat_evening"
  | "present_sun_midday"
  | "present_sun_evening"
  | "present_mon_midday";

type PresenceUser = {
  name: string;
  dietary: string | null;
  present_fri_evening: boolean | null;
  present_sat_midday:  boolean | null;
  present_sat_evening: boolean | null;
  present_sun_midday:  boolean | null;
  present_sun_evening: boolean | null;
  present_mon_midday:  boolean | null;
};

// ── constants ─────────────────────────────────────────────────

const MOMENTS: { key: MomentKey; label: string; short: string; emoji: string }[] = [
  { key: "present_fri_evening", label: "Vendredi soir",  short: "Ven soir", emoji: "🌙" },
  { key: "present_sat_midday",  label: "Samedi midi",    short: "Sam midi",  emoji: "☀️" },
  { key: "present_sat_evening", label: "Samedi soir",    short: "Sam soir",  emoji: "🌙" },
  { key: "present_sun_midday",  label: "Dimanche midi",  short: "Dim midi",  emoji: "☀️" },
  { key: "present_sun_evening", label: "Dimanche soir",  short: "Dim soir",  emoji: "🌙" },
  { key: "present_mon_midday",  label: "Lundi midi",     short: "Lun midi",  emoji: "☀️" },
];

const DIETARY_TYPES: { key: string; emoji: string; label: string }[] = [
  { key: "vegetarian", emoji: "🥬", label: "végétarien·nes" },
  { key: "no_pork",    emoji: "🐷", label: "sans porc" },
  { key: "lactose",    emoji: "🥛", label: "intolérant·es lactose" },
];

// ── helpers ───────────────────────────────────────────────────

function presentAt(u: PresenceUser, key: MomentKey): boolean {
  return u[key] === true;
}

function hasDietary(u: PresenceUser, key: string): boolean {
  return u.dietary?.split(",").map((s) => s.trim()).includes(key) ?? false;
}

// ── component ─────────────────────────────────────────────────

export default function AdminPresencePage() {
  const [users,       setUsers]       = useState<PresenceUser[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [openMoments, setOpenMoments] = useState<Set<string>>(
    new Set(MOMENTS.map((m) => m.key))
  );
  const [dietaryOpen, setDietaryOpen] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("users")
        .select(`
          name,
          dietary,
          present_fri_evening,
          present_sat_midday,
          present_sat_evening,
          present_sun_midday,
          present_sun_evening,
          present_mon_midday
        `)
        .order("name", { ascending: true });

      setUsers((data ?? []) as PresenceUser[]);
      setLoading(false);
    }
    load();
  }, []);

  function toggleMoment(key: string) {
    setOpenMoments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }

  function exportCsv() {
    const header = ["Nom", "Ven soir", "Sam midi", "Sam soir", "Dim midi", "Dim soir", "Lun midi"];
    const rows = users.map((u) => [
      u.name,
      u.present_fri_evening ? "✓" : "",
      u.present_sat_midday  ? "✓" : "",
      u.present_sat_evening ? "✓" : "",
      u.present_sun_midday  ? "✓" : "",
      u.present_sun_evening ? "✓" : "",
      u.present_mon_midday  ? "✓" : "",
    ]);
    const csv  = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "lolapabouillet-presences.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── loading skeleton ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <div className="h-8 w-48 rounded-xl animate-pulse mb-1" style={{ background: "#F4A7B933" }} />
          <div className="h-4 w-32 rounded-lg animate-pulse"     style={{ background: "#F4A7B922" }} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MOMENTS.map((m) => (
            <div key={m.key} className="shrink-0 w-20 h-20 rounded-2xl animate-pulse" style={{ background: "#F4A7B933" }} />
          ))}
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "#F4A7B922" }} />
          ))}
        </div>
      </div>
    );
  }

  // ── derived ───────────────────────────────────────────────────

  const usersWithNoPresence = users.filter(
    (u) =>
      !u.present_fri_evening &&
      !u.present_sat_midday  &&
      !u.present_sat_evening &&
      !u.present_sun_midday  &&
      !u.present_sun_evening &&
      !u.present_mon_midday
  );

  // ── render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div>
        <h1
          className="font-[family-name:var(--font-lilita)] text-2xl uppercase"
          style={{ color: "#2D2D2D", WebkitTextStroke: "1px #2D2D2D" }}
        >
          🗓️ Présences
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#2D2D2D66" }}>
          Qui est là quand ?
        </p>
      </div>

      {/* ── Summary cards ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {MOMENTS.map((m) => {
          const count = users.filter((u) => presentAt(u, m.key)).length;
          return (
            <div
              key={m.key}
              className="shrink-0 rounded-2xl px-3 py-2 flex flex-col items-center min-w-[76px] shadow-sm"
              style={{ background: "#F4A7B933" }}
            >
              <span className="text-lg leading-none">{m.emoji}</span>
              <span
                className="text-2xl font-black tabular-nums leading-tight"
                style={{ color: "#2D2D2D" }}
              >
                {count}
              </span>
              <span
                className="text-[9px] font-extrabold uppercase tracking-wide text-center leading-tight mt-0.5"
                style={{ color: "#2D2D2D66" }}
              >
                {m.short}
              </span>
              <span
                className="text-[9px] text-center leading-tight"
                style={{ color: "#2D2D2D44" }}
              >
                personnes
              </span>
            </div>
          );
        })}

        {/* "Pas répondu" card */}
        <div
          className="shrink-0 rounded-2xl px-3 py-2 flex flex-col items-center min-w-[76px] shadow-sm"
          style={{ background: "#2D2D2D0D" }}
        >
          <span className="text-lg leading-none">❓</span>
          <span
            className="text-2xl font-black tabular-nums leading-tight"
            style={{ color: "#2D2D2D" }}
          >
            {usersWithNoPresence.length}
          </span>
          <span
            className="text-[9px] font-extrabold uppercase tracking-wide text-center leading-tight mt-0.5"
            style={{ color: "#2D2D2D66" }}
          >
            Pas répondu
          </span>
        </div>
      </div>

      {/* ── Collapsible moment sections ── */}
      <div className="space-y-3">
        {MOMENTS.map((m) => {
          const present = users.filter((u) => presentAt(u, m.key));
          const isOpen  = openMoments.has(m.key);
          return (
            <section
              key={m.key}
              className="rounded-2xl overflow-hidden shadow-sm"
              style={{ background: "white" }}
            >
              {/* Clickable header */}
              <button
                type="button"
                onClick={() => toggleMoment(m.key)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-bold text-sm" style={{ color: "#2D2D2D" }}>
                  {m.emoji} {m.label}
                  <span className="font-normal ml-1.5" style={{ color: "#2D2D2D66" }}>
                    — {present.length} personne{present.length !== 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-xs ml-2 shrink-0" style={{ color: "#2D2D2D44" }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {/* Body */}
              {isOpen && (
                <div className="px-4 pb-4">
                  {present.length === 0 ? (
                    <p className="text-sm" style={{ color: "#2D2D2D40" }}>
                      Personne encore 🌸
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {present.map((u) => (
                        <span
                          key={u.name}
                          className="px-3 py-1 text-sm rounded-full font-medium"
                          style={{ background: "#F4A7B933", color: "#2D2D2D" }}
                        >
                          {u.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ── Dietary alerts per moment ── */}
      <section>
        <button
          type="button"
          onClick={() => setDietaryOpen((v) => !v)}
          className="flex items-center gap-2 mb-3 w-full text-left"
        >
          <h2
            className="text-xs font-extrabold uppercase tracking-widest"
            style={{ color: "#2D2D2D88" }}
          >
            ⚠️ Besoins alimentaires par moment
          </h2>
          <span className="text-xs" style={{ color: "#2D2D2D44" }}>
            {dietaryOpen ? "▲" : "▼"}
          </span>
        </button>

        {dietaryOpen && (
          <div className="space-y-3">
            {MOMENTS.map((m) => {
              const present = users.filter((u) => presentAt(u, m.key));
              const needs = DIETARY_TYPES
                .map((d) => ({
                  ...d,
                  people: present
                    .filter((u) => hasDietary(u, d.key))
                    .map((u) => u.name),
                }))
                .filter((d) => d.people.length > 0);

              if (needs.length === 0) return null;

              return (
                <div
                  key={m.key}
                  className="rounded-2xl p-4 space-y-2"
                  style={{ background: "#C9B8E822" }}
                >
                  <p
                    className="text-xs font-extrabold uppercase tracking-widest"
                    style={{ color: "#2D2D2D66" }}
                  >
                    {m.emoji} {m.label}
                  </p>
                  {needs.map((d) => (
                    <p key={d.key} className="text-sm" style={{ color: "#2D2D2D" }}>
                      {d.emoji}{" "}
                      <span className="font-semibold">
                        {d.people.length} {d.label} :
                      </span>{" "}
                      <span style={{ color: "#2D2D2D77" }}>
                        {d.people.join(", ")}
                      </span>
                    </p>
                  ))}
                </div>
              );
            })}

            {/* No dietary needs at all */}
            {MOMENTS.every((m) =>
              DIETARY_TYPES.every(
                (d) =>
                  users
                    .filter((u) => presentAt(u, m.key))
                    .filter((u) => hasDietary(u, d.key)).length === 0
              )
            ) && (
              <p className="text-sm" style={{ color: "#2D2D2D40" }}>
                Aucun besoin alimentaire renseigné 🌸
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── No presence section ── */}
      <section
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: "white" }}
      >
        <button
          type="button"
          onClick={() => toggleMoment("none")}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="font-bold text-sm" style={{ color: "#2D2D2D" }}>
            ❓ Aucune présence indiquée
            <span className="font-normal ml-1.5" style={{ color: "#2D2D2D66" }}>
              — {usersWithNoPresence.length} personne{usersWithNoPresence.length !== 1 ? "s" : ""}
            </span>
          </span>
          <span className="text-xs ml-2 shrink-0" style={{ color: "#2D2D2D44" }}>
            {openMoments.has("none") ? "▲" : "▼"}
          </span>
        </button>

        {openMoments.has("none") && (
          <div className="px-4 pb-4">
            {usersWithNoPresence.length === 0 ? (
              <p className="text-sm" style={{ color: "#2D2D2D40" }}>
                Tout le monde a indiqué sa présence 🌸
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {usersWithNoPresence.map((u) => (
                  <span
                    key={u.name}
                    className="px-3 py-1 text-sm rounded-full font-medium"
                    style={{ background: "#2D2D2D0D", color: "#2D2D2D99" }}
                  >
                    {u.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Export button ── */}
      {users.length > 0 && (
        <button
          onClick={exportCsv}
          className="w-full rounded-full py-3 text-sm font-bold shadow-md transition-all active:scale-95"
          style={{ background: "#B8E4D8", color: "#2D2D2D" }}
        >
          📥 Exporter les présences
        </button>
      )}

    </div>
  );
}
