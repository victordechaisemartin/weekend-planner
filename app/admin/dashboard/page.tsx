"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getEventId } from "@/lib/constants";
import { useAuth } from "@/lib/useAuth";
import AddTentModal from "@/components/features/tents/AddTentModal";

const FESTIVAL_DATE = new Date("2026-05-22T19:00:00");

function daysUntil(target: Date): number {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "il y a moins d'une heure";
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? "s" : ""}`;
}

type DashboardStats = {
  userCount: number;
  carsCount: number;
  freeCarSeats: number;
  tentsCount: number;
  freeTentSpots: number;
  latestAnnouncementAt: string | null;
  usersWithoutCar: { id: string; name: string }[];
  usersWithoutTent: { id: string; name: string }[];
};

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomError, setRoomError]         = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const eventId = await getEventId();
      if (!eventId) return;

      const [
        { data: users },
        { data: cars },
        { data: tents },
        { data: carPassengers },
        { data: tentGuests },
        { data: bikes },
        { data: latestAnnouncement },
      ] = await Promise.all([
        supabase.from("users").select("id, name"),
        supabase.from("cars").select("id, seats_total, driver_id").eq("event_id", eventId),
        supabase.from("tents").select("id, capacity").eq("event_id", eventId),
        supabase.from("car_passengers").select("user_id"),
        supabase.from("tent_guests").select("user_id"),
        supabase.from("bikes").select("rider_id").eq("event_id", eventId),
        supabase
          .from("announcements")
          .select("created_at")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const allUsers       = users ?? [];
      const allCars        = cars ?? [];
      const allTents       = tents ?? [];
      const passengerIds   = new Set((carPassengers ?? []).map((p) => p.user_id));
      const guestIds       = new Set((tentGuests ?? []).map((g) => g.user_id));
      const totalCarSeats  = allCars.reduce((s, c) => s + c.seats_total, 0);
      const totalTentSpots = allTents.reduce((s, t) => s + t.capacity, 0);

      // A user "has transport" if they're a driver, passenger, or bike rider
      const usersWithCarIds = new Set<string>([
        ...allCars.map((c) => c.driver_id).filter(Boolean),
        ...Array.from(passengerIds),
        ...(bikes ?? []).map((b) => b.rider_id).filter(Boolean),
      ]);

      setStats({
        userCount:            allUsers.length,
        carsCount:            allCars.length,
        freeCarSeats:         Math.max(0, totalCarSeats - passengerIds.size),
        tentsCount:           allTents.length,
        freeTentSpots:        Math.max(0, totalTentSpots - guestIds.size),
        latestAnnouncementAt: latestAnnouncement?.created_at ?? null,
        usersWithoutCar:      allUsers.filter((u) => !usersWithCarIds.has(u.id)),
        usersWithoutTent:     allUsers.filter((u) => !guestIds.has(u.id)),
      });
      setLoading(false);
    }

    load();
  }, []);

  async function handleAddRoom(form: {
    name: string; type: string; capacity: number; snoring: boolean;
  }) {
    const userId = user?.id
      ?? (await supabase.auth.getSession()).data.session?.user?.id
      ?? null;
    if (!userId) { setRoomError("Non authentifié"); return; }
    const eventId = await getEventId();
    if (!eventId) { setRoomError("Événement introuvable"); return; }
    setRoomError(null);
    const { error } = await supabase.from("tents").insert({
      event_id: eventId,
      host_id:  userId,
      name:     form.name,
      type:     "Room",
      capacity: form.capacity,
    });
    if (error) { setRoomError(error.message); throw new Error(error.message); }
    setShowRoomModal(false);
  }

  const firstName = profile?.name?.split(" ")[0] ?? "Victor";
  const days      = daysUntil(FESTIVAL_DATE);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1
          className="font-[family-name:var(--font-lilita)] text-3xl uppercase text-white leading-tight"
          style={{ WebkitTextStroke: "2px #2D2D2D" }}
        >
          Bonjour {firstName} 🌸
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: "#2D2D2D99" }}>
          Festival dans{" "}
          <span className="font-black tabular-nums" style={{ color: "#2D2D2D" }}>
            {days}
          </span>{" "}
          jours
        </p>
      </div>

      {/* ── Stats grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl p-4 h-24 animate-pulse"
              style={{ background: "#F4A7B955" }}
            />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            emoji="🌸"
            value={stats.userCount}
            label="participants"
          />
          <StatCard
            emoji="🚗"
            value={stats.carsCount}
            label="voitures"
            sub={`${stats.freeCarSeats} places libres`}
          />
          <StatCard
            emoji="⛺"
            value={stats.tentsCount}
            label="tentes"
            sub={`${stats.freeTentSpots} places libres`}
          />
          <StatCard
            emoji="📢"
            value={null}
            label={
              stats.latestAnnouncementAt
                ? `Dernière annonce\n${timeAgo(stats.latestAnnouncementAt)}`
                : "Aucune annonce"
            }
          />
        </div>
      )}

      {/* ── Attention cards ── */}
      {stats && stats.usersWithoutCar.length > 0 && (
        <AlertCard
          emoji="🚗"
          color="#F4A7B9"
          title={`${stats.usersWithoutCar.length} personne${stats.usersWithoutCar.length > 1 ? "s" : ""} sans voiture`}
          names={stats.usersWithoutCar.map((u) => u.name)}
        />
      )}

      {stats && stats.usersWithoutTent.length > 0 && (
        <AlertCard
          emoji="⛺"
          color="#C9B8E8"
          title={`${stats.usersWithoutTent.length} personne${stats.usersWithoutTent.length > 1 ? "s" : ""} sans tente`}
          names={stats.usersWithoutTent.map((u) => u.name)}
        />
      )}

      {/* ── Quick actions ── */}
      <div className="flex flex-col gap-3 pt-2">
        <Link
          href="/admin/announcements"
          className="flex items-center justify-center gap-2 rounded-full py-4 text-base font-bold shadow-md active:scale-95 transition-transform"
          style={{ background: "#F4A7B9", color: "#2D2D2D" }}
        >
          📢 Poster une annonce
        </Link>
        <Link
          href="/admin/djs"
          className="flex items-center justify-center gap-2 rounded-full py-4 text-base font-bold shadow-md active:scale-95 transition-transform"
          style={{ background: "#C9B8E8", color: "#2D2D2D" }}
        >
          🎧 Révéler un DJ
        </Link>
        <button
          onClick={() => setShowRoomModal(true)}
          className="flex items-center justify-center gap-2 rounded-full py-4 text-base font-bold shadow-md active:scale-95 transition-transform"
          style={{ background: "#B8E4D8", color: "#2D2D2D" }}
        >
          🏠 Ajouter une chambre
        </button>
      </div>

      {showRoomModal && (
        <AddTentModal
          hostName={profile?.name ?? ""}
          isAdmin={true}
          defaultType="Room"
          error={roomError}
          onClose={() => { setShowRoomModal(false); setRoomError(null); }}
          onSubmit={handleAddRoom}
        />
      )}

    </div>
  );
}

function StatCard({
  emoji,
  value,
  label,
  sub,
}: {
  emoji: string;
  value: number | null;
  label: string;
  sub?: string;
}) {
  const lines = label.split("\n");
  return (
    <div
      className="rounded-3xl p-4 flex flex-col justify-between min-h-[88px] shadow-sm"
      style={{ background: "#F4A7B933" }}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <div>
        {value !== null && (
          <p
            className="text-3xl font-black tabular-nums leading-none"
            style={{ color: "#2D2D2D" }}
          >
            {value}
          </p>
        )}
        {lines.map((line, i) => (
          <p
            key={i}
            className={`leading-snug ${
              i === 0
                ? "text-[11px] font-extrabold uppercase tracking-widest mt-0.5"
                : "text-[11px] font-semibold mt-0.5"
            }`}
            style={{ color: "#2D2D2D99" }}
          >
            {line}
          </p>
        ))}
        {sub && (
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#2D2D2D66" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function AlertCard({
  emoji,
  color,
  title,
  names,
}: {
  emoji: string;
  color: string;
  title: string;
  names: string[];
}) {
  return (
    <div
      className="rounded-3xl p-4 shadow-sm"
      style={{ background: color + "44" }}
    >
      <p className="font-bold text-sm mb-2" style={{ color: "#2D2D2D" }}>
        {emoji} {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {names.map((name) => (
          <span
            key={name}
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: color, color: "#2D2D2D" }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
