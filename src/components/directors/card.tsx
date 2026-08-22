"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { Director, DirectorSource } from "@/types/director";
import { cn } from "@/lib/utils";
import { DirectorDetailDialog } from "@/components/directors/detail-dialog";
const SOURCE_BADGE_CLASSES: Record<DirectorSource, string> = {
  auto: "bg-emerald-500/90 text-white",
  manual: "bg-sky-500/90 text-white",
  muted: "bg-zinc-500/90 text-white",
};

const SOURCE_BADGE_LABELS: Record<DirectorSource, string> = {
  auto: "Seguido",
  manual: "Favorito",
  muted: "Silenciado",
};

export default function Card08({
  director,
  onPreferenceChanged,
}: {
  director: Director;
  onPreferenceChanged?: (directorId: string, source: DirectorSource | null) => void;
}) {
  const { name } = director;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative overflow-hidden rounded-2xl cursor-pointer",
          "bg-white/80 dark:bg-zinc-900/80",
          "backdrop-blur-xl",
          "border border-zinc-200/50 dark:border-zinc-800/50",
          "shadow-xs",
          "transition-all duration-300",
          "hover:shadow-md",
          "hover:border-zinc-300/50 dark:hover:border-zinc-700/50",
        )}
      >
        {director.source && (
          <span
            className={cn(
              "absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg text-xs font-medium",
              "backdrop-blur-md shadow-xs",
              SOURCE_BADGE_CLASSES[director.source],
            )}
          >
            {SOURCE_BADGE_LABELS[director.source]}
          </span>
        )}

        <div className="relative h-[320px] overflow-hidden">
          <Image
            src={
              director.image_url ||
              "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg"
            }
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div
          className={cn(
            "absolute inset-0",
            "bg-linear-to-t from-black/90 via-black/40 to-transparent",
          )}
        />

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-white dark:text-zinc-100 leading-snug">
                {name}
              </h3>
              <p className="text-sm text-zinc-200 dark:text-zinc-300 line-clamp-2">
                Ver detalle y justificación
              </p>
            </div>
            <a
              href={director.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={cn(
                  "p-2 rounded-full",
                  "bg-white/10 dark:bg-zinc-800/50",
                  "backdrop-blur-md",
                  "hover:bg-white/20 dark:hover:bg-zinc-700/50",
                  "transition-colors duration-300 group",
                )}
              >
                <ArrowUpRight className="w-4 h-4 text-white group-hover:-rotate-12 transition-transform duration-300" />
              </div>
            </a>
          </div>
        </div>
      </div>

      <DirectorDetailDialog
        director={director}
        open={isOpen}
        onOpenChange={setIsOpen}
        onPreferenceChanged={onPreferenceChanged}
      />
    </>
  );
}
