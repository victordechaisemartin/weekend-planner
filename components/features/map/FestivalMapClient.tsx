"use client";

import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── constants ─────────────────────────────────────────────────

const FESTIVAL_CENTER: [number, number] = [48.6896, 1.6975];

const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

// ── spots ─────────────────────────────────────────────────────

type Spot = { lat: number; lng: number; name: string; emoji: string };

const SPOTS: Spot[] = [
  { lat: 48.68918, lng: 1.69503, name: "Maison d'Yves",    emoji: "🏠" },
  { lat: 48.68845, lng: 1.69600, name: "Maison Titanic",   emoji: "🚢" },
  { lat: 48.68866, lng: 1.69520, name: "Étang Rambouboat", emoji: "🎣" },
  { lat: 48.68967, lng: 1.70323, name: "Grange",           emoji: "🪵" },
  { lat: 48.68905, lng: 1.70455, name: "Tennis",           emoji: "🎾" },
  { lat: 48.69028, lng: 1.70499, name: "Maison Rouge",     emoji: "🔴" },
  { lat: 48.68966, lng: 1.70424, name: "Étang 2 îlots",   emoji: "🏝️" },
  { lat: 48.69153, lng: 1.69923, name: "Cabane",           emoji: "🛖" },
  { lat: 48.68881, lng: 1.69681, name: "Camping",          emoji: "⛺" },
  { lat: 48.68873, lng: 1.69599, name: "Yves Stage",       emoji: "🎧" },
  { lat: 48.69126, lng: 1.69098, name: "Entrée 1",         emoji: "🌸" },
  { lat: 48.69156, lng: 1.70608, name: "Entrée 2",         emoji: "🌸" },
];

// ── icon factory ──────────────────────────────────────────────

function makeIcon(spot: Spot): L.DivIcon {
  const isEntry   = spot.name.startsWith("Entrée");
  const isStage   = spot.name === "Yves Stage";
  const isCamping = spot.name === "Camping";

  let bg = "transparent";
  let extra = "";

  if (isEntry) {
    bg    = "#F4A7B9";
    extra = "box-shadow:0 2px 8px rgba(244,167,185,0.55);";
  } else if (isStage) {
    bg    = "rgba(244,167,185,0.18)";
    extra = "box-shadow:0 0 12px #F4A7B9;";
  } else if (isCamping) {
    bg    = "rgba(184,228,216,0.45)";
  }

  const html = `
    <span style="
      font-size:24px;line-height:1;
      display:flex;align-items:center;justify-content:center;
      width:36px;height:36px;border-radius:50%;
      background:${bg};${extra}
    ">${spot.emoji}</span>`;

  return L.divIcon({
    html,
    className: "",
    iconSize:    [36, 36],
    iconAnchor:  [18, 18],
    popupAnchor: [0, -22],
  });
}

// ── component ─────────────────────────────────────────────────

export default function FestivalMapClient() {
  return (
    <>
      <style>{`
        .festival-map .leaflet-tooltip {
          background: white !important;
          border: none !important;
          border-radius: 100px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          padding: 2px 8px !important;
          color: #2D2D2D !important;
          box-shadow: 0 2px 8px rgba(45,45,45,0.12) !important;
          white-space: nowrap;
        }
        .festival-map .leaflet-tooltip::before { display: none !important; }
        .festival-map .leaflet-popup-content-wrapper {
          border-radius: 20px !important;
          box-shadow: 0 4px 24px rgba(45,45,45,0.13) !important;
          background: #FFF8F0 !important;
          padding: 0 !important;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.7) !important;
        }
        .festival-map .leaflet-popup-content { margin: 0 !important; }
        .festival-map .leaflet-popup-tip { background: #FFF8F0 !important; box-shadow: none !important; }
        .festival-map .leaflet-popup-close-button {
          top: 8px !important; right: 10px !important;
          color: rgba(45,45,45,0.35) !important; font-size: 16px !important;
        }
      `}</style>

      <MapContainer
        center={FESTIVAL_CENTER}
        zoom={16}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
        className="festival-map"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        {SPOTS.map((spot) => (
          <Marker
            key={spot.name}
            position={[spot.lat, spot.lng]}
            icon={makeIcon(spot)}
          >
            <Tooltip permanent direction="bottom" offset={[0, 10]}>
              {spot.name}
            </Tooltip>
            <Popup>
              <div style={{ padding: "16px 20px", textAlign: "center", minWidth: 120 }}>
                <p style={{ fontSize: 36, margin: "0 0 8px", lineHeight: 1 }}>{spot.emoji}</p>
                <p style={{ fontWeight: 800, fontSize: 14, color: "#2D2D2D", margin: 0 }}>
                  {spot.name}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
