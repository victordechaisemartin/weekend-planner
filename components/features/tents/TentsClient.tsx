"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import PageHeader from "@/components/ui/PageHeader";
import PastelButton from "@/components/ui/PastelButton";
import FlowerDivider from "@/components/ui/FlowerDivider";
import TentCard, { type TentData, type Guest } from "./TentCard";
import AddTentModal from "./AddTentModal";

// ── data fetching ─────────────────────────────────────────────

async function loadTents(eventId: string): Promise<TentData[]> {
  const { data: rawTents } = await supabase
    .from("tents")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (!rawTents?.length) return [];

  const hostIds = Array.from(new Set(rawTents.map((t) => t.host_id)));
  const tentIds = rawTents.map((t) => t.id);

  const [{ data: hosts }, { data: tgRows }] = await Promise.all([
    supabase.from("users").select("id, name").in("id", hostIds),
    supabase.from("tent_guests").select("tent_id, user_id").in("tent_id", tentIds),
  ]);

  const guestIds = Array.from(new Set((tgRows ?? []).map((r) => r.user_id)));
  const { data: guestUsers } = guestIds.length
    ? await supabase.from("users").select("id, name, snoring_warning").in("id", guestIds)
    : { data: [] as Guest[] };

  return rawTents.map((tent) => ({
    ...tent,
    host:
      (hosts ?? []).find((h) => h.id === tent.host_id) ??
      { id: tent.host_id, name: "Unknown" },
    guests: (tgRows ?? [])
      .filter((tg) => tg.tent_id === tent.id)
      .map((tg) => (guestUsers ?? []).find((u) => u.id === tg.user_id))
      .filter((u): u is Guest => !!u),
  }));
}

// ── component ─────────────────────────────────────────────────

export default function TentsClient() {
  const { user, profile, loading: authLoading } = useAuth();
  const currentUserId = user?.id ?? null;

  const [eventId, setEventId] = useState<string | null>(null);
  const [tents, setTents] = useState<TentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const refresh = useCallback(async (eId: string) => {
    const data = await loadTents(eId);
    setTents(data);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    async function init() {
      const { data: event } = await supabase
        .from("events").select("id").limit(1).maybeSingle();
      if (!event?.id) { setLoading(false); return; }
      setEventId(event.id);
      const data = await loadTents(event.id);
      setTents(data);
      setLoading(false);
    }
    init();
  }, [authLoading, user]);

  async function handleJoin(tentId: string) {
    if (!currentUserId || !eventId) return;
    setBusy(true);
    await supabase
      .from("tent_guests")
      .insert({ tent_id: tentId, user_id: currentUserId });
    await refresh(eventId);
    setBusy(false);
  }

  async function handleLeave(tentId: string) {
    if (!currentUserId || !eventId) return;
    setBusy(true);
    await supabase
      .from("tent_guests")
      .delete()
      .eq("tent_id", tentId)
      .eq("user_id", currentUserId);
    await refresh(eventId);
    setBusy(false);
  }

  async function handleRemoveGuest(tentId: string, guestId: string) {
    if (!eventId) return;
    setBusy(true);
    await supabase
      .from("tent_guests")
      .delete()
      .eq("tent_id", tentId)
      .eq("user_id", guestId);
    await refresh(eventId);
    setBusy(false);
  }

  async function handleAddTent(form: {
    name: string;
    type: string;
    capacity: number;
    snoring: boolean;
  }) {
    if (!currentUserId || !eventId) return;

    // Update snoring warning on the user's profile (silent no-op if row doesn't exist yet)
    await supabase
      .from("users")
      .update({ snoring_warning: form.snoring })
      .eq("id", currentUserId);

    await supabase.from("tents").insert({
      event_id: eventId,
      host_id: currentUserId,
      name: form.name,
      type: form.type,
      capacity: form.capacity,
    });

    setShowModal(false);
    await refresh(eventId);
  }

  // ── derived stats ──────────────────────────────────────────

  const totalFreeSpots = tents.reduce(
    (sum, t) => sum + Math.max(0, t.capacity - 1 - t.guests.length),
    0
  );

  // ── render ─────────────────────────────────────────────────

  if (authLoading || !profile || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="animate-pulse text-4xl">🌸</span>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="⛺ Where are you sleeping, flower? 🌼" />

      <div className="px-4 pb-10 space-y-4">
        {/* Stats badges */}
        {tents.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full border border-lavender/40 bg-lavender/25 px-3 py-1 text-xs font-semibold text-charcoal/60">
              ⛺ {tents.length} tent{tents.length !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-mint/40 bg-mint/25 px-3 py-1 text-xs font-semibold text-[#3a8c78]">
              🌼 {totalFreeSpots} spot{totalFreeSpots !== 1 ? "s" : ""} free
            </span>
          </div>
        )}

        {/* Tent list */}
        {tents.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-4xl">⛺</p>
            <p className="text-sm text-charcoal/40">
              No tents yet. Set up camp first!
            </p>
          </div>
        ) : (
          tents.map((tent) => (
            <TentCard
              key={tent.id}
              tent={tent}
              currentUserId={currentUserId}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onRemoveGuest={handleRemoveGuest}
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
          hostName={profile.name}
          onClose={() => setShowModal(false)}
          onSubmit={handleAddTent}
        />
      )}
    </>
  );
}
