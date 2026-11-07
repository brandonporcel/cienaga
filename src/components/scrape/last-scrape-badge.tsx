"use client";

import { useEffect, useState } from "react";

import {
  getLastScrapeRun,
  type LastScrapeRun,
} from "@/app/actions/scrape-runs";

function formatRunDate(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function LastScrapeBadge({ className = "" }: { className?: string }) {
  const [run, setRun] = useState<LastScrapeRun | null>(null);

  useEffect(() => {
    let cancelled = false;

    getLastScrapeRun()
      .then((data) => {
        if (!cancelled) setRun(data);
      })
      .catch(() => {
        // Si la tabla todavía no existe, el badge simplemente no se muestra.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!run?.finished_at) return null;

  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      Última búsqueda: {formatRunDate(run.finished_at)}
    </p>
  );
}
