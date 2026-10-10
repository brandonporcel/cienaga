"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";

import "leaflet/dist/leaflet.css";
import "./cinema-map.css";

import Cinema from "@/types/cinema";

// Pin SVG inline (evita los iconos default de Leaflet, que se rompen con
// bundlers por las rutas de imágenes).
const pinIcon = L.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -34],
});

interface CinemaMapProps {
  cinemas: Cinema[];
  height?: string;
}

/**
 * Mapa Leaflet con un marker por cine (solo los que tienen lat/lng).
 * Debe importarse con `next/dynamic(..., { ssr: false })` porque Leaflet
 * toca `window` — nunca importar directo desde un server component.
 */
export default function CinemaMap({ cinemas, height = "480px" }: CinemaMapProps) {
  const withCoords = cinemas.filter(
    (c) => typeof c.lat === "number" && typeof c.lng === "number",
  );

  if (withCoords.length === 0) {
    return (
      <div
        className="flex items-center justify-center border rounded-xl bg-muted/30 text-sm text-muted-foreground"
        style={{ height }}
      >
        No hay cines con ubicación cargada todavía.
      </div>
    );
  }

  // Centro = promedio (datos de CABA, dispersión chica).
  const center: [number, number] = [
    withCoords.reduce((acc, c) => acc + (c.lat as number), 0) / withCoords.length,
    withCoords.reduce((acc, c) => acc + (c.lng as number), 0) / withCoords.length,
  ];

  return (
    <MapContainer
      center={center}
      zoom={12}
      maxZoom={16}
      scrollWheelZoom
      className="cinema-map z-0"
      style={{ height }}
    >
      <TileLayer
        attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
      />
      <TileLayer
        attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
      />
      {withCoords.map((cinema) => (
        <Marker
          key={cinema.id}
          position={[cinema.lat as number, cinema.lng as number]}
          icon={pinIcon}
        >
          <Popup>
            <div className="text-sm">
              <span className="font-semibold">{cinema.name}</span>
              {cinema.address && (
                <p className="text-muted-foreground text-xs mt-0.5">
                  {cinema.address}
                </p>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${cinema.lat},${cinema.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline text-xs block mt-1"
              >
                Google Maps ↗
              </a>
              <Link
                href={`/cinemas/${cinema.slug}`}
                className="text-primary underline text-xs block mt-1"
              >
                Ver cine →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}