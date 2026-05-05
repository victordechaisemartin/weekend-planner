"use client";

import type { Tent } from "@/lib/types";
import { cn } from "@/lib/utils";
import PastelButton from "@/components/ui/PastelButton";

export type Guest = { id: string; name: string; snoring_warning: boolean };

export type TentData = Tent & {
  host: { id: string; name: string };
  guests: Guest[];
};

type Props = {
  tent: TentData;
  currentUserId: string | null;
  onJoin: (tentId: string) => void;
  onLeave: (tentId: string) => void;
  onRemoveGuest: (tentId: string, guestId: string) => void;
  busy: boolean;
};

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
    card: "bg-yellow/25 border-yellow/40",
    typeBadge: "bg-yellow/50 text-[#8a6d00] border-yellow/55",
  },
};

const TYPE_ICONS: Record<string, string> = { Tent: "⛺", Van: "🚐", Room: "🏠" };

function fallbackStyles(type: string) {
  return TYPE_STYLES[type] ?? TYPE_STYLES.Tent;
}

export default function TentCard({
  tent,
  currentUserId,
  onJoin,
  onLeave,
  onRemoveGuest,
  busy,
}: Props) {
  const styles = fallbackStyles(tent.type);
  const freeSpots = tent.capacity - 1 - tent.guests.length; // capacity minus host minus guests
  const isFull = freeSpots <= 0;
  const isHost = tent.host_id === currentUserId;
  const isGuest = tent.guests.some((g) => g.id === currentUserId);

  return (
    <article className={cn("rounded-3xl border p-5 space-y-4", styles.card)}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-bold text-charcoal">
            🏕️ {tent.host.name}
          </p>
          <p className="text-xs text-charcoal/50 mt-0.5 truncate">{tent.name}</p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
              styles.typeBadge
            )}
          >
            {TYPE_ICONS[tent.type] ?? "⛺"} {tent.type}
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
        {/* Host — always filled */}
        <div
          title={`${tent.host.name} (host)`}
          className="w-9 h-9 rounded-xl bg-white/55 flex items-center justify-center text-base select-none"
        >
          🌸
        </div>

        {/* Guests — filled */}
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-charcoal">{tent.host.name}</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-charcoal/30">
            host
          </span>
        </div>

        {/* Guest rows */}
        {tent.guests.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-charcoal truncate">{g.name}</span>
              {g.snoring_warning && (
                <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full border border-yellow/55 bg-yellow/40 px-2 py-0.5 text-[10px] font-semibold text-[#8a6d00]">
                  😴 Snores
                </span>
              )}
            </div>

            {isHost && (
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
      {isHost ? (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/30">
          Your tent 🏕️
        </p>
      ) : isGuest ? (
        <PastelButton
          variant="lavender"
          onClick={() => onLeave(tent.id)}
          disabled={busy}
          className="text-xs py-2 px-5"
        >
          Leave
        </PastelButton>
      ) : !isFull ? (
        <PastelButton
          variant="lavender"
          onClick={() => onJoin(tent.id)}
          disabled={busy}
          className="text-xs py-2 px-5"
        >
          Join 🌼
        </PastelButton>
      ) : null}
    </article>
  );
}
