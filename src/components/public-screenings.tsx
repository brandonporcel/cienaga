"use client";

import React, { useEffect, useState } from "react";

import Screening from "@/types/screening";

import ScreeningCard from "./screenings/card";

export default function PublicScreenings() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const getScreenings = async () => {
      try {
        const res = await fetch("/api/screenings/featured");
        if (!res.ok) {
          setError(true);
          return;
        }
        const parsedData: { data: Screening[] | null } = await res.json();
        setScreenings(parsedData.data ?? []);
      } catch {
        setError(true);
      }
    };
    getScreenings();
  }, []);

  return (
    <>
      <header className="border-border backdrop-blur-sm sticky top-0 z-50 bg-gradient-to-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">🌊 Ciénaga</h1>
              <p className="text-muted-foreground text-pretty">
                Películas de tus directores favoritos en Buenos Aires
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4">
        {error ? (
          <p className="text-muted-foreground py-8 text-center">
            No se pudieron cargar las funciones. Intentalo de nuevo mas tarde.
          </p>
        ) : screenings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {screenings.map((screening) => (
              <ScreeningCard key={screening.id} screening={screening} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center">
            Todavia no hay funciones disponibles.
          </p>
        )}
      </div>
    </>
  );
}
