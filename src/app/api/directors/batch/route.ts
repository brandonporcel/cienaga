import { NextRequest, NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

interface MovieDirectorData {
  movieId: string;
  director: string;
  directorUrl?: string;
  posterUrl?: string;
  year?: number;
  backgroundMovieImg?: string;
  movieRating?: number;
  directorSlug?: string;
  movieSlug?: string;
  movieNationalName?: string;
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
      const {
        movieId,
        director,
        posterUrl,
        backgroundMovieImg,
        directorUrl,
        movieRating,
        directorSlug,
        movieNationalName,
        movieSlug,
      } = movieData;

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
            .update({ background_img_url: backgroundMovieImg })
            .eq("id", movieId);
        }

        if (movieRating) {
          await supabase
            .from("movies")
            .update({ rating: movieRating })
            .eq("id", movieId);
        }

        if (movieNationalName)
          await supabase
            .from("movies")
            .update({ national_name: movieNationalName })
            .eq("id", movieId);

        if (movieSlug)
          await supabase
            .from("movies")
            .update({ slug: movieSlug })
            .eq("id", movieId);

        // Buscar si el director ya existe
        const { data: existingDirector, error: directorError } = await supabase
          .from("directors")
          .select("id")
          .eq("name", director)
          .eq("slug", directorSlug)
          .single();

        let directorId = existingDirector?.id;

        if (directorError && directorError.code === "PGRST116") {
          // Director no existe, crearlo
          const { data: newDirector, error: insertError } = await supabase
            .from("directors")
            .insert({ name: director, url: directorUrl, slug: directorSlug })
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

        // Sincronizar user_directors
        // Encontrar usuarios que tienen películas de este director
        const { data: usersWithMovies, error: queryError } = await supabase
          .from("user_movies")
          .select(
            `
            user_id,
            movies!inner (
              director_id
            )
          `,
          )
          .eq("movies.director_id", directorId);

        if (!queryError && usersWithMovies && usersWithMovies.length > 0) {
          // Extraer user_ids únicos
          const uniqueUserIds = [
            ...new Set(usersWithMovies.map((item) => item.user_id)),
          ];

          // Para cada usuario, verificar si ya tiene la relación user_directors
          const userDirectorInserts = [];

          for (const userId of uniqueUserIds) {
            const { data: existingRelation } = await supabase
              .from("user_directors")
              .select("user_id")
              .eq("user_id", userId)
              .eq("director_id", directorId)
              .single();

            if (!existingRelation) {
              userDirectorInserts.push({
                user_id: userId,
                director_id: directorId,
              });
            }
          }

          // Insertar nuevas relaciones user_directors
          if (userDirectorInserts.length > 0) {
            const { error: insertUserDirectorsError } = await supabase
              .from("user_directors")
              .insert(userDirectorInserts);

            if (!insertUserDirectorsError) {
              console.log(
                `✅ Created ${userDirectorInserts.length} user_director relationships for director ${director}`,
              );
            } else {
              console.error(
                "Error inserting user_directors:",
                insertUserDirectorsError,
              );
            }
          }
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
