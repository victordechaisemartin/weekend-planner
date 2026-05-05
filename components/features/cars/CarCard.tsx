"use client";

import type { Car } from "@/lib/types";
import { cn } from "@/lib/utils";
import PastelButton from "@/components/ui/PastelButton";

type Passenger = { id: string; name: string };

export type CarData = Car & {
  driver: { id: string; name: string };
  passengers: Passenger[];
};

type Props = {
  car: CarData;
  currentUserId: string | null;
  onJoin: (carId: string) => void;
  onLeave: (carId: string) => void;
  busy: boolean;
};

function formatDeparture(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CarCard({ car, currentUserId, onJoin, onLeave, busy }: Props) {
  const freeSeats = car.seats_total - car.passengers.length;
  const isFull = freeSeats <= 0;
  const isDriver = car.driver.id === currentUserId;
  const isPassenger = car.passengers.some((p) => p.id === currentUserId);

  return (
    <article className="rounded-3xl bg-cream border border-white/60 shadow-[0_2px_16px_0_rgba(45,45,45,0.07)] border-l-4 border-l-pink overflow-hidden">
      <div className="p-5 space-y-3.5">

        {/* Driver + badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-bold text-charcoal">
            🌸 {car.driver.name}
          </p>
          {isFull ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-pink/30 bg-pink/20 px-2.5 py-0.5 text-[11px] font-semibold text-pink/80 whitespace-nowrap">
              🌺 Full
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-mint/40 bg-mint/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#3a8c78] whitespace-nowrap">
              🌱 {freeSeats} seat{freeSeats > 1 ? "s" : ""} free
            </span>
          )}
        </div>

        {/* Address */}
        <p className="text-sm text-charcoal/70 flex gap-1.5 items-start">
          <span className="mt-px shrink-0">📍</span>
          <span>{car.address}</span>
        </p>

        {/* Departure */}
        <p className="text-sm text-charcoal/60 flex gap-1.5 items-center">
          <span>🕐</span>
          <span>{formatDeparture(car.departure_datetime)}</span>
        </p>

        {/* Seat grid */}
        <div className="flex flex-wrap gap-2 pt-1">
          {/* Filled seats — one per passenger */}
          {car.passengers.map((p) => (
            <div
              key={p.id}
              title={p.name}
              className="w-9 h-9 rounded-xl bg-pink/20 flex items-center justify-center text-base select-none"
            >
              🌸
            </div>
          ))}

          {/* Empty seats — clickable + squares */}
          {!isFull &&
            Array.from({ length: freeSeats }).map((_, i) => (
              <button
                key={i}
                onClick={() => !isPassenger && !isDriver && onJoin(car.id)}
                disabled={busy || isPassenger || isDriver}
                aria-label="Reserve a seat"
                className={cn(
                  "w-9 h-9 rounded-xl border-2 border-dashed flex items-center justify-center",
                  "text-lg font-light transition-all duration-150",
                  isPassenger || isDriver
                    ? "border-charcoal/10 text-charcoal/15 cursor-default"
                    : "border-charcoal/20 text-charcoal/35 hover:border-pink/60 hover:text-pink hover:bg-pink/5 hover:scale-105 active:scale-95 cursor-pointer"
                )}
              >
                +
              </button>
            ))}
        </div>

        {/* Action row */}
        {!isDriver && (
          <div className="pt-0.5">
            {isPassenger ? (
              <PastelButton
                variant="lavender"
                onClick={() => onLeave(car.id)}
                disabled={busy}
                className="text-xs py-2 px-5"
              >
                Leave
              </PastelButton>
            ) : !isFull ? (
              <PastelButton
                variant="mint"
                onClick={() => onJoin(car.id)}
                disabled={busy}
                className="text-xs py-2 px-5"
              >
                Join 🌸
              </PastelButton>
            ) : null}
          </div>
        )}

        {isDriver && (
          <p className="text-[11px] font-semibold text-charcoal/35 uppercase tracking-wider pt-0.5">
            Your car 🚗
          </p>
        )}
      </div>
    </article>
  );
}
