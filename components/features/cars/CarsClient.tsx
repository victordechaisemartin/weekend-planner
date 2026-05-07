"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { getEventId } from "@/lib/constants";
import PageHeader from "@/components/ui/PageHeader";
import PastelButton from "@/components/ui/PastelButton";
import CarCard, { type CarData } from "./CarCard";
import AddCarModal from "./AddCarModal";

// ── types ─────────────────────────────────────────────────────

type RawPassengerRef = { user: { id: string; name: string } | null };

type RawCarRow = {
  id: string;
  event_id: string;
  driver_id: string;
  name: string | null;
  address: string;
  seats_total: number;
  departure_datetime: string;
  driver: { id: string; name: string } | null;
  car_passengers: RawPassengerRef[];
};

// ── data fetching ─────────────────────────────────────────────

async function loadCars(): Promise<CarData[]> {
  const eventId = await getEventId();
  if (!eventId) return [];

  const { data: raw } = await supabase
    .from("cars")
    .select(`
      *,
      driver:users!driver_id(id, name),
      car_passengers(user:users(id, name))
    `)
    .eq("event_id", eventId)
    .order("departure_datetime", { ascending: true });

  return ((raw ?? []) as unknown as RawCarRow[]).map((row) => ({
    id: row.id,
    event_id: row.event_id,
    driver_id: row.driver_id,
    // Fall back to "<driver>'s car" for cars created before the name column existed
    name: row.name ?? `${row.driver?.name ?? "Unknown"}'s car`,
    address: row.address,
    seats_total: row.seats_total,
    departure_datetime: row.departure_datetime,
    driver: row.driver ?? { id: row.driver_id, name: "Unknown" },
    passengers: (row.car_passengers ?? [])
      .map((cp) => cp.user)
      .filter((u): u is { id: string; name: string } => u !== null),
  }));
}

// ── component ─────────────────────────────────────────────────

export default function CarsClient() {
  // useAuth is only needed for user-specific UI (your car, join/leave buttons).
  // Data fetching starts immediately on mount — it does not wait for auth.
  const { user, profile, loading: authLoading } = useAuth();
  const currentUserId = user?.id ?? null;

  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [joinToast, setJoinToast] = useState(false);
  const [editToast, setEditToast] = useState(false);

  // Fires immediately — Supabase client uses the stored token without waiting
  // for onAuthStateChange to propagate through React state.
  useEffect(() => {
    loadCars().then((data) => {
      setCars(data);
      setLoading(false);
    });
  }, []);

  const refresh = useCallback(async () => {
    const data = await loadCars();
    setCars(data);
  }, []);

  async function handleJoin(carId: string) {
    // Fall back to getSession() if useAuth hasn't propagated yet — this ensures
    // the user ID is always available even if onAuthStateChange fires after mount.
    const userId = currentUserId
      ?? (await supabase.auth.getSession()).data.session?.user?.id
      ?? null;
    console.log("joining car:", carId, "user:", userId);
    if (!userId) return;
    const car = cars.find((c) => c.id === carId);
    if (car && userId === car.driver_id) {
      console.warn("Driver cannot join their own car");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("car_passengers")
      .insert({ car_id: carId, user_id: userId });
    if (error) {
      console.error("join car error:", error);
      setBusy(false);
      return;
    }
    await refresh();
    setBusy(false);
    setJoinToast(true);
    setTimeout(() => setJoinToast(false), 2000);
  }

  async function handleLeave(carId: string) {
    const userId = currentUserId
      ?? (await supabase.auth.getSession()).data.session?.user?.id
      ?? null;
    if (!userId) return;
    setBusy(true);
    await supabase
      .from("car_passengers")
      .delete()
      .eq("car_id", carId)
      .eq("user_id", userId);
    await refresh();
    setBusy(false);
  }

  async function handleEdit(carId: string, form: { address: string; date: string; time: string; seats: number }) {
    const car = cars.find((c) => c.id === carId);
    const departure_datetime = new Date(`${form.date}T${form.time}:00`).toISOString();

    if (car && form.seats < car.passengers.length) {
      const toRemove = car.passengers.length - form.seats;
      const passengersToRemove = car.passengers.slice(-toRemove);
      const names = passengersToRemove.map((p) => p.name).join(", ");
      const confirmed = window.confirm(
        `Réduire à ${form.seats} place(s) supprimera ${toRemove} passager(s) : ${names}. Confirmer ?`
      );
      if (!confirmed) return;

      await supabase
        .from("car_passengers")
        .delete()
        .in("user_id", passengersToRemove.map((p) => p.id))
        .eq("car_id", carId);
    }

    await supabase.from("cars")
      .update({ address: form.address, departure_datetime, seats_total: form.seats })
      .eq("id", carId);
    await refresh();
    setEditToast(true);
    setTimeout(() => setEditToast(false), 2000);
  }

  async function handleDelete(carId: string) {
    await supabase.from("car_passengers").delete().eq("car_id", carId);
    await supabase.from("cars").delete().eq("id", carId);
    await refresh();
  }

  async function handleAddCar(form: {
    address: string;
    seats: number;
    date: string;
    time: string;
  }) {
    if (!currentUserId) return;
    const eventId = await getEventId();
    if (!eventId) return;
    setAddError(null);
    const departure_datetime = new Date(`${form.date}T${form.time}:00`).toISOString();
    const carName = profile?.name ? `${profile.name}'s car` : "My car";
    const { error } = await supabase.from("cars").insert({
      event_id: eventId,
      driver_id: currentUserId,
      name: carName,
      address: form.address,
      seats_total: form.seats,
      departure_datetime,
    });
    if (error) {
      console.error("add car error:", error);
      setAddError(error.message);
      return;
    }
    setShowModal(false);
    await refresh();
  }

  // ── derived stats ──────────────────────────────────────────

  const totalFreeSeats = cars.reduce(
    (sum, car) => sum + Math.max(0, car.seats_total - car.passengers.length),
    0
  );

  // ── render ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3 px-4 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-pink/20 rounded-2xl h-32" />
        ))}
      </div>
    );
  }

  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 px-4">
        <p className="text-sm text-charcoal/60 text-center">
          Connecte-toi pour ajouter ta voiture 🌸
        </p>
        <Link href="/auth" className="text-sm font-semibold text-pink hover:underline">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Cars 🚗" subtitle="Coordinate your road trip" />

      <div className="px-4 pb-28 space-y-4">
        {/* Stats row */}
        {cars.length > 0 && (
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-mint/40 bg-mint/25 px-3 py-1 text-xs font-semibold text-[#3a8c78]">
              🚗 {cars.length} car{cars.length !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-mint/40 bg-mint/25 px-3 py-1 text-xs font-semibold text-[#3a8c78]">
              🌱 {totalFreeSeats} seat{totalFreeSeats !== 1 ? "s" : ""} free
            </span>
          </div>
        )}

        {/* Join toast */}
        {joinToast && (
          <div className="rounded-2xl bg-mint/30 border border-mint/40 px-4 py-3 text-center">
            <p className="text-sm font-bold text-[#3a8c78]">Tu as rejoint cette voiture 🌸</p>
          </div>
        )}

        {/* Edit toast */}
        {editToast && (
          <div className="rounded-2xl bg-lavender/30 border border-lavender/40 px-4 py-3 text-center">
            <p className="text-sm font-bold text-charcoal/70">Voiture mise à jour 🌸</p>
          </div>
        )}

        {/* Car list */}
        {cars.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-4xl">🚗</p>
            <p className="text-sm text-charcoal/40">
              No cars yet. Be the first to add one!
            </p>
          </div>
        ) : (
          cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              currentUserId={currentUserId}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onEdit={handleEdit}
              onDelete={handleDelete}
              busy={busy}
            />
          ))
        )}

        {/* Add car button */}
        <PastelButton
          variant="pink"
          fullWidth
          onClick={() => setShowModal(true)}
        >
          + Add my car 🚗
        </PastelButton>
      </div>

      {showModal && (
        <AddCarModal
          driverName={profile?.name ?? ""}
          error={addError}
          onClose={() => { setShowModal(false); setAddError(null); }}
          onSubmit={handleAddCar}
        />
      )}
    </>
  );
}
