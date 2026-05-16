"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { cn } from "@/lib/utils";
import PastelButton from "@/components/ui/PastelButton";

// ── constants ─────────────────────────────────────────────────

const DIETARY_OPTIONS = [
  { key: "vegetarian", label: "🥬 Vegetarian"         },
  { key: "no-pork",    label: "🐷 No pork"            },
  { key: "lactose",    label: "🥛 Lactose intolerant" },
];

const DRINK_LEVELS = [
  { value: 0, label: "None"   },
  { value: 1, label: "Low"    },
  { value: 2, label: "Medium" },
  { value: 3, label: "Heavy"  },
];

const WINE_LEVELS = ["none", "low", "medium", "heavy"] as const;

type PresenceKey =
  | "present_fri_evening"
  | "present_sat_midday"
  | "present_sat_evening"
  | "present_sun_midday"
  | "present_sun_evening"
  | "present_mon_midday";

const PRESENCE_SLOTS: { key: PresenceKey; label: string }[] = [
  { key: "present_fri_evening", label: "Vendredi soir"  },
  { key: "present_sat_midday",  label: "Samedi midi"    },
  { key: "present_sat_evening", label: "Samedi soir"    },
  { key: "present_sun_midday",  label: "Dimanche midi"  },
  { key: "present_sun_evening", label: "Dimanche soir"  },
  { key: "present_mon_midday",  label: "Lundi midi"     },
];

// ── helpers ───────────────────────────────────────────────────

function parseDietary(raw: string | null): string[] {
  return raw?.split(",").filter(Boolean) ?? [];
}

function serializeDietary(s: string[]): string | null {
  return s.length ? s.join(",") : null;
}

function wineToNum(text: string | null): number {
  const idx = WINE_LEVELS.indexOf((text ?? "none") as typeof WINE_LEVELS[number]);
  return idx >= 0 ? idx : 0;
}

function wineToText(n: number): string {
  return WINE_LEVELS[n] ?? "none";
}

// ── DrinkBar ─────────────────────────────────────────────────

function DrinkBar({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-charcoal/50 mb-2">
        {label}
      </label>
      <div className="flex rounded-2xl bg-gray-100 p-0.5 gap-0.5">
        {DRINK_LEVELS.map(({ value: v, label: l }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-150",
              value === v
                ? "bg-lavender text-charcoal shadow-sm"
                : "text-charcoal/40 hover:text-charcoal/65"
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────

const labelCls =
  "block text-[10px] font-extrabold uppercase tracking-[0.15em] text-charcoal/50 mb-2";

const inputCls =
  "w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-charcoal " +
  "placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-pink/30 " +
  "focus:bg-white transition-colors";

// ── page ──────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  // Form fields
  const [name,          setName]          = useState("");
  const [dietary,       setDietary]       = useState<string[]>([]);
  const [beerLevel,     setBeerLevel]     = useState(0);
  const [wineLevel,     setWineLevel]     = useState(0);
  const [spiritsLevel,  setSpiritLevel]   = useState(0);
  const [snoringWarning, setSnoringWarning] = useState(false);
  const [presence, setPresence] = useState<Record<PresenceKey, boolean>>({
    present_fri_evening: false,
    present_sat_midday:  false,
    present_sat_evening: false,
    present_sun_midday:  false,
    present_sun_evening: false,
    present_mon_midday:  false,
  });

  // Data loading
  const [loading, setLoading] = useState(true);

  // Save state
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [nameError, setNameError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [authLoading, user, router]);

  // Fetch profile inside onAuthStateChange so it runs only once the session
  // is confirmed ready — getSession() can return null with cookie-based auth
  // if called before the client has parsed the cookies on first mount.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) { setLoading(false); return; }
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        console.log("profile loaded:", data);
        if (data) {
          setName(data.name ?? "");
          setDietary(parseDietary(data.dietary));
          setBeerLevel(data.beer_level ?? 0);
          setWineLevel(wineToNum(data.wine_level));
          setSpiritLevel(data.spirits_level ?? 0);
          setSnoringWarning(data.snoring_warning ?? false);
          setPresence({
            present_fri_evening: data.present_fri_evening ?? false,
            present_sat_midday:  data.present_sat_midday  ?? false,
            present_sat_evening: data.present_sat_evening ?? false,
            present_sun_midday:  data.present_sun_midday  ?? false,
            present_sun_evening: data.present_sun_evening ?? false,
            present_mon_midday:  data.present_mon_midday  ?? false,
          });
        }
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  function toggleDietary(key: string) {
    setDietary((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setNameError("Entre ton nom de festivalier 🌸");
      return;
    }
    setNameError("");
    setSaving(true);

    // upsert so the row is created if it doesn't exist yet
    // (update silently no-ops when the row is missing)
    const { error } = await supabase.from("users").upsert({
      id:              user.id,
      name:            name.trim(),
      dietary:         serializeDietary(dietary),
      beer_level:      beerLevel,
      wine_level:      wineToText(wineLevel),
      spirits_level:   spiritsLevel,
      snoring_warning: snoringWarning,
      ...presence,
    });

    if (error) console.error("profile save error:", error);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ── render ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-4 pt-8 space-y-4">
        <div className="animate-pulse bg-pink/20 rounded-full h-8 w-48" />
        <div className="animate-pulse bg-pink/10 rounded-2xl h-64 w-full" />
      </div>
    );
  }

  if (!user && !authLoading) return null;

  return (
    <div className="min-h-screen bg-cream pb-24 space-y-4">

      {/* ── Header ── */}
      <div className="px-6 pt-10 pb-4 space-y-1.5">
        <p className="text-xs font-extrabold uppercase tracking-widest text-charcoal/40">
          You&apos;re invited to
        </p>
        <h1
          className="font-[family-name:var(--font-lilita)] text-4xl uppercase leading-none"
          style={{ WebkitTextStroke: "2px #2D2D2D", color: "white" }}
        >
          Lolapabouillet 🌸
        </h1>
        <p className="text-xs font-semibold text-charcoal/35 uppercase tracking-[0.2em]">
          Fri, 22 May 2026 · 19:00
        </p>
        <p className="text-xs font-semibold text-charcoal/35 uppercase tracking-[0.2em]">
          18 route du Passoir
        </p>
      </div>

      {/* ── Profile form ── */}
      <div className="px-4">
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-5">

          <p className="font-[family-name:var(--font-lilita)] text-2xl text-charcoal leading-snug">
            {name.trim() ? `Bonjour, ${name.trim()} 🌸` : "Bonjour 🌸"}
          </p>

          <form onSubmit={handleSave} className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest text-charcoal/40 mb-2">
                Nom de festivalier 🌸
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(""); }}
                placeholder="Ton prénom ou surnom"
                className={inputCls}
              />
              {nameError && (
                <p className="mt-1.5 text-xs font-semibold text-pink">{nameError}</p>
              )}
            </div>

            {/* Dietary */}
            <div>
              <label className={labelCls}>
                Dietary preferences{" "}
                <span className="normal-case font-medium text-charcoal/30">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDietary(key)}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-150 border",
                      dietary.includes(key)
                        ? "bg-mint text-charcoal border-mint/50 shadow-sm"
                        : "bg-gray-100 text-charcoal/55 border-transparent hover:bg-gray-200"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <DrinkBar label="Drinking 🍺 Beer"        value={beerLevel}    onChange={setBeerLevel}   />
            <DrinkBar label="Drinking 🍷 Wine"        value={wineLevel}    onChange={setWineLevel}   />
            <DrinkBar label="Drinking 🥃 Hard liquor" value={spiritsLevel} onChange={setSpiritLevel} />

            {/* Présence */}
            <div>
              <label className={labelCls}>
                Quand seras-tu là ?{" "}
                <span className="normal-case font-medium text-charcoal/30">(Coches toutes les options)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESENCE_SLOTS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setPresence((p) => ({ ...p, [key]: !p[key] }))
                    }
                    className={cn(
                      "rounded-full px-3 py-2 text-sm font-semibold transition-all duration-150 border",
                      presence[key]
                        ? "bg-lavender text-charcoal border-lavender/50 shadow-sm"
                        : "bg-white text-charcoal/50 border-charcoal/20 hover:border-charcoal/40"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ronflements */}
            <div className="flex items-center justify-between w-full py-3 px-4 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div>
                <p className="font-semibold text-sm text-charcoal">😴 Je ronfle</p>
                <p className="text-xs text-charcoal/40">Tes co-tenteurs seront prévenus</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snoringWarning}
                onClick={() => setSnoringWarning((v) => !v)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0",
                  snoringWarning ? "bg-pink" : "bg-charcoal/20"
                )}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    left: snoringWarning ? "26px" : "4px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 0.2s ease",
                  }}
                />
              </button>
            </div>

            {/* Floral reminder */}
            <div className="rounded-2xl bg-pink/15 border border-pink/25 px-4 py-3.5">
              <p className="text-sm font-semibold text-charcoal leading-snug">
                🌸 Floral outfits only — flowers, petals, garden vibes
              </p>
            </div>

            {/* Toast */}
            {saved && (
              <div className="rounded-2xl bg-mint/30 border border-mint/40 px-4 py-3 text-center">
                <p className="text-sm font-bold text-[#3a8c78]">Sauvegardé ✓</p>
              </div>
            )}

            <PastelButton
              type="submit"
              variant="pink"
              fullWidth
              disabled={saving}
            >
              {saving ? "Sauvegarde…" : "Mettre à jour 🌸"}
            </PastelButton>
          </form>

          {/* Sign out */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-charcoal/35 hover:text-charcoal/60 transition-colors underline underline-offset-2"
            >
              Sign out
            </button>
          </div>

          {/* Admin access — only visible to admins */}
          {isAdmin && (
            <div className="pt-2 border-t border-charcoal/10">
              <Link href="/admin">
                <button className="w-full py-3 rounded-2xl bg-charcoal/8 text-charcoal/50 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-charcoal/12 transition-colors">
                  ⚙️ Admin Panel
                </button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
