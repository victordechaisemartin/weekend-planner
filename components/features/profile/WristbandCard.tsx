"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type WristbandInfo = {
  car: { address: string; departure_datetime: string; driver_name: string } | null;
  tent: { name: string; type: string } | null;
};

function formatDeparture(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function WristbandCard({ userId }: { userId: string }) {
  const [info, setInfo] = useState<WristbandInfo | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: cp }, { data: tg }] = await Promise.all([
        supabase
          .from("car_passengers")
          .select("car_id")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("tent_guests")
          .select("tent_id")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      const [{ data: car }, { data: tent }] = await Promise.all([
        cp?.car_id
          ? supabase
              .from("cars")
              .select("address, departure_datetime, driver:users!driver_id(name)")
              .eq("id", cp.car_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        tg?.tent_id
          ? supabase
              .from("tents")
              .select("name, type")
              .eq("id", tg.tent_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      type CarRow = { address: string; departure_datetime: string; driver: { name: string } | null };
      const carRow = car as CarRow | null;

      setInfo({
        car: carRow
          ? {
              address: carRow.address,
              departure_datetime: carRow.departure_datetime,
              driver_name: carRow.driver?.name ?? "Unknown",
            }
          : null,
        tent: tent as { name: string; type: string } | null,
      });
    }
    load();
  }, [userId]);

  if (!info) return null;

  const { car, tent } = info;

  return (
    <div className="rounded-3xl border-2 border-dashed border-lavender/60 bg-lavender/15 p-5 space-y-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-charcoal/45">
        🎪 Festival wristband
      </p>

      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl bg-white/60 p-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/35">
            🚗 Car
          </p>
          {car ? (
            <>
              <p className="text-sm font-semibold text-charcoal leading-snug">
                {car.address}
              </p>
              <p className="text-[11px] text-charcoal/50">
                {formatDeparture(car.departure_datetime)}
              </p>
              <p className="text-[11px] text-charcoal/40">with {car.driver_name}</p>
            </>
          ) : (
            <p className="text-xs text-charcoal/35 italic pt-0.5">No car yet</p>
          )}
        </div>

        <div className="flex-1 rounded-2xl bg-white/60 p-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/35">
            ⛺ Tent
          </p>
          {tent ? (
            <>
              <p className="text-sm font-semibold text-charcoal leading-snug">{tent.name}</p>
              <p className="text-[11px] text-charcoal/50">{tent.type}</p>
            </>
          ) : (
            <p className="text-xs text-charcoal/35 italic pt-0.5">No tent yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
