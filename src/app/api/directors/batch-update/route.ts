import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";

// Schemas de validación con Zod
const BasicMovieSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.url(),
  year: z
    .number()
    .int()
    .min(1888)
    .max(new Date().getFullYear() + 5),
  thumbnailUrl: z.url().optional(),
});

const DirectorUpdateSchema = z.object({
  directorId: z.uuid("Invalid director ID format"),
  avatarUrl: z.url("Invalid avatar URL").nullable().optional(),
  bio: z.string().max(5000, "Bio too long").nullable().optional(),
  basicMovies: z.array(BasicMovieSchema).max(100, "Too many movies in batch"),
  TMDBId: z.number().int().positive().nullable().optional(),
});

type DirectorUpdateData = z.infer<typeof DirectorUpdateSchema>;
type BasicMovie = z.infer<typeof BasicMovieSchema>;

interface ProcessingResult {
  movieUrl: string;
  success: boolean;
  error?: string;
  action?: "created" | "updated" | "skipped";
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = DirectorUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.message,
        },
        { status: 400 },
      );
    }

    const directorData = validationResult.data;
    console.log(
      `📝 Updating director ${directorData.directorId} with ${directorData.basicMovies.length} movies`,
    );

    // 3. Verificar que el director existe
    const { data: existingDirector, error: directorCheckError } = await supabase
      .from("directors")
      .select("id, name")
      .eq("id", directorData.directorId)
      .single();

    if (directorCheckError || !existingDirector) {
      return NextResponse.json(
        {
          error: "Director not found",
          directorId: directorData.directorId,
        },
        { status: 404 },
      );
    }

    // 4. Actualizar información del director
    const directorUpdateResult = await updateDirectorInfo(
      supabase,
      directorData,
    );

    if (!directorUpdateResult.success) {
      return NextResponse.json(
        {
          error: "Failed to update director",
          details: directorUpdateResult.error,
        },
        { status: 500 },
      );
    }

    // 5. Procesar películas
    const movieResults: ProcessingResult[] = [];

    for (const movie of directorData.basicMovies) {
      const result = await processMovie(
        supabase,
        movie,
        directorData.directorId,
      );
      movieResults.push(result);
    }

    // 6. Generar respuesta
    const successful = movieResults.filter((r) => r.success).length;
    const failed = movieResults.filter((r) => !r.success).length;

    console.log(
      `✅ Director update completed: ${successful} movies processed, ${failed} failed`,
    );

    return NextResponse.json({
      success: true,
      directorId: directorData.directorId,
      directorName: existingDirector.name,
      directorUpdated: directorUpdateResult.updated,
      movies: {
        total: movieResults.length,
        successful,
        failed,
        results: movieResults,
      },
    });
  } catch (error) {
    console.error("💥 Fatal API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function updateDirectorInfo(
  supabase: SupabaseClient,
  directorData: DirectorUpdateData,
): Promise<{ success: boolean; updated: boolean; error?: string }> {
  try {
    const updateData: Record<string, string | number | null> = {};

    // Solo actualizar campos que no sean null/undefined
    if (directorData.avatarUrl !== undefined) {
      updateData.image_url = directorData.avatarUrl;
    }
    if (directorData.bio !== undefined) {
      updateData.description = directorData.bio;
    }
    if (directorData.TMDBId !== undefined) {
      updateData.tmdb_id = directorData.TMDBId;
    }

    // Si no hay nada que actualizar, retornar success
    if (Object.keys(updateData).length === 0) {
      return { success: true, updated: false };
    }

    const { error } = await supabase
      .from("directors")
      .update(updateData)
      .eq("id", directorData.directorId);

    if (error) {
      console.error("Error updating director:", error);
      return { success: false, updated: false, error: error.message };
    }

    console.log(
      `✅ Director info updated: ${Object.keys(updateData).join(", ")}`,
    );
    return { success: true, updated: true };
  } catch (error) {
    return {
      success: false,
      updated: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function processMovie(
  supabase: SupabaseClient,
  movie: BasicMovie,
  directorId: string,
): Promise<ProcessingResult> {
  try {
    // Buscar si la película ya existe por URL
    const { data: existingMovie, error: searchError } = await supabase
      .from("movies")
      .select("id, title, year, director_id")
      .eq("url", movie.url)
      .single();

    // Película existe
    if (existingMovie && !searchError) {
      // Solo actualizar si hay cambios
      const needsUpdate =
        existingMovie.title !== movie.title ||
        existingMovie.year !== movie.year ||
        !existingMovie.director_id;

      if (!needsUpdate) {
        return {
          movieUrl: movie.url,
          success: true,
          action: "skipped",
        };
      }

      // Actualizar película existente
      const { error: updateError } = await supabase
        .from("movies")
        .update({
          title: movie.title,
          year: movie.year,
          director_id: directorId,
          poster_url: movie.thumbnailUrl,
        })
        .eq("id", existingMovie.id);

      if (updateError) {
        return {
          movieUrl: movie.url,
          success: false,
          error: `Update failed: ${updateError.message}`,
        };
      }

      return {
        movieUrl: movie.url,
        success: true,
        action: "updated",
      };
    }

    // Película no existe, crearla
    const { error: insertError } = await supabase.from("movies").insert({
      title: movie.title,
      url: movie.url,
      year: movie.year,
      director_id: directorId,
      poster_url: movie.thumbnailUrl,
    });

    if (insertError) {
      return {
        movieUrl: movie.url,
        success: false,
        error: `Insert failed: ${insertError.message}`,
      };
    }

    return {
      movieUrl: movie.url,
      success: true,
      action: "created",
    };
  } catch (error) {
    return {
      movieUrl: movie.url,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
