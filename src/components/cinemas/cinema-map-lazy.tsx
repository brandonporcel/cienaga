"use client";

import dynamic from "next/dynamic";

import Cinema from "@/types/cinema";
import { Skeleton } from "@/components/ui/skeleton";

// Leaflet toca `window` → nunca renderizar en servidor. Este wrapper client
// es la única vía de import: `next/dynamic` con ssr:false NO se permite en
// Server Components (error de build), así que el lazy se declara acá.
const CinemaMap = dynamic(() => import("@/components/cinemas/cinema-map"), {
  ssr: false,
  loading: () => (
    <Skeleton className="w-full rounded-xl" style={{ height: "100%" }} />
  ),
});

interface CinemaMapLazyProps {
  cinemas: Cinema[];
  height?: string;
}

export default function CinemaMapLazy({
  cinemas,
  height = "400px",
}: CinemaMapLazyProps) {
  return (
    <div style={{ height }}>
      <CinemaMap cinemas={cinemas} height={height} />
    </div>
  );
}