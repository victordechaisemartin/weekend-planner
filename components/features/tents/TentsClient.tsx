"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { getEventId } from "@/lib/constants";
import PageHeader from "@/components/ui/PageHeader";
import PastelButton from "@/components/ui/PastelButton";
import FlowerDivider from "@/components/ui/FlowerDivider";
import TentCard, { type TentData, type Guest } from "./TentCard";
import AddTentModal from "./AddTentModal";

// ── types ─────────────────────────────────────────────────────

type RawGuestRef = { user: { id: string; name: string; snoring_warning: boolean } | null };

type RawTentRow = {
  id: string;
  event_id: string;
  host_id: string;
  name: string;
  type: string;
  capacity: number;
  host: { id: string; name: string; snoring_warning: boolean } | null;
  tent_guests: RawGuestRef[];
};

// ── data fetching ─────────────────────────────────────────────

async function loadTents(): Promise<TentData[]> {
  const eventId = await getEventId();
  if (!eventId) return [];

  const { data: raw } = await supabase
    .from("tents")
    .select(`
      *,
      host:users!host_id(id, name, snoring_warning),
      tent_guests(user:users(id, name, snoring_warning))
    `)
    .eq("event_id", eventId);

  return ((raw ?? []) as unknown as RawTentRow[]).map((row) => ({
    id: row.id,
    event_id: row.event_id,
    host_id: row.host_id,
    name: row.name,
    type: row.type,
    capacity: row.capacity,
    host: row.host ?? { id: row.host_id, name: "Unknown", snoring_warning: false },
    guests: (row.tent_guests ?? [])
      .map((tg) => tg.user)
      .filter((u): u is Guest => u !== null),
  }));
}

// ── component ─────────────────────────────────────────────────

export default function TentsClient() {
  // useAuth is only needed for user-specific UI (your tent, join/leave buttons).
  // Data fetching starts immediately on mount — it does not wait for auth.
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const currentUserId = user?.id ?? null;

  const [tents, setTents] = useState<TentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Fires immediately — Supabase client uses the stored token without waiting
  // for onAuthStateChange to propagate through React state.
  useEffect(() => {
    loadTents().then((data) => {
      setTents(data);
      setLoading(false);
    });
  }, []);

  const refresh = useCallback(async () => {
    const data = await loadTents();
    setTents(data);
  }, []);

  async function handleJoin(tentId: string) {
    if (!currentUserId) return;
    setBusy(true);
    await supabase
      .from("tent_guests")
      .insert({ tent_id: tentId, user_id: currentUserId });
    await refresh();
    setBusy(false);
  }

  async function handleLeave(tentId: string) {
    if (!currentUserId) return;
    setBusy(true);
    await supabase
      .from("tent_guests")
      .delete()
      .eq("tent_id", tentId)
      .eq("user_id", currentUserId);
    await refresh();
    setBusy(false);
  }

  async function handleRemoveGuest(tentId: string, guestId: string) {
    setBusy(true);
    await supabase
      .from("tent_guests")
      .delete()
      .eq("tent_id", tentId)
      .eq("user_id", guestId);
    await refresh();
    setBusy(false);
  }

  async function handleEdit(tentId: string, name: string, type: string, capacity: number) {
    await supabase.from("tents").update({ name, type, capacity }).eq("id", tentId);
    await refresh();
  }

  async function handleDelete(tentId: string) {
    await supabase.from("tent_guests").delete().eq("tent_id", tentId);
    await supabase.from("tents").delete().eq("id", tentId);
    await refresh();
  }

  async function handleAddTent(form: {
    name: string;
    type: string;
    capacity: number;
    snoring: boolean;
  }) {
    console.log("submitting tent:", form);

    // Fall back to getSession() if useAuth hasn't propagated yet
    const userId = currentUserId
      ?? (await supabase.auth.getSession()).data.session?.user?.id
      ?? null;
    console.log("user id:", userId);

    if (!userId) {
      console.warn("handleAddTent: no user id, aborting");
      setAddError("Connecte-toi pour ajouter une tente 🌸");
      return;
    }

    const eventId = await getEventId();
    console.log("event id:", eventId);

    if (!eventId) {
      console.warn("handleAddTent: no event id, aborting");
      setAddError("Erreur lors de la création 🌸 Réessaie !");
      return;
    }

    setAddError(null);

    await supabase
      .from("users")
      .update({ snoring_warning: form.snoring })
      .eq("id", userId);

    const { data, error } = await supabase.from("tents").insert({
      event_id: eventId,
      host_id: userId,
      name: form.name,
      type: form.type,
      capacity: form.capacity,
    });

    console.log("supabase response:", data, error);

    if (error) {
      console.error("add tent error:", error);
      setAddError("Erreur lors de la création 🌸 Réessaie !");
      throw new Error(error.message);
    }

    console.log("tent created, closing modal");
    setShowModal(false);
    await refresh();
  }

  // ── derived stats ──────────────────────────────────────────

  const TYPE_ORDER: Record<string, number> = { Tent: 0, Van: 1, Room: 2 };
  const sortedTents   = [...tents].sort(
    (a, b) => (TYPE_ORDER[a.type] ?? 0) - (TYPE_ORDER[b.type] ?? 0)
  );
  const tentCount     = tents.filter((t) => t.type !== "Room").length;
  const roomCount     = tents.filter((t) => t.type === "Room").length;
  const tentFreeSpots = tents
    .filter((t) => t.type !== "Room")
    .reduce((sum, t) => sum + Math.max(0, t.capacity - t.guests.length), 0);
  const roomFreeSpots = tents
    .filter((t) => t.type === "Room")
    .reduce((sum, t) => sum + Math.max(0, t.capacity - t.guests.length), 0);

  // ── render ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3 px-4 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-lavender/30 rounded-2xl h-32" />
        ))}
      </div>
    );
  }

  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 px-4">
        <p className="text-sm text-charcoal/60 text-center">
          Connecte-toi pour ajouter ta tente 🌸
        </p>
        <Link href="/auth" className="text-sm font-semibold text-pink hover:underline">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="⛺ Where are you sleeping, flower? 🌼" />

      <div className="px-4 pb-28 space-y-4">
        {/* Stats badges */}
        <div className="space-y-2">
          {tentCount > 0 && (
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-lavender/40 bg-lavender/25 px-3 py-1 text-xs font-semibold text-[#7c6db8]">
                🏕️ {tentCount} tente{tentCount !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-mint/40 bg-mint/25 px-3 py-1 text-xs font-semibold text-[#3a8c78]">
                🌼 {tentFreeSpots} place{tentFreeSpots !== 1 ? "s" : ""} libre{tentFreeSpots !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {roomCount > 0 && (
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-pink/40 bg-pink/25 px-3 py-1 text-xs font-semibold text-[#c4708a]">
                🏠 {roomCount} chambre{roomCount !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-mint/40 bg-mint/25 px-3 py-1 text-xs font-semibold text-[#3a8c78]">
                🌼 {roomFreeSpots} place{roomFreeSpots !== 1 ? "s" : ""} libre{roomFreeSpots !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Tent list */}
        {tents.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-4xl">⛺</p>
            <p className="text-sm text-charcoal/40">
              No tents yet. Set up camp first!
            </p>
          </div>
        ) : (
          sortedTents.map((tent) => (
            <TentCard
              key={tent.id}
              tent={tent}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onRemoveGuest={handleRemoveGuest}
              onEdit={handleEdit}
              onDelete={handleDelete}
              busy={busy}
            />
          ))
        )}

        <FlowerDivider />

        {/* Add tent CTA */}
        <PastelButton
          variant="lavender"
          fullWidth
          onClick={() => setShowModal(true)}
        >
          + Add my tent 🌸
        </PastelButton>
      </div>

      {showModal && (
        <AddTentModal
          hostName={profile?.name ?? ""}
          isAdmin={isAdmin}
          error={addError}
          onClose={() => { setShowModal(false); setAddError(null); }}
          onSubmit={handleAddTent}
        />
      )}
    </>
  );
}
