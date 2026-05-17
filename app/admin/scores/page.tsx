"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import type { BPDuo, BPMatch, FestivalTeam, ScoreEvent } from "@/lib/types";
import { CATEGORY_LABELS, TEAM_COLORS } from "@/lib/types";
import CustomSelect from "@/components/ui/CustomSelect";

// ── constants ─────────────────────────────────────────────────

const POINT_PRESETS: Record<ScoreEvent["category"], number[]> = {
  bingo_bouillet:   [1, 2, 5],
  bouille_pong:     [10, 15, 20],
  capture_the_flag: [10, 15, 20],
  alcolympics:      [10],
  cocktail_contest: [10, 15, 20],
  happening:        [5, 10, 15],
  costume_contest:  [2, 5, 10],
};

const POOLS = ["A", "B", "C", "D"] as const;
const ROUNDS: { value: BPMatch["round"]; label: string }[] = [
  { value: "pool",    label: "Phase de poules" },
  { value: "quarter", label: "Quart de finale"  },
  { value: "semi",    label: "Demi-finale"       },
  { value: "final",   label: "Finale"            },
];

// ── helpers ───────────────────────────────────────────────────

function tc(color: FestivalTeam["color"]) {
  return TEAM_COLORS[color] ?? TEAM_COLORS.white;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
}

const inputCls =
  "w-full rounded-2xl border border-[#2D2D2D]/10 bg-white px-4 py-2.5 text-sm text-[#2D2D2D] " +
  "placeholder:text-[#2D2D2D]/30 focus:outline-none focus:ring-2 focus:ring-[#F4A7B9]/50";

const labelCls =
  "block text-[11px] font-extrabold uppercase tracking-widest text-[#2D2D2D]/40 mb-1.5";

// ── component ─────────────────────────────────────────────────

export default function AdminScoresPage() {
  const { user } = useAuth();

  // ── data ────────────────────────────────────────────────────
  const [teams,         setTeams]         = useState<FestivalTeam[]>([]);
  const [events,        setEvents]        = useState<ScoreEvent[]>([]);
  const [duos,          setDuos]          = useState<BPDuo[]>([]);
  const [matches,       setMatches]       = useState<BPMatch[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [scoresVisible, setScoresVisible] = useState(true);

  // ── add-points form ─────────────────────────────────────────
  const [selTeamId,  setSelTeamId]  = useState<string | null>(null);
  const [selCat,     setSelCat]     = useState<ScoreEvent["category"]>("bingo_bouillet");
  const [selPts,     setSelPts]     = useState<number>(1);
  const [description, setDescription] = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  // ── bp: add duo form ────────────────────────────────────────
  const [duoName,    setDuoName]    = useState("");
  const [duoTeamId,  setDuoTeamId]  = useState<string | null>(null);
  const [duoPool,    setDuoPool]    = useState<string>("A");
  const [duoAdding,  setDuoAdding]  = useState(false);

  // ── bp: add match form ──────────────────────────────────────
  const [mDuo1,   setMDuo1]   = useState("");
  const [mDuo2,   setMDuo2]   = useState("");
  const [mScore1, setMScore1] = useState(0);
  const [mScore2, setMScore2] = useState(0);
  const [mRound,  setMRound]  = useState<BPMatch["round"]>("pool");
  const [mPool,   setMPool]   = useState<string>("A");
  const [mAdding, setMAdding] = useState(false);

  // ── toast ────────────────────────────────────────────────────
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }

  // ── load ─────────────────────────────────────────────────────
  const load = useCallback(async () => {
    const [
      { data: teamsData },
      { data: eventsData },
      { data: duosData },
      { data: matchesData },
    ] = await Promise.all([
      supabase.from("festival_teams").select("*").order("name"),
      supabase
        .from("score_events")
        .select("*, team:festival_teams(*)")
        .order("created_at", { ascending: false }),
      supabase.from("bp_duos").select("*, festival_team:festival_teams(*)").order("pool").order("name"),
      supabase
        .from("bp_matches")
        .select(`*, duo1:bp_duos!duo1_id(*, festival_team:festival_teams(*)), duo2:bp_duos!duo2_id(*, festival_team:festival_teams(*))`)
        .order("created_at", { ascending: false }),
    ]);
    setTeams((teamsData ?? []) as FestivalTeam[]);
    setEvents((eventsData ?? []) as unknown as ScoreEvent[]);
    setDuos((duosData ?? []) as unknown as BPDuo[]);
    setMatches((matchesData ?? []) as unknown as BPMatch[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Fetch scores_visible once on mount (not part of load() so it
  // doesn't reset on every data mutation)
  useEffect(() => {
    supabase
      .from("settings")
      .select("value")
      .eq("key", "scores_visible")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setScoresVisible(data.value !== "false");
      });
  }, []);

  // ── handlers ─────────────────────────────────────────────────

  async function handleToggleScores() {
    const next = !scoresVisible;
    setScoresVisible(next);
    const { error } = await supabase
      .from("settings")
      .upsert({ key: "scores_visible", value: String(next) }, { onConflict: "key" });
    if (error) {
      setScoresVisible(!next);
      showToast("Erreur : " + error.message);
    } else {
      showToast(next ? "Page Scores visible pour tous ✅" : "Page Scores masquée 🙈");
    }
  }

  function handleCategoryChange(cat: ScoreEvent["category"]) {
    setSelCat(cat);
    setSelPts(POINT_PRESETS[cat][0]);
  }

  async function handleAddPoints() {
    if (!selTeamId || !selPts) return;
    setSubmitting(true);
    const team = teams.find((t) => t.id === selTeamId);
    const { error } = await supabase.from("score_events").insert({
      team_id:     selTeamId,
      points:      selPts,
      category:    selCat,
      description: description.trim() || null,
      added_by:    user?.id ?? null,
    });
    setSubmitting(false);
    if (error) { showToast("Erreur ❌"); return; }
    showToast(`${team?.emoji ?? "🏆"} ${team?.name ?? "Équipe"} +${selPts} pts 🏆`);
    setDescription("");
    await load();
  }

  async function handleDeleteEvent(id: string) {
    await supabase.from("score_events").delete().eq("id", id);
    await load();
  }

  async function handleAddDuo() {
    if (!duoName.trim() || !duoTeamId) return;
    setDuoAdding(true);
    const team = teams.find((t) => t.id === duoTeamId);
    const { error } = await supabase.from("bp_duos").insert({
      name:             duoName.trim(),
      festival_team_id: duoTeamId,
      color:            team?.color ?? "white",
      pool:             duoPool,
    });
    setDuoAdding(false);
    if (error) { showToast("Erreur ❌"); return; }
    showToast(`Duo "${duoName.trim()}" créé 🏓`);
    setDuoName("");
    await load();
  }

  async function handleDeleteDuo(id: string) {
    await supabase.from("bp_duos").delete().eq("id", id);
    await load();
  }

  async function handleAddMatch() {
    if (!mDuo1 || !mDuo2 || mDuo1 === mDuo2) return;
    setMAdding(true);
    const { error } = await supabase.from("bp_matches").insert({
      duo1_id:   mDuo1,
      duo2_id:   mDuo2,
      score1:    mScore1,
      score2:    mScore2,
      round:     mRound,
      pool:      mRound === "pool" ? mPool : null,
      completed: true,
    });
    setMAdding(false);
    if (error) { showToast("Erreur ❌"); return; }
    showToast("Match enregistré 🏓");
    setMDuo1(""); setMDuo2(""); setMScore1(0); setMScore2(0);
    await load();
  }

  async function handleDeleteMatch(id: string) {
    await supabase.from("bp_matches").delete().eq("id", id);
    await load();
  }

  // ── render ────────────────────────────────────────────────────

  return (
    <div className="space-y-10">

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full shadow-lg text-sm font-bold whitespace-nowrap"
          style={{ background: "#F4A7B9", color: "#2D2D2D" }}
        >
          {toast}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VISIBILITY TOGGLE
      ══════════════════════════════════════════════════════ */}
      <section>
        <div className="rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4" style={{ background: "white" }}>
          <div>
            <p className="font-bold text-base" style={{ color: "#2D2D2D" }}>Page Scores 🏆</p>
            <p className="text-xs mt-0.5" style={{ color: "#2D2D2D55" }}>
              Visible ou masquée pour les participants
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleScores}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95"
            style={{
              background: scoresVisible ? "#B8E4D8" : "#F4A7B922",
              color: "#2D2D2D",
            }}
          >
            {scoresVisible ? "Visible ✅" : "Masquée 🙈"}
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — ADD POINTS
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
          Ajouter des points 🏆
        </h2>

        <div className="rounded-3xl p-5 space-y-5 shadow-sm" style={{ background: "white" }}>

          {/* Team selector */}
          <div>
            <label className={labelCls}>Équipe</label>
            {loading ? (
              <div className="flex gap-2">
                {[0,1,2,3].map((i) => (
                  <div key={i} className="flex-1 h-10 rounded-full animate-pulse" style={{ background: "#F4A7B933" }} />
                ))}
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {teams.map((team) => {
                  const c = tc(team.color);
                  const selected = selTeamId === team.id;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelTeamId(team.id)}
                      className="flex-1 min-w-[80px] rounded-full py-2 px-3 text-sm font-bold border transition-all"
                      style={{
                        background:  selected ? c.bg : "white",
                        color:       selected ? c.text : "#2D2D2D66",
                        borderColor: selected ? c.border : "#2D2D2D15",
                        boxShadow:   selected ? `0 0 0 2px ${c.border}` : "none",
                      }}
                    >
                      {team.emoji} {team.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Catégorie</label>
            <CustomSelect
              value={selCat}
              onChange={(v) => handleCategoryChange(v as ScoreEvent["category"])}
              options={(Object.entries(CATEGORY_LABELS) as [ScoreEvent["category"], string][]).map(
                ([key, label]) => ({ value: key, label })
              )}
            />
          </div>

          {/* Points presets */}
          <div>
            <label className={labelCls}>Points</label>
            <div className="flex gap-2 flex-wrap">
              {POINT_PRESETS[selCat].map((pts) => (
                <button
                  key={pts}
                  type="button"
                  onClick={() => setSelPts(pts)}
                  className="flex-1 rounded-full py-2 text-sm font-bold border transition-all"
                  style={{
                    background:  selPts === pts ? "#F4A7B9" : "white",
                    color:       selPts === pts ? "#2D2D2D" : "#2D2D2D66",
                    borderColor: selPts === pts ? "#F4A7B9" : "#2D2D2D15",
                  }}
                >
                  {pts} pt{pts > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description (optionnel)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Victoire Bouille Pong Finale 🏆"
              maxLength={120}
              className={inputCls}
              style={{ fontSize: 16 }}
            />
          </div>

          <button
            type="button"
            onClick={handleAddPoints}
            disabled={!selTeamId || !selPts || submitting}
            className="w-full rounded-full py-3.5 text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#F4A7B9", color: "#2D2D2D" }}
          >
            {submitting ? "Ajout…" : "Ajouter 🏆"}
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — POINTS HISTORY
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
          Historique des points
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[0,1,2].map((i) => (
              <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "#F4A7B922" }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: "#2D2D2D44" }}>
            Aucun point ajouté pour l&apos;instant 🌸
          </p>
        ) : (
          <div className="rounded-3xl overflow-hidden border border-[#2D2D2D]/8">
            {events.map((e, i) => {
              const c = tc(e.team?.color ?? "white");
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#2D2D2D]/6 last:border-0 border-l-4"
                  style={{
                    background: i % 2 === 0 ? "white" : "#FFF8F0",
                    borderLeftColor: c.border,
                  }}
                >
                  <span className="text-lg shrink-0">{e.team?.emoji ?? "🏆"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: "#2D2D2D" }}>
                        {e.team?.name ?? "Équipe"}
                      </span>
                      <span
                        className="text-xs font-black px-1.5 py-0.5 rounded-full tabular-nums"
                        style={{ background: c.bg, color: c.text }}
                      >
                        +{e.points} pts
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#2D2D2D66" }}>
                      {CATEGORY_LABELS[e.category]}
                      {e.description && ` · ${e.description}`}
                    </p>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: "#2D2D2D40" }}>
                    {e.created_at ? timeAgo(e.created_at) : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(e.id)}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors"
                    style={{ background: "#F4A7B922", color: "#2D2D2D55" }}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — BOUILLE PONG MANAGER
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        <h2 className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
          Gérer le Bouille Pong 🏓
        </h2>

        {/* ── Add duo ── */}
        <div className="rounded-3xl p-5 space-y-4 shadow-sm" style={{ background: "white" }}>
          <p className="text-sm font-bold" style={{ color: "#2D2D2D" }}>Créer un duo</p>

          <div>
            <label className={labelCls}>Nom du duo</label>
            <input
              type="text"
              value={duoName}
              onChange={(e) => setDuoName(e.target.value)}
              placeholder="Ex: Les Flammes"
              maxLength={40}
              className={inputCls}
              style={{ fontSize: 16 }}
            />
          </div>

          <div>
            <label className={labelCls}>Équipe festival</label>
            <div className="flex gap-2 flex-wrap">
              {teams.map((team) => {
                const c = tc(team.color);
                const sel = duoTeamId === team.id;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setDuoTeamId(team.id)}
                    className="flex-1 min-w-[72px] rounded-full py-2 px-3 text-xs font-bold border transition-all"
                    style={{
                      background:  sel ? c.bg : "white",
                      color:       sel ? c.text : "#2D2D2D66",
                      borderColor: sel ? c.border : "#2D2D2D15",
                      boxShadow:   sel ? `0 0 0 2px ${c.border}` : "none",
                    }}
                  >
                    {team.emoji} {team.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelCls}>Poule</label>
            <div className="flex gap-2">
              {POOLS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDuoPool(p)}
                  className="flex-1 rounded-full py-2 text-sm font-bold border transition-all"
                  style={{
                    background:  duoPool === p ? "#C9B8E8" : "white",
                    color:       duoPool === p ? "#2D2D2D" : "#2D2D2D55",
                    borderColor: duoPool === p ? "#C9B8E8" : "#2D2D2D15",
                  }}
                >
                  Pool {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddDuo}
            disabled={!duoName.trim() || !duoTeamId || duoAdding}
            className="w-full rounded-full py-3 text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "#C9B8E8", color: "#2D2D2D" }}
          >
            {duoAdding ? "Création…" : "+ Créer ce duo 🏓"}
          </button>
        </div>

        {/* ── Existing duos ── */}
        {duos.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-widest px-1" style={{ color: "#2D2D2D55" }}>
              Duos inscrits ({duos.length})
            </p>
            {(["A","B","C","D"] as const).map((pool) => {
              const poolDuos = duos.filter((d) => d.pool === pool);
              if (!poolDuos.length) return null;
              return (
                <div key={pool}>
                  <p className="text-xs font-bold px-1 mb-1" style={{ color: "#2D2D2D55" }}>
                    Pool {pool}
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-[#2D2D2D]/8">
                    {poolDuos.map((duo, i) => {
                      const c = tc(duo.color);
                      return (
                        <div
                          key={duo.id}
                          className="flex items-center gap-3 px-3 py-2.5 border-b border-[#2D2D2D]/6 last:border-0"
                          style={{ background: i % 2 === 0 ? "white" : "#FFF8F0" }}
                        >
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full border shrink-0"
                            style={{ background: c.bg, color: c.text, borderColor: c.border }}
                          >
                            {duo.festival_team?.emoji ?? ""} {duo.festival_team?.name ?? ""}
                          </span>
                          <span className="flex-1 text-sm font-semibold" style={{ color: "#2D2D2D" }}>
                            {duo.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteDuo(duo.id)}
                            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                            style={{ background: "#F4A7B922", color: "#2D2D2D55" }}
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Add match result ── */}
        <div className="rounded-3xl p-5 space-y-4 shadow-sm" style={{ background: "white" }}>
          <p className="text-sm font-bold" style={{ color: "#2D2D2D" }}>Enregistrer un match</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Duo 1</label>
              <CustomSelect
                value={mDuo1}
                onChange={setMDuo1}
                options={duos.map((d) => ({ value: d.id, label: d.name }))}
                placeholder="— Choisir —"
              />
            </div>
            <div>
              <label className={labelCls}>Duo 2</label>
              <CustomSelect
                value={mDuo2}
                onChange={setMDuo2}
                options={duos.map((d) => ({ value: d.id, label: d.name }))}
                placeholder="— Choisir —"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Score Duo 1</label>
              <input
                type="number"
                min={0}
                value={mScore1}
                onChange={(e) => setMScore1(Number(e.target.value))}
                className={inputCls}
                style={{ fontSize: 16 }}
              />
            </div>
            <div>
              <label className={labelCls}>Score Duo 2</label>
              <input
                type="number"
                min={0}
                value={mScore2}
                onChange={(e) => setMScore2(Number(e.target.value))}
                className={inputCls}
                style={{ fontSize: 16 }}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Phase</label>
            <CustomSelect
              value={mRound}
              onChange={(v) => setMRound(v as BPMatch["round"])}
              options={ROUNDS.map((r) => ({ value: r.value, label: r.label }))}
            />
          </div>

          {mRound === "pool" && (
            <div>
              <label className={labelCls}>Poule</label>
              <div className="flex gap-2">
                {POOLS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMPool(p)}
                    className="flex-1 rounded-full py-2 text-sm font-bold border transition-all"
                    style={{
                      background:  mPool === p ? "#C9B8E8" : "white",
                      color:       mPool === p ? "#2D2D2D" : "#2D2D2D55",
                      borderColor: mPool === p ? "#C9B8E8" : "#2D2D2D15",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddMatch}
            disabled={!mDuo1 || !mDuo2 || mDuo1 === mDuo2 || mAdding}
            className="w-full rounded-full py-3 text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "#C9B8E8", color: "#2D2D2D" }}
          >
            {mAdding ? "Enregistrement…" : "Enregistrer 🏓"}
          </button>
        </div>

        {/* ── Match results list ── */}
        {matches.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-widest px-1" style={{ color: "#2D2D2D55" }}>
              Matchs enregistrés ({matches.length})
            </p>
            <div className="rounded-3xl overflow-hidden border border-[#2D2D2D]/8">
              {matches.map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#2D2D2D]/6 last:border-0"
                  style={{ background: i % 2 === 0 ? "white" : "#FFF8F0" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "#2D2D2D" }}>
                      {m.duo1?.name ?? "—"}
                      <span className="font-black tabular-nums mx-2" style={{ color: "#F4A7B9" }}>
                        {m.score1} : {m.score2}
                      </span>
                      {m.duo2?.name ?? "—"}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#2D2D2D55" }}>
                      {ROUNDS.find((r) => r.value === m.round)?.label}
                      {m.pool && ` · Pool ${m.pool}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMatch(m.id)}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                    style={{ background: "#F4A7B922", color: "#2D2D2D55" }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
