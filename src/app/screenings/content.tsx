"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Filter, LayoutGrid, List, Search } from "lucide-react";

import Screening from "@/types/screening";
import Cinema from "@/types/cinema";
import { movieSlug } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ScreeningCard, {
  ScreeningDetailModal,
} from "@/components/screenings/card";
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

type DateFilter = "all" | "today" | string;

export default function ScreeningsPageContent() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreening, setSelectedScreening] =
    useState<Screening | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCinemas, setSelectedCinemas] = useState<Set<string>>(
    new Set(),
  );
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [view, setView] = useState<"grid" | "table">("grid");

  const searchParams = useSearchParams();
  const highlightSlug = searchParams.get("movie");
  const highlightedRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
    getCinemasWithScreenings().then(setCinemas).catch(() => {});
  }, []);

  const toggleCinema = (name: string) => {
    setSelectedCinemas((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
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
      selectedCinemas.size === 0 || selectedCinemas.has(screening.cinemas.name);

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
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
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
                aria-label="Vista de grilla"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setView("table")}
                aria-label="Vista de tabla"
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
        ) : filteredScreenings.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No se encontraron funciones que coincidan con tu búsqueda.
          </p>
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
                    onClick={() => setSelectedScreening(screening)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {screening.thumbnail_url ||
                        screening.movies?.poster_url ? (
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
          /* Grilla de cards horizontales */
          <div
            id="cartelera"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {filteredScreenings.map((screening) => (
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
