"use client";

import { useState } from "react";
import type { Car } from "@/lib/types";
import { cn } from "@/lib/utils";
import PastelButton from "@/components/ui/PastelButton";

type Passenger = { id: string; name: string };

export type CarData = Car & {
  name: string;
  driver: { id: string; name: string };
  passengers: Passenger[];
};

type Props = {
  car: CarData;
  currentUserId: string | null;
  onJoin: (carId: string) => void;
  onLeave: (carId: string) => void;
  onEdit: (carId: string, form: { address: string; date: string; time: string; seats: number }) => Promise<void>;
  onDelete: (carId: string) => Promise<void>;
  busy: boolean;
};

const inputCls =
  "w-full rounded-2xl bg-white/80 border border-white px-4 py-2.5 text-sm text-charcoal " +
  "placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-lavender/40";

const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-1.5";

function formatDeparture(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CarCard({ car, currentUserId, onJoin, onLeave, onEdit, onDelete, busy }: Props) {
  const freeSeats = car.seats_total - car.passengers.length;
  const isFull = freeSeats <= 0;
  const isDriver = car.driver.id === currentUserId;
  const isPassenger = car.passengers.some((p) => p.id === currentUserId);

  // ── edit state ────────────────────────────────────────────────
  const [editing,      setEditing]      = useState(false);
  const [editAddress,  setEditAddress]  = useState("");
  const [editDate,     setEditDate]     = useState("");
  const [editTime,     setEditTime]     = useState("");
  const [editSeats,    setEditSeats]    = useState(car.seats_total);
  const [editSaving,   setEditSaving]   = useState(false);

  // ── delete state ──────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  function openEdit() {
    const dt = new Date(car.departure_datetime);
    setEditAddress(car.address);
    setEditDate(dt.toISOString().slice(0, 10));
    setEditTime(dt.toTimeString().slice(0, 5));
    setEditSeats(car.seats_total);
    setEditing(true);
  }

  async function submitEdit() {
    setEditSaving(true);
    await onEdit(car.id, { address: editAddress, date: editDate, time: editTime, seats: editSeats });
    setEditSaving(false);
    setEditing(false);
  }

  async function submitDelete() {
    setDeleting(true);
    await onDelete(car.id);
    setDeleting(false);
    setConfirmDelete(false);
  }

  return (
    <>
      <article className="rounded-3xl bg-cream border border-white/60 shadow-[0_2px_16px_0_rgba(45,45,45,0.07)] border-l-4 border-l-pink overflow-hidden">
        <div className="p-5 space-y-3.5">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-bold text-charcoal">🚗 {car.name}</p>
              <p className="text-xs text-charcoal/40 mt-0.5">{car.driver.name}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {isDriver && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={openEdit}
                    title="Modifier"
                    className="w-7 h-7 rounded-full bg-charcoal/6 flex items-center justify-center text-sm text-charcoal/50 hover:bg-lavender/40 hover:text-charcoal/80 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    title="Supprimer"
                    className="w-7 h-7 rounded-full bg-charcoal/6 flex items-center justify-center text-sm text-charcoal/50 hover:bg-pink/20 hover:text-pink/80 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              )}
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
          </div>

          {/* ── Address ── */}
          <p className="text-sm text-charcoal/70 flex gap-1.5 items-start">
            <span className="mt-px shrink-0">📍</span>
            <span>{car.address}</span>
          </p>

          {/* ── Departure ── */}
          <p className="text-sm text-charcoal/60 flex gap-1.5 items-center">
            <span>🕐</span>
            <span>{formatDeparture(car.departure_datetime)}</span>
          </p>

          {/* ── Seat grid ── */}
          <div className="flex flex-wrap gap-2 pt-1">
            {car.passengers.map((p) => (
              <div
                key={p.id}
                title={p.name}
                className="w-9 h-9 rounded-xl bg-pink/20 flex items-center justify-center text-base select-none"
              >
                🌸
              </div>
            ))}
            {!isFull && !isDriver && !isPassenger &&
              Array.from({ length: freeSeats }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => onJoin(car.id)}
                  disabled={busy || !currentUserId}
                  aria-label="Reserve a seat"
                  className={cn(
                    "w-9 h-9 rounded-xl border-2 border-dashed flex items-center justify-center",
                    "text-lg font-light transition-all duration-150",
                    !currentUserId
                      ? "border-charcoal/10 text-charcoal/15 cursor-default"
                      : "border-charcoal/20 text-charcoal/35 hover:border-pink/60 hover:text-pink hover:bg-pink/5 hover:scale-105 active:scale-95 cursor-pointer"
                  )}
                >
                  +
                </button>
              ))}
          </div>

          {/* ── Action row ── */}
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
                  disabled={busy || !currentUserId}
                  className="text-xs py-2 px-5"
                >
                  Join 🌸
                </PastelButton>
              ) : null}
            </div>
          )}

          {isDriver && !confirmDelete && (
            <p className="text-[11px] font-semibold text-charcoal/35 uppercase tracking-wider pt-0.5">
              Your car 🚗
            </p>
          )}

          {/* ── Delete confirmation ── */}
          {confirmDelete && (
            <div className="rounded-2xl bg-pink/10 border border-pink/25 p-4 space-y-3">
              <p className="text-sm font-semibold text-charcoal leading-snug">
                Supprimer ta voiture ? Tes passagers seront prévenus.
              </p>
              <div className="flex gap-2">
                <PastelButton
                  variant="pink"
                  onClick={submitDelete}
                  disabled={deleting}
                  className="text-xs py-2 px-4"
                >
                  {deleting ? "…" : "Supprimer"}
                </PastelButton>
                <PastelButton
                  variant="lavender"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="text-xs py-2 px-4"
                >
                  Annuler
                </PastelButton>
              </div>
            </div>
          )}

        </div>
      </article>

      {/* ── Edit modal ── */}
      {editing && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
            onClick={() => !editSaving && setEditing(false)}
          />
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-cream px-6 pt-5 pb-8 space-y-5 z-[61]">
            <div className="w-10 h-1 rounded-full bg-charcoal/15 mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-charcoal">Modifier la voiture ✏️</h2>
              <button
                onClick={() => !editSaving && setEditing(false)}
                className="w-8 h-8 rounded-full bg-charcoal/8 flex items-center justify-center text-charcoal/50 hover:bg-charcoal/12 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Adresse de départ</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Places disponibles</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditSeats((s) => Math.max(1, s - 1))}
                    className="w-9 h-9 rounded-full bg-white/80 border border-white text-charcoal/60 font-bold text-lg hover:bg-white transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-xl font-bold text-charcoal tabular-nums">
                    {editSeats}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditSeats((s) => Math.min(8, s + 1))}
                    className="w-9 h-9 rounded-full bg-white/80 border border-white text-charcoal/60 font-bold text-lg hover:bg-white transition-colors"
                  >
                    +
                  </button>
                  <span className="text-xs text-charcoal/40 font-medium">
                    {car.passengers.length} occupée(s) sur {editSeats}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Heure</label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <PastelButton
                variant="lavender"
                fullWidth
                disabled={editSaving || !editAddress.trim()}
                onClick={submitEdit}
              >
                {editSaving ? "Sauvegarde…" : "Sauvegarder 🌸"}
              </PastelButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
