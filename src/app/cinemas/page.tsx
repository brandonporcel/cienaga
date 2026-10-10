import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { createClientForServer } from "@/lib/supabase/server";
import Cinema from "@/types/cinema";
import CinemaMapLazy from "@/components/cinemas/cinema-map-lazy";
import { Button } from "@/components/ui/button";

interface CinemaWithCount extends Cinema {
  futureCount: number;
}

export const metadata = {
  title: "Cines | Ciénaga",
  description: "Cines y espacios de Buenos Aires con funciones en cartelera",
};

export default async function CinemasPage() {
  const supabase = await createClientForServer();

  const now = new Date().toISOString();

  // Cines + conteo de funciones futuras (solo los que tienen algo en cartelera)
  const { data: screenings, error: screeningsError } = await supabase
    .from("screenings")
    .select("cinema_id, screening_times(screening_datetime)")
    .filter("screening_times.screening_datetime", "gte", now);

  if (screeningsError) {
    console.error("Error fetching screenings:", screeningsError);
  }

  const counts = new Map<number, number>();
  for (const s of screenings ?? []) {
    counts.set(s.cinema_id, (counts.get(s.cinema_id) ?? 0) + 1);
  }

  const { data: cinemas, error } = await supabase
    .from("cinemas")
    .select("*")
    .in("id", [...counts.keys()]);

  if (error) {
    console.error("Error fetching cinemas:", error);
  }

  const list: CinemaWithCount[] = (cinemas ?? [])
    .map((c) => ({ ...c, futureCount: counts.get(c.id) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1320px] mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
          <h1 className="text-3xl md:text-5xl font-semibold">Cines</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Cines y espacios de Buenos Aires con funciones en cartelera
          </p>
        </div>

        <CinemaMapLazy cinemas={list} height="380px" />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((cinema) => (
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
                {cinema.futureCount === 1
                  ? "1 función"
                  : `${cinema.futureCount} funciones`}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}