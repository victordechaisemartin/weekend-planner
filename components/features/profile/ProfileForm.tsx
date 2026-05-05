"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import PastelButton from "@/components/ui/PastelButton";
import PastelCard from "@/components/ui/PastelCard";
import FlowerDivider from "@/components/ui/FlowerDivider";
import WristbandCard from "./WristbandCard";

// ── constants ────────────────────────────────────────────────

const DIETARY_OPTIONS = [
  { key: "vegetarian", label: "🥦 Vegetarian"         },
  { key: "no-pork",    label: "🐷 No pork"            },
  { key: "lactose",    label: "🥛 Lactose intolerant" },
];

const DRINK_LEVELS = [
  { value: 0, label: "None"   },
  { value: 1, label: "Low"    },
  { value: 2, label: "Medium" },
  { value: 3, label: "Heavy"  },
];

// ── helpers ──────────────────────────────────────────────────

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
}

function parseDietary(raw: string | null): string[] {
  return raw?.split(",").filter(Boolean) ?? [];
}

function serializeDietary(selected: string[]): string | null {
  return selected.length ? selected.join(",") : null;
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
    <PastelCard>
      <p className="text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-3">
        {label}
      </p>
      <div className="flex rounded-2xl overflow-hidden border border-white/80 shadow-sm">
        {DRINK_LEVELS.map(({ value: v, label: l }, i) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition-all duration-150",
              i > 0 && "border-l border-white/60",
              value === v
                ? "bg-lavender text-charcoal shadow-inner"
                : "bg-white/50 text-charcoal/45 hover:bg-white/80"
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </PastelCard>
  );
}

// ── ProfileForm ───────────────────────────────────────────────

export default function ProfileForm() {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [beerLevel, setBeerLevel] = useState(0);
  const [spiritsLevel, setSpiritLevel] = useState(0);
  const [snoringWarning, setSnoringWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setDietary(parseDietary(data.dietary));
        setBeerLevel(data.beer_level ?? 0);
        setSpiritLevel(data.spirits_level ?? 0);
        setSnoringWarning(data.snoring_warning ?? false);
      }
      setLoading(false);
    }
    load();
  }, []);

  function toggleDietary(key: string) {
    setDietary((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);

    await supabase.from("users").upsert({
      id: userId,
      name: name.trim(),
      phone: phone.trim() || null,
      dietary: serializeDietary(dietary),
      beer_level: beerLevel,
      spirits_level: spiritsLevel,
      snoring_warning: snoringWarning,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ── loading / unauthenticated states ────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="animate-pulse text-4xl">🌸</span>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="px-5 py-20 text-center space-y-2">
        <p className="text-4xl">🌸</p>
        <p className="text-sm font-medium text-charcoal/50">
          Sign in to view your profile
        </p>
      </div>
    );
  }

  // ── form ────────────────────────────────────────────────────

  return (
    <div className="px-4 pb-10 space-y-4">

      {/* Avatar with flower crown */}
      <div className="flex flex-col items-center py-2">
        <div className="relative mt-2">
          <span
            className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl select-none leading-none"
            aria-hidden
          >
            🌺
          </span>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink to-lavender flex items-center justify-center shadow-md">
            <span className="text-white text-2xl font-extrabold tracking-tight">
              {initials(name)}
            </span>
          </div>
        </div>
      </div>

      {/* Name + phone */}
      <PastelCard>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl bg-white/70 border border-white/80 px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-pink/40"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 …"
              className="w-full rounded-2xl bg-white/70 border border-white/80 px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-pink/40"
            />
          </div>
        </div>
      </PastelCard>

      {/* Dietary */}
      <PastelCard>
        <p className="text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-3">
          🍽️ Dietary
        </p>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map(({ key, label }) => {
            const active = dietary.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleDietary(key)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold border transition-all duration-150",
                  active
                    ? "bg-mint text-charcoal border-mint/50 shadow-[0_4px_12px_0_rgba(184,228,216,0.45)]"
                    : "bg-white/70 text-charcoal/55 border-white hover:bg-white"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </PastelCard>

      {/* Beer level */}
      <DrinkBar label="🍺 Beer level" value={beerLevel} onChange={setBeerLevel} />

      {/* Spirits level */}
      <DrinkBar label="🥃 Spirits level" value={spiritsLevel} onChange={setSpiritLevel} />

      {/* Snoring warning */}
      <PastelCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-charcoal">😴 Snoring warning</p>
            <p className="text-xs text-charcoal/40 mt-0.5">Warn your tent-mates ahead of time</p>
          </div>
          <button
            role="switch"
            aria-checked={snoringWarning}
            onClick={() => setSnoringWarning((v) => !v)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink/50",
              snoringWarning ? "bg-pink" : "bg-charcoal/15"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                snoringWarning ? "translate-x-[26px]" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </PastelCard>

      <FlowerDivider />

      {/* Dressing reminder */}
      <div className="rounded-3xl bg-pink/15 border border-pink/30 p-5 space-y-1.5">
        <p className="text-sm font-bold text-charcoal">
          🌸 Floral outfits only — flowers, petals, garden vibes
        </p>
        <p className="text-xs text-charcoal/50 leading-relaxed">
          Dress code strictly enforced. Come as a garden. 🌷🌼🌻
        </p>
      </div>

      {/* Wristband */}
      <WristbandCard userId={userId} />

      {/* Save */}
      <PastelButton
        variant="pink"
        fullWidth
        onClick={handleSave}
        disabled={saving}
        className="mt-2"
      >
        {saved ? "Saved ✓" : saving ? "Saving…" : "Save profile"}
      </PastelButton>
    </div>
  );
}
