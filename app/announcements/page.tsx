import { supabase } from "@/lib/supabase";
import type { Announcement } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import FlowerDivider from "@/components/ui/FlowerDivider";
import CountdownBanner from "@/components/features/announcements/CountdownBanner";
import AnnouncementCard from "@/components/features/announcements/AnnouncementCard";

export const revalidate = 0; // no cache while debugging

export default async function AnnouncementsPage() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("pinned",     { ascending: false })
    .order("created_at", { ascending: false });

  // Log raw Supabase response to the server console
  console.log("[announcements] data:", JSON.stringify(data, null, 2));
  console.log("[announcements] error:", JSON.stringify(error, null, 2));

  const announcements: Announcement[] = (data ?? []).map((a) => ({
    ...a,
    reactions: a.reactions ?? {},
  }));

  const pinned = announcements.filter((a) => a.pinned);
  const feed   = announcements.filter((a) => !a.pinned);

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader title="Announcements 📢" />

      <div className="px-4 pb-10 space-y-4">
        {/* Debug line — remove once data is confirmed */}
        <p className="text-center text-xs text-charcoal/40 font-mono">
          Fetched {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
          {error ? ` · error: ${error.message}` : ""}
        </p>

        <CountdownBanner />

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
