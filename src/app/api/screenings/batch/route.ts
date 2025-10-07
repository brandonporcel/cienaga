import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createClientForServer } from "@/lib/supabase/server";
import { normalizeText } from "@/lib/utils";

// Schema de validación con Zod
const ScreeningSchema = z.object({
  title: z.string().min(1).max(200),
  director: z.string().optional(),
  screeningTimes: z.array(z.iso.datetime()).min(1).max(20),
  screeningTimeText: z.string().max(100).optional().nullable(),
  cinemaName: z.string().min(1),
  originalUrl: z.url(),
  eventType: z.string().optional(),
  description: z.string().max(2000).optional(),
  room: z.string().max(100).optional(),
  thumbnailUrl: z.string().url().optional(),
  genre: z.string().optional(),
  year: z.number().optional(),
  duration: z.number().optional(),
  country: z.string().optional(),
});

const BatchScreeningsSchema = z.object({
  screenings: z
    .array(ScreeningSchema)
    .min(1, "At least one screening required")
    .max(100, "Too many screenings"),
  cinemaId: z.number().int().positive("Invalid cinema ID"),
});

type ValidatedScreening = z.infer<typeof ScreeningSchema>;

function extractTitles(titleText: string): { main: string; alt?: string } {
  // "PSICOSIS (PSYCHO)" → { main: "PSICOSIS", alt: "PSYCHO" }
  const match = titleText.match(/^([^(]+)(?:\(([^)]+)\))?/);
  if (match) {
    return {
      main: normalizeText(match[1]),
      alt: match[2] ? normalizeText(match[2]) : undefined,
    };
  }
  return { main: normalizeText(titleText) };
}

interface ProcessingResult {
  title: string;
  success: boolean;
  error?: string;
  screeningId?: string;
  movieId?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClientForServer();

  try {
    // Verificar autenticación
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parsear y validar request body
    const body = await request.json();
    const validationResult = BatchScreeningsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.message,
        },
        { status: 400 },
      );
    }

    const { screenings, cinemaId } = validationResult.data;
    console.log(
      `Processing ${screenings.length} screenings for cinema ${cinemaId}`,
    );

    // Procesar cada screening
    const results: ProcessingResult[] = [];

    for (const screeningData of screenings) {
      try {
        const result = await processScreening(
          supabase,
          screeningData,
          cinemaId,
        );
        results.push(result);
      } catch (error) {
        console.error(
          `Error processing screening "${screeningData.title}":`,
          error,
        );
        results.push({
          title: screeningData.title,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Estadísticas finales
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `Batch processing completed: ${successful} successful, ${failed} failed`,
    );

    // Log errores para debugging
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.log("Failed screenings:");
      failures.forEach((f) => console.log(`  - ${f.title}: ${f.error}`));
    }

    return NextResponse.json({
      processed: results.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Fatal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function processScreening(
  supabase: SupabaseClient,
  screeningData: ValidatedScreening,
  cinemaId: number,
): Promise<ProcessingResult> {
  const {
    title,
    director,
    screeningTimeText,
    year,
    duration,
    screeningTimes,
    ...restData
  } = screeningData;

  try {
    // 1. Buscar o crear película
    const movieId = await findOrCreateMovie(supabase, {
      title,
      director,
      year,
      duration,
    });
    if (!movieId) {
      return {
        title,
        success: false,
        error: "Failed to find or create movie",
      };
    }

    // 2. Verificar si ya existe esta proyección (evitar duplicados)
    const { data: existingScreening } = await supabase
      .from("screenings")
      .select("id")
      .eq("movie_id", movieId)
      .eq("cinema_id", cinemaId)
      .eq("screening_time_text", screeningTimeText)

      .single();

    if (existingScreening) {
      return {
        title,
        success: true,
        error: "Screening already exists (skipped)",
        screeningId: existingScreening.id,
        movieId,
      };
    }

    // 3. Crear nueva proyección
    const { data: newScreening, error: insertError } = await supabase
      .from("screenings")
      .insert({
        movie_id: movieId,
        cinema_id: cinemaId,
        screening_time_text: screeningTimeText,
        event_type: restData.eventType,
        description: restData.description,
        room: restData.room,
        original_url: restData.originalUrl,
        thumbnail_url: restData.thumbnailUrl,
      })
      .select("id")
      .single();

    if (insertError) {
      return {
        title,
        success: false,
        error: `Database insert failed: ${insertError.message}`,
      };
    }

    // Crear todos los horarios específicos
    const timeEntries = screeningTimes.map((time) => ({
      screening_id: newScreening.id,
      screening_datetime: time,
    }));

    const { error: timesError } = await supabase
      .from("screening_times")
      .insert(timeEntries);

    if (timesError) {
      console.error("Error inserting screening times:", timesError);
    }

    return {
      title,
      success: true,
      screeningId: newScreening.id,
      movieId,
    };
  } catch (error) {
    return {
      title,
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown processing error",
    };
  }
}

async function findOrCreateMovie(
  supabase: SupabaseClient,
  movieData: {
    title: string;
    director?: string;
    year?: number;
    duration?: number;
  },
): Promise<string | null> {
  try {
    const { title, director, year, duration } = movieData;
    const { main: normalizedTitle, alt: alternativeTitle } =
      extractTitles(title);

    // Buscar por título normalizado (ambas variantes si existen)
    let query = supabase
      .from("movies")
      .select(
        "id, title, national_title, year, duration, director_id, directors(name)",
      )
      .or(
        `title.ilike.%${normalizedTitle}%,national_title.ilike.%${normalizedTitle}%`,
      );

    if (alternativeTitle) {
      query = query.or(
        `title.ilike.%${alternativeTitle}%,national_title.ilike.%${alternativeTitle}%`,
      );
    }

    const { data: candidates, error: searchError } = await query;

    if (searchError) {
      console.error("Error searching movies:", searchError);
    }

    // Evaluar candidatos con scoring
    if (candidates && candidates.length > 0) {
      const bestMatch = findBestMovieMatch(candidates, {
        normalizedTitle,
        alternativeTitle,
        director,
        year,
        duration,
      });

      if (bestMatch) {
        // Si no tiene director pero nosotros sí, actualizarlo
        if (!bestMatch.director_id && director) {
          const directorId = await findOrCreateDirector(supabase, director);
          if (directorId) {
            await supabase
              .from("movies")
              .update({ director_id: directorId })
              .eq("id", bestMatch.id);
          }
        }
        return bestMatch.id;
      }
    }

    // No encontramos match, crear nueva película
    const directorId = director
      ? await findOrCreateDirector(supabase, director)
      : null;

    const { data: newMovie, error: createError } = await supabase
      .from("movies")
      .insert({
        title: title, // Guardar título original
        national_title: alternativeTitle || title,
        director_id: directorId,
        year,
        duration,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating movie:", createError);
      return null;
    }

    return newMovie.id;
  } catch (error) {
    console.error("Error in findOrCreateMovie:", error);
    return null;
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findBestMovieMatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  candidates: Record<string, any>[],
  criteria: {
    normalizedTitle: string;
    alternativeTitle?: string;
    director?: string;
    year?: number;
    duration?: number;
  },
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bestMatch: Record<string, any> | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    let score = 0;

    // Score por título (40 puntos)
    const candidateTitle = normalizeText(candidate.title);
    const candidateNationalTitle = normalizeText(
      candidate.national_title || "",
    );

    if (
      candidateTitle === criteria.normalizedTitle ||
      candidateNationalTitle === criteria.normalizedTitle
    ) {
      score += 40;
    } else if (
      criteria.alternativeTitle &&
      (candidateTitle === criteria.alternativeTitle ||
        candidateNationalTitle === criteria.alternativeTitle)
    ) {
      score += 35;
    } else if (
      candidateTitle.includes(criteria.normalizedTitle) ||
      criteria.normalizedTitle.includes(candidateTitle)
    ) {
      score += 20;
    }

    // Score por director (30 puntos)
    if (criteria.director && candidate.directors?.name) {
      const normalizedCandidateDirector = normalizeText(
        candidate.directors.name,
      );
      const normalizedCriteriaDirector = normalizeText(criteria.director);

      if (normalizedCandidateDirector === normalizedCriteriaDirector) {
        score += 30;
      } else if (
        normalizedCandidateDirector.includes(normalizedCriteriaDirector) ||
        normalizedCriteriaDirector.includes(normalizedCandidateDirector)
      ) {
        score += 15;
      }
    }

    // Score por año (20 puntos)
    if (criteria.year && candidate.year) {
      if (candidate.year === criteria.year) {
        score += 20;
      } else if (Math.abs(candidate.year - criteria.year) <= 1) {
        score += 10; // Margen de 1 año
      }
    }

    // Score por duración (10 puntos)
    if (criteria.duration && candidate.duration) {
      const diff = Math.abs(candidate.duration - criteria.duration);
      if (diff <= 5) {
        score += 10;
      } else if (diff <= 10) {
        score += 5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  // Umbral mínimo de 50 puntos para considerar match válido
  return bestScore >= 50 ? bestMatch : null;
}

async function findOrCreateDirector(
  supabase: SupabaseClient,
  directorName: string,
): Promise<number | null> {
  try {
    // Buscar director existente
    const { data: existingDirector } = await supabase
      .from("directors")
      .select("id")
      .eq("name", directorName)
      .single();

    if (existingDirector) {
      return existingDirector.id;
    }

    // Crear nuevo director
    const { data: newDirector, error: createError } = await supabase
      .from("directors")
      .insert({ name: directorName })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating director:", createError);
      return null;
    }

    return newDirector.id;
  } catch (error) {
    console.error("Error in findOrCreateDirector:", error);
    return null;
  }
}
