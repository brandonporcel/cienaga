"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Clock,
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

function fmtRating(r: number) {
  return Number.isInteger(r) ? `${r}.0` : String(r);
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
              {fmtRating(m.rating)}
            </Badge>
          </div>
        )}
      </button>

      {/* Info */}
      <div className="flex flex-col justify-center min-w-0 flex-1 py-1">
        <h3 className="font-bold text-base sm:text-lg leading-tight truncate">
          {m.title}
        </h3>
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
  const [copied, setCopied] = useState(false);

  const grouped = useMemo(
    () => groupByDate(screening.screening_times ?? []),
    [screening.screening_times],
  );

  const now = new Date();

  const handleShare = () => {
    const url = shareUrl(m.title, m.year);
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
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
                {fmtRating(m.rating)}
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
              {copied ? "Copiado ✓" : "Copiar link"}
            </Button>
            {m.url && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                asChild
              >
                <a href={m.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://letterboxd.com/favicon.ico"
                    alt=""
                    className="h-3.5 w-3.5"
                  />
                  Letterboxd
                </a>
              </Button>
            )}
          </div>

          {/* Info cine + screening text */}
          <div className="mt-4 p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#3aa64a] flex-shrink-0" />
              <span className="text-sm font-medium">{c.name}</span>
              {screening.room && (
                <span className="text-xs text-muted-foreground">
                  · {screening.room}
                </span>
              )}
            </div>
            {screening.screening_time_text && (
              <p className="text-xs text-muted-foreground mt-1.5 italic pl-4">
                {screening.screening_time_text}
              </p>
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
                        const isPast = new Date(slot.screening_datetime) < now;
                        return (
                          <span
                            key={slot.id}
                            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${
                              isPast
                                ? "bg-muted text-muted-foreground/50"
                                : "bg-[#3aa64a] text-white"
                            }`}
                          >
                            {fmtTime(slot.screening_datetime)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
