import { createServiceClient } from "@/lib/supabase/service";

export type ScrapeRunStatus = "success" | "error";

/**
 * Registra el inicio de una corrida de scraping en `scrape_runs`.
 * Devuelve el id para cerrarla al terminar (o null si falla el registro:
 * el scraping debe seguir funcionando aunque la tabla no exista todavía).
 */
export async function startScrapeRun(source: string): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("scrape_runs")
      .insert({ source, status: "running" })
      .select("id")
      .single();

    if (error) {
      console.error(
        `⚠️  No se pudo registrar la corrida (${source}):`,
        error.message,
      );
      return null;
    }
    return data.id;
  } catch (error) {
    console.error(`⚠️  No se pudo registrar la corrida (${source}):`, error);
    return null;
  }
}

/** Cierra la corrida con su resultado final. */
export async function finishScrapeRun(
  id: string | null,
  result: {
    status: ScrapeRunStatus;
    entriesProcessed?: number;
    errorMessage?: string;
  },
): Promise<void> {
  if (!id) return;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("scrape_runs")
      .update({
        status: result.status,
        finished_at: new Date().toISOString(),
        entries_processed: result.entriesProcessed ?? null,
        error_message: result.errorMessage ?? null,
      })
      .eq("id", id);

    if (error) {
      console.error("⚠️  No se pudo cerrar la corrida:", error.message);
    }
  } catch (error) {
    console.error("⚠️  No se pudo cerrar la corrida:", error);
  }
}
