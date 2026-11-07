"use server";

import { createClientForServer } from "@/lib/supabase/server";

export interface LastScrapeRun {
  source: string;
  finished_at: string;
  entries_processed: number | null;
}

/** Última corrida de scraping exitosa (para el badge "Última búsqueda"). */
export async function getLastScrapeRun(): Promise<LastScrapeRun | null> {
  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("scrape_runs")
    .select("source, finished_at, entries_processed")
    .eq("status", "success")
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as LastScrapeRun;
}
