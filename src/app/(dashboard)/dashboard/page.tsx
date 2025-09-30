"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import Cinema from "@/types/cinema";
import Screening from "@/types/screening";
import ScreeningCard from "@/components/screenings/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEnabledCinemas } from "@/app/actions/cinemas";
import { getPersonalizedScreenings } from "@/app/actions/screenings";

export default function ScreeningsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCinema, setSelectedCinema] = useState("Todos los cines");
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);

  const filteredScreenings = screenings.filter((screening) => {
    const matchesSearch =
      screening.movies.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      screening.movies.directors?.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesCinema =
      selectedCinema === "Todos los cines" ||
      screening.cinemas.name === selectedCinema;
    return matchesSearch && matchesCinema;
  });

  useEffect(() => {
    const getScreenings = async () => {
      const res = await getPersonalizedScreenings();
      console.log(res);
      setScreenings(res);
    };
    const getCinemas = async () => {
      const res = await getEnabledCinemas();
      setCinemas(res);
    };
    getCinemas();
    getScreenings();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-border backdrop-blur-sm sticky top-0 z-50 bg-gradient-to-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-balance">🌊 Ciénaga</h1>
              <p className="text-muted-foreground text-pretty">
                Películas de tus directores favoritos en Buenos Aires
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por película o director..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 backdrop-blur-sm"
            />
          </div>

          {/* Cinema Filter */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {cinemas.map((cinema) => (
              <Button
                key={cinema.name}
                variant={selectedCinema === cinema.name ? "default" : "outline"}
                onClick={() => setSelectedCinema(cinema.name)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {cinema.name}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screenings.map((screening) => (
            <ScreeningCard key={screening.id} screening={screening} />
          ))}
        </div>

        {filteredScreenings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No se encontraron funciones que coincidan con tu búsqueda.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
