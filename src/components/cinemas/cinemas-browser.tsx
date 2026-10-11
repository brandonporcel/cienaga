"use client";

import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import Link from "next/link";

import CinemaMapLazy from "@/components/cinemas/cinema-map-lazy";
import { Input } from "@/components/ui/input";
import Cinema from "@/types/cinema";

export interface CinemaWithCount extends Cinema {
  movieCount: number;
}

interface CinemasBrowserProps {
  cinemas: CinemaWithCount[];
}

/**
 * Navegador de cines: busca por nombre o dirección y filtra el mapa
 * y el listado en simultáneo.
 */
export default function CinemasBrowser({ cinemas }: CinemasBrowserProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cinemas;
    return cinemas.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q),
    );
  }, [cinemas, query]);

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cine o dirección..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 w-full md:w-[400px]"
        />
      </div>

      <CinemaMapLazy cinemas={filtered} height="480px" />

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No se encontraron cines que coincidan con tu búsqueda.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((cinema) => (
            <Link
              key={cinema.id}
              href={`/cinemas/${cinema.slug}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card p-4 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{cinema.name}</p>
                  {cinema.address && (
                    <p className="text-sm text-muted-foreground truncate">
                      {cinema.address}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground flex-shrink-0">
                {cinema.movieCount === 1
                  ? "1 película"
                  : `${cinema.movieCount} películas`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}