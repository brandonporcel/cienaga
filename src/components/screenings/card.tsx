"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  Calendar,
  CalendarPlus,
  Clock,
  ExternalLink,
  Film,
  MapPin,
  Share2,
  Star,
} from "lucide-react";

import Screening, { ScreeningTime } from "@/types/screening";
import { movieSlug } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─── helpers ─── */

function groupByDate(times: ScreeningTime[]) {
  const now = new Date();
  const grouped = times
    .filter((t) => new Date(t.screening_datetime) >= now)
    .reduce(
      (acc, t) => {
        const key = new Date(t.screening_datetime).toDateString();
        (acc[key] ??= []).push(t);
        return acc;
      },
      {} as Record<string, ScreeningTime[]>,
    );

  return Object.entries(grouped)
    .map(([date, slots]) => ({
      date,
      slots: slots.sort(
        (a, b) =>
          new Date(a.screening_datetime).getTime() -
          new Date(b.screening_datetime).getTime(),
      ),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function fmtDay(d: string) {
  return new Date(d)
    .toLocaleDateString("es-AR", { weekday: "short" })
    .toUpperCase()
    .replace(".", "");
}

function fmtDayNum(d: string) {
  return new Date(d).getDate().toString();
}

function fmtMonth(d: string) {
  return new Date(d)
    .toLocaleDateString("es-AR", { month: "short" })
    .toLowerCase()
    .replace(".", "");
}

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function googleCalendarUrl(
  title: string,
  datetime: string,
  cinemaName: string,
  directorName?: string,
) {
  const start = new Date(datetime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const details = [directorName && `Director: ${directorName}`, `Cine: ${cinemaName}`]
    .filter(Boolean)
    .join("\n");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(cinemaName)}`;
}

function shareUrl(title: string, year?: number) {
  const slug = movieSlug(title, year);
  return `${window.location.origin}/screenings?movie=${slug}#cartelera`;
}

/* ─── component ─── */

interface ScreeningCardProps {
  screening: Screening;
  onOpenDetail?: (s: Screening) => void;
}

export default function ScreeningCard({
  screening,
  onOpenDetail,
}: ScreeningCardProps) {
  const m = screening.movies;
  const c = screening.cinemas;

  const nextTime = useMemo(() => {
    const now = new Date();
    const future = (screening.screening_times ?? [])
      .filter((t) => new Date(t.screening_datetime) > now)
      .sort(
        (a, b) =>
          new Date(a.screening_datetime).getTime() -
          new Date(b.screening_datetime).getTime(),
      );
    return future[0]?.screening_datetime ?? screening.screening_times?.[0]?.screening_datetime;
  }, [screening.screening_times]);

  const grouped = useMemo(
    () => groupByDate(screening.screening_times ?? []),
    [screening.screening_times],
  );

  return (
    <div className="flex gap-4 rounded-2xl border border-border/50 bg-card p-3 hover:shadow-lg transition-shadow duration-200">
      {/* Poster */}
      <button
        type="button"
        onClick={() => onOpenDetail?.(screening)}
        className="relative w-[100px] sm:w-[120px] flex-shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 cursor-pointer group/poster"
      >
        {m.poster_url ? (
          <Image
            src={m.poster_url}
            alt={m.title}
            fill
            className="object-cover transition-transform duration-200 group-hover/poster:scale-105"
            sizes="120px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs text-center p-2">
            <Film className="h-6 w-6 mb-1 opacity-40" />
          </div>
        )}
        {m.rating && (
          <div className="absolute top-1.5 right-1.5">
            <Badge
              variant="secondary"
              className="bg-background/80 backdrop-blur-sm text-xs px-1.5 py-0.5"
            >
              <Star className="h-2.5 w-2.5 mr-0.5 fill-primary text-primary" />
              {m.rating}
            </Badge>
          </div>
        )}
      </button>

      {/* Info */}
      <div className="flex flex-col justify-center min-w-0 flex-1 py-1">
        <button
          type="button"
          onClick={() => onOpenDetail?.(screening)}
          className="font-bold text-base sm:text-lg leading-tight truncate hover:underline text-left cursor-pointer"
        >
          {m.title}
        </button>
        <p className="text-sm text-muted-foreground">
          {m.directors?.name}
          {m.year ? ` · ${m.year}` : ""}
        </p>

        {/* Próxima función */}
        {nextTime && (
          <p className="text-sm text-muted-foreground mt-1.5">
            <Clock className="h-3 w-3 inline mr-1" />
            {fmtDay(nextTime)} {fmtDayNum(nextTime)} {fmtMonth(nextTime)} a
            las {fmtTime(nextTime)} hs
          </p>
        )}

        {/* Cine */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
          {c.image_url ? (
            <img src={c.image_url} alt={c.name} className="h-3.5 w-auto" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          <span className="truncate">{c.name}</span>
        </div>

        {/* Ver más */}
        {onOpenDetail && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 self-start text-xs h-7 cursor-pointer"
            onClick={() => onOpenDetail(screening)}
          >
            Ver funciones
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Modal de detalle ─── */

interface ScreeningDetailProps {
  screening: Screening;
  open: boolean;
  onClose: () => void;
}

export function ScreeningDetailModal({
  screening,
  open,
  onClose,
}: ScreeningDetailProps) {
  const m = screening.movies;
  const c = screening.cinemas;
  const backgroundImage = m.background_img_url || m.poster_url;

  const grouped = useMemo(
    () => groupByDate(screening.screening_times ?? []),
    [screening.screening_times],
  );

  const now = new Date();

  const handleShare = () => {
    const url = shareUrl(m.title, m.year);
    navigator.clipboard.writeText(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl">
        {/* Hero image */}
        <div className="relative w-full aspect-[16/7] sm:aspect-[16/6]">
          {backgroundImage ? (
            <Image
              src={backgroundImage}
              alt={m.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 640px"
              priority
            />
          ) : (
            <div className="w-full h-full bg-zinc-900" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-background/70 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-background/90 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 pt-0 -mt-8 relative z-10">
          {/* Title block */}
          <h2 className="text-2xl font-bold leading-tight">{m.title}</h2>
          <p className="text-muted-foreground mt-0.5">
            {m.directors?.name}
            {m.year ? ` · ${m.year}` : ""}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {m.rating && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                {m.rating}
              </Badge>
            )}
            {m.duration && (
              <span className="text-xs text-muted-foreground">
                {m.duration} min
              </span>
            )}
            {screening.event_type && (
              <Badge className="text-xs bg-primary/90">{screening.event_type}</Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleShare}
            >
              <Share2 className="h-3.5 w-3.5" />
              Copiar link
            </Button>
            {m.url && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                asChild
              >
                <a href={m.url} target="_blank" rel="noopener noreferrer">
                  {/* Letterboxd icon (inline SVG) */}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                  >
                    <path d="M11.399 8.005a5.735 5.735 0 0 0-1.108 4.476c.78-1.254 2.064-2.12 3.56-2.404a5.683 5.683 0 0 0-2.452-2.072zm5.653 4.48c-.036-.04-.075-.078-.11-.114a5.74 5.74 0 0 0-3.032-1.728c.018-.002.034-.009.052-.009.78 0 1.524.192 2.19.518a5.718 5.718 0 0 1 .9 3.333zm-9.862.54c0 .019-.001.036-.001.054 0 2.98 2.414 5.397 5.398 5.397.422 0 .836-.05 1.234-.145a5.69 5.69 0 0 1-2.404-3.876c0-.021-.001-.041-.001-.062a5.703 5.703 0 0 0-4.226 1.375v-2.743zm7.775-3.63a5.74 5.74 0 0 0-3.71-1.38c-.02 0-.041.001-.062.001a5.693 5.693 0 0 1 2.356 2.107 5.73 5.73 0 0 0 1.416-.728zm-7.26-2.23a5.732 5.732 0 0 0-2.224 3.287c.69-.98 1.707-1.7 2.875-2.024a5.706 5.706 0 0 0-.651-1.263zm4.172-1.23c-.636-.188-1.312-.29-2.008-.29-.665 0-1.304.092-1.904.26a5.72 5.72 0 0 1 3.912.03zm5.88 3.207c-.726-1.372-2.052-2.368-3.64-2.76a5.72 5.72 0 0 1 1.68 3.383 5.71 5.71 0 0 0 1.96-.623zM7.6 3.898A5.69 5.69 0 0 0 4.29 7.32a5.71 5.71 0 0 1 2.007-3.887c.43-.373.912-.684 1.432-.916l-.128-.62zm5.737-.527c-.446-.13-.912-.2-1.388-.2-.876 0-1.715.23-2.435.624a5.703 5.703 0 0 1 3.823-.424zm5.815 2.937c-.84-1.56-2.42-2.65-4.254-3a5.73 5.73 0 0 1 1.865 3.591 5.71 5.71 0 0 0 2.389-.59zM3.962 9.69c-.354 1.038-.377 2.148-.04 3.197.646-1.254 1.87-2.192 3.324-2.59a5.71 5.71 0 0 1-3.284-.607zm5.737-5.65c-.632-.186-1.303-.286-1.994-.286-.72 0-1.414.108-2.072.31a5.703 5.703 0 0 1 4.066-.024zm5.88 3.2c-.79-1.46-2.23-2.485-3.916-2.82a5.73 5.73 0 0 1 1.814 3.441 5.7 5.7 0 0 0 2.102-.621zM6.62 3.89c-.448.393-.847.83-1.183 1.316A5.71 5.71 0 0 0 3.28 8.8c.664-1.256 1.863-2.193 3.296-2.595a5.71 5.71 0 0 1 .045-1.316z" />
                  </svg>
                  Letterboxd
                </a>
              </Button>
            )}
            {screening.original_url && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                asChild
              >
                <a
                  href={screening.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Cine
                </a>
              </Button>
            )}
          </div>

          {/* Funciones por día */}
          {grouped.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Funciones
              </h3>

              <div className="space-y-3">
                {grouped.map(({ date, slots }) => (
                  <div
                    key={date}
                    className="flex items-start gap-3 rounded-xl bg-muted/40 p-3"
                  >
                    {/* Día */}
                    <div className="flex flex-col items-center min-w-[44px] pt-0.5">
                      <span className="text-xs font-bold text-muted-foreground">
                        {fmtDay(date)}
                      </span>
                      <span className="text-xl font-bold leading-tight">
                        {fmtDayNum(date)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {fmtMonth(date)}
                      </span>
                    </div>

                    {/* Horarios */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {slots.map((slot) => {
                        const isPast =
                          new Date(slot.screening_datetime) < now;
                        return (
                          <a
                            key={slot.id}
                            href={googleCalendarUrl(
                              m.title,
                              slot.screening_datetime,
                              c.name,
                              m.directors?.name,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                              isPast
                                ? "bg-muted text-muted-foreground/50 cursor-default"
                                : "bg-[#3aa64a] text-white hover:bg-[#329140]"
                            }`}
                          >
                            <CalendarPlus className="h-3 w-3" />
                            {fmtTime(slot.screening_datetime)}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info cine */}
          <div className="flex items-center justify-between mt-4 p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#3aa64a]" />
              <span className="text-sm font-medium">{c.name}</span>
              {screening.room && (
                <span className="text-xs text-muted-foreground">
                  · {screening.room}
                </span>
              )}
            </div>
            {c.url && (
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Screening text original */}
          {screening.screening_time_text && (
            <p className="text-xs text-muted-foreground mt-3 italic">
              {screening.screening_time_text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
