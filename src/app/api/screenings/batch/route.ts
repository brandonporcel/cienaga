import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createClientForServer } from "@/lib/supabase/server";

// Schema de validación con Zod
const ScreeningSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  director: z.string().optional(),
  datetime: z.string().datetime("Invalid datetime format"),
  cinemaName: z.string().min(1, "Cinema name is required"),
  originalUrl: z.string().url("Invalid URL format"),
  eventType: z.string().optional(),
  description: z.string().max(2000, "Description too long").optional(),
  room: z.string().max(100, "Room name too long").optional(),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional(),
  price: z.string().optional(),
  bookingUrl: z.string().url("Invalid booking URL").optional(),
});

const BatchScreeningsSchema = z.object({
  screenings: z
    .array(ScreeningSchema)
    .min(1, "At least one screening required")
    .max(50, "Too many screenings"),
  cinemaId: z.number().int().positive("Invalid cinema ID"),
});

type ValidatedScreening = z.infer<typeof ScreeningSchema>;

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
  const { title, director, datetime, ...restData } = screeningData;

  try {
    // 1. Buscar o crear película
    const movieId = await findOrCreateMovie(supabase, title, director);
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
      .eq("screening_time", datetime)
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
        screening_time: datetime,
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
  title: string,
  director?: string,
): Promise<string | null> {
  try {
    // Buscar película existente por título
    const { data: existingMovie, error: searchError } = await supabase
      .from("movies")
      .select("id, director_id, directors(name)")
      .ilike("title", title)
      .single();

    // Si encontramos la película
    if (existingMovie && !searchError) {
      // Si tiene director asignado, usar esa película
      if (existingMovie.director_id) {
        return existingMovie.id;
      }

      // Si no tiene director pero nosotros sí, intentar encontrar/crear el director
      if (director) {
        const directorId = await findOrCreateDirector(supabase, director);
        if (directorId) {
          await supabase
            .from("movies")
            .update({ director_id: directorId })
            .eq("id", existingMovie.id);
        }
      }

      return existingMovie.id;
    }

    // Si no encontramos la película, crearla
    let directorId: number | null = null;
    if (director) {
      directorId = await findOrCreateDirector(supabase, director);
    }

    const { data: newMovie, error: createError } = await supabase
      .from("movies")
      .insert({
        title,
        director_id: directorId,
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
