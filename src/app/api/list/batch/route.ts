import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createClientForServer } from "@/lib/supabase/server";
import { normalizeText } from "@/lib/utils";

const ListEntrySchema = z.object({
  filmSlug: z.string().min(1),
  filmTitle: z.string().min(1).max(200),
  filmYear: z.number().int(),
  directorName: z.string().optional(),
  directorUrl: z.string().url().optional(),
  posterUrl: z.string().url().optional(),
  cinemaName: z.string().min(1),
  cinemaAddress: z.string().optional(),
  screeningTimeText: z.string().max(500),
  screeningDatetimes: z.array(z.iso.datetime()).min(1),
  description: z.string().max(2000).optional(),
  originalUrl: z.string().url(),
});

const ListBatchSchema = z.object({
  entries: z.array(ListEntrySchema).min(1).max(200),
});

type ValidatedEntry = z.infer<typeof ListEntrySchema>;

interface ProcessingResult {
  title: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClientForServer();

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = ListBatchSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.message,
        },
        { status: 400 },
      );
    }

    const { entries } = validationResult.data;
    console.log(`Processing ${entries.length} list entries`);

    const results: ProcessingResult[] = [];

    for (const entry of entries) {
      try {
        const result = await processEntry(supabase, entry);
        results.push(result);
      } catch (error) {
        console.error(`Error processing "${entry.filmTitle}":`, error);
        results.push({
          title: entry.filmTitle,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const created = results.filter((r) => r.success && !r.error).length;
    const skipped = results.filter((r) => r.success && r.error).length;
    const errors = results
      .filter((r) => !r.success)
      .map((r) => `${r.title}: ${r.error}`);

    console.log(
      `Batch completed: ${created} created, ${skipped} skipped, ${errors.length} errors`,
    );

    return NextResponse.json({
      processed: results.length,
      created,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("Fatal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function processEntry(
  supabase: SupabaseClient,
  entry: ValidatedEntry,
): Promise<ProcessingResult> {
  try {
    const cinemaId = await findOrCreateCinema(supabase, entry.cinemaName);
    if (!cinemaId) {
      return { title: entry.filmTitle, success: false, error: "Failed to find or create cinema" };
    }

    const movieId = await findOrCreateMovie(
      supabase,
      entry.filmSlug,
      entry.filmTitle,
      entry.filmYear,
      entry.originalUrl,
      entry.posterUrl,
    );
    if (!movieId) {
      return { title: entry.filmTitle, success: false, error: "Failed to find or create movie" };
    }

    if (entry.directorName) {
      const directorId = await findOrCreateDirector(supabase, entry.directorName, entry.directorUrl);
      if (directorId) {
        await linkDirectorToMovie(supabase, movieId, directorId);
      }
    }

    const { data: existingScreening } = await supabase
      .from("screenings")
      .select("id")
      .eq("movie_id", movieId)
      .eq("cinema_id", cinemaId)
      .eq("screening_time_text", entry.screeningTimeText)
      .maybeSingle();

    if (existingScreening) {
      return { title: entry.filmTitle, success: true, error: "Screening already exists (skipped)" };
    }

    const { data: newScreening, error: screeningError } = await supabase
      .from("screenings")
      .insert({
        movie_id: movieId,
        cinema_id: cinemaId,
        screening_time_text: entry.screeningTimeText,
        description: entry.description,
        original_url: entry.originalUrl,
      })
      .select("id")
      .single();

    if (screeningError) {
      return { title: entry.filmTitle, success: false, error: `Screening insert failed: ${screeningError.message}` };
    }

    // Insertar TODOS los horarios (puede haber múltiples fechas por función)
    const timeEntries = entry.screeningDatetimes.map((dt) => ({
      screening_id: newScreening.id,
      screening_datetime: dt,
    }));

    const { error: timeError } = await supabase
      .from("screening_times")
      .insert(timeEntries);

    if (timeError) {
      console.error("Error inserting screening times:", timeError);
    }

    return { title: entry.filmTitle, success: true };
  } catch (error) {
    return {
      title: entry.filmTitle,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function findOrCreateCinema(
  supabase: SupabaseClient,
  name: string,
): Promise<number | null> {
  // Buscar por nombre (case-insensitive)
  const { data: existing } = await supabase
    .from("cinemas")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existing) return existing.id;

  const slug = normalizeText(name).replace(/\s+/g, "-");

  // Buscar por slug (por si el nombre no matchea exacto)
  const { data: bySlug } = await supabase
    .from("cinemas")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (bySlug) return bySlug.id;

  const { data: newCinema, error } = await supabase
    .from("cinemas")
    .insert({
      name,
      slug,
      url: `https://cienaga.app/cinemas/${slug}`,
      enabled: false,
    })
    .select("id")
    .single();

  if (error) {
    // Si falla por slug duplicado, buscar por slug
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("cinemas")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      return retry?.id || null;
    }
    console.error("Error creating cinema:", error);
    return null;
  }

  return newCinema.id;
}

async function findOrCreateMovie(
  supabase: SupabaseClient,
  slug: string,
  title: string,
  year: number,
  url: string,
  posterUrl?: string,
): Promise<string | null> {
  // 1) Buscar por slug (canónico). Las pelis importadas pré-scraping tenían
  //    slug null, así que esto solo matchea las que ya tienen slug.
  const { data: bySlug } = await supabase
    .from("movies")
    .select("id, poster_url")
    .eq("slug", slug)
    .maybeSingle();
  if (bySlug) {
    return maybeUpdatePoster(supabase, bySlug.id, bySlug.poster_url, posterUrl);
  }

  // 2) Buscar por URL exacta (fallback para evitar duplicados al re-procesar
  //    una peli cuya URL ya está registrada).
  const { data: byUrl } = await supabase
    .from("movies")
    .select("id, poster_url")
    .eq("url", url)
    .maybeSingle();
  if (byUrl) {
    return maybeUpdatePoster(supabase, byUrl.id, byUrl.poster_url, posterUrl);
  }

  // 3) Buscar por título + año (case-insensitive). Catch-all para pelis con
  //    slug null venidas de `boxd.it` que ya existen: así no se duplican.
  const { data: byTitle } = await supabase
    .from("movies")
    .select("id, poster_url")
    .ilike("title", title)
    .eq("year", year)
    .maybeSingle();
  if (byTitle) {
    return maybeUpdatePoster(supabase, byTitle.id, byTitle.poster_url, posterUrl);
  }

  const { data: newMovie, error } = await supabase
    .from("movies")
    .insert({
      slug,
      title,
      national_title: title,
      year,
      url,
      poster_url: posterUrl || null,
    })
    .select("id")
    .single();

  if (error) {
    // Si falló por slug duplicado (23505), reintentar por slug.
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("movies")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      return retry?.id || null;
    }
    console.error("Error creating movie:", error);
    return null;
  }

  return newMovie.id;
}

async function maybeUpdatePoster(
  supabase: SupabaseClient,
  movieId: string,
  currentPoster: string | null,
  posterUrl?: string,
): Promise<string> {
  // Actualizar poster si la peli no lo tiene y llegó uno.
  if (!currentPoster && posterUrl) {
    await supabase
      .from("movies")
      .update({ poster_url: posterUrl })
      .eq("id", movieId);
  }
  return movieId;
}

async function findOrCreateDirector(
  supabase: SupabaseClient,
  name: string,
  url?: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("directors")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    // Si el director ya existe pero no tiene URL y la tenemos, actualizarla
    if (url) {
      await supabase
        .from("directors")
        .update({ url })
        .eq("id", existing.id)
        .is("url", null);
    }
    return existing.id;
  }

  const slug = normalizeText(name).replace(/\s+/g, "-");
  const { data: newDirector, error } = await supabase
    .from("directors")
    .insert({ name, slug, url: url || null })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("directors")
        .select("id")
        .eq("name", name)
        .maybeSingle();
      return retry?.id || null;
    }
    console.error("Error creating director:", error);
    return null;
  }

  return newDirector.id;
}

async function linkDirectorToMovie(
  supabase: SupabaseClient,
  movieId: string,
  directorId: string,
): Promise<void> {
  const { data: movie } = await supabase
    .from("movies")
    .select("director_id")
    .eq("id", movieId)
    .single();

  if (!movie?.director_id) {
    await supabase
      .from("movies")
      .update({ director_id: directorId })
      .eq("id", movieId);
  }
}
