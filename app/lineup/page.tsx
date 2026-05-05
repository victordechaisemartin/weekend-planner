import { supabase } from "@/lib/supabase";
import type { DJ } from "@/lib/types";
import FlowerDivider from "@/components/ui/FlowerDivider";
import DJCard from "@/components/features/lineup/DJCard";

export const revalidate = 300;

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
        <h1 className="text-[2rem] font-black tracking-tighter text-charcoal leading-none uppercase">
          Lolapabouillet
        </h1>
        <p className="text-xl font-bold text-charcoal/75 tracking-wide">
          🎧 Lineup 🌸
        </p>
        <p className="text-xs font-semibold text-charcoal/35 uppercase tracking-[0.2em] pt-1">
          30 May 2026 · Orphin
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

export default async function LineupPage() {
  const { data } = await supabase
    .from("djs")
    .select("*")
    .order("set_time", { ascending: true, nullsFirst: false });

  const djs: DJ[] = data ?? [];
  const revealed = djs.filter((d) => d.revealed);
  const hidden = djs.filter((d) => !d.revealed);

  return (
    <div className="min-h-screen bg-cream">
      <GarlandHeader />

      <div className="px-4 pb-10 space-y-6">
        {djs.length === 0 && (
          <div className="py-16 text-center space-y-2">
            <p className="text-4xl">🎧</p>
            <p className="text-sm text-charcoal/40">Lineup dropping soon. Stay tuned! 🌸</p>
          </div>
        )}

        {/* Revealed DJs */}
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

        {/* Divider between revealed and hidden */}
        {revealed.length > 0 && hidden.length > 0 && (
          <FlowerDivider />
        )}

        {/* Unrevealed DJs */}
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
    </div>
  );
}
