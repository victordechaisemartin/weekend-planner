"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import PageHeader from "@/components/ui/PageHeader";
import PastelButton from "@/components/ui/PastelButton";
import CarCard, { type CarData } from "./CarCard";
import AddCarModal from "./AddCarModal";

// ── data fetching ─────────────────────────────────────────────

async function loadCars(eventId: string): Promise<CarData[]> {
  const { data: rawCars } = await supabase
    .from("cars")
    .select("*")
    .eq("event_id", eventId)
    .order("departure_datetime", { ascending: true });

  if (!rawCars || rawCars.length === 0) return [];

  const driverIds = Array.from(new Set(rawCars.map((c) => c.driver_id)));
  const carIds = rawCars.map((c) => c.id);

  const [{ data: drivers }, { data: cpRows }] = await Promise.all([
    supabase.from("users").select("id, name").in("id", driverIds),
    supabase.from("car_passengers").select("car_id, user_id").in("car_id", carIds),
  ]);

  const passengerIds = Array.from(new Set((cpRows ?? []).map((r) => r.user_id)));
  const { data: passengerUsers } = passengerIds.length
    ? await supabase.from("users").select("id, name").in("id", passengerIds)
    : { data: [] as { id: string; name: string }[] };

  return rawCars.map((car) => ({
    ...car,
    driver:
      (drivers ?? []).find((d) => d.id === car.driver_id) ??
      { id: car.driver_id, name: "Unknown" },
    passengers: (cpRows ?? [])
      .filter((cp) => cp.car_id === car.id)
      .map((cp) => (passengerUsers ?? []).find((u) => u.id === cp.user_id))
      .filter((u): u is { id: string; name: string } => !!u),
  }));
}

// ── component ─────────────────────────────────────────────────

export default function CarsClient() {
  const { user, profile, loading: authLoading } = useAuth();
  const currentUserId = user?.id ?? null;

  const [eventId, setEventId] = useState<string | null>(null);
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const refresh = useCallback(async (eId: string) => {
    const data = await loadCars(eId);
    setCars(data);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    async function init() {
      const { data: event } = await supabase
        .from("events").select("id").limit(1).maybeSingle();

      if (!event?.id) { setLoading(false); return; }
      setEventId(event.id);

      const data = await loadCars(event.id);
      setCars(data);
      setLoading(false);
    }
    init();
  }, [authLoading, user]);

  async function handleJoin(carId: string) {
    if (!currentUserId || !eventId) return;
    setBusy(true);
    await supabase
      .from("car_passengers")
      .insert({ car_id: carId, user_id: currentUserId });
    await refresh(eventId);
    setBusy(false);
  }

  async function handleLeave(carId: string) {
    if (!currentUserId || !eventId) return;
    setBusy(true);
    await supabase
      .from("car_passengers")
      .delete()
      .eq("car_id", carId)
      .eq("user_id", currentUserId);
    await refresh(eventId);
    setBusy(false);
  }

  async function handleAddCar(form: {
    address: string;
    seats: number;
    date: string;
    time: string;
  }) {
    if (!currentUserId || !eventId) return;
    const departure_datetime = new Date(`${form.date}T${form.time}:00`).toISOString();
    await supabase.from("cars").insert({
      event_id: eventId,
      driver_id: currentUserId,
      address: form.address,
      seats_total: form.seats,
      departure_datetime,
    });
    setShowModal(false);
    await refresh(eventId);
  }

  // ── derived stats ──────────────────────────────────────────

  const totalFreeSeats = cars.reduce(
    (sum, car) => sum + Math.max(0, car.seats_total - car.passengers.length),
    0
  );

  // ── render ─────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="animate-pulse text-4xl">🌸</span>
      </div>
    );
  }

  if (!user) {
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
