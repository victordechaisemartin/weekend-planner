"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const inputCls =
  "w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-charcoal " +
  "placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-pink/30 " +
  "focus:bg-white transition-colors";

const labelCls =
  "block text-[10px] font-extrabold uppercase tracking-[0.15em] text-charcoal/50 mb-2";

const submitCls =
  "w-full rounded-full bg-pink text-white py-2.5 text-sm font-semibold " +
  "shadow-[0_4px_14px_0_rgba(244,167,185,0.45)] hover:brightness-105 active:brightness-95 " +
  "transition-all disabled:opacity-40 disabled:cursor-not-allowed";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    router.push("/announcements");
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Festival wordmark */}
      <div className="px-6 pt-10 pb-4">
        <h1
          className="font-[family-name:var(--font-lilita)] text-4xl uppercase leading-none"
          style={{ WebkitTextStroke: "2px #2D2D2D", color: "white" }}
        >
          Lolapabouillet 🌸
        </h1>
        <p className="text-xs font-semibold text-charcoal/35 uppercase tracking-[0.2em] mt-1.5">
          22 Mai 2026 · Rambouillet
        </p>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
          <h2 className="font-[family-name:var(--font-lilita)] text-2xl text-charcoal leading-tight">
            Nouveau mot de passe 🌸
          </h2>

          {!ready ? (
            <div className="flex items-center justify-center py-10">
              <span className="animate-pulse text-4xl">🌸</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>
                  Nouveau mot de passe{" "}
                  <span className="normal-case font-medium text-charcoal/30">(8 caractères min)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputCls}
                />
              </div>

              {error && (
                <p className="text-xs font-medium text-pink">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className={submitCls}
              >
                {loading ? "Mise à jour…" : "Enregistrer 🌸"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
