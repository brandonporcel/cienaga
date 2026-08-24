// actions/directors.ts
"use server";

import { Director, DirectorDetail } from "@/types/director";
import {
  DirectorSource,
  getDirectorMetrics,
} from "@/lib/services/director-preference";
import { MESSAGES } from "@/lib/constants/messages";
import handleServerError from "@/lib/errors/server";
import { getUserOrThrow } from "@/lib/helpers/get-server-user";

async function getDirectors(): Promise<Director[]> {
  const { supabase, user } = await getUserOrThrow();

  // 1. Directores con relación explícita (user_directors)
  const { data: userDirectors, error: udError } = await supabase
    .from("user_directors")
    .select("directors(*), source")
    .eq("user_id", user.id);

  if (udError) {
    return handleServerError({
      error: udError,
      message: MESSAGES.errors.gettingDirectors,
    });
  }

  // 2. Directores de pelis vistas que todavía no tienen relación
  const { data: watchedDirectors, error: wdError } = await supabase
    .from("user_movies")
    .select(
      "movies!inner(director_id, directors(id, name, url, image_url, tmdb_id, created_at))",
    )
    .eq("user_id", user.id)
    .not("movies.director_id", "is", null);

  if (wdError) {
    return handleServerError({
      error: wdError,
      message: MESSAGES.errors.gettingDirectors,
    });
  }

  // Mapa director.id → Director para deduplicar
  const directorsMap = new Map<string, Director>();

  // Primero los user_directors (tienen source explícito)
  for (const row of userDirectors ?? []) {
    const dir = row.directors as unknown as Director;
    if (dir) {
      directorsMap.set(dir.id, { ...dir, source: row.source as DirectorSource });
    }
  }

  // Después los detectados desde pelis vistas, sin relación aún
  for (const row of watchedDirectors ?? []) {
    const movie = row.movies as unknown as {
      director_id: string;
      directors: Director | null;
    };
    if (movie?.directors && !directorsMap.has(movie.directors.id)) {
      directorsMap.set(movie.directors.id, {
        ...movie.directors,
        source: undefined,
      });
    }
  }

  // Contar películas vistas por director
  const moviesCountByDirector = new Map<string, number>();
  for (const row of watchedDirectors ?? []) {
    const movie = row.movies as unknown as {
      director_id: string;
    };
    if (movie?.director_id) {
      moviesCountByDirector.set(
        movie.director_id,
        (moviesCountByDirector.get(movie.director_id) ?? 0) + 1,
      );
    }
  }

  // Agregar movies_count a cada director
  for (const [id, director] of directorsMap) {
    director.movies_count = moviesCountByDirector.get(id) ?? 0;
  }

  return Array.from(directorsMap.values());
}

async function getDirectorDetail(directorId: string): Promise<DirectorDetail> {
  const { supabase, user } = await getUserOrThrow();

  // Fuente de la relación (auto / manual)
  const { data: relation } = await supabase
    .from("user_directors")
    .select("source")
    .eq("user_id", user.id)
    .eq("director_id", directorId)
    .maybeSingle();

  // Datos del director
  const { data: director, error: directorError } = await supabase
    .from("directors")
    .select("*")
    .eq("id", directorId)
    .single();

  if (directorError || !director) {
    return handleServerError({
      error: directorError,
      message: MESSAGES.errors.gettingDirectors,
    });
  }

  // Filmografía vista por el usuario con su rating
  const { data: watchedFilms, error: filmsError } = await supabase
    .from("user_movies")
    .select("rating, movies!inner(title, year, poster_url)")
    .eq("user_id", user.id)
    .eq("movies.director_id", directorId)
    .order("rating", { ascending: false });

  if (filmsError) {
    return handleServerError({
      error: filmsError,
      message: MESSAGES.errors.gettingDirectors,
    });
  }

  const filmography =
    (watchedFilms as unknown as
      | {
          rating: number | null;
          movies: { title: string; year: number | null; poster_url: string | null };
        }[]
      | null)
      ?.map((film) => ({
        title: film.movies.title,
        year: film.movies.year,
        poster_url: film.movies.poster_url,
        rating: film.rating,
      })) ?? [];

  const metrics = getDirectorMetrics(filmography);

  return {
    director: director as Director,
    source: (relation?.source as DirectorSource) ?? null,
    metrics,
    filmography,
  };
}

/**
 * Acciones del usuario sobre un director. Los overrides manuales
 * sobreviven al recálculo: 'manual' nunca se pisa.
 */
async function updateDirectorPreference(
  directorId: string,
  action: "follow" | "unfollow",
): Promise<{ success: boolean }> {
  const { supabase, user } = await getUserOrThrow();

  try {
    if (action === "unfollow") {
      const { error } = await supabase
        .from("user_directors")
        .delete()
        .eq("user_id", user.id)
        .eq("director_id", directorId);

      if (error) throw error;
      return { success: true };
    }

    // follow → source "manual"
    const { error } = await supabase
      .from("user_directors")
      .upsert(
        { user_id: user.id, director_id: directorId, source: "manual" },
        { onConflict: "user_id,director_id" },
      );

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return handleServerError({ error });
  }
}

export { getDirectors, getDirectorDetail, updateDirectorPreference };
