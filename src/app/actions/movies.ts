"use server";

import { LetterboxdMovie } from "@/types/letterboxd";
import { MESSAGES } from "@/lib/constants/messages";
import handleServerError from "@/lib/errors/server";
import { createClientForServer } from "@/lib/supabase/server";
import { shouldFollowDirector } from "@/lib/services/director-preference";

/**
 * Sincroniza user_directors (source 'auto') para un set de directores,
 * respetando overrides manuales. Evalúa el criterio con TODAS las pelis
 * del usuario para cada director (no solo las recién subidas).
 */
async function syncAutoFollows(
  supabase: Awaited<ReturnType<typeof createClientForServer>>,
  userId: string,
  directorIds: string[],
): Promise<number> {
  if (directorIds.length === 0) return 0;

  // 1) Pelis del usuario para esos directores, con su rating
  const { data: films } = await supabase
    .from("user_movies")
    .select("rating, movies!inner(director_id)")
    .eq("user_id", userId)
    .in("movies.director_id", directorIds);

  const filmsByDirector = new Map<string, { rating: number | null }[]>();

  for (const row of (films ?? []) as unknown as {
    rating: number | null;
    movies: { director_id: string } | null;
  }[]) {
    const directorId = row.movies?.director_id;
    if (!directorId) continue;
    const list = filmsByDirector.get(directorId) ?? [];
    list.push({ rating: row.rating });
    filmsByDirector.set(directorId, list);
  }

  // 2) Relaciones existentes del usuario (para no pisar 'manual')
  const { data: current } = await supabase
    .from("user_directors")
    .select("director_id, source")
    .eq("user_id", userId)
    .in("director_id", directorIds);

  const sourceByDirector = new Map<string, string>(
    (current ?? []).map((rel) => [rel.director_id, rel.source ?? ""]),
  );

  // 3) Insertar los que cumplen el criterio y no tienen override
  let added = 0;

  for (const [directorId, directorFilms] of filmsByDirector) {
    if (!shouldFollowDirector(directorFilms)) continue;

    const source = sourceByDirector.get(directorId);
    if (source === "manual" || source === "auto") continue;

    const { error } = await supabase.from("user_directors").insert({
      user_id: userId,
      director_id: directorId,
      source: "auto",
    });

    if (error && error.code !== "23505") {
      // 23505 = duplicado (carrera entre chunks): no es fatal
      console.error(`Error auto-following director ${directorId}:`, error);
      continue;
    }

    added++;
  }

  return added;
}

async function saveMoviesAction(movies: LetterboxdMovie[]) {
  try {
    const supabase = await createClientForServer();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error(MESSAGES.errors.noSession);
    }

    const userId = userData.user.id;

    // 1. Procesar cada película individualmente para evitar duplicados
    const userMovieInserts: {
      user_id: string;
      movie_id: string;
      rating?: number;
    }[] = [];
    const knownDirectorIds = new Set<string>();

    for (const movie of movies) {
      // Verificar si la película ya existe
      const { data: existingMovie, error: checkError } = await supabase
        .from("movies")
        .select("id, director_id")
        .eq("title", movie.title)
        .eq("year", movie.year)
        .eq("url", movie.url)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking existing movie:", checkError);
        continue;
      }

      let movieId: string;

      if (existingMovie) {
        // Película ya existe, usar su ID
        movieId = existingMovie.id;
        console.log(`Movie already exists: ${movie.title} (${movie.year})`);

        // Si ya tiene director conocido, el auto-follow puede evaluarse ya
        if (existingMovie.director_id) {
          knownDirectorIds.add(existingMovie.director_id);
        }
      } else {
        // Insertar nueva película
        const { data: newMovie, error: insertError } = await supabase
          .from("movies")
          .insert({
            title: movie.title,
            national_title: movie.title,
            year: movie.year,
            url: movie.url,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error(`Error inserting movie ${movie.title}:`, insertError);
          continue;
        }

        movieId = newMovie.id;
        console.log(`Created new movie: ${movie.title} (${movie.year})`);
      }

      userMovieInserts.push({
        user_id: userId,
        movie_id: movieId,
        ...(movie.rating !== undefined && { rating: movie.rating }),
      });
    }

    // 2. Crear relaciones user_movies (upsert para actualizar ratings al re-subir)

    if (userMovieInserts.length > 0) {
      const { error: userMoviesError } = await supabase
        .from("user_movies")
        .upsert(userMovieInserts, {
          onConflict: "user_id,movie_id",
        });

      if (userMoviesError) {
        console.error(
          "Error creating user_movies relationships:",
          userMoviesError,
        );
        return handleServerError({
          error: userMoviesError,
          message: "Error linking movies to user",
        });
      }

      // 3. Auto-follow de directores ya conocidos de las pelis subidas
      let autoFollowed = 0;
      if (knownDirectorIds.size > 0) {
        autoFollowed = await syncAutoFollows(
          supabase,
          userId,
          [...knownDirectorIds],
        );
      }

      console.log(
        `Successfully processed ${userMovieInserts.length} movies for user ${userId} (${autoFollowed} auto-follows)`,
      );

      return {
        success: true,
        processedCount: userMovieInserts.length,
        totalCount: movies.length,
        autoFollowed,
      };
    }

    console.log(
      `Successfully processed ${userMovieInserts.length} movies for user ${userId}`,
    );

    return {
      success: true,
      processedCount: userMovieInserts.length,
      totalCount: movies.length,
      autoFollowed: 0,
    };
  } catch (error) {
    console.error("Fatal error in saveMoviesAction:", error);
    return handleServerError({
      error,
      message: MESSAGES.errors.saveMovies,
    });
  }
}

export { saveMoviesAction };