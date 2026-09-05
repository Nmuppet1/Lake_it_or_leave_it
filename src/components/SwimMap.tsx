import "leaflet/dist/leaflet.css";

import { Link } from "@tanstack/react-router";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import type { Swim } from "@/lib/swims";

const pinIcon = (highlight: boolean) =>
  L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${
      highlight ? "oklch(0.82 0.13 78)" : "oklch(0.84 0.105 200)"
    };box-shadow:0 0 0 4px oklch(0.19 0.028 240 / 0.65), 0 0 12px oklch(0.84 0.105 200 / 0.8)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => onPick(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

function FlyTo({ target }: { target: { lat: number; lng: number; zoom?: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([target.lat, target.lng], target.zoom ?? 14, { duration: 1.2 });
  }, [map, target]);
  return null;
}

export type SwimMapProps = {
  swims?: Swim[];
  pin?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  flyTo?: { lat: number; lng: number; zoom?: number } | null;
};

export default function SwimMap({
  swims = [],
  pin = null,
  onPick,
  center = [54.5, -3.5],
  zoom = 5,
  flyTo = null,
}: SwimMapProps) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom zoomAnimation fadeAnimation wheelPxPerZoomLevel={120} zoomDelta={1} zoomSnap={0.5} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {onPick ? <ClickCapture onPick={onPick} /> : null}
      {flyTo ? <FlyTo target={flyTo} /> : null}
      {pin ? <Marker position={[pin.lat, pin.lng]} icon={pinIcon(true)} /> : null}
      {swims.map((swim) => (
        <Marker key={swim.id} position={[swim.lat, swim.lng]} icon={pinIcon(false)}>
          <Popup>
            <div className="w-52 space-y-2">
              {swim.photo_url ? (
                <img
                  src={swim.photo_url}
                  alt={`Swim at ${swim.spot_name}`}
                  className="h-28 w-full rounded object-cover"
                  loading="lazy"
                />
              ) : null}
              <Link
                to="/swim/$swimId"
                params={{ swimId: swim.id }}
                className="font-display block text-base leading-tight hover:underline"
              >
                {swim.spot_name}
              </Link>
              <p className="text-xs text-muted-foreground">
               {"💧".repeat(swim.rating)} · {swim.swam_on}
              </p>
              {swim.review ? <p className="text-xs">{swim.review}</p> : null}
              <Link
                to="/swim/$swimId"
                params={{ swimId: swim.id }}
                className="block text-xs text-primary hover:underline"
              >
                Go to this swim →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer> 
  );
} 