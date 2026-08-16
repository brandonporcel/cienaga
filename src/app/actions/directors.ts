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

  const { data, error } = await supabase
    .from("user_directors")
    .select("directors(*), source")
    .eq("user_id", user.id);

  if (error) {
    return handleServerError({
      error,
      message: MESSAGES.errors.gettingDirectors,
    });
  }

  return (
    data
      // Flatten para devolver un array de directores con su fuente
      ?.map((row) => ({
        ...(row.directors as unknown as Director),
        source: row.source as DirectorSource,
      })) ?? []
  );
}

async function getDirectorDetail(directorId: string): Promise<DirectorDetail> {
  const { supabase, user } = await getUserOrThrow();

  // Fuente de la relación (auto / manual / muted)
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
 * Acciones del usuario sobre un director. Los overrides sobreviven al
 * recálculo: 'manual' y 'muted' nunca se pisan.
 */
async function updateDirectorPreference(
  directorId: string,
  action: "follow" | "silence" | "unsilence" | "unfollow",
): Promise<{ success: boolean }> {
  const { supabase, user } = await getUserOrThrow();

  const base = { user_id: user.id, director_id: directorId };

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

    const source: DirectorSource =
      action === "silence" ? "muted" : action === "unsilence" ? "auto" : "manual";

    const { error } = await supabase
      .from("user_directors")
      .upsert({ ...base, source }, { onConflict: "user_id,director_id" });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return handleServerError({ error });
  }
}

export { getDirectors, getDirectorDetail, updateDirectorPreference };
