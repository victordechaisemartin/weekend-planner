"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// ── constants ─────────────────────────────────────────────────

const DIETARY_OPTIONS = [
  { key: "vegetarian", label: "🥬 Vegetarian"         },
  { key: "no-pork",    label: "🐷 No pork"            },
  { key: "lactose",    label: "🥛 Lactose intolerant" },
];

const DRINK_LEVELS = [
  { value: 0, label: "None"   },
  { value: 1, label: "Low"    },
  { value: 2, label: "Medium" },
  { value: 3, label: "Heavy"  },
];

const WINE_LEVELS = ["none", "low", "medium", "heavy"] as const;

// ── helpers ───────────────────────────────────────────────────

function serializeDietary(s: string[]): string | null {
  return s.length ? s.join(",") : null;
}

function wineToText(n: number): string {
  return WINE_LEVELS[n] ?? "none";
}

// ── sub-components ────────────────────────────────────────────

function DrinkBar({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-charcoal/50 mb-2">
        {label}
      </label>
      <div className="flex rounded-2xl bg-gray-100 p-0.5 gap-0.5">
        {DRINK_LEVELS.map(({ value: v, label: l }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-150",
              value === v
                ? "bg-lavender text-charcoal shadow-sm"
                : "text-charcoal/40 hover:text-charcoal/65"
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────

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

// ── page ──────────────────────────────────────────────────────

type Mode = "signup" | "signin";

export default function AuthPage() {
  const router = useRouter();

  // If a valid session already exists, skip the form entirely
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/announcements");
      else setCheckingSession(false);
    });
  }, [router]);

  const [mode, setMode] = useState<Mode>("signup");

  // Shared fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Signup-only fields
  const [name,         setName]        = useState("");
  const [dietary,      setDietary]     = useState<string[]>([]);
  const [beerLevel,    setBeerLevel]   = useState(0);
  const [wineLevel,    setWineLevel]   = useState(0);
  const [spiritsLevel, setSpiritLevel] = useState(0);

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
  }

  function toggleDietary(key: string) {
    setDietary((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }

  // ── sign up ────────────────────────────────────────────────

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username.trim())) {
      setError("Username: lowercase letters, numbers and underscores only.");
      return;
    }

    setLoading(true);
    const email = `${username.trim()}@lolapabouillet.fr`;

    const { data, error: authErr } = await supabase.auth.signUp({ email, password });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      await supabase.from("users").upsert({
        id:              userId,
        name:            name.trim(),
        dietary:         serializeDietary(dietary),
        beer_level:      beerLevel,
        wine_level:      wineToText(wineLevel),
        spirits_level:   spiritsLevel,
        snoring_warning: false,
      });
    }

    // Requires "Enable email confirmations" = OFF in Supabase dashboard
    // Authentication → Settings → Enable email confirmations → OFF
    router.push("/announcements");
  }

  // ── sign in ────────────────────────────────────────────────

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = `${username.trim().toLowerCase()}@lolapabouillet.fr`;
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError("Wrong username or password.");
      setLoading(false);
      return;
    }

    router.push("/announcements");
  }

  // ── render ─────────────────────────────────────────────────

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <span className="animate-pulse text-4xl">🌸</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Festival header */}
      <div className="px-6 pt-10 pb-4 space-y-1.5">
        <h1
          className="font-[family-name:var(--font-lilita)] text-4xl uppercase leading-none"
          style={{ WebkitTextStroke: "2px #2D2D2D", color: "white" }}
        >
          Lolapabouillet 🌸
        </h1>
        <p className="text-xs font-semibold text-charcoal/35 uppercase tracking-[0.2em]">
          {mode === "signup" ? "Join the festival · 22 May 2026" : "Welcome back 🌸"}
        </p>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-5">

          {/* ── SIGNUP ── */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className={labelCls}>Your name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Fleur Dupont" required className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>
                  Username{" "}
                  <span className="normal-case font-medium text-charcoal/30">
                    (a–z, 0–9, _)
                  </span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
                  placeholder="fleur"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Password{" "}
                  <span className="normal-case font-medium text-charcoal/30">(min 8 chars)</span>
                </label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required className={inputCls} />
              </div>

              {/* Dietary */}
              <div>
                <label className={labelCls}>
                  Dietary preferences{" "}
                  <span className="normal-case font-medium text-charcoal/30">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDietary(key)}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-sm font-semibold border transition-all duration-150",
                        dietary.includes(key)
                          ? "bg-mint text-charcoal border-mint/50 shadow-sm"
                          : "bg-gray-100 text-charcoal/55 border-transparent hover:bg-gray-200"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <DrinkBar label="Drinking 🍺 Beer"        value={beerLevel}    onChange={setBeerLevel}   />
              <DrinkBar label="Drinking 🍷 Wine"        value={wineLevel}    onChange={setWineLevel}   />
              <DrinkBar label="Drinking 🥃 Hard liquor" value={spiritsLevel} onChange={setSpiritLevel} />

              {/* Floral reminder */}
              <div className="rounded-2xl bg-pink/15 border border-pink/25 px-4 py-3.5">
                <p className="text-sm font-semibold text-charcoal leading-snug">
                  🌸 Floral outfits only — flowers, petals, garden vibes
                </p>
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <button type="submit" disabled={loading || !name.trim() || !username.trim() || !password}
                className={submitCls}>
                {loading ? "Creating account…" : "Join Event 🌸"}
              </button>
            </form>
          )}

          {/* ── SIGNIN ── */}
          {mode === "signin" && (
            <form onSubmit={handleSignin} className="space-y-5">
              <div>
                <label className={labelCls}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
                  placeholder="fleur"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required className={inputCls} />
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <button type="submit" disabled={loading || !username.trim() || !password}
                className={submitCls}>
                {loading ? "Signing in…" : "Sign in 🌸"}
              </button>
            </form>
          )}

          {/* Mode toggle */}
          <p className="text-center text-xs text-charcoal/40">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("signin")}
                  className="font-semibold text-pink hover:underline">
                  Sign in
                </button>
              </>
            ) : (
              <>
                First time?{" "}
                <button type="button" onClick={() => switchMode("signup")}
                  className="font-semibold text-pink hover:underline">
                  Join the event
                </button>
              </>
            )}
          </p>

        </div>
      </div>
    </div>
  );
}
