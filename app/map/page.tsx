import dynamic from "next/dynamic";
import PageHeader from "@/components/ui/PageHeader";

const MapClient = dynamic(
  () => import("@/components/features/map/MapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <span className="animate-pulse text-4xl">🌸</span>
      </div>
    ),
  }
);

export default function MapPage() {
  return (
    <div className="flex flex-col bg-cream" style={{ height: "100dvh" }}>
      <div className="shrink-0">
        <PageHeader
          title="Map 🗺️"
          subtitle="See where everyone's coming from"
          className="pb-3"
        />
      </div>

      <div className="flex-1 px-4 pb-20 min-h-0">
        <div className="h-full rounded-3xl overflow-hidden shadow-[0_2px_20px_0_rgba(45,45,45,0.1)]">
          <MapClient />
        </div>
      </div>
    </div>
  );
}
