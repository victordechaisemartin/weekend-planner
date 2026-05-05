import type { DJ } from "@/lib/types";

type Props = { dj: DJ };

function formatSetTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Revealed card ─────────────────────────────────────────────

function RevealedCard({ dj }: { dj: DJ }) {
  const setTime = formatSetTime(dj.set_time);

  return (
    <article className="relative rounded-3xl overflow-hidden border border-white/60 shadow-[0_4px_20px_0_rgba(244,167,185,0.18)] flex flex-col items-center text-center bg-gradient-to-br from-pink/30 via-pink/10 to-lavender/30 p-5 gap-3">
      {/* Shimmer accent */}
      <div className="absolute inset-0 bg-gradient-to-t from-lavender/10 to-transparent pointer-events-none" />

      {/* Photo with flower crown */}
      <div className="relative mt-1">
        <span
          className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl leading-none select-none z-10"
          aria-hidden
        >
          🌺
        </span>
        <div className="w-24 h-24 rounded-full overflow-hidden ring-[3px] ring-white/80 shadow-md">
          {dj.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dj.photo_url}
              alt={dj.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink/40 to-lavender/40 flex items-center justify-center text-3xl">
              🎧
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <p className="text-base font-extrabold text-charcoal tracking-tight leading-tight z-10">
        {dj.name}
      </p>

      {/* Hype / bio */}
      {dj.bio && (
        <p className="text-xs italic text-charcoal/60 leading-relaxed line-clamp-2 z-10">
          &ldquo;{dj.bio}&rdquo;
        </p>
      )}

      {/* Set time badge */}
      {setTime && (
        <span className="inline-flex items-center gap-1 rounded-full border border-mint/45 bg-mint/30 px-3 py-1 text-[11px] font-extrabold text-[#3a8c78] z-10">
          🕐 {setTime}
        </span>
      )}
    </article>
  );
}

// ── Unrevealed card ───────────────────────────────────────────

function UnrevealedCard({ dj }: { dj: DJ }) {
  const setTime = formatSetTime(dj.set_time);

  return (
    <article className="relative rounded-3xl overflow-hidden border border-charcoal/10 shadow-[0_2px_12px_0_rgba(45,45,45,0.07)] flex flex-col items-center text-center bg-gradient-to-br from-charcoal/6 via-charcoal/3 to-charcoal/8 p-5 gap-3">

      {/* Blurred photo circle */}
      <div className="relative mt-1 w-24 h-24">
        <div className="w-24 h-24 rounded-full overflow-hidden ring-[3px] ring-white/40 shadow-sm bg-charcoal/10">
          {dj.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dj.photo_url}
              alt="Mystery DJ"
              className="w-full h-full object-cover blur-xl scale-125 opacity-25"
            />
          )}
        </div>
        {/* Flower overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center text-3xl select-none"
          aria-hidden
        >
          🌸
        </div>
      </div>

      {/* Mystery name */}
      <p className="text-2xl font-extrabold text-charcoal/25 tracking-widest">
        ???
      </p>

      {/* Genre hint */}
      {dj.bio && (
        <p className="text-[11px] text-charcoal/35 italic leading-relaxed line-clamp-2">
          {dj.bio}
        </p>
      )}

      {/* Coming soon badge */}
      <span className="inline-flex items-center gap-1 rounded-full border border-yellow/55 bg-yellow/45 px-3 py-1 text-[11px] font-extrabold text-[#8a6d00]">
        🌼 Reveal coming soon…
      </span>

      {/* Set time if known */}
      {setTime && (
        <span className="text-[10px] font-semibold text-charcoal/30 uppercase tracking-widest">
          {setTime}
        </span>
      )}
    </article>
  );
}

// ── Export ────────────────────────────────────────────────────

export default function DJCard({ dj }: Props) {
  return dj.revealed ? <RevealedCard dj={dj} /> : <UnrevealedCard dj={dj} />;
}
