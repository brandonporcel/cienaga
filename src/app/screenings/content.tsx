"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import Screening from "@/types/screening";
import { movieSlug } from "@/lib/utils";
import ScreeningCard from "@/components/screenings/card";
import { Button } from "@/components/ui/button";

export default function ScreeningsPageContent() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const highlightSlug = searchParams.get("movie");
  const highlightedRef = useRef<HTMLDivElement>(null);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card p-0 overflow-hidden"
              >
                <div className="h-64 bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : screenings.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No hay funciones programadas por el momento.
          </p>
        ) : (
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
