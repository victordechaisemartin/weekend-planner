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
    if (!currentUserId) return;
    setBusy(true);
    await supabase
      .from("car_passengers")
      .insert({ car_id: carId, user_id: currentUserId });
    await refresh();
    setBusy(false);
  }

  async function handleLeave(carId: string) {
    if (!currentUserId) return;
    setBusy(true);
    await supabase
      .from("car_passengers")
      .delete()
      .eq("car_id", carId)
      .eq("user_id", currentUserId);
    await refresh();
    setBusy(false);
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
    const departure_datetime = new Date(`${form.date}T${form.time}:00`).toISOString();
    await supabase.from("cars").insert({
      event_id: eventId,
      driver_id: currentUserId,
      address: form.address,
      seats_total: form.seats,
      departure_datetime,
    });
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

      <div className="px-4 pb-10 space-y-4">
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
          onClose={() => setShowModal(false)}
          onSubmit={handleAddCar}
        />
      )}
    </>
  );
}
