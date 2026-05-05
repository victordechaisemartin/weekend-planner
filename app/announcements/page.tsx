import { supabase } from "@/lib/supabase";
import type { Announcement } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import FlowerDivider from "@/components/ui/FlowerDivider";
import CountdownBanner from "@/components/features/announcements/CountdownBanner";
import AnnouncementCard from "@/components/features/announcements/AnnouncementCard";

export const revalidate = 60;

export default async function AnnouncementsPage() {
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("pinned",      { ascending: false })
    .order("created_at",  { ascending: false });

  const announcements: Announcement[] = data ?? [];
  const pinned = announcements.filter((a) => a.pinned);
  const feed   = announcements.filter((a) => !a.pinned);

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader title="Announcements 📢" />

      <div className="px-4 pb-10 space-y-4">
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
