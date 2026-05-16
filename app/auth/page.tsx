"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// ── constants ─────────────────────────────────────────────────

const DIETARY_OPTIONS = [
  { key: "vegetarian", label: "🥬 Végétarien·ne"       },
  { key: "no-pork",    label: "🐷 Sans porc"           },
  { key: "lactose",    label: "🥛 Intolérant·e lactose" },
];

const DRINK_LEVELS = [
  { value: 0, label: "Rien"   },
  { value: 1, label: "Peu"    },
  { value: 2, label: "Moyen"  },
  { value: 3, label: "Beauf"  },
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

const linkCls = "font-semibold text-pink hover:underline";

// ── page ──────────────────────────────────────────────────────

type Mode = "signin" | "signup" | "forgot" | "verify" | "reset";

const TITLES: Record<Mode, string> = {
  signin: "Bon retour 🌸",
  signup: "Rejoins Lolapabouillet 🌸",
  forgot: "Réinitialiser mon mot de passe 🌸",
  verify: "Vérifie ton email 🌸",
  reset:  "Nouveau mot de passe 🌸",
};

export default function AuthPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let recoveryDetected = false;

    // Subscribe first — onAuthStateChange fires PASSWORD_RECOVERY synchronously
    // when a session was created from a reset link, before getSession resolves.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryDetected = true;
        setMode("reset");
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (recoveryDetected) return;
      if (session) router.replace("/announcements");
      else setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // ── state ──────────────────────────────────────────────────

  const [mode, setMode] = useState<Mode>("signin");

  // shared across all modes
  const [email,          setEmail]         = useState("");
  const [password,       setPassword]      = useState("");
  const [error,          setError]         = useState("");
  const [loading,        setLoading]       = useState(false);
  const [showSignupHint, setShowSignupHint] = useState(false);

  // signup-only
  const [name,         setName]        = useState("");
  const [dietary,      setDietary]     = useState<string[]>([]);
  const [beerLevel,    setBeerLevel]   = useState(0);
  const [wineLevel,    setWineLevel]   = useState(0);
  const [spiritsLevel, setSpiritLevel] = useState(0);

  // forgot/verify-only
  const [otpCode, setOtpCode] = useState("");

  // reset-only
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setShowSignupHint(false);
  }

  function toggleDietary(key: string) {
    setDietary((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }

  // ── sign in ────────────────────────────────────────────────

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authErr) {
      setError("Email ou mot de passe incorrect 🌸");
      setShowSignupHint(true);
      setLoading(false);
      return;
    }

    router.push("/announcements");
  }

  // ── sign up ────────────────────────────────────────────────

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);

    const { data, error: authErr } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authErr) {
      const msg = authErr.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        setError("Cet email est déjà utilisé 🌸 Connecte-toi plutôt !");
      } else {
        setError(authErr.message);
      }
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { error: upsertErr } = await supabase.from("users").upsert({
        id:              userId,
        name:            name.trim(),
        dietary:         serializeDietary(dietary),
        beer_level:      beerLevel,
        wine_level:      wineToText(wineLevel),
        spirits_level:   spiritsLevel,
        snoring_warning: false,
      });
      if (upsertErr) console.error("users row creation failed:", upsertErr);
    }

    router.push("/announcements");
  }

  // ── update password (after reset link) ─────────────────────

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas 🌸");
      return;
    }

    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    router.push("/announcements");
  }

  // ── forgot password — send OTP ─────────────────────────────

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });

    setLoading(false);

    if (otpErr) {
      setError(otpErr.message);
      return;
    }

    setMode("verify");
    setError("");
  }

  // ── verify OTP ─────────────────────────────────────────────

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otpCode,
      type:  "email",
    });

    setLoading(false);

    if (verifyErr) {
      setError(verifyErr.message);
      return;
    }

    setMode("reset");
    setError("");
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

          {/* Form title */}
          <h2 className="font-[family-name:var(--font-lilita)] text-2xl text-charcoal leading-tight">
            {TITLES[mode]}
          </h2>

          {/* ── SIGN IN ── */}
          {mode === "signin" && (
            <form onSubmit={handleSignin} className="space-y-4">
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Mot de passe</label>
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
                <div className="space-y-1">
                  <p className="text-xs font-medium text-pink">{error}</p>
                  {showSignupHint && (
                    <p className="text-xs text-charcoal/50">
                      Pas encore de compte ?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("signup")}
                        className={linkCls}
                      >
                        Rejoins-nous →
                      </button>
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className={submitCls}
              >
                {loading ? "Connexion…" : "Se connecter 🌸"}
              </button>

              <div className="space-y-2 text-center">
                <p className="text-xs text-charcoal/40">
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className={linkCls}
                  >
                    Mot de passe oublié ?
                  </button>
                </p>
                <p className="text-xs text-charcoal/40">
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className={linkCls}
                  >
                    Rejoins-nous
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ── SIGN UP ── */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className={labelCls}>Ton prénom</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Fleur"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Mot de passe{" "}
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

              {/* Dietary */}
              <div>
                <label className={labelCls}>
                  Régime alimentaire{" "}
                  <span className="normal-case font-medium text-charcoal/30">(optionnel)</span>
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

              <DrinkBar label="Bière 🍺"        value={beerLevel}    onChange={setBeerLevel}   />
              <DrinkBar label="Vin 🍷"          value={wineLevel}    onChange={setWineLevel}   />
              <DrinkBar label="Alcool fort 🥃"  value={spiritsLevel} onChange={setSpiritLevel} />

              {/* Floral reminder */}
              <div className="rounded-2xl bg-pink/15 border border-pink/25 px-4 py-3.5">
                <p className="text-sm font-semibold text-charcoal leading-snug">
                  🌸 Tenue florale obligatoire — fleurs, pétales, jardins
                </p>
              </div>

              {error && (
                <p className="text-xs font-semibold text-pink">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim() || !email.trim() || !password}
                className={submitCls}
              >
                {loading ? "Création du compte…" : "Créer mon compte 🌸"}
              </button>

              <p className="text-center text-xs text-charcoal/40">
                Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className={linkCls}
                >
                  Se connecter
                </button>
              </p>
            </form>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  required
                  className={inputCls}
                />
              </div>

              {error && (
                <p className="text-xs font-medium text-pink">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className={submitCls}
              >
                {loading ? "Envoi…" : "Envoyer le code 🌸"}
              </button>

              <p className="text-center text-xs text-charcoal/40">
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className={linkCls}
                >
                  Retour à la connexion
                </button>
              </p>
            </form>
          )}

          {/* ── VERIFY OTP ── */}
          {mode === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-2xl bg-mint/20 border border-mint/30 px-4 py-3">
                <p className="text-sm font-semibold text-charcoal leading-snug">
                  📧 Un code à 6 chiffres t&apos;a été envoyé !<br />
                  Entre-le ci-dessous 🌸
                </p>
              </div>

              <div>
                <label className={labelCls}>Code de vérification</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  className={`${inputCls} text-center text-xl tracking-widest font-mono`}
                />
              </div>

              {error && (
                <p className="text-xs font-medium text-pink">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className={submitCls}
              >
                {loading ? "Vérification…" : "Vérifier le code 🌸"}
              </button>

              <p className="text-center text-xs text-charcoal/40">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className={linkCls}
                >
                  Retour
                </button>
              </p>
            </form>
          )}

          {/* ── RESET PASSWORD (from email link) ── */}
          {mode === "reset" && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className={labelCls}>Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                disabled={loading || !newPassword || !confirmPassword}
                className={submitCls}
              >
                {loading ? "Mise à jour…" : "Mettre à jour 🌸"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
