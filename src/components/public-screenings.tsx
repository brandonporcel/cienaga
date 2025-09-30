"use client";

import React, { useEffect, useState } from "react";

import Screening from "@/types/screening";

import ScreeningCard from "./screenings/card";

export default function PublicScreenings() {
  const [screenings, setScreenings] = useState<Screening[]>([]);

  useEffect(() => {
    const getScreenings = async () => {
      const res = await fetch("/api/screenings/featured");
      const parsedData: { data: Screening[] } = await res.json();
      setScreenings(parsedData.data);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screenings.map((screening) => (
            <ScreeningCard key={screening.id} screening={screening} />
          ))}
        </div>
      </div>
    </>
  );
}
