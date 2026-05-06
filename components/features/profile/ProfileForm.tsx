"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import PastelButton from "@/components/ui/PastelButton";

// ── constants ─────────────────────────────────────────────────

const LS_KEY = "lolapabouillet_user_id";

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

function DrinkBar({
  label,
  value,
  onChange,
}: {
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

export default function ProfileForm() {
  const [name, setName]               = useState("");
  const [phone, setPhone]             = useState("");
  const [dietary, setDietary]         = useState<string[]>([]);
  const [beerLevel, setBeerLevel]     = useState(0);
  const [wineLevel, setWineLevel]     = useState(0);
  const [spiritsLevel, setSpiritLevel]= useState(0);

  const [isReturning, setIsReturning] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  const [attendingCount, setAttendingCount] = useState<number | null>(null);
  const [carsCount, setCarsCount]           = useState<number | null>(null);
  const [freeSeats, setFreeSeats]           = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      // ── Returning user: pre-fill from Supabase ──────────────
      const storedId = localStorage.getItem(LS_KEY);
      if (storedId) {
        setIsReturning(true);
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", storedId)
          .maybeSingle();
        if (data) {
          setName(data.name ?? "");
          setPhone(data.phone ?? "");
          setDietary(parseDietary(data.dietary));
          setBeerLevel(data.beer_level ?? 0);
          setWineLevel(wineToNum(data.wine_level));
          setSpiritLevel(data.spirits_level ?? 0);
        }
      }

      // ── Stats: attendees + cars ──────────────────────────────
      const [{ count: userCount }, { data: event }] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("events").select("id").limit(1).maybeSingle(),
      ]);

      setAttendingCount(userCount ?? 0);

      if (event?.id) {
        const { data: cars } = await supabase
          .from("cars")
          .select("id, seats_total")
          .eq("event_id", event.id);

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
    init();
  }, []);

  function toggleDietary(key: string) {
    setDietary((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const existingId = localStorage.getItem(LS_KEY);
    const id = existingId ?? crypto.randomUUID();

    await supabase.from("users").upsert({
      id,
      name: name.trim(),
      phone: phone.trim() || null,
      dietary: serializeDietary(dietary),
      beer_level: beerLevel,
      wine_level: wineToText(wineLevel),
      spirits_level: spiritsLevel,
      snoring_warning: false,
    });

    localStorage.setItem(LS_KEY, id);
    setIsReturning(true);

    // Bump attending count optimistically
    setAttendingCount((n) => (existingId ? n : (n ?? 0) + 1));

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // ── render ────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── 1. Header ── */}
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

      {/* ── 2. Stat boxes ── */}
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

      {/* ── 3. Join form ── */}
      <div className="px-4">
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
          <h2 className="text-base font-extrabold text-charcoal">
            {isReturning ? "Update your info" : "Join this event"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-charcoal/50 mb-2">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fleur Dupont"
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-pink/30 focus:bg-white transition-colors"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-charcoal/50 mb-2">
                Your phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-pink/30 focus:bg-white transition-colors"
              />
            </div>

            {/* Dietary */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-charcoal/50 mb-2">
                Dietary preferences{" "}
                <span className="normal-case font-medium text-charcoal/30">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(({ key, label }) => {
                  const active = dietary.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDietary(key)}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-150 border",
                        active
                          ? "bg-mint text-charcoal border-mint/50 shadow-sm"
                          : "bg-gray-100 text-charcoal/55 border-transparent hover:bg-gray-200"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Beer */}
            <DrinkBar
              label="Drinking 🍺 Beer"
              value={beerLevel}
              onChange={setBeerLevel}
            />

            {/* Wine */}
            <DrinkBar
              label="Drinking 🍷 Wine"
              value={wineLevel}
              onChange={setWineLevel}
            />

            {/* Hard liquor */}
            <DrinkBar
              label="Drinking 🥃 Hard liquor"
              value={spiritsLevel}
              onChange={setSpiritLevel}
            />

            {/* Floral reminder */}
            <div className="rounded-2xl bg-pink/15 border border-pink/25 px-4 py-3.5">
              <p className="text-sm font-semibold text-charcoal leading-snug">
                🌸 Floral outfits only — flowers, petals, garden vibes
              </p>
            </div>

            {/* Submit */}
            <PastelButton
              type="submit"
              variant="pink"
              fullWidth
              disabled={saving || !name.trim()}
            >
              {saved ? "Joined! ✓" : saving ? "Saving…" : "Join Event"}
            </PastelButton>

          </form>
        </div>
      </div>
    </div>
  );
}
