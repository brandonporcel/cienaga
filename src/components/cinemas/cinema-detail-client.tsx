"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Instagram } from "lucide-react";

import Cinema from "@/types/cinema";
import Screening from "@/types/screening";
import CinemaMapLazy from "@/components/cinemas/cinema-map-lazy";
import ScreeningCard, {
  ScreeningDetailModal,
} from "@/components/screenings/card";
import { Button } from "@/components/ui/button";

interface CinemaDetailClientProps {
  cinema: Cinema;
}

export default function CinemaDetailClient({
  cinema,
}: CinemaDetailClientProps) {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreening, setSelectedScreening] =
    useState<Screening | null>(null);

  useEffect(() => {
    fetch(`/api/screenings/all?cinema_id=${cinema.id}`)
      .then((res) => res.json())
      .then((data: { data: Screening[] }) => setScreenings(data.data ?? []))
      .catch(() => setScreenings([]))
      .finally(() => setLoading(false));
  }, [cinema.id]);

  return (
    <>
      <div className="mb-8">
        <Link href="/cinemas">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a cines
          </Button>
        </Link>
        <h1 className="text-3xl md:text-5xl font-semibold">{cinema.name}</h1>
        {cinema.address && (
          <p className="text-muted-foreground text-lg mt-2">{cinema.address}</p>
        )}
        {(cinema.website_url || cinema.instagram_url) && (
          <div className="flex gap-2 mt-3">
            {cinema.website_url && (
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a
                  href={cinema.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Sitio web
                </a>
              </Button>
            )}
            {cinema.instagram_url && (
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a
                  href={cinema.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  Instagram
                </a>
              </Button>
            )}
          </div>
        )}
      </div>

      <CinemaMapLazy cinemas={[cinema]} height="420px" showCineLink={false} />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Funciones en cartelera</h2>
        {loading ? (
          <p className="text-muted-foreground">Cargando funciones...</p>
        ) : screenings.length === 0 ? (
          <p className="text-muted-foreground">
            No hay funciones próximas en este cine.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {screenings.map((screening) => (
              <ScreeningCard
                key={screening.id}
                screening={screening}
                onOpenDetail={setSelectedScreening}
              />
            ))}
          </div>
        )}
      </div>

      {selectedScreening && (
        <ScreeningDetailModal
          screening={selectedScreening}
          open={!!selectedScreening}
          onClose={() => setSelectedScreening(null)}
        />
      )}
    </>
  );
}