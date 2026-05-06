"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/lib/useAuth";
import { getEventId } from "@/lib/constants";
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

// ── helpers ───────────────────────────────────────────────────

function parseDietary(raw: string | null): string[] {
  return raw?.split(",").filter(Boolean) ?? [];
}

function serializeDietary(selected: string[]): string | null {
  return selected.length ? selected.join(",") : null;
}

const WINE_LEVELS = ["none", "low", "medium", "heavy"] as const;

function wineToNum(text: string | null): number {
  const idx = WINE_LEVELS.indexOf((text ?? "none") as typeof WINE_LEVELS[number]);
  return idx >= 0 ? idx : 0;
}

function wineToText(n: number): string {
  return WINE_LEVELS[n] ?? "none";
}

// ── DrinkBar ─────────────────────────────────────────────────

function DrinkBar({ label, value, onChange }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
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

// ── ProfileForm ───────────────────────────────────────────────

const inputCls =
  "w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-charcoal " +
  "placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-pink/30 focus:bg-white transition-colors";

const labelCls =
  "block text-[10px] font-extrabold uppercase tracking-[0.15em] text-charcoal/50 mb-2";

type Props = {
  user: User | null;
  profile: UserProfile | null;
};

export default function ProfileForm({ user, profile }: Props) {
  const [phone, setPhone]             = useState("");
  const [dietary, setDietary]         = useState<string[]>([]);
  const [beerLevel, setBeerLevel]     = useState(0);
  const [wineLevel, setWineLevel]     = useState(0);
  const [spiritsLevel, setSpiritLevel]= useState(0);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const [attendingCount, setAttendingCount] = useState<number | null>(null);
  const [carsCount, setCarsCount]           = useState<number | null>(null);
  const [freeSeats, setFreeSeats]           = useState<number | null>(null);

  // Pre-fill when profile loads
  useEffect(() => {
    if (profile) {
      setPhone(profile.phone ?? "");
      setDietary(parseDietary(profile.dietary));
      setBeerLevel(profile.beer_level ?? 0);
      setWineLevel(wineToNum(profile.wine_level));
      setSpiritLevel(profile.spirits_level ?? 0);
    }
  }, [profile]);

  // Fetch stats — fires on mount, uses shared getEventId() cache
  useEffect(() => {
    async function fetchStats() {
      const [{ count: userCount }, eventId] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        getEventId(),
      ]);
      setAttendingCount(userCount ?? 0);

      if (eventId) {
        const { data: cars } = await supabase
          .from("cars").select("id, seats_total").eq("event_id", eventId);
        const carIds = (cars ?? []).map((c) => c.id);
        const { count: passengerCount } = carIds.length
          ? await supabase
              .from("car_passengers")
              .select("*", { count: "exact", head: true })
              .in("car_id", carIds)
          : { count: 0 };
        const totalSeats = (cars ?? []).reduce((s, c) => s + c.seats_total, 0);
        setCarsCount((cars ?? []).length);
        setFreeSeats(Math.max(0, totalSeats - (passengerCount ?? 0)));
      }
    }
    fetchStats();
  }, []);

  function toggleDietary(key: string) {
    setDietary((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);

    await supabase.from("users").upsert({
      id: user.id,
      name: profile.name,
      phone: phone.trim() || null,
      dietary: serializeDietary(dietary),
      beer_level: beerLevel,
      wine_level: wineToText(wineLevel),
      spirits_level: spiritsLevel,
      snoring_warning: false,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

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

      {/* ── Stats ── */}
      <div className="px-4 flex gap-3">
        <div className="flex-1 bg-white rounded-3xl p-4 text-center shadow-sm">
          <p className="text-3xl font-black text-charcoal tabular-nums">
            {attendingCount ?? "—"}
          </p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-charcoal/35 mt-1">
            Attending
          </p>
        </div>
        <div className="flex-1 bg-white rounded-3xl p-4 text-center shadow-sm">
          <p className="text-3xl font-black text-charcoal tabular-nums">
            {carsCount ?? "—"}
          </p>
          {freeSeats !== null && (
            <p className="text-[11px] font-semibold text-charcoal/40 leading-none mt-0.5">
              ({freeSeats} seats free)
            </p>
          )}
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-charcoal/35 mt-1">
            Cars
          </p>
        </div>
      </div>

      {/* ── Profile form ── */}
      <div className="px-4 pb-6">
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
          <p
            className="font-[family-name:var(--font-lilita)] text-2xl text-charcoal leading-snug"
          >
            {profile ? `Bonjour, ${profile.name} 🌸` : "Bonjour 🌸"}
          </p>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className={labelCls}>Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className={inputCls}
              />
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

            {/* Floral reminder */}
            <div className="rounded-2xl bg-pink/15 border border-pink/25 px-4 py-3.5">
              <p className="text-sm font-semibold text-charcoal leading-snug">
                🌸 Floral outfits only — flowers, petals, garden vibes
              </p>
            </div>

            <PastelButton
              type="submit"
              variant="pink"
              fullWidth
              disabled={saving}
            >
              {saved ? "Saved ✓" : saving ? "Saving…" : "Save changes 🌸"}
            </PastelButton>
          </form>

          {/* Sign out */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-charcoal/35 hover:text-charcoal/60 transition-colors underline underline-offset-2"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
