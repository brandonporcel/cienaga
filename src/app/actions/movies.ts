"use server";

import { LetterboxdMovie } from "@/types/letterboxd";
import { MESSAGES } from "@/lib/constants/messages";
import handleServerError from "@/lib/errors/server";
import { createClientForServer } from "@/lib/supabase/server";

async function saveMoviesAction(movies: LetterboxdMovie[]) {
  try {
    const supabase = await createClientForServer();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error(MESSAGES.errors.noSession);
    }

    const userId = userData.user.id;

    // 1. Procesar cada película individualmente para evitar duplicados
    const movieIds: string[] = [];

    for (const movie of movies) {
      // Verificar si la película ya existe
      const { data: existingMovie, error: checkError } = await supabase
        .from("movies")
        .select("id")
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
      } else {
        // Insertar nueva película
        const { data: newMovie, error: insertError } = await supabase
          .from("movies")
          .insert({
            title: movie.title,
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

      movieIds.push(movieId);
    }

    // 2. Crear relaciones user_movies (solo para películas nuevas del usuario)
    const userMovieInserts = movieIds.map((movieId) => ({
      user_id: userId,
      movie_id: movieId,
    }));

    if (userMovieInserts.length > 0) {
      // Usar upsert para evitar duplicados
      const { error: userMoviesError } = await supabase
        .from("user_movies")
        .upsert(userMovieInserts, {
          onConflict: "user_id,movie_id",
          ignoreDuplicates: true,
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
    }

    // 3. Marcar que el usuario subió su CSV
    const { error: updateError } = await supabase
      .from("users")
      .update({ has_upload_csv: true })
      .eq("id", userId);

    if (updateError) {
      return handleServerError({ error: updateError });
    }

    console.log(
      `Successfully processed ${movieIds.length} movies for user ${userId}`,
    );

    return {
      success: true,
      processedCount: movieIds.length,
      totalCount: movies.length,
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
