"use client";

import ScreeningsBrowser from "@/components/screenings/screenings-browser";
import { getPersonalizedScreenings } from "@/app/actions/screenings";

export default function ScreeningsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Cartelera</h1>
        <p className="text-muted-foreground text-sm">
          Funciones de tus directores favoritos en Buenos Aires
        </p>
      </div>

      <ScreeningsBrowser loadScreenings={getPersonalizedScreenings} />
    </>
  );
}