"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import Screening from "@/types/screening";
import { movieSlug } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ScreeningCard from "@/components/screenings/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ScreeningsPageContent() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreening, setSelectedScreening] =
    useState<Screening | null>(null);
  const searchParams = useSearchParams();
  const highlightSlug = searchParams.get("movie");
  const highlightedRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchScreenings = async () => {
      try {
        const res = await fetch("/api/screenings/all");
        if (res.ok) {
          const data: { data: Screening[] } = await res.json();
          setScreenings(data.data ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchScreenings();
  }, []);

  // Scroll al elemento destacado cuando la página carga
  useEffect(() => {
    if (highlightSlug && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightSlug, screenings]);

  const isHighlighted = (s: Screening) =>
    highlightSlug === movieSlug(s.movies.title, s.movies.year);

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
          <h1 className="text-3xl md:text-5xl font-semibold">
            Todas las funciones
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Próximas funciones en Buenos Aires
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
            {Array.from({ length: isMobile ? 12 : 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card overflow-hidden"
              >
                <div
                  className={`bg-muted animate-pulse ${isMobile ? "aspect-[2/3]" : "h-64"}`}
                />
                {!isMobile && (
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : screenings.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No hay funciones programadas por el momento.
          </p>
        ) : isMobile ? (
          /* Mobile: grilla de posters */
          <>
            <div
              id="cartelera"
              className="grid grid-cols-4 gap-2"
            >
              {screenings.map((screening) => (
                <div
                  key={screening.id}
                  ref={isHighlighted(screening) ? highlightedRef : undefined}
                >
                  <button
                    onClick={() => setSelectedScreening(screening)}
                    className={`relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-zinc-800 active:scale-95 transition-transform ${
                      isHighlighted(screening)
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                  >
                    {screening.movies?.poster_url ? (
                      <Image
                        src={screening.movies.poster_url}
                        alt={screening.movies.title}
                        fill
                        className="object-cover"
                        sizes="25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs text-center p-1">
                        {screening.movies.title}
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Modal con detalles */}
            <Dialog
              open={!!selectedScreening}
              onOpenChange={(open) => !open && setSelectedScreening(null)}
            >
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                {selectedScreening && (
                  <>
                    <DialogTitle className="sr-only">
                      {selectedScreening.movies.title}
                    </DialogTitle>
                    <ScreeningCard screening={selectedScreening} />
                  </>
                )}
              </DialogContent>
            </Dialog>
          </>
        ) : (
          /* Desktop: cards completas */
          <div
            id="cartelera"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {screenings.map((screening) => (
              <div
                key={screening.id}
                ref={isHighlighted(screening) ? highlightedRef : undefined}
                className={
                  isHighlighted(screening)
                    ? "ring-2 ring-primary rounded-lg"
                    : undefined
                }
              >
                <ScreeningCard screening={screening} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
