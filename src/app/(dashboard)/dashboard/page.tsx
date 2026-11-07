"use client";

import ScreeningsBrowser from "@/components/screenings/screenings-browser";
import { LastScrapeBadge } from "@/components/scrape/last-scrape-badge";
import { getPersonalizedScreenings } from "@/app/actions/screenings";

export default function ScreeningsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Cartelera</h1>
        <p className="text-muted-foreground text-sm">
          Funciones de tus directores favoritos en Buenos Aires
        </p>
        <LastScrapeBadge className="mt-1" />
      </div>

      <ScreeningsBrowser loadScreenings={getPersonalizedScreenings} />
    </>
  );
}