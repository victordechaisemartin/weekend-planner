"use client";

import { Fragment, useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Polyline,
  Popup,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/lib/supabase";

// ── constants ─────────────────────────────────────────────────

const FRANCE_CENTER: [number, number] = [46.8, 2.3];
const DESTINATION: [number, number] = [48.608, 1.725];
const DEST_LABEL = "18 route du Passoir, 78125 Orphin";

const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

const PASTEL = ["#F4A7B9", "#C9B8E8", "#B8E4D8"] as const;

const BIKE_COLORS = ["#C9B8E8", "#B8E4D8", "#F4A7B9", "#D4A5F5"];

// Created at module level — this file is only ever loaded client-side (ssr:false)
const flowerIcon = L.divIcon({
  html: `<span style="font-size:30px;line-height:1;display:block;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.22))">🌸</span>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 28],
  popupAnchor: [0, -30],
});

// ── types ─────────────────────────────────────────────────────

type CarInfo = {
  id: string;
  address: string;
  seats_total: number;
  departure_datetime: string;
  stops: string[];
  driver: { id: string; name: string };
  passengers: { id: string; name: string }[];
};

type MappedCar = CarInfo & {
  coords: [number, number];
  stopCoords: ([number, number] | null)[];
  color: string;
};

type MappedBike = {
  id: string;
  rider_id: string;
  departure_address: string;
  departure_datetime: string | null;
  bike_model: string | null;
  note: string | null;
  coords: [number, number];
  color: string;
  rider?: { id: string; name: string };
};

// ── helpers ───────────────────────────────────────────────────

function formatDeparture(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function geocode(address: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(
      address.toLowerCase().includes("france") ? address : `${address}, France`
    );
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "User-Agent": "WeekendPlanner/1.0" } }
    );
    const json = await res.json();
    if (json?.length) return [parseFloat(json[0].lat), parseFloat(json[0].lon)];
  } catch {}
  return null;
}

async function fetchCars(eventId: string): Promise<CarInfo[]> {
  const { data: rawCars } = await supabase
    .from("cars")
    .select("*")
    .eq("event_id", eventId)
    .order("departure_datetime", { ascending: true });

  if (!rawCars?.length) return [];

  const driverIds = Array.from(new Set(rawCars.map((c) => c.driver_id)));
  const carIds = rawCars.map((c) => c.id);

  const [{ data: drivers }, { data: cpRows }] = await Promise.all([
    supabase.from("users").select("id, name").in("id", driverIds),
    supabase.from("car_passengers").select("car_id, user_id").in("car_id", carIds),
  ]);

  const passengerIds = Array.from(
    new Set((cpRows ?? []).map((r) => r.user_id))
  );
  const { data: passengerUsers } = passengerIds.length
    ? await supabase.from("users").select("id, name").in("id", passengerIds)
    : { data: [] as { id: string; name: string }[] };

  return rawCars.map((car) => ({
    ...car,
    stops: (car.stops ?? []) as string[],
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

export default function MapClient() {
  const [mappedCars, setMappedCars] = useState<MappedCar[]>([]);
  const [mappedBikes, setMappedBikes] = useState<MappedBike[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function init() {
      const [{ data: { user } }, { data: event }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("events").select("id").limit(1).maybeSingle(),
      ]);

      setCurrentUserId(user?.id ?? null);
      if (!event?.id) return;
      setEventId(event.id);

      const [cars, { data: rawBikeRows }] = await Promise.all([
        fetchCars(event.id),
        supabase.from("bikes").select("*").eq("event_id", event.id),
      ]);

      // Fetch rider names separately — avoids FK schema-cache dependency
      const bikeRiderIds = Array.from(
        new Set((rawBikeRows ?? []).map((b) => b.rider_id))
      );
      const { data: bikeRiders } = bikeRiderIds.length
        ? await supabase.from("users").select("id, name").in("id", bikeRiderIds)
        : { data: [] as { id: string; name: string }[] };

      const bikesWithRiders = (rawBikeRows ?? []).map((b) => ({
        ...b,
        rider: (bikeRiders ?? []).find((r) => r.id === b.rider_id) ?? { id: b.rider_id, name: "Cycliste" },
      }));

      // Geocode bikes that have a departure address, assign per-bike color
      const bikeResults = await Promise.allSettled(
        bikesWithRiders
          .filter((b) => b.departure_address)
          .map(async (bike, i): Promise<MappedBike> => {
            const coords = await geocode(bike.departure_address);
            if (!coords) throw new Error("no coords");
            return { ...bike, coords, color: BIKE_COLORS[i % BIKE_COLORS.length] };
          })
      );
      setMappedBikes(
        bikeResults
          .filter((r) => r.status === "fulfilled")
          .map((r) => (r as PromiseFulfilledResult<MappedBike>).value)
      );

      // Geocode start address + all stops in parallel; skip failures
      const results = await Promise.allSettled(
        cars.map(async (car, i): Promise<MappedCar> => {
          const [startCoords, ...stopCoords] = await Promise.all([
            geocode(car.address),
            ...(car.stops ?? []).map((s) => geocode(s)),
          ]);
          if (!startCoords) throw new Error("no coords");
          return {
            ...car,
            coords: startCoords,
            stopCoords,
            color: PASTEL[i % PASTEL.length],
          };
        })
      );

      setMappedCars(
        results
          .filter((r) => r.status === "fulfilled")
          .map((r) => (r as PromiseFulfilledResult<MappedCar>).value)
      );
    }
    init();
  }, []);

  async function handleJoin(carId: string) {
    if (!currentUserId || !eventId) return;
    setBusy(true);
    await supabase
      .from("car_passengers")
      .insert({ car_id: carId, user_id: currentUserId });

    // Refresh passenger counts without re-geocoding — keep existing coords/color
    const fresh = await fetchCars(eventId);
    setMappedCars((prev) =>
      prev.map((mc) => {
        const updated = fresh.find((c) => c.id === mc.id);
        return updated ? { ...mc, ...updated } : mc;
      })
    );
    setBusy(false);
  }

  return (
    <div className="relative w-full h-full">
      {/* Leaflet popup / tooltip overrides */}
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 20px !important;
          box-shadow: 0 4px 24px rgba(45,45,45,0.13) !important;
          border: 1px solid rgba(255,255,255,0.7) !important;
          padding: 0 !important;
          overflow: hidden;
          background: #FFF8F0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip-container { margin-top: -1px; }
        .leaflet-popup-tip { background: #FFF8F0 !important; box-shadow: none !important; }
        .leaflet-popup-close-button {
          top: 10px !important; right: 12px !important;
          color: rgba(45,45,45,0.35) !important; font-size: 18px !important;
        }
        .leaflet-tooltip {
          background: white !important;
          border: 1px solid rgba(244,167,185,0.45) !important;
          border-radius: 100px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          padding: 2px 9px !important;
          color: #2D2D2D !important;
          box-shadow: 0 2px 8px rgba(45,45,45,0.1) !important;
          white-space: nowrap;
        }
        .leaflet-tooltip::before { display: none !important; }
      `}</style>

      <MapContainer
        center={FRANCE_CENTER}
        zoom={6}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        {/* Dashed polylines routed through stops */}
        {mappedCars.map((car) => {
          const validStops = (car.stopCoords ?? []).filter(Boolean) as [number, number][];
          const routePoints: [number, number][] = [car.coords, ...validStops, DESTINATION];
          return (
            <Polyline
              key={`line-${car.id}`}
              positions={routePoints}
              pathOptions={{
                color: car.color,
                weight: 2.5,
                dashArray: "8 8",
                opacity: 0.75,
              }}
            />
          );
        })}

        {/* Stop markers */}
        {mappedCars.map((car) =>
          (car.stopCoords ?? []).map((coords, i) =>
            coords ? (
              <CircleMarker
                key={`stop-${car.id}-${i}`}
                center={coords}
                radius={8}
                pathOptions={{
                  fillColor: car.color,
                  fillOpacity: 0.7,
                  color: "white",
                  weight: 2,
                }}
              >
                <Tooltip direction="top">
                  🛑 Arrêt {i + 1}: {car.stops[i]}
                </Tooltip>
              </CircleMarker>
            ) : null
          )
        )}

        {/* Bike polylines + markers */}
        {mappedBikes.map((bike) => (
          <Fragment key={bike.id}>
            <Polyline
              positions={[bike.coords, DESTINATION]}
              pathOptions={{
                color: bike.color,
                dashArray: "8 8",
                weight: 2,
                opacity: 0.75,
              }}
            />
            <CircleMarker
              center={bike.coords}
              radius={12}
              pathOptions={{
                fillColor: bike.color,
                fillOpacity: 0.9,
                color: "white",
                weight: 3,
              }}
            >
              <Tooltip permanent direction="top" className="bike-label">
                <span>{bike.rider?.name ?? "Cycliste"} 🚲</span>
              </Tooltip>
              <Popup>
                <div style={{ padding: "14px 18px", minWidth: 190 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: "#2D2D2D", margin: "0 0 4px" }}>
                    🚲 {bike.rider?.name ?? "Cycliste"}
                  </p>
                  {bike.bike_model && (
                    <p style={{ fontSize: 11, color: "rgba(45,45,45,0.45)", margin: "0 0 8px", fontWeight: 600 }}>
                      {bike.bike_model}
                    </p>
                  )}
                  {bike.departure_datetime && (
                    <p style={{ fontSize: 12, color: "rgba(45,45,45,0.6)", margin: "0 0 4px" }}>
                      ⏱️ {new Date(bike.departure_datetime).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {bike.note && (
                    <p style={{ fontSize: 12, color: "rgba(45,45,45,0.6)", margin: "0", fontStyle: "italic" }}>
                      💬 {bike.note}
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        ))}

        {/* Destination flower marker */}
        <Marker position={DESTINATION} icon={flowerIcon} zIndexOffset={1000}>
          <Tooltip permanent direction="top" offset={[0, -32]}>
            🌸 Lolapabouillet 🌸
          </Tooltip>
          <Popup>
            <div style={{ padding: "14px 18px", minWidth: 190 }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: "#2D2D2D", margin: "0 0 5px" }}>
                🌸 Festival HQ
              </p>
              <p style={{ fontSize: 12, color: "rgba(45,45,45,0.55)", margin: 0 }}>
                {DEST_LABEL}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Driver circle markers */}
        {mappedCars.map((car) => {
          const freeSeats = car.seats_total - car.passengers.length;
          const isDriver = car.driver.id === currentUserId;
          const isPassenger = car.passengers.some((p) => p.id === currentUserId);

          return (
            <CircleMarker
              key={car.id}
              center={car.coords}
              radius={16}
              pathOptions={{
                fillColor: car.color,
                fillOpacity: 0.92,
                color: "white",
                weight: 3,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -18]}>
                {car.driver.name}&apos;s car 🚗
              </Tooltip>

              <Popup>
                <div style={{ padding: "14px 18px", minWidth: 210 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: "#2D2D2D", margin: "0 0 4px" }}>
                    🚗 {car.driver.name}&apos;s car
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(45,45,45,0.45)", margin: "0 0 8px", fontWeight: 600 }}>
                    {car.driver.name}
                  </p>

                  <p style={{ fontSize: 12, color: "rgba(45,45,45,0.6)", margin: "0 0 4px", display: "flex", gap: 5, alignItems: "flex-start" }}>
                    <span>📍</span>
                    <span>{car.address}</span>
                  </p>

                  <p style={{ fontSize: 12, color: "rgba(45,45,45,0.6)", margin: "0 0 4px" }}>
                    🕐 {formatDeparture(car.departure_datetime)}
                  </p>

                  <p style={{
                    fontSize: 12,
                    fontWeight: 700,
                    margin: "0 0 12px",
                    color: freeSeats > 0 ? "#3a8c78" : "#c97b92",
                  }}>
                    {freeSeats > 0
                      ? `🌱 ${freeSeats} seat${freeSeats !== 1 ? "s" : ""} free`
                      : "🌺 Full"}
                  </p>

                  {!isDriver && !isPassenger && freeSeats > 0 && (
                    <button
                      onClick={() => handleJoin(car.id)}
                      disabled={busy}
                      style={{
                        background: "#F4A7B9",
                        color: "white",
                        border: "none",
                        borderRadius: "100px",
                        padding: "7px 18px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: busy ? "not-allowed" : "pointer",
                        opacity: busy ? 0.6 : 1,
                        display: "block",
                        width: "100%",
                      }}
                    >
                      🌸 Join
                    </button>
                  )}

                  {isPassenger && (
                    <p style={{ fontSize: 11, color: "rgba(45,45,45,0.4)", fontWeight: 700, margin: 0 }}>
                      ✓ You&apos;re in this car
                    </p>
                  )}
                  {isDriver && (
                    <p style={{ fontSize: 11, color: "rgba(45,45,45,0.4)", fontWeight: 700, margin: 0 }}>
                      Your car 🚗
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

    </div>
  );
}
