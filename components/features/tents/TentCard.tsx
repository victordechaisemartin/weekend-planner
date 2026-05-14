"use client";

import { useState } from "react";
import type { Tent } from "@/lib/types";
import { cn } from "@/lib/utils";
import PastelButton from "@/components/ui/PastelButton";

export type Guest = { id: string; name: string; snoring_warning: boolean };

export type TentData = Tent & {
  host: { id: string; name: string; snoring_warning: boolean };
  guests: Guest[];
};

type Props = {
  tent: TentData;
  currentUserId: string | null;
  isAdmin?: boolean;
  onJoin: (tentId: string) => void;
  onLeave: (tentId: string) => void;
  onRemoveGuest: (tentId: string, guestId: string) => void;
  onEdit: (tentId: string, capacity: number) => Promise<void>;
  onDelete: (tentId: string) => Promise<void>;
  busy: boolean;
};

const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-1.5";

const TYPE_STYLES: Record<string, { card: string; typeBadge: string }> = {
  Tent: {
    card: "bg-lavender/20 border-lavender/30",
    typeBadge: "bg-lavender/35 text-charcoal/70 border-lavender/45",
  },
  Van: {
    card: "bg-mint/20 border-mint/30",
    typeBadge: "bg-mint/40 text-[#3a8c78] border-mint/50",
  },
  Room: {
    card: "bg-pink/10 border-pink/25",
    typeBadge: "bg-pink/30 text-charcoal/70 border-pink/40",
  },
};

const TYPE_LABELS: Record<string, string> = { Tent: "Tent", Van: "Van", Room: "Chambre" };

const TYPE_ICONS: Record<string, string> = { Tent: "⛺", Van: "🚐", Room: "🏠" };

function fallbackStyles(type: string) {
  return TYPE_STYLES[type] ?? TYPE_STYLES.Tent;
}

export default function TentCard({
  tent,
  currentUserId,
  isAdmin = false,
  onJoin,
  onLeave,
  onRemoveGuest,
  onEdit,
  onDelete,
  busy,
}: Props) {
  const styles = fallbackStyles(tent.type);
  const freeSpots = tent.capacity - tent.guests.length;
  const isFull = freeSpots <= 0;
  const isHost = tent.host_id === currentUserId;
  const isGuest = tent.guests.some((g) => g.id === currentUserId);
  const hostIsGuest = tent.guests.some((g) => g.id === tent.host_id);
  const visibleGuests = tent.guests.filter((g) => g.id !== tent.host_id);

  // ── edit state ────────────────────────────────────────────────
  const [editing,       setEditing]       = useState(false);
  const [editCapacity,  setEditCapacity]  = useState(tent.capacity);
  const [editSaving,    setEditSaving]    = useState(false);

  // ── delete state ──────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  function openEdit() {
    setEditCapacity(tent.capacity);
    setEditing(true);
  }

  async function submitEdit() {
    setEditSaving(true);
    await onEdit(tent.id, editCapacity);
    setEditSaving(false);
    setEditing(false);
  }

  async function submitDelete() {
    setDeleting(true);
    await onDelete(tent.id);
    setDeleting(false);
    setConfirmDelete(false);
  }

  return (
    <>
    <article className={cn("rounded-3xl border p-5 space-y-4", styles.card)}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-bold text-charcoal">
            🏕️ {tent.host.name}
          </p>
          <p className="text-xs text-charcoal/50 mt-0.5 truncate">{tent.name}</p>
          {tent.type === "Room" && (
            <p className="text-xs text-charcoal/40 mt-0.5">Ajoutée par l&apos;organisateur</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {(isHost || isAdmin) && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={openEdit}
                title="Modifier"
                className="w-7 h-7 rounded-full bg-charcoal/6 flex items-center justify-center text-sm text-charcoal/50 hover:bg-lavender/40 hover:text-charcoal/80 transition-colors"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Supprimer"
                className="w-7 h-7 rounded-full bg-charcoal/6 flex items-center justify-center text-sm text-charcoal/50 hover:bg-pink/20 hover:text-pink/80 transition-colors"
              >
                🗑️
              </button>
            </div>
          )}

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
              styles.typeBadge
            )}
          >
            {TYPE_ICONS[tent.type] ?? "⛺"} {TYPE_LABELS[tent.type] ?? tent.type}
          </span>

          {isFull ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-pink/30 bg-pink/20 px-2.5 py-0.5 text-[11px] font-semibold text-pink/80">
              🌺 Full
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-mint/40 bg-mint/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#3a8c78]">
              🌼 {freeSpots} spot{freeSpots !== 1 ? "s" : ""} free
            </span>
          )}
        </div>
      </div>

      {/* ── Spot icons ── */}
      <div className="flex flex-wrap gap-2">
        {/* Filled spots — tent_guests only */}
        {tent.guests.map((g) => (
          <div
            key={g.id}
            title={g.name}
            className="w-9 h-9 rounded-xl bg-white/55 flex items-center justify-center text-base select-none"
          >
            🌸
          </div>
        ))}

        {/* Free spots */}
        {Array.from({ length: Math.max(0, freeSpots) }).map((_, i) => (
          <div
            key={i}
            className="w-9 h-9 rounded-xl border-2 border-dashed border-charcoal/15 flex items-center justify-center text-base text-charcoal/20 select-none"
          >
            🌼
          </div>
        ))}
      </div>

      {/* ── Guest list ── */}
      <div className="space-y-2">
        {/* Host row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-charcoal">{tent.host.name}</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-charcoal/30">
            host
          </span>
          {hostIsGuest && tent.host.snoring_warning && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-lavender/40 px-2 py-0.5 text-[10px] font-semibold text-charcoal/60">
              😴 Ronfleur
            </span>
          )}
        </div>

        {/* Guest rows — host filtered out (shown separately above) */}
        {visibleGuests.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-charcoal truncate">{g.name}</span>
              {g.snoring_warning && (
                <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-lavender/40 px-2 py-0.5 text-[10px] font-semibold text-charcoal/60">
                  😴 Ronfleur
                </span>
              )}
            </div>

            {/* ✕ for host or admin — not the host's own guest row */}
            {(isHost || isAdmin) && g.id !== tent.host_id && (
              <button
                onClick={() => onRemoveGuest(tent.id, g.id)}
                disabled={busy}
                aria-label={`Remove ${g.name}`}
                className="shrink-0 w-6 h-6 rounded-full bg-white/50 flex items-center justify-center text-[11px] text-charcoal/35 hover:bg-pink/20 hover:text-pink/80 transition-all disabled:opacity-40"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Action row ── */}
      {isHost && isGuest && (
        <PastelButton
          variant="lavender"
          onClick={() => onLeave(tent.id)}
          disabled={busy}
          className="text-xs py-2 px-5"
        >
          Quitter ma tente
        </PastelButton>
      )}

      {isHost && !isGuest && !isFull && (
        <PastelButton
          variant="lavender"
          onClick={() => onJoin(tent.id)}
          disabled={busy}
          className="text-xs py-2 px-5"
        >
          Rejoindre ma tente 🌸
        </PastelButton>
      )}

      {isHost && !isGuest && isFull && !confirmDelete && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/30">
          Your tent 🏕️
        </p>
      )}

      {!isHost && isGuest && (
        <PastelButton
          variant="lavender"
          onClick={() => onLeave(tent.id)}
          disabled={busy}
          className="text-xs py-2 px-5"
        >
          Leave
        </PastelButton>
      )}

      {!isHost && !isGuest && !isFull && (
        <PastelButton
          variant="lavender"
          onClick={() => onJoin(tent.id)}
          disabled={busy}
          className="text-xs py-2 px-5"
        >
          Join 🌼
        </PastelButton>
      )}

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div className="rounded-2xl bg-pink/10 border border-pink/25 p-4 space-y-3">
          <p className="text-sm font-semibold text-charcoal leading-snug">
            Supprimer ta tente ? Tes invités seront retirés.
          </p>
          <div className="flex gap-2">
            <PastelButton
              variant="pink"
              onClick={submitDelete}
              disabled={deleting}
              className="text-xs py-2 px-4"
            >
              {deleting ? "…" : "Supprimer"}
            </PastelButton>
            <PastelButton
              variant="lavender"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="text-xs py-2 px-4"
            >
              Annuler
            </PastelButton>
          </div>
        </div>
      )}

    </article>

    {/* ── Edit modal ── */}
    {editing && (
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
        <div
          className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
          onClick={() => !editSaving && setEditing(false)}
        />
        <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-cream px-6 pt-5 pb-8 space-y-5 z-[61]">
          <div className="w-10 h-1 rounded-full bg-charcoal/15 mx-auto sm:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal">Modifier la tente ✏️</h2>
            <button
              onClick={() => !editSaving && setEditing(false)}
              className="w-8 h-8 rounded-full bg-charcoal/8 flex items-center justify-center text-charcoal/50 hover:bg-charcoal/12 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Capacité (vous inclus)</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditCapacity((c) => Math.max(1, c - 1))}
                  className="w-9 h-9 rounded-full bg-white/80 border border-white text-charcoal/60 font-bold text-lg hover:bg-white transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center text-xl font-bold text-charcoal tabular-nums">
                  {editCapacity}
                </span>
                <button
                  type="button"
                  onClick={() => setEditCapacity((c) => Math.min(10, c + 1))}
                  className="w-9 h-9 rounded-full bg-white/80 border border-white text-charcoal/60 font-bold text-lg hover:bg-white transition-colors"
                >
                  +
                </button>
                <span className="text-xs text-charcoal/35 font-medium">personnes</span>
              </div>
            </div>
            <PastelButton
              variant="lavender"
              fullWidth
              disabled={editSaving}
              onClick={submitEdit}
            >
              {editSaving ? "Sauvegarde…" : "Sauvegarder 🌸"}
            </PastelButton>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
