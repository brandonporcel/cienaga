"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Search,
  Star,
} from "lucide-react";

import Cinema from "@/types/cinema";
import Screening, { ScreeningTime } from "@/types/screening";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { getEnabledCinemas } from "@/app/actions/cinemas";
import { getPersonalizedScreenings } from "@/app/actions/screenings";

export default function ScreeningsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCinema, setSelectedCinema] = useState("Todos los cines");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);

  const { isMobile } = useSidebar();

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

  const addToCalendar = (screening: Screening, showtime: string) => {
    if (showtime == "") {
    }
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(screening.movies.title)}&dates=${startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${endDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z&details=${encodeURIComponent(`Director: ${screening.movies.directors?.name}\nCine: ${screening.cinemas.name}`)}&location=${encodeURIComponent(screening.cinemas.name)}`;

    window.open(calendarUrl, "_blank");
  };

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

  // Agrupar horarios por fecha
  function groupScreeningsByDate(screeningTimes: ScreeningTime[]) {
    const grouped = screeningTimes.reduce(
      (acc, time) => {
        const date = new Date(time.screening_datetime).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(time);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return Object.entries(grouped)
      .map(([date, times]) => ({
        date,
        times: times.sort(
          (a, b) =>
            new Date(a.screening_datetime).getTime() -
            new Date(b.screening_datetime).getTime(),
        ),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(datetime: string) {
    return new Date(datetime).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getNextScreeningTime(screeningTimes: any[]) {
    const now = new Date();
    const futureScreenings = screeningTimes
      .filter((time) => new Date(time.screening_datetime) > now)
      .sort(
        (a, b) =>
          new Date(a.screening_datetime).getTime() -
          new Date(b.screening_datetime).getTime(),
      );

    return (
      futureScreenings[0]?.screening_datetime ||
      screeningTimes[0]?.screening_datetime
    );
  }

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
            <Card
              key={screening.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50"
              onMouseEnter={() => setHoveredCard(screening.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="relative">
                <Image
                  src={screening.thumbnail_url}
                  alt={screening.movies.title}
                  title={`${screening.movies.title} - ${screening.cinemas.name}`}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  width={600}
                  height={500}
                />

                <div className="absolute top-3 right-3">
                  <Badge
                    variant="secondary"
                    className="bg-background/80 backdrop-blur-sm"
                  >
                    <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                    {screening.movies.rating || "N/A"}
                  </Badge>
                </div>
                {screening.event_type && (
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-primary/90 backdrop-blur-sm">
                      {screening.event_type}
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg text-balance leading-tight">
                      {screening.movies.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {screening.movies?.directors?.name}
                      {screening.movies.year
                        ? `• ${screening.movies.year}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {screening.cinemas.image_url && (
                      <img
                        src={screening.cinemas.image_url}
                        alt={screening.cinemas.name}
                        className="h-4 w-auto"
                      />
                    )}
                    <MapPin className="h-3 w-3" />
                    <span>{screening.cinemas.name}</span>
                    {screening.room && <span>• {screening.room}</span>}
                  </div>

                  {/* Mostrar texto original y fechas procesadas */}
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      <span className="italic">
                        {screening.screening_time_text}
                      </span>
                    </div>

                    {/* Fechas específicas agrupadas */}
                    <div className="space-y-1">
                      {groupScreeningsByDate(screening.screening_times).map(
                        ({ date, times }) => (
                          <div
                            key={date}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-muted-foreground min-w-[80px]">
                              {formatDate(date)}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {times.map((time) => (
                                <Badge
                                  key={`${date}-${time.id}`}
                                  variant="secondary"
                                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                  onClick={() =>
                                    addToCalendar(
                                      screening,
                                      time.screening_datetime,
                                    )
                                  }
                                >
                                  {formatTime(time.screening_datetime)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div
                    className={`flex gap-2 pt-2 transition-all duration-300 ${
                      hoveredCard === screening.id || isMobile
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-2"
                    }`}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(screening.original_url, "_blank")
                      }
                      className="flex-1"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Ver detalles
                    </Button>

                    {/* Botón de calendario para el próximo horario */}
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() =>
                        addToCalendar(
                          screening,
                          getNextScreeningTime(screening.screening_times),
                        )
                      }
                      className="shrink-0"
                    >
                      <Calendar className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
