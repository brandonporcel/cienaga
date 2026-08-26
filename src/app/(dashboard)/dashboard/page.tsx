"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, LayoutGrid, List, Search } from "lucide-react";

import Cinema from "@/types/cinema";
import Screening from "@/types/screening";
import ScreeningCard, { ScreeningDetailModal } from "@/components/screenings/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getCinemasWithScreenings } from "@/app/actions/cinemas";
import { getPersonalizedScreenings } from "@/app/actions/screenings";

type DateFilter = "all" | "today" | string;

export default function ScreeningsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCinemas, setSelectedCinemas] = useState<Set<string>>(
    new Set(),
  );
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [selectedScreening, setSelectedScreening] = useState<Screening | null>(null);

  const toggleCinema = (name: string) => {
    setSelectedCinemas((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const filteredScreenings = screenings.filter((screening) => {
    const matchesSearch =
      screening.movies.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (screening.movies.directors?.name ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesCinema =
      selectedCinemas.size === 0 ||
      selectedCinemas.has(screening.cinemas.name);

    const matchesDate = (() => {
      if (dateFilter === "all") return true;
      if (dateFilter === "today") {
        const now = new Date();
        const screeningDate = new Date(
          screening.screening_times?.[0]?.screening_datetime || 0,
        );
        return screeningDate.toDateString() === now.toDateString();
      }
      // Filtro por fecha específica (YYYY-MM-DD)
      const screeningDate = new Date(
        screening.screening_times?.[0]?.screening_datetime || 0,
      );
      const screeningDateStr = screeningDate.toISOString().split("T")[0];
      return screeningDateStr === dateFilter;
    })();

    return matchesSearch && matchesCinema && matchesDate;
  });

  // Fechas únicas con funciones, ordenadas
  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();
    for (const screening of screenings) {
      const dt = screening.screening_times?.[0]?.screening_datetime;
      if (dt) {
        const d = new Date(dt);
        dateSet.add(d.toISOString().split("T")[0]);
      }
    }
    return Array.from(dateSet).sort();
  }, [screenings]);

  useEffect(() => {
    const fetchData = async () => {
      const [screeningsRes, cinemasRes] = await Promise.all([
        getPersonalizedScreenings(),
        getCinemasWithScreenings(),
      ]);
      setScreenings(screeningsRes);
      setCinemas(cinemasRes);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Cartelera</h1>
        <p className="text-muted-foreground text-sm">
          Funciones de tus directores favoritos en Buenos Aires
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center flex-wrap gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por película o director..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>

          {/* Cinema Multi-Select */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Cines
                {selectedCinemas.size > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {selectedCinemas.size}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Cines</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {cinemas.map((cinema) => (
                <DropdownMenuCheckboxItem
                  key={cinema.name}
                  checked={selectedCinemas.has(cinema.name)}
                  onCheckedChange={() => toggleCinema(cinema.name)}
                >
                  {cinema.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setView("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      {!loading && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant={dateFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("all")}
            className="text-xs"
          >
            Todas
          </Button>
          <Button
            variant={dateFilter === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("today")}
            className="text-xs"
          >
            Hoy
          </Button>
          {availableDates.map((dateStr) => {
            const d = new Date(dateStr + "T12:00:00");
            const label = d.toLocaleDateString("es-AR", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            return (
              <Button
                key={dateStr}
                variant={dateFilter === dateStr ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter(dateStr)}
                className="text-xs"
              >
                {label}
              </Button>
            );
          })}
        </div>
      )}

      {loading ? (
        /* Loading Skeleton */
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
                <div className="h-4 bg-muted animate-pulse rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredScreenings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">
            No se encontraron funciones que coincidan con tu búsqueda.
          </p>
        </div>
      ) : view === "table" ? (
        /* Table View */
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Película</th>
                <th className="text-left px-4 py-3 font-medium">Director</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  Cine
                </th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                  Próxima función
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredScreenings.map((screening) => (
                <tr
                  key={screening.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() =>
                    setSelectedScreening(screening)
                  }
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {screening.thumbnail_url || screening.movies?.poster_url ? (
                        <img
                          src={
                            screening.thumbnail_url ||
                            screening.movies?.poster_url ||
                            ""
                          }
                          alt=""
                          className="w-10 h-14 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-muted rounded flex items-center justify-center text-xs">
                          🎬
                        </div>
                      )}
                      <div>
                        <span className="font-medium">
                          {screening.movies.title}
                        </span>
                        {screening.movies.year && (
                          <span className="text-muted-foreground ml-1">
                            ({screening.movies.year})
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {screening.movies.directors?.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {screening.cinemas.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {screening.screening_times?.[0]?.screening_datetime
                      ? new Date(
                          screening.screening_times[0].screening_datetime,
                        ).toLocaleDateString("es-AR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScreenings.map((screening) => (
            <ScreeningCard key={screening.id} screening={screening} onOpenDetail={setSelectedScreening} />
          ))}
        </div>
      )}

      {/* Modal de detalle */}
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
