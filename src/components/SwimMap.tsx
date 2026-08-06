import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";

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

export type SwimMapProps = {
  swims?: Swim[];
  pin?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
};

export default function SwimMap({
  swims = [],
  pin = null,
  onPick,
  center = [54.5, -3.5],
  zoom = 5,
}: SwimMapProps) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom zoomAnimation fadeAnimation wheelPxPerZoomLevel={120} zoomDelta={1} zoomSnap={0.5} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      {onPick ? <ClickCapture onPick={onPick} /> : null}
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
              <p className="font-display text-base leading-tight">{swim.spot_name}</p> 
              <p className="text-xs text-muted-foreground">
               {"💧".repeat(swim.rating)} · {swim.swam_on}
              </p>
              {swim.review ? <p className="text-xs">{swim.review}</p> : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer> 
  );
} 