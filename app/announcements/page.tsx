"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getEventId } from "@/lib/constants";
import type { Announcement } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import FlowerDivider from "@/components/ui/FlowerDivider";
import CountdownBanner from "@/components/features/announcements/CountdownBanner";
import AnnouncementCard from "@/components/features/announcements/AnnouncementCard";

export default function AnnouncementsPage() {
  const [announcements,    setAnnouncements]    = useState<Announcement[]>([]);
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [carsCount,        setCarsCount]        = useState<number | null>(null);
  const [freeSeats,        setFreeSeats]        = useState<number | null>(null);

  // Fetch announcements once on mount
  useEffect(() => {
    supabase
      .from("announcements")
      .select("*")
      .order("pinned",     { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAnnouncements(
          (data ?? []).map((a) => ({ ...a, reactions: a.reactions ?? {} }))
        );
      });
  }, []);

  // Fetch live stats + subscribe to Realtime updates
  useEffect(() => {
    async function fetchStats() {
      // Reset to null before each fetch so stale values never linger while
      // a refetch is in progress — the UI shows "—" until fresh data arrives.
      setParticipantCount(null);

      // Query public.users directly — not auth.users — for the participant count.
      // Run this independently so a stale getEventId() cache can't affect it.
      const { count: userCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      console.log("user count:", userCount);
      // Do NOT default to 0 — null means the query failed or was blocked by RLS,
      // which renders as "—" so it's visually distinct from a genuine zero.
      setParticipantCount(userCount);

      const eventId = await getEventId();
      if (eventId) {
        const { data: cars } = await supabase
          .from("cars").select("id, seats_total").eq("event_id", eventId);
        console.log("cars count:", (cars ?? []).length);
        const carIds = (cars ?? []).map((c) => c.id);
        const { count: passengerCount } = carIds.length
          ? await supabase
              .from("car_passengers")
              .select("*", { count: "exact", head: true })
              .in("car_id", carIds)
          : { count: 0 };
        const totalSeats = (cars ?? []).reduce((s, c) => s + c.seats_total, 0);
        setCarsCount((cars ?? []).length);
        setFreeSeats(Math.max(0, totalSeats - (passengerCount ?? 0)));
      }
    }

    // Run once on mount (covers cases where session is already in cookies).
    // Also re-run when the session is confirmed via onAuthStateChange — the
    // events table requires authenticated access, and createBrowserClient
    // parses cookies asynchronously so the first mount call can fire too early.
    fetchStats();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { if (session) fetchStats(); }
    );

    const channel = supabase
      .channel("live-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => fetchStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cars" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const pinned = announcements.filter((a) => a.pinned);
  const feed   = announcements.filter((a) => !a.pinned);

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader title="Announcements 📢" />

      <div className="px-4 pb-10 space-y-4">
        <CountdownBanner />

        {/* ── Live stats ── */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-3xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-charcoal tabular-nums">
              {participantCount ?? "—"}
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-charcoal/35 mt-1">
              Participants 🌸
            </p>
          </div>
          <div className="flex-1 bg-white rounded-3xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-charcoal tabular-nums">
              {carsCount ?? "—"}
            </p>
            {freeSeats !== null && (
              <p className="text-[11px] font-semibold text-charcoal/40 leading-none mt-0.5">
                ({freeSeats} places libres)
              </p>
            )}
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-charcoal/35 mt-1">
              Voitures
            </p>
          </div>
        </div>

        {pinned.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} variant="pinned" />
        ))}

        {pinned.length > 0 && feed.length > 0 && (
          <FlowerDivider className="my-2" />
        )}

        {feed.map((a, i) => (
          <AnnouncementCard
            key={a.id}
            announcement={a}
            variant={i % 2 === 0 ? "lavender" : "mint"}
          />
        ))}

        {announcements.length === 0 && (
          <p className="py-16 text-center text-sm text-charcoal/40">
            No announcements yet. Stay tuned! 🌸
          </p>
        )}
      </div>
    </div>
  );
}
