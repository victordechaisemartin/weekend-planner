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
import type { Bike } from "@/lib/types";

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
  note: string | null;
  stops: string[] | null;
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
    note: row.note ?? null,
    stops: (row.stops ?? []) as string[],
    driver: row.driver ?? { id: row.driver_id, name: "Unknown" },
    passengers: (row.car_passengers ?? [])
      .map((cp) => cp.user)
      .filter((u): u is { id: string; name: string } => u !== null),
  }));
}

async function loadBikes(): Promise<Bike[]> {
  const eventId = await getEventId();
  console.log("[bikes] eventId:", eventId);
  if (!eventId) return [];

  const { data: rawBikes, error } = await supabase
    .from("bikes")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  console.log("[bikes] raw fetch:", rawBikes?.length ?? 0, "rows — error:", error);
  if (!rawBikes?.length) return [];

  // Fetch rider names separately — avoids FK schema-cache dependency
  const riderIds = Array.from(new Set(rawBikes.map((b) => b.rider_id)));
  const { data: riders } = await supabase
    .from("users")
    .select("id, name")
    .in("id", riderIds);

  return rawBikes.map((bike) => ({
    ...bike,
    rider: (riders ?? []).find((r) => r.id === bike.rider_id) ?? undefined,
  })) as Bike[];
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── shared modal styles ───────────────────────────────────────

const inputCls =
  "w-full rounded-2xl bg-white/80 border border-white px-4 py-2.5 text-sm text-charcoal " +
  "placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-lavender/40";

const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-charcoal/40 mb-1.5";

// ── component ─────────────────────────────────────────────────

export default function CarsClient() {
  // useAuth is only needed for user-specific UI (your car, join/leave buttons).
  // Data fetching starts immediately on mount — it does not wait for auth.
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const currentUserId = user?.id ?? null;

  const [cars, setCars] = useState<CarData[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBikeModal, setShowBikeModal] = useState(false);
  const [bikeAddress, setBikeAddress] = useState("");
  const [bikeDate, setBikeDate] = useState("");
  const [bikeTime, setBikeTime] = useState("09:00");
  const [bikeModel, setBikeModel] = useState("");
  const [bikeNote, setBikeNote] = useState("");
  const [bikeAddError, setBikeAddError] = useState<string | null>(null);
  const [bikeAdding, setBikeAdding] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [bikeEditAddress, setBikeEditAddress] = useState("");
  const [bikeEditDate, setBikeEditDate] = useState("");
  const [bikeEditTime, setBikeEditTime] = useState("09:00");
  const [bikeEditModel, setBikeEditModel] = useState("");
  const [bikeEditNote, setBikeEditNote] = useState("");
  const [bikeEditError, setBikeEditError] = useState<string | null>(null);
  const [bikeEditing, setBikeEditing] = useState(false);
  const [confirmDeleteBikeId, setConfirmDeleteBikeId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [joinToast, setJoinToast] = useState(false);
  const [editToast, setEditToast] = useState(false);

  // Fires immediately — Supabase client uses the stored token without waiting
  // for onAuthStateChange to propagate through React state.
  useEffect(() => {
    Promise.all([loadCars(), loadBikes()]).then(([carsData, bikesData]) => {
      console.log("[init] bikes loaded:", bikesData.length);
      setCars(carsData);
      setBikes(bikesData);
      setLoading(false);
    });
  }, []);

  const refresh = useCallback(async () => {
    const [carsData, bikesData] = await Promise.all([loadCars(), loadBikes()]);
    setCars(carsData);
    setBikes(bikesData);
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

  async function handleRemovePassenger(carId: string, passengerId: string) {
    await supabase
      .from("car_passengers")
      .delete()
      .eq("car_id", carId)
      .eq("user_id", passengerId);
    await refresh();
  }

  async function handleEdit(carId: string, form: { address: string; date: string; time: string; seats: number; note: string | null; stops: string[] }) {
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
      .update({ address: form.address, departure_datetime, seats_total: form.seats, note: form.note ?? null, stops: form.stops ?? [] })
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
    note: string | null;
    stops: string[];
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
      note: form.note ?? null,
      stops: form.stops ?? [],
    });
    if (error) {
      console.error("add car error:", error);
      setAddError(error.message);
      return;
    }
    setShowModal(false);
    await refresh();
  }

  async function handleAddBike() {
    setBikeAddError(null);
    const userId = currentUserId
      ?? (await supabase.auth.getSession()).data.session?.user?.id
      ?? null;
    if (!userId) { setBikeAddError("Tu n'es pas connecté·e."); return; }
    const eventId = await getEventId();
    if (!eventId) { setBikeAddError("Événement introuvable."); return; }

    const departure_datetime =
      bikeDate && bikeTime
        ? new Date(`${bikeDate}T${bikeTime}`).toISOString()
        : null;

    setBikeAdding(true);
    console.log("[addBike] inserting…", { eventId, userId, departure_datetime });
    const { error } = await supabase.from("bikes").insert({
      event_id: eventId,
      rider_id: userId,
      departure_address: bikeAddress.trim() || null,
      departure_datetime,
      bike_model: bikeModel.trim() || null,
      note: bikeNote.trim() || null,
    });
    setBikeAdding(false);

    if (error) {
      console.error("[addBike] insert error:", error);
      setBikeAddError(error.message);
      return;
    }
    console.log("[addBike] success — refreshing bikes…");
    closeBikeModal();
    await refresh();
  }

  async function handleRemoveBike(bikeId: string) {
    const { error } = await supabase.from("bikes").delete().eq("id", bikeId);
    if (error) { console.error("[removeBike] error:", error); return; }
    setConfirmDeleteBikeId(null);
    await refresh();
  }

  function openBikeModal() {
    setBikeAddress("");
    setBikeDate("");
    setBikeTime("09:00");
    setBikeModel("");
    setBikeNote("");
    setBikeAddError(null);
    setShowBikeModal(true);
  }

  function closeBikeModal() {
    setShowBikeModal(false);
    setBikeAddError(null);
  }

  function openEditBike(bike: Bike) {
    setBikeEditAddress(bike.departure_address ?? "");
    if (bike.departure_datetime) {
      const d = new Date(bike.departure_datetime);
      setBikeEditDate(d.toISOString().slice(0, 10));
      setBikeEditTime(d.toTimeString().slice(0, 5));
    } else {
      setBikeEditDate("");
      setBikeEditTime("09:00");
    }
    setBikeEditModel(bike.bike_model ?? "");
    setBikeEditNote(bike.note ?? "");
    setBikeEditError(null);
    setEditingBike(bike);
  }

  async function handleEditBike() {
    if (!editingBike) return;
    setBikeEditError(null);
    setBikeEditing(true);

    const departure_datetime =
      bikeEditDate && bikeEditTime
        ? new Date(`${bikeEditDate}T${bikeEditTime}`).toISOString()
        : null;

    const { error } = await supabase
      .from("bikes")
      .update({
        departure_address: bikeEditAddress.trim() || null,
        departure_datetime,
        bike_model: bikeEditModel.trim() || null,
        note: bikeEditNote.trim() || null,
      })
      .eq("id", editingBike.id);

    setBikeEditing(false);

    if (error) {
      setBikeEditError(error.message);
      return;
    }
    setEditingBike(null);
    await refresh();
  }

  // ── derived stats ──────────────────────────────────────────

  const totalFreeSeats = cars.reduce(
    (sum, car) => sum + Math.max(0, car.seats_total - car.passengers.length),
    0
  );
  const myBike = bikes.find((b) => b.rider_id === currentUserId);

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
              isAdmin={isAdmin}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onRemovePassenger={handleRemovePassenger}
              onEdit={handleEdit}
              onDelete={handleDelete}
              busy={busy}
            />
          ))
        )}

        {/* ── Bikes section ── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-charcoal/70">🚲 Cyclistes</span>
            {bikes.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-lavender/40 bg-lavender/25 px-3 py-1 text-xs font-semibold text-[#7c6db8]">
                {bikes.length} cycliste{bikes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {bikes.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-sm text-charcoal/40">Pas encore de cyclistes 🚲</p>
            </div>
          )}

          {bikes.map((bike) => (
            <article
              key={bike.id}
              className="rounded-3xl bg-cream border border-white/60 shadow-[0_2px_16px_0_rgba(45,45,45,0.07)] border-l-4 border-l-lavender overflow-hidden"
            >
              <div className="p-4 flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-bold text-charcoal">
                    🚲 {bike.rider?.name ?? "Cycliste"}
                    {bike.bike_model && (
                      <span className="text-charcoal/40 font-normal"> · {bike.bike_model}</span>
                    )}
                  </p>
                  {bike.departure_address && (
                    <p className="text-sm text-charcoal/70 flex gap-1.5 items-start">
                      <span className="mt-px shrink-0">📍</span>
                      <span>{bike.departure_address}</span>
                    </p>
                  )}
                  {bike.departure_datetime && (
                    <p className="text-sm text-charcoal/60 flex gap-1.5 items-center">
                      <span>⏱️</span>
                      <span>{formatDateTime(bike.departure_datetime)}</span>
                    </p>
                  )}
                  {bike.note && (
                    <p className="text-xs text-charcoal/50 italic">{bike.note}</p>
                  )}
                </div>
                {bike.rider_id === currentUserId && confirmDeleteBikeId !== bike.id && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditBike(bike)}
                      title="Modifier mon vélo"
                      className="w-7 h-7 rounded-full bg-charcoal/6 flex items-center justify-center text-sm text-charcoal/50 hover:bg-lavender/20 hover:text-lavender transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteBikeId(bike.id)}
                      title="Supprimer mon vélo"
                      className="w-7 h-7 rounded-full bg-charcoal/6 flex items-center justify-center text-sm text-charcoal/50 hover:bg-pink/20 hover:text-pink/80 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              {confirmDeleteBikeId === bike.id && (
                <div className="px-4 pb-4">
                  <div className="rounded-2xl bg-pink/10 border border-pink/25 p-4 space-y-3">
                    <p className="text-sm font-semibold text-charcoal leading-snug">
                      Supprimer ton vélo ?
                    </p>
                    <div className="flex gap-2">
                      <PastelButton
                        variant="pink"
                        onClick={() => handleRemoveBike(bike.id)}
                        className="text-xs py-2 px-4"
                      >
                        Supprimer
                      </PastelButton>
                      <PastelButton
                        variant="lavender"
                        onClick={() => setConfirmDeleteBikeId(null)}
                        className="text-xs py-2 px-4"
                      >
                        Annuler
                      </PastelButton>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}

          {myBike ? (
            <p className="text-[11px] font-semibold text-charcoal/35 uppercase tracking-wider px-1">
              Mon vélo 🚲
            </p>
          ) : (
            <PastelButton
              variant="lavender"
              fullWidth
              onClick={openBikeModal}
            >
              + Ajouter mon vélo 🚲
            </PastelButton>
          )}
        </div>

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

      {showBikeModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
            onClick={closeBikeModal}
          />
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-cream px-6 pt-5 pb-8 space-y-5 z-[61] max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-charcoal/15 mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-charcoal">Ajouter mon vélo 🚲</h2>
              <button
                onClick={closeBikeModal}
                className="w-8 h-8 rounded-full bg-charcoal/8 flex items-center justify-center text-charcoal/50 hover:bg-charcoal/12 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Adresse de départ</label>
                <input
                  type="text"
                  value={bikeAddress}
                  onChange={(e) => setBikeAddress(e.target.value)}
                  placeholder="Ex: 10 rue de Rivoli, Paris"
                  className={inputCls}
                  style={{ fontSize: 16 }}
                />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-charcoal/40 mb-2">
                  Date et heure de départ
                </p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="date"
                      value={bikeDate}
                      onChange={(e) => setBikeDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className={inputCls}
                      style={{ fontSize: 16 }}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="time"
                      value={bikeTime}
                      onChange={(e) => setBikeTime(e.target.value)}
                      className={inputCls}
                      style={{ fontSize: 16 }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>La marque de ton vélo (juste pour flex)</label>
                <input
                  type="text"
                  value={bikeModel}
                  onChange={(e) => setBikeModel(e.target.value)}
                  placeholder="Ex: Trek, Specialized, Canyon…"
                  className={inputCls}
                  style={{ fontSize: 16 }}
                />
              </div>
              <div>
                <label className={labelCls}>Note (optionnel)</label>
                <textarea
                  value={bikeNote}
                  onChange={(e) => setBikeNote(e.target.value)}
                  placeholder="Tu veux préciser quelque chose ? Ex: J'arrive vendredi soir 🚲"
                  rows={2}
                  maxLength={200}
                  className={`${inputCls} resize-none`}
                  style={{ fontSize: 16 }}
                />
                <p className="mt-1 text-xs text-charcoal/30 text-right">{bikeNote.length} / 200</p>
              </div>
              {bikeAddError && (
                <p className="text-xs text-pink/80 font-semibold text-center">{bikeAddError}</p>
              )}
              <PastelButton
                variant="lavender"
                fullWidth
                disabled={bikeAdding || !bikeAddress.trim()}
                onClick={handleAddBike}
              >
                {bikeAdding ? "En route…" : "C'est parti 🚲"}
              </PastelButton>
            </div>
          </div>
        </div>
      )}
      {editingBike && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
            onClick={() => setEditingBike(null)}
          />
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-cream px-6 pt-5 pb-8 space-y-5 z-[61] max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-charcoal/15 mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-charcoal">Modifier mon vélo ✏️</h2>
              <button
                onClick={() => setEditingBike(null)}
                className="w-8 h-8 rounded-full bg-charcoal/8 flex items-center justify-center text-charcoal/50 hover:bg-charcoal/12 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Adresse de départ</label>
                <input
                  type="text"
                  value={bikeEditAddress}
                  onChange={(e) => setBikeEditAddress(e.target.value)}
                  placeholder="Ex: 10 rue de Rivoli, Paris"
                  className={inputCls}
                  style={{ fontSize: 16 }}
                />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-charcoal/40 mb-2">
                  Date et heure de départ
                </p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="date"
                      value={bikeEditDate}
                      onChange={(e) => setBikeEditDate(e.target.value)}
                      className={inputCls}
                      style={{ fontSize: 16 }}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="time"
                      value={bikeEditTime}
                      onChange={(e) => setBikeEditTime(e.target.value)}
                      className={inputCls}
                      style={{ fontSize: 16 }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Marque du vélo</label>
                <input
                  type="text"
                  value={bikeEditModel}
                  onChange={(e) => setBikeEditModel(e.target.value)}
                  placeholder="Trek, Specialized…"
                  className={inputCls}
                  style={{ fontSize: 16 }}
                />
              </div>
              <div>
                <label className={labelCls}>Note (optionnel)</label>
                <textarea
                  value={bikeEditNote}
                  onChange={(e) => setBikeEditNote(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className={`${inputCls} resize-none`}
                  style={{ fontSize: 16 }}
                />
                <p className="mt-1 text-xs text-charcoal/30 text-right">{bikeEditNote.length} / 200</p>
              </div>
              {bikeEditError && (
                <p className="text-xs text-pink/80 font-semibold text-center">{bikeEditError}</p>
              )}
              <PastelButton
                variant="lavender"
                fullWidth
                disabled={bikeEditing}
                onClick={handleEditBike}
              >
                {bikeEditing ? "Enregistrement…" : "Enregistrer 🌸"}
              </PastelButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
