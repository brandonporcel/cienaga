"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
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
    <div className="container mx-auto px-4">
      <div className="flex flex-col justify-start items-start gap-2 mb-8">
        <h2 className="text-foreground text-4xl md:text-6xl font-semibold leading-tight md:leading-[66px]">
          Cartelera
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
          Las funciones que más siguen los usuarios de Ciénaga en Buenos Aires
        </p>
      </div>

      {error ? (
        <p className="text-muted-foreground py-8 text-center">
          No se pudieron cargar las funciones. Intentalo de nuevo mas tarde.
        </p>
      ) : screenings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {screenings.map((screening) => (
              <ScreeningCard key={screening.id} screening={screening} />
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Link href="/screenings">
              <Button variant="outline" className="cursor-pointer">
                Ver todas las funciones
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground py-8 text-center">
          Todavia no hay funciones disponibles.
        </p>
      )}
    </div>
  );
}
