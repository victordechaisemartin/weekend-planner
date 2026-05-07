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
  }) => Promise<void>;
};

const inputCls =
  "w-full rounded-2xl bg-white/80 border border-white px-4 py-2.5 text-sm text-charcoal " +
  "placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-pink/40";

const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-1.5";

export default function AddCarModal({ driverName, error, onClose, onSubmit }: Props) {
  const [address, setAddress] = useState("");
  const [seats, setSeats] = useState(3);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim() || !date) return;
    setSubmitting(true);
    await onSubmit({ address: address.trim(), seats, date, time });
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
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-cream px-6 pt-5 pb-8 space-y-5 z-[61]">
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
