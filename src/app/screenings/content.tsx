"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import Screening from "@/types/screening";
import { movieSlug } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ScreeningCard, {
  ScreeningDetailModal,
} from "@/components/screenings/card";
import { Button } from "@/components/ui/button";

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

  // Scroll + auto-open para deep linking
  useEffect(() => {
    if (highlightSlug && screenings.length > 0) {
      const match = screenings.find(
        (s) => highlightSlug === movieSlug(s.movies.title, s.movies.year),
      );
      if (match) {
        setSelectedScreening(match);
        // Scroll después de un tick para que el DOM renderice
        requestAnimationFrame(() => {
          highlightedRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
      }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-2xl border bg-card p-3 animate-pulse"
              >
                <div className="w-[120px] aspect-[2/3] bg-muted rounded-xl" />
                <div className="flex-1 py-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-7 bg-muted rounded w-24 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : screenings.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No hay funciones programadas por el momento.
          </p>
        ) : (
          <>
            {/* Grilla de cards horizontales */}
            <div
              id="cartelera"
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {screenings.map((screening) => (
                <div
                  key={screening.id}
                  ref={isHighlighted(screening) ? highlightedRef : undefined}
                  className={
                    isHighlighted(screening)
                      ? "ring-2 ring-primary rounded-2xl"
                      : undefined
                  }
                >
                  <ScreeningCard
                    screening={screening}
                    onOpenDetail={setSelectedScreening}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedScreening && (
        <ScreeningDetailModal
          screening={selectedScreening}
          open={!!selectedScreening}
          onClose={() => setSelectedScreening(null)}
        />
      )}
    </div>
  );
}
