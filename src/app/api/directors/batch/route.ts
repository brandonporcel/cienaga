import { NextRequest, NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

interface MovieDirectorData {
  movieId: string;
  director: string;
  directorUrl?: string;
  posterUrl?: string;
  year?: number;
  backgroundMovieImg?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClientForServer();

  try {
    // Verificar clave de acceso
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { movieDirectors }: { movieDirectors: MovieDirectorData[] } =
      await request.json();

    if (!movieDirectors || !Array.isArray(movieDirectors)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 },
      );
    }

    const results = [];

    for (const movieData of movieDirectors) {
      const { movieId, director, posterUrl, backgroundMovieImg } = movieData;

      try {
        // Actualizar poster de película
        if (posterUrl) {
          await supabase
            .from("movies")
            .update({ poster_url: posterUrl })
            .eq("id", movieId);
        }
        // Actualizar imagen de fondo de película
        if (backgroundMovieImg) {
          await supabase
            .from("movies")
            .update({ background_img: backgroundMovieImg })
            .eq("id", movieId);
        }

        // Buscar si el director ya existe
        const { data: existingDirector, error: directorError } = await supabase
          .from("directors")
          .select("id")
          .eq("name", director)
          .single();

        let directorId = existingDirector?.id;

        if (directorError && directorError.code === "PGRST116") {
          // Director no existe, crearlo
          const { data: newDirector, error: insertError } = await supabase
            .from("directors")
            .insert({ name: director })
            .select("id")
            .single();

          if (insertError) {
            console.error("Error creating director:", insertError);
            results.push({
              movieId,
              director,
              success: false,
              error: "Failed to create director",
            });
            continue;
          }
          directorId = newDirector.id;
        } else if (directorError) {
          console.error("Error checking director:", directorError);
          results.push({
            movieId,
            director,
            success: false,
            error: "Database error",
          });
          continue;
        }

        // Actualizar la película con el director
        const { error: updateError } = await supabase
          .from("movies")
          .update({ director_id: directorId })
          .eq("id", movieId);

        if (updateError) {
          console.error("Error updating movie:", updateError);
          results.push({
            movieId,
            director,
            success: false,
            error: "Failed to update movie",
          });
          continue;
        }

        results.push({
          movieId,
          director,
          directorId,
          success: true,
        });
      } catch (error) {
        console.error(`Error processing movie ${movieId}:`, error);
        results.push({
          movieId,
          director,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      processed: results.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
