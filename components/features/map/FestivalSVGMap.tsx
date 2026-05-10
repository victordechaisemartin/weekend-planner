"use client";

export default function FestivalSVGMap() {
  return (
    <div
      className="w-full h-full bg-[#FFF8F0]"
      style={{
        overflow:                 "auto",
        WebkitOverflowScrolling: "touch",
        touchAction:             "pan-x pan-y pinch-zoom",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/map-lola.svg"
        alt="Festival Map"
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}
