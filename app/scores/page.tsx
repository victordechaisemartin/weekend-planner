"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FestivalTeam, ScoreEvent } from "@/lib/types";
import { CATEGORY_LABELS, TEAM_COLORS } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import BouillePong from "@/components/features/scores/BouillePong";

// ── types ─────────────────────────────────────────────────────

type TeamTotal = FestivalTeam & { total: number };
type Tab = "classement" | "bouille_pong";

// ── helpers ───────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

function teamColors(color: FestivalTeam["color"]) {
  return TEAM_COLORS[color] ?? TEAM_COLORS.white;
}

// ── component ─────────────────────────────────────────────────

export default function ScoresPage() {
  const [tab,     setTab]     = useState<Tab>("classement");
  const [teams,   setTeams]   = useState<TeamTotal[]>([]);
  const [events,  setEvents]  = useState<ScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: teamsData }, { data: eventsData }] = await Promise.all([
      supabase.from("festival_teams").select("*"),
      supabase
        .from("score_events")
        .select("*, team:festival_teams(*)")
        .order("created_at", { ascending: false }),
    ]);

    const rawEvents = (eventsData ?? []) as unknown as ScoreEvent[];
    const rawTeams  = (teamsData  ?? []) as FestivalTeam[];

    const totals: TeamTotal[] = rawTeams
      .map((team) => ({
        ...team,
        total: rawEvents
          .filter((e) => e.team_id === team.id)
          .reduce((sum, e) => sum + e.points, 0),
      }))
      .sort((a, b) => b.total - a.total);

    setTeams(totals);
    setEvents(rawEvents);
    setLoading(false);
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("scores")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "score_events" },
        () => load()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── podium ────────────────────────────────────────────────────

  const [first, second, third, ...rest] = teams;

  // ── render ────────────────────────────────────────────────────

  return (
    <>
      <PageHeader title="🏆 Scores" subtitle="Qui va gagner ?" />

      {/* Tab switcher */}
      <div className="flex gap-2 px-4 pb-3">
        {(["classement", "bouille_pong"] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = {
            classement:  "🏆 Classement",
            bouille_pong: "🏓 Bouille Pong",
          };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                tab === t
                  ? "bg-pink text-white shadow-[0_4px_14px_0_rgba(244,167,185,0.45)]"
                  : "border border-pink text-pink bg-transparent hover:bg-pink/10"
              }`}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-28 space-y-6">

        {/* ── TAB 1: Classement ── */}
        {tab === "classement" && (
          <>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-24 rounded-3xl animate-pulse bg-pink/15" />
                ))}
              </div>
            ) : teams.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-4xl">🏆</p>
                <p className="text-sm text-charcoal/40">Aucune équipe encore</p>
              </div>
            ) : (
              <>
                {/* ── Podium ── */}
                <div className="flex items-end justify-center gap-3 pt-2">
                  {/* 2nd place */}
                  {second && (
                    <PodiumCard team={second} medal="🥈" height="h-28" />
                  )}
                  {/* 1st place */}
                  {first && (
                    <PodiumCard team={first} medal="👑" height="h-36" />
                  )}
                  {/* 3rd place */}
                  {third && (
                    <PodiumCard team={third} medal="🥉" height="h-24" />
                  )}
                </div>

                {/* ── Full ranking (4th onwards) ── */}
                {rest.length > 0 && (
                  <div className="rounded-3xl overflow-hidden border border-charcoal/8">
                    {rest.map((team, i) => {
                      const c = teamColors(team.color);
                      return (
                        <div
                          key={team.id}
                          className="flex items-center gap-3 px-4 py-3 border-b border-charcoal/6 last:border-0"
                          style={{ background: i % 2 === 0 ? "white" : "#FFF8F0" }}
                        >
                          <span className="text-sm font-black text-charcoal/30 w-5 text-center tabular-nums">
                            {i + 4}
                          </span>
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                            style={{ background: c.bg, border: `1px solid ${c.border}` }}
                          >
                            {team.emoji}
                          </span>
                          <span className="flex-1 text-sm font-semibold text-charcoal">
                            {team.name}
                          </span>
                          <span
                            className="text-base font-black tabular-nums"
                            style={{ color: c.text }}
                          >
                            {team.total} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Points history ── */}
                {events.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-charcoal/40 px-1">
                      Historique
                    </p>
                    <div className="rounded-3xl overflow-hidden border border-charcoal/8">
                      {events.map((e, i) => {
                        const c = teamColors(e.team?.color ?? "white");
                        return (
                          <div
                            key={e.id}
                            className="flex items-start gap-3 px-4 py-3 border-b border-charcoal/6 last:border-0 border-l-4"
                            style={{
                              background:  i % 2 === 0 ? "white" : "#FFF8F0",
                              borderLeftColor: c.border,
                            }}
                          >
                            <span className="text-xl leading-tight shrink-0 mt-0.5">
                              {e.team?.emoji ?? "🏆"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-charcoal">
                                  {e.team?.name ?? "Équipe"}
                                </span>
                                <span
                                  className="text-xs font-black tabular-nums px-1.5 py-0.5 rounded-full"
                                  style={{ background: c.bg, color: c.text }}
                                >
                                  +{e.points} pts
                                </span>
                              </div>
                              <p className="text-xs text-charcoal/50 mt-0.5">
                                {CATEGORY_LABELS[e.category]}
                                {e.description && ` · ${e.description}`}
                              </p>
                            </div>
                            <span className="text-[10px] text-charcoal/35 shrink-0 mt-1">
                              {e.created_at ? timeAgo(e.created_at) : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── TAB 2: Bouille Pong ── */}
        {tab === "bouille_pong" && <BouillePong />}
      </div>
    </>
  );
}

// ── PodiumCard ────────────────────────────────────────────────

function PodiumCard({
  team,
  medal,
  height,
}: {
  team: TeamTotal;
  medal: string;
  height: string;
}) {
  const c = TEAM_COLORS[team.color] ?? TEAM_COLORS.white;
  return (
    <div
      className={`flex-1 ${height} rounded-3xl flex flex-col items-center justify-center gap-1 px-2 shadow-sm border`}
      style={{ background: c.bg, borderColor: c.border }}
    >
      <span className="text-xl leading-none">{medal}</span>
      <span className="text-2xl leading-none">{team.emoji}</span>
      <span className="text-[11px] font-bold text-center leading-tight" style={{ color: c.text }}>
        {team.name}
      </span>
      <span className="text-lg font-black tabular-nums leading-tight" style={{ color: c.text }}>
        {team.total}
        <span className="text-[10px] font-semibold ml-0.5">pts</span>
      </span>
    </div>
  );
}
