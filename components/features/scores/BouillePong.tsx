"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { BPDuo, BPMatch, FestivalTeam } from "@/lib/types";
import { TEAM_COLORS } from "@/lib/types";

// ── constants ─────────────────────────────────────────────────

const POOLS = ["A", "B", "C", "D"] as const;
type Pool = (typeof POOLS)[number];

const COLOR_LABELS: Record<FestivalTeam["color"], string> = {
  red:    "🔴 Rouge",
  pink:   "🩷 Rose",
  yellow: "🟡 Jaune",
  white:  "⚪ Blanc",
};

// ── helpers ───────────────────────────────────────────────────

function tc(color: FestivalTeam["color"]) {
  return TEAM_COLORS[color] ?? TEAM_COLORS.white;
}

function winner(match: BPMatch): "duo1" | "duo2" | null {
  if (!match.completed) return null;
  return match.score1 > match.score2 ? "duo1" : "duo2";
}

// ── sub-components ────────────────────────────────────────────

function DuoChip({ duo }: { duo: BPDuo }) {
  const c = tc(duo.color);
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      {duo.name}
    </span>
  );
}

function MatchBox({ match }: { match: BPMatch }) {
  const w = winner(match);
  const duo1Color = match.duo1 ? tc(match.duo1.color) : tc("white");
  const duo2Color = match.duo2 ? tc(match.duo2.color) : tc("white");

  return (
    <div className="rounded-2xl border border-charcoal/10 overflow-hidden text-xs">
      {/* Duo 1 */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-charcoal/8"
        style={{
          background: w === "duo1" ? duo1Color.bg : "white",
          fontWeight: w === "duo1" ? 700 : 400,
          color: w === "duo1" ? duo1Color.text : "#2D2D2D99",
        }}
      >
        <span className="truncate">{match.duo1?.name ?? "—"}</span>
        {match.completed && (
          <span className="ml-2 tabular-nums font-black shrink-0">{match.score1}</span>
        )}
      </div>
      {/* Duo 2 */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          background: w === "duo2" ? duo2Color.bg : "white",
          fontWeight: w === "duo2" ? 700 : 400,
          color: w === "duo2" ? duo2Color.text : "#2D2D2D99",
        }}
      >
        <span className="truncate">{match.duo2?.name ?? "—"}</span>
        {match.completed && (
          <span className="ml-2 tabular-nums font-black shrink-0">{match.score2}</span>
        )}
      </div>
      {/* Not played yet */}
      {!match.completed && (
        <div className="text-center text-[10px] text-charcoal/30 font-medium py-1 bg-charcoal/3 border-t border-charcoal/8">
          À venir
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────

export default function BouillePong() {
  const [duos,       setDuos]       = useState<BPDuo[]>([]);
  const [matches,    setMatches]    = useState<BPMatch[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activePool, setActivePool] = useState<Pool>("A");

  useEffect(() => {
    async function load() {
      const [{ data: duosData }, { data: matchesData }] = await Promise.all([
        supabase
          .from("bp_duos")
          .select("*, festival_team:festival_teams(*)")
          .order("created_at"),
        supabase
          .from("bp_matches")
          .select(`
            *,
            duo1:bp_duos!duo1_id(*, festival_team:festival_teams(*)),
            duo2:bp_duos!duo2_id(*, festival_team:festival_teams(*))
          `)
          .order("created_at"),
      ]);
      setDuos((duosData    ?? []) as unknown as BPDuo[]);
      setMatches((matchesData ?? []) as unknown as BPMatch[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-2xl animate-pulse bg-lavender/20" />
        ))}
      </div>
    );
  }

  // ── pool data ────────────────────────────────────────────────

  const poolDuos    = duos.filter((d) => d.pool === activePool);
  const poolMatches = matches.filter(
    (m) => m.round === "pool" && m.pool === activePool && m.completed
  );

  type Standing = {
    duo: BPDuo;
    wins: number;
    losses: number;
    pf: number;
    pa: number;
  };

  const standings: Standing[] = poolDuos
    .map((duo) => {
      const played = poolMatches.filter(
        (m) => m.duo1_id === duo.id || m.duo2_id === duo.id
      );
      const wins = played.filter(
        (m) =>
          (m.duo1_id === duo.id && m.score1 > m.score2) ||
          (m.duo2_id === duo.id && m.score2 > m.score1)
      ).length;
      const pf = played.reduce(
        (s, m) => s + (m.duo1_id === duo.id ? m.score1 : m.score2),
        0
      );
      const pa = played.reduce(
        (s, m) => s + (m.duo1_id === duo.id ? m.score2 : m.score1),
        0
      );
      return { duo, wins, losses: played.length - wins, pf, pa };
    })
    .sort((a, b) => b.wins - a.wins || (b.pf - b.pa) - (a.pf - a.pa));

  // ── bracket data ─────────────────────────────────────────────

  const quarterMatches = matches.filter((m) => m.round === "quarter");
  const semiMatches    = matches.filter((m) => m.round === "semi");
  const finalMatch     = matches.find((m) => m.round === "final");
  const hasElim        = quarterMatches.length > 0 || semiMatches.length > 0 || finalMatch;

  // ── duos grouped by color ────────────────────────────────────

  const duosByColor = (["red", "pink", "yellow", "white"] as FestivalTeam["color"][])
    .map((color) => ({ color, duos: duos.filter((d) => d.color === color) }))
    .filter((g) => g.duos.length > 0);

  // ── render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Pool tabs ── */}
      <div className="space-y-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-charcoal/40 px-1">
          Phases de poules
        </p>

        <div className="flex gap-2">
          {POOLS.map((pool) => (
            <button
              key={pool}
              onClick={() => setActivePool(pool)}
              className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${
                activePool === pool
                  ? "bg-lavender text-white shadow-sm"
                  : "bg-lavender/20 text-charcoal/60 hover:bg-lavender/30"
              }`}
            >
              Pool {pool}
            </button>
          ))}
        </div>

        {poolDuos.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-charcoal/40">Aucun duo dans cette poule</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Duos in pool */}
            <div className="flex flex-wrap gap-2">
              {poolDuos.map((duo) => (
                <DuoChip key={duo.id} duo={duo} />
              ))}
            </div>

            {/* Pool match results */}
            {poolMatches.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-charcoal/35">
                  Résultats
                </p>
                {poolMatches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-charcoal/8 text-sm"
                  >
                    <DuoChip duo={m.duo1!} />
                    <span className="font-black tabular-nums text-charcoal/70">
                      {m.score1} : {m.score2}
                    </span>
                    <DuoChip duo={m.duo2!} />
                  </div>
                ))}
              </div>
            )}

            {/* Pool standings */}
            <div className="rounded-2xl overflow-hidden border border-charcoal/8">
              <div className="grid grid-cols-5 px-3 py-1.5 bg-charcoal/4 text-[10px] font-extrabold uppercase tracking-widest text-charcoal/40">
                <span className="col-span-2">Duo</span>
                <span className="text-center">V</span>
                <span className="text-center">D</span>
                <span className="text-center">+/-</span>
              </div>
              {standings.map((s, i) => {
                const c = tc(s.duo.color);
                return (
                  <div
                    key={s.duo.id}
                    className="grid grid-cols-5 px-3 py-2.5 border-t border-charcoal/6 items-center"
                    style={{ background: i % 2 === 0 ? "white" : "#FFF8F0" }}
                  >
                    <span
                      className="col-span-2 text-xs font-semibold truncate"
                      style={{ color: c.text }}
                    >
                      {s.duo.name}
                    </span>
                    <span className="text-center text-xs font-black text-[#3a8c78]">{s.wins}</span>
                    <span className="text-center text-xs font-black text-charcoal/40">{s.losses}</span>
                    <span className="text-center text-xs font-bold tabular-nums text-charcoal/60">
                      {s.pf - s.pa > 0 ? "+" : ""}{s.pf - s.pa}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Bracket ── */}
      {hasElim && (
        <div className="space-y-3">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-charcoal/40 px-1">
            Élimination directe
          </p>
          <div className="grid grid-cols-3 gap-3 items-center">
            {/* Quarter-finals */}
            <div className="space-y-2">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-charcoal/35 text-center">
                Quarts
              </p>
              {quarterMatches.length === 0 ? (
                <p className="text-xs text-charcoal/30 text-center py-2">À venir</p>
              ) : (
                quarterMatches.map((m) => <MatchBox key={m.id} match={m} />)
              )}
            </div>

            {/* Semi-finals */}
            <div className="space-y-2">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-charcoal/35 text-center">
                Demis
              </p>
              {semiMatches.length === 0 ? (
                <p className="text-xs text-charcoal/30 text-center py-2">À venir</p>
              ) : (
                semiMatches.map((m) => <MatchBox key={m.id} match={m} />)
              )}
            </div>

            {/* Final */}
            <div className="space-y-2">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-charcoal/35 text-center">
                Finale 🏆
              </p>
              {!finalMatch ? (
                <p className="text-xs text-charcoal/30 text-center py-2">À venir</p>
              ) : (
                <MatchBox match={finalMatch} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Duos list ── */}
      {duos.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-charcoal/40 px-1">
            Duos inscrits
          </p>
          {duosByColor.map(({ color, duos: colorDuos }) => {
            const c = tc(color);
            return (
              <div key={color} className="space-y-1.5">
                <p className="text-xs font-bold px-1" style={{ color: c.text }}>
                  {COLOR_LABELS[color]}
                  <span className="ml-1.5 font-normal text-charcoal/40">
                    ({colorDuos.length} duo{colorDuos.length !== 1 ? "s" : ""})
                  </span>
                </p>
                {colorDuos.map((duo) => (
                  <div
                    key={duo.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl border text-sm"
                    style={{ background: c.bg, borderColor: c.border }}
                  >
                    <span className="font-semibold" style={{ color: c.text }}>{duo.name}</span>
                    {duo.pool && (
                      <span className="text-xs font-bold text-charcoal/40">
                        Pool {duo.pool}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {duos.length === 0 && (
        <div className="py-8 text-center space-y-2">
          <p className="text-3xl">🏓</p>
          <p className="text-sm text-charcoal/40">Aucun duo inscrit pour l&apos;instant</p>
        </div>
      )}

    </div>
  );
}
