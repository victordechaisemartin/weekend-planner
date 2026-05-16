"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getEventId } from "@/lib/constants";

// ── local types ───────────────────────────────────────────────

type RawUser = {
  id: string;
  name: string;
  dietary: string | null;
  beer_level: number | null;
  wine_level: string | null;
  spirits_level: number | null;
  snoring_warning: boolean | null;
  present_fri_evening: boolean | null;
  present_sat_midday:  boolean | null;
  present_sat_evening: boolean | null;
  present_sun_midday:  boolean | null;
  present_sun_evening: boolean | null;
  present_mon_midday:  boolean | null;
};

type CarRow = {
  id: string;
  name: string | null;
  driver_id: string;
  driver: { name: string } | null;
};

type GuestRow = RawUser & {
  car_name: string | null;
  tent_name: string | null;
};

type Filter = "all" | "no_car" | "no_tent";

// ── helpers ───────────────────────────────────────────────────

const DRINK_LABELS = ["—", "Low", "Medium", "Heavy"] as const;

function drinkLabel(level: number | null): string {
  if (level == null || level === 0) return "";
  return DRINK_LABELS[level] ?? "";
}

function wineLabel(w: string | null): string {
  if (!w || w === "none") return "";
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function hasDietary(u: RawUser, key: string): boolean {
  return u.dietary?.split(",").map((s) => s.trim()).includes(key) ?? false;
}

function cardBg(g: GuestRow): string {
  if (!g.car_name)  return "#F4A7B933";
  if (!g.tent_name) return "#C9B8E833";
  return "white";
}

// ── component ─────────────────────────────────────────────────

export default function AdminGuestsPage() {
  const [guests,  setGuests]  = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<Filter>("all");

  useEffect(() => {
    async function load() {
      const eventId = await getEventId();
      if (!eventId) return;

      const [
        { data: rawUsers },
        { data: rawCars },
        { data: rawCarPass },
        { data: rawTents },
        { data: rawTentGuests },
        { data: rawBikes },
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id, name, dietary, beer_level, wine_level, spirits_level, snoring_warning, present_fri_evening, present_sat_midday, present_sat_evening, present_sun_midday, present_sun_evening, present_mon_midday")
          .order("name", { ascending: true }),
        supabase
          .from("cars")
          .select("id, name, driver_id, driver:users!driver_id(name)")
          .eq("event_id", eventId),
        supabase
          .from("car_passengers")
          .select("car_id, user_id"),
        supabase
          .from("tents")
          .select("id, name")
          .eq("event_id", eventId),
        supabase
          .from("tent_guests")
          .select("tent_id, user_id"),
        supabase
          .from("bikes")
          .select("rider_id, bike_model")
          .eq("event_id", eventId),
      ]);

      const cars  = (rawCars ?? []) as unknown as CarRow[];
      const tents = rawTents ?? [];

      // Build lookup maps: userId → display name
      const carNameMap  = new Map(
        cars.map((c) => [c.id, c.name ?? c.driver?.name ?? "Voiture"])
      );
      const tentNameMap = new Map(tents.map((t) => [t.id, t.name as string]));

      // Passengers
      const userCarMap = new Map(
        (rawCarPass ?? []).map((p) => [
          p.user_id,
          carNameMap.get(p.car_id) ?? "Voiture",
        ])
      );
      // Drivers (only add if not already a passenger in the same or another car)
      for (const car of cars) {
        if (car.driver_id && !userCarMap.has(car.driver_id)) {
          userCarMap.set(car.driver_id, carNameMap.get(car.id) ?? "Voiture");
        }
      }
      // Bike riders (only add if not already in a car)
      for (const bike of (rawBikes ?? [])) {
        if (bike.rider_id && !userCarMap.has(bike.rider_id)) {
          userCarMap.set(bike.rider_id, bike.bike_model ? `Vélo · ${bike.bike_model}` : "Vélo");
        }
      }
      const userTentMap = new Map(
        (rawTentGuests ?? []).map((g) => [
          g.user_id,
          tentNameMap.get(g.tent_id) ?? "Tente",
        ])
      );

      const rows: GuestRow[] = (rawUsers ?? []).map((u) => ({
        ...(u as RawUser),
        car_name:  userCarMap.get(u.id) ?? null,
        tent_name: userTentMap.get(u.id) ?? null,
      }));

      setGuests(rows);
      setLoading(false);
    }
    load();
  }, []);

  // ── derived stats ─────────────────────────────────────────────
  const total      = guests.length;
  const vegCount   = guests.filter((g) => hasDietary(g, "vegetarian")).length;
  const porkCount  = guests.filter((g) => hasDietary(g, "no_pork")).length;
  const lactCount  = guests.filter((g) => hasDietary(g, "lactose")).length;
  const beerHeavy  = guests.filter((g) => g.beer_level === 3).length;
  const wineHeavy  = guests.filter((g) => g.wine_level === "heavy").length;
  const spirHeavy  = guests.filter((g) => g.spirits_level === 3).length;
  const snoringCount = guests.filter((g) => g.snoring_warning).length;

  const presenceCounts = [
    { label: "Ven soir",  count: guests.filter((g) => g.present_fri_evening).length },
    { label: "Sam midi",  count: guests.filter((g) => g.present_sat_midday).length  },
    { label: "Sam soir",  count: guests.filter((g) => g.present_sat_evening).length },
    { label: "Dim midi",  count: guests.filter((g) => g.present_sun_midday).length  },
    { label: "Dim soir",  count: guests.filter((g) => g.present_sun_evening).length },
    { label: "Lun midi",  count: guests.filter((g) => g.present_mon_midday).length  },
  ].filter((s) => s.count > 0);

  // ── filtered list ─────────────────────────────────────────────
  const visible = guests.filter((g) => {
    if (filter === "no_car")  return !g.car_name;
    if (filter === "no_tent") return !g.tent_name;
    return true;
  });

  // ── CSV export ────────────────────────────────────────────────
  function exportCsv() {
    const rows = [
      ["Nom","Végé","Sans porc","Lactose","Bière","Vin","Alcool fort","Voiture","Tente"],
      ...guests.map((u) => [
        u.name,
        hasDietary(u, "vegetarian") ? "✓" : "",
        hasDietary(u, "no_pork")    ? "✓" : "",
        hasDietary(u, "lactose")    ? "✓" : "",
        u.beer_level     ?? "",
        u.wine_level     ?? "",
        u.spirits_level  ?? "",
        u.car_name  || "Aucune",
        u.tent_name || "Aucune",
      ]),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "lolapabouillet-guests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── render ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Summary cards (scrollable row) ── */}
      {loading ? (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[0,1,2,3,4,5,6].map((i) => (
            <div
              key={i}
              className="shrink-0 w-24 h-16 rounded-2xl animate-pulse"
              style={{ background: "#F4A7B933" }}
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <SummaryChip emoji="🌸" value={total}        label="participants"  />
          {vegCount     > 0 && <SummaryChip emoji="🥬" value={vegCount}     label="végétariens"  />}
          {porkCount    > 0 && <SummaryChip emoji="🐷" value={porkCount}    label="sans porc"    />}
          {lactCount    > 0 && <SummaryChip emoji="🥛" value={lactCount}    label="lactose"      />}
          {beerHeavy    > 0 && <SummaryChip emoji="🍺" value={beerHeavy}    label="heavy beer"   />}
          {wineHeavy    > 0 && <SummaryChip emoji="🍷" value={wineHeavy}    label="heavy wine"   />}
          {spirHeavy    > 0 && <SummaryChip emoji="🥃" value={spirHeavy}    label="heavy spirits"/>}
          {snoringCount > 0 && <SummaryChip emoji="😴" value={snoringCount} label="ronfleurs"    />}
          {presenceCounts.map((s) => (
            <SummaryChip key={s.label} emoji="📅" value={s.count} label={s.label} />
          ))}
        </div>
      )}

      {/* ── Filter buttons ── */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "no_car", "no_tent"] as Filter[]).map((f) => {
          const labels: Record<Filter, string> = {
            all:      "Tous",
            no_car:   "Sans voiture",
            no_tent:  "Sans tente",
          };
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
              style={{
                background: active ? "#F4A7B9" : "#2D2D2D11",
                color: "#2D2D2D",
              }}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* ── Guest list ── */}
      {loading ? (
        <div className="space-y-3">
          {[0,1,2,3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-3xl animate-pulse"
              style={{ background: "#F4A7B922" }}
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-base font-bold" style={{ color: "#2D2D2D" }}>
            Aucun résultat 🌸
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((g) => (
            <GuestCard key={g.id} guest={g} />
          ))}
        </div>
      )}

      {/* ── Export button ── */}
      {!loading && guests.length > 0 && (
        <button
          onClick={exportCsv}
          className="w-full rounded-full py-3 text-sm font-bold shadow-md transition-all active:scale-95"
          style={{ background: "#B8E4D8", color: "#2D2D2D" }}
        >
          📥 Exporter la liste
        </button>
      )}

    </div>
  );
}

// ── sub-components ────────────────────────────────────────────

function SummaryChip({
  emoji, value, label,
}: {
  emoji: string; value: number; label: string;
}) {
  return (
    <div
      className="shrink-0 rounded-2xl px-3 py-2 flex flex-col items-center min-w-[72px] shadow-sm"
      style={{ background: "#F4A7B933" }}
    >
      <span className="text-lg leading-none">{emoji}</span>
      <span
        className="text-xl font-black tabular-nums leading-tight"
        style={{ color: "#2D2D2D" }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-extrabold uppercase tracking-wide text-center leading-tight"
        style={{ color: "#2D2D2D66" }}
      >
        {label}
      </span>
    </div>
  );
}

function GuestCard({ guest: g }: { guest: GuestRow }) {
  const dietaryTags: { key: string; emoji: string }[] = [
    { key: "vegetarian", emoji: "🥬" },
    { key: "no_pork",    emoji: "🐷" },
    { key: "lactose",    emoji: "🥛" },
  ];

  const beer  = drinkLabel(g.beer_level);
  const wine  = wineLabel(g.wine_level);
  const spir  = drinkLabel(g.spirits_level);

  const activeDiet = dietaryTags.filter((d) => hasDietary(g, d.key));
  const drinks     = [
    beer  && `🍺 ${beer}`,
    wine  && `🍷 ${wine}`,
    spir  && `🥃 ${spir}`,
  ].filter(Boolean) as string[];

  return (
    <div
      className="rounded-2xl px-4 py-3 shadow-sm"
      style={{ background: cardBg(g) }}
    >
      {/* Name + snoring badge */}
      <div className="flex items-center gap-2">
        <p
          className="font-[family-name:var(--font-lilita)] text-base uppercase leading-tight"
          style={{ color: "#2D2D2D", WebkitTextStroke: "0.5px #2D2D2D" }}
        >
          {g.name}
        </p>
        {g.snoring_warning && (
          <span
            className="text-xs rounded-full px-2 py-0.5 font-semibold shrink-0"
            style={{ background: "#C9B8E888", color: "#2D2D2D" }}
          >
            😴 Ronfleur
          </span>
        )}
      </div>

      {/* Dietary + drink badges */}
      {(activeDiet.length > 0 || drinks.length > 0) && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {activeDiet.map((d) => (
            <span
              key={d.key}
              className="text-xs rounded-full px-2 py-0.5 font-semibold"
              style={{ background: "#B8E4D888", color: "#2D2D2D" }}
            >
              {d.emoji}
            </span>
          ))}
          {drinks.map((d) => (
            <span
              key={d}
              className="text-xs rounded-full px-2 py-0.5 font-semibold"
              style={{ background: "#C9B8E888", color: "#2D2D2D" }}
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Car + Tent */}
      <div className="flex gap-3 mt-2 flex-wrap">
        <span
          className="text-xs font-semibold"
          style={{ color: g.car_name ? "#2D2D2D" : "#2D2D2D44" }}
        >
          🚗 {g.car_name ?? "Aucune"}
        </span>
        <span
          className="text-xs font-semibold"
          style={{ color: g.tent_name ? "#2D2D2D" : "#2D2D2D44" }}
        >
          ⛺ {g.tent_name ?? "Aucune"}
        </span>
      </div>
    </div>
  );
}
