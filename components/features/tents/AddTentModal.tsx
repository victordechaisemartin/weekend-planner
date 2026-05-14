"use client";

import { useState } from "react";
import PastelButton from "@/components/ui/PastelButton";
import { cn } from "@/lib/utils";

type Props = {
  hostName: string;
  isAdmin?: boolean;
  defaultType?: TentType;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: string;
    capacity: number;
    snoring: boolean;
  }) => Promise<void>;
};

const TYPES = ["Tent", "Van", "Room"] as const;
type TentType = (typeof TYPES)[number];
const TYPE_ICONS: Record<TentType, string> = { Tent: "⛺", Van: "🚐", Room: "🏠" };

const inputCls =
  "w-full rounded-2xl bg-white/80 border border-white px-4 py-2.5 text-sm text-charcoal " +
  "placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-lavender/40";

const labelCls =
  "block text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-1.5";

export default function AddTentModal({ hostName, isAdmin = false, defaultType, error, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<TentType>(defaultType ?? "Tent");
  const [capacity, setCapacity] = useState(4);
  const [snoring, setSnoring] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), type, capacity, snoring });
      // modal is closed by the parent on success
    } catch {
      // error message is set by the parent via the error prop
    } finally {
      setSubmitting(false);
    }
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
        <div className="w-10 h-1 rounded-full bg-charcoal/15 mx-auto sm:hidden" />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-charcoal">Add my tent 🌸</h2>
            {hostName && (
              <p className="text-sm text-charcoal/40 mt-0.5">Adding tent as {hostName}</p>
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
          {/* Name */}
          <div>
            <label className={labelCls}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Lavender Palace"
              required
              className={inputCls}
            />
          </div>

          {/* Type selector */}
          <div>
            <label className={labelCls}>Type</label>
            <div className="flex rounded-2xl overflow-hidden border border-white/80 shadow-sm">
              {TYPES.map((t, i) => {
                const isDisabled = t === "Room" && !isAdmin;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isDisabled}
                    onClick={isDisabled ? undefined : () => setType(t)}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-semibold transition-all duration-150",
                      i > 0 && "border-l border-white/60",
                      isDisabled
                        ? "bg-white/50 text-charcoal/45 opacity-40 cursor-not-allowed"
                        : type === t
                          ? "bg-lavender text-charcoal shadow-inner"
                          : "bg-white/50 text-charcoal/45 hover:bg-white/80"
                    )}
                  >
                    {TYPE_ICONS[t]} {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capacity stepper */}
          <div>
            <label className={labelCls}>Capacity (including you)</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCapacity((c) => Math.max(1, c - 1))}
                className="w-9 h-9 rounded-full bg-white/80 border border-white text-charcoal/60 font-bold text-lg hover:bg-white transition-colors"
              >
                −
              </button>
              <span className="w-8 text-center text-xl font-bold text-charcoal tabular-nums">
                {capacity}
              </span>
              <button
                type="button"
                onClick={() => setCapacity((c) => Math.min(10, c + 1))}
                className="w-9 h-9 rounded-full bg-white/80 border border-white text-charcoal/60 font-bold text-lg hover:bg-white transition-colors"
              >
                +
              </button>
              <span className="text-xs text-charcoal/35 font-medium">people total</span>
            </div>
          </div>

          {/* Snoring toggle */}
          <div className="flex items-center justify-between w-full py-3">
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-charcoal">😴 Je ronfle</span>
              <span className="text-xs text-charcoal/40">Préviens tes futurs co-tenteurs</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={snoring}
              onClick={() => setSnoring(!snoring)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors duration-200",
                snoring ? "bg-pink" : "bg-charcoal/20"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                  snoring ? "translate-x-7" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <PastelButton
            type="submit"
            variant="lavender"
            fullWidth
            disabled={submitting || !name.trim()}
          >
            {submitting ? "Création en cours... 🌸" : "Add tent 🌸"}
          </PastelButton>

          {error && (
            <p className="text-xs font-semibold text-pink text-center pt-1">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
