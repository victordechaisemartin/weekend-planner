"use client";

import { useState } from "react";
import PastelButton from "@/components/ui/PastelButton";
import { cn } from "@/lib/utils";

type Props = {
  driverName: string;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: {
    address: string;
    seats: number;
    date: string;
    time: string;
    note: string | null;
    stops: string[];
  }) => Promise<void>;
};

const inputCls =
  "w-full rounded-2xl bg-white/80 border border-white px-4 py-2.5 text-sm text-charcoal " +
  "placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-pink/40";

const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-1.5";

export default function AddCarModal({ driverName, error, onClose, onSubmit }: Props) {
  const [address,    setAddress]    = useState("");
  const [seats,      setSeats]      = useState(3);
  const [date,       setDate]       = useState("");
  const [time,       setTime]       = useState("10:00");
  const [note,       setNote]       = useState("");
  const [stops,      setStops]      = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function addStop() {
    if (stops.length < 5) setStops([...stops, ""]);
  }
  function removeStop(i: number) {
    setStops(stops.filter((_, idx) => idx !== i));
  }
  function updateStop(i: number, val: string) {
    const updated = [...stops];
    updated[i] = val;
    setStops(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim() || !date) return;
    setSubmitting(true);
    const cleanStops = stops.filter((s) => s.trim() !== "");
    await onSubmit({
      address: address.trim(),
      seats,
      date,
      time,
      note: note.trim() || null,
      stops: cleanStops,
    });
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-cream px-6 pt-5 pb-8 space-y-5 z-[61] max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-charcoal/15 mx-auto sm:hidden" />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-charcoal">Add my car 🚗</h2>
            {driverName && (
              <p className="text-sm text-charcoal/40 mt-0.5">Adding car as {driverName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-charcoal/8 flex items-center justify-center text-charcoal/50 hover:bg-charcoal/12 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Address */}
          <div>
            <label className={labelCls}>Pickup address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="15 Rue des Fleurs, Paris"
              required
              className={inputCls}
            />
          </div>

          {/* Seats */}
          <div>
            <label className={labelCls}>Available seats</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSeats((s) => Math.max(1, s - 1))}
                className="w-9 h-9 rounded-full bg-white/80 border border-white text-charcoal/60 font-bold text-lg hover:bg-white transition-colors"
              >
                −
              </button>
              <span className="w-8 text-center text-xl font-bold text-charcoal tabular-nums">
                {seats}
              </span>
              <button
                type="button"
                onClick={() => setSeats((s) => Math.min(8, s + 1))}
                className="w-9 h-9 rounded-full bg-white/80 border border-white text-charcoal/60 font-bold text-lg hover:bg-white transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Date + Time */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={cn(inputCls, "cursor-pointer")}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={cn(inputCls, "cursor-pointer")}
              />
            </div>
          </div>

          {/* Stops */}
          <div>
            <label className={labelCls}>Arrêts en route</label>
            <div className="space-y-2">
              {stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={stop}
                    onChange={(e) => updateStop(i, e.target.value)}
                    placeholder="Ex: Gare de Lyon, Paris"
                    className={cn(inputCls, "flex-1")}
                    style={{ fontSize: 16 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeStop(i)}
                    className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-charcoal/40 hover:text-pink/70 transition-colors shrink-0"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            {stops.length < 5 ? (
              <button
                type="button"
                onClick={addStop}
                className="mt-2 rounded-full border border-pink/40 px-4 py-1.5 text-xs font-semibold text-pink/70 hover:bg-pink/10 transition-colors"
              >
                + Ajouter un arrêt
              </button>
            ) : (
              <p className="mt-2 text-xs text-charcoal/40">Maximum 5 arrêts atteint</p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className={labelCls}>Note (optionnel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Je passe par Paris, contact-moi si tu veux monter 🌸"
              rows={2}
              maxLength={200}
              className={cn(inputCls, "resize-none")}
              style={{ fontSize: 16 }}
            />
            <p className="mt-1 text-xs text-charcoal/30 text-right">
              {note.length} / 200
            </p>
          </div>

          <PastelButton
            type="submit"
            variant="pink"
            fullWidth
            disabled={submitting || !address.trim() || !date}
          >
            {submitting ? "Adding…" : "Add car 🚗"}
          </PastelButton>

          {error && (
            <p className="text-xs font-semibold text-pink text-center pt-1">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
