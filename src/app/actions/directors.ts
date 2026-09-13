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

async function getDirectors(): Promise<{
  directors: Director[];
  pendingMovies: number;
  recentImports: RecentImport[];
}> {
  const { supabase, user } = await getUserOrThrow();

  // Películas del usuario sin director detectado aún (el cron las procesa
  // en las próximas corridas). Sirve para mostrar el banner de "estamos detectando".
  const { count: pendingMovies } = await supabase
    .from("user_movies")
    .select("id, movies!inner(id)", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("movies.director_id", null);

  // Últimas películas importadas (72h = ventana de una corrida del cron).
  // Sirve para confirmar al usuario que su subida se registró, listando
  // las pelis con su estado de detección (✅/⏳).
  const { data: recentMovies } = await supabase
    .from("user_movies")
    .select(
      "created_at, movies!inner(id, title, year, director_id)",
    )
    .eq("user_id", user.id)
    .gte("created_at", importsWindowStart())
    .order("created_at", { ascending: false })
    .limit(10);

  const recentImports: RecentImport[] = (recentMovies ?? []).map((row) => {
    const movie = row.movies as unknown as {
      id: string;
      title: string;
      year: number | null;
      director_id: string | null;
    };
    return {
      id: movie.id,
      title: movie.title,
      year: movie.year,
      hasDirector: !!movie.director_id,
    };
  });

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

  return {
    directors: Array.from(directorsMap.values()),
    pendingMovies: pendingMovies ?? 0,
    recentImports,
  };
}

/**
 * Búsqueda global de directores en la base (no solo los del usuario).
 * Devuelve con qué relación tiene el usuario cada director: seguido / visto / sin relación.
 */
export interface DirectorSearchResult {
  id: string;
  name: string;
  url: string;
  image_url: string;
  tmdb_id: number | null;
  created_at: string;
  relation: "followed" | "watched" | "unrelated";
}

async function searchDirectors(query: string): Promise<DirectorSearchResult[]> {
  const { supabase, user } = await getUserOrThrow();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data: directors, error } = await supabase
    .from("directors")
    .select("id, name, url, image_url, tmdb_id, created_at")
    .ilike("name", `%${trimmed}%`)
    .order("name")
    .limit(15);

  if (error) {
    console.error("Error searching directors:", error);
    return [];
  }
  if (!directors || directors.length === 0) return [];

  const ids = directors.map((d) => d.id);

  // Directores que el usuario ya sigue
  const { data: followedRows } = await supabase
    .from("user_directors")
    .select("director_id")
    .eq("user_id", user.id)
    .in("director_id", ids);
  const followed = new Set<string>(
    (followedRows ?? []).map((r) => r.director_id),
  );

  // Directores de películas que el usuario ya vio
  const { data: watchedRows } = await supabase
    .from("user_movies")
    .select("movies!inner(director_id)")
    .eq("user_id", user.id)
    .in("movies.director_id", ids);
  const watched = new Set(
    (watchedRows ?? []).map(
      (row) =>
        (row.movies as unknown as { director_id: string }).director_id,
    ),
  );

  return directors.map((d) => ({
    id: d.id,
    name: d.name,
    url: d.url,
    image_url: d.image_url,
    tmdb_id: d.tmdb_id,
    created_at: d.created_at,
    relation: followed.has(d.id)
      ? "followed"
      : watched.has(d.id)
        ? "watched"
        : "unrelated",
  }));
}

export interface RecentImport {
  id: string;
  title: string;
  year: number | null;
  hasDirector: boolean;
}

/** Inicio de la ventana de imports recientes (72h). */
function importsWindowStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString();
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

export { getDirectors, getDirectorDetail, updateDirectorPreference, searchDirectors };
