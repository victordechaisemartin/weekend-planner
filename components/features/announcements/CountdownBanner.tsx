"use client";

import { useEffect, useState } from "react";

type Slot = { value: number; label: string };

function getTimeLeft(target: Date): Slot[] {
  const diff = Math.max(0, target.getTime() - Date.now());
  return [
    { value: Math.floor(diff / 86_400_000),                       label: "days" },
    { value: Math.floor((diff % 86_400_000) / 3_600_000),         label: "hrs"  },
    { value: Math.floor((diff % 3_600_000)  / 60_000),            label: "min"  },
    { value: Math.floor((diff % 60_000)     / 1_000),             label: "sec"  },
  ];
}

const TARGET = new Date("2026-05-30T11:00:00");

export default function CountdownBanner() {
  const [slots, setSlots] = useState<Slot[]>(() => getTimeLeft(TARGET));

  useEffect(() => {
    const id = setInterval(() => setSlots(getTimeLeft(TARGET)), 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative rounded-3xl border-2 border-dashed border-pink/50 bg-white/70 px-5 py-5 text-center">
      {/* corner flowers */}
      {["top-2 left-3", "top-2 right-3", "bottom-2 left-3", "bottom-2 right-3"].map((pos) => (
        <span key={pos} className={`absolute ${pos} text-sm select-none`} aria-hidden>🌸</span>
      ))}

      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal/45 mb-3">
        Festival starts in
      </p>

      <div className="flex justify-center gap-3">
        {slots.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="w-16 rounded-2xl bg-pink/15 py-2.5">
              <span className="block text-2xl font-extrabold text-charcoal tabular-nums leading-none">
                {String(value).padStart(2, "0")}
              </span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/45">
              {label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-charcoal/35 font-medium">
        30 May 2026 · 11:00 🎵
      </p>
    </div>
  );
}
