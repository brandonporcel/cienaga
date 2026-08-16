"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Star, Volume2, VolumeX, UserMinus } from "lucide-react";
import { toast } from "sonner";

import {
  getDirectorDetail,
  updateDirectorPreference,
} from "@/app/actions/directors";
import { Director, DirectorDetail, DirectorSource } from "@/types/director";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<DirectorSource, string> = {
  auto: "Seguido (auto)",
  manual: "Seguido (manual)",
  muted: "Silenciado",
};

function SourceBadge({ source }: { source: DirectorSource | null }) {
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-lg text-xs font-medium",
        source === "auto" &&
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        source === "manual" &&
          "bg-sky-500/15 text-sky-600 dark:text-sky-400",
        source === "muted" &&
          "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
      )}
    >
      {source ? SOURCE_LABEL[source] : "No seguido"}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(Math.max(rating - (star - 1), 0), 1);
        return (
          <span key={star} className="relative inline-block h-3.5 w-3.5">
            <Star className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function justification(detail: DirectorDetail): string {
  const { metrics } = detail;

  if (detail.source === "manual") {
    return "Lo marcaste como favorito manualmente.";
  }
  if (detail.source === "muted") {
    return "Lo silenciaste: no recibís notificaciones de este director.";
  }

  if (metrics.ratedFiveStars > 0) {
    return `Le diste 5★ a ${metrics.ratedFiveStars} película${metrics.ratedFiveStars > 1 ? "s" : ""}.`;
  }
  if (metrics.watched > 0) {
    return `Viste ${metrics.watched} película${metrics.watched > 1 ? "s" : ""}, ${metrics.rated35Plus} con 3.5★ o más (${metrics.pct35Plus}%).`;
  }
  return "Todavía no viste películas de este director.";
}

export function DirectorDetailDialog({
  director,
  open,
  onOpenChange,
  onPreferenceChanged,
}: {
  director: Director;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreferenceChanged?: (directorId: string, source: DirectorSource | null) => void;
}) {
  const [detail, setDetail] = useState<DirectorDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    getDirectorDetail(director.id)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("No se pudo cargar el detalle del director");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, director.id]);

  const handleAction = async (
    action: "follow" | "silence" | "unsilence" | "unfollow",
  ) => {
    setUpdatingAction(action);
    try {
      await updateDirectorPreference(director.id, action);

      if (action === "unfollow") {
        onPreferenceChanged?.(director.id, null);
        toast.success("Dejaste de seguir a este director");
        onOpenChange(false);
        return;
      }

      const refreshed = await getDirectorDetail(director.id);
      setDetail(refreshed);
      onPreferenceChanged?.(director.id, refreshed.source);
      toast.success("Preferencia actualizada");
    } catch {
      toast.error("No se pudo actualizar la preferencia");
    } finally {
      setUpdatingAction(null);
    }
  };

  const source = detail?.source ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {detail?.director.image_url && (
              <Image
                src={detail.director.image_url}
                alt={director.name}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            )}
            <span>{director.name}</span>
            <SourceBadge source={source} />
          </DialogTitle>
          <DialogDescription>
            Por qué aparece entre tus directores favoritos
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <>
            <p className="text-sm text-muted-foreground">
              {justification(detail)}
            </p>

            {detail.filmography.length > 0 && (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {detail.filmography.map((film) => (
                  <div
                    key={`${film.title}-${film.year}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200/60 p-2 dark:border-zinc-800/60"
                  >
                    {film.poster_url ? (
                      <Image
                        src={film.poster_url}
                        alt={film.title}
                        width={36}
                        height={52}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-[52px] w-9 items-center justify-center rounded bg-zinc-100 text-xs text-muted-foreground dark:bg-zinc-800">
                        ?
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{film.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {film.year ?? "—"}
                      </p>
                    </div>
                    {film.rating != null && <Stars rating={film.rating} />}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              {source !== "muted" ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updatingAction !== null}
                  onClick={() => handleAction("silence")}
                >
                  {updatingAction === "silence" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <VolumeX className="mr-2 h-4 w-4" />
                  )}
                  Silenciar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updatingAction !== null}
                  onClick={() => handleAction("unsilence")}
                >
                  {updatingAction === "unsilence" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="mr-2 h-4 w-4" />
                  )}
                  Dejar de silenciar
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                disabled={updatingAction !== null}
                onClick={() => handleAction("unfollow")}
              >
                {updatingAction === "unfollow" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserMinus className="mr-2 h-4 w-4" />
                )}
                Dejar de seguir
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
