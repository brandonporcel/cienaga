import { NextRequest, NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { shouldFollowDirector } from "@/lib/services/director-preference";
import { createClientForServer } from "@/lib/supabase/server";

interface MovieDataData {
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
  movieDuration?: number;
  watches?: number | null;
}

interface MovieResult {
  movieId: string;
  director: string;
  directorId?: string;
  success: boolean;
  error?: string;
}

// Umbral de "vistas globales en Letterboxd" para considerar una peli
// "mainstream" y poder trackearla. Peli con menos watchers (de nicho, a
// menudo sin poster en Letterboxd) se excluye del pipeline para no atascar
// la cola de pending con pelis que nunca se van a completar (ej: "Fugs").
const MIN_WATCHES = 800;

/**
 * Procesa una sola película: actualiza posters/duraciones, resuelve/crea el
 * director y sincroniza user_directors. Extraído a función propia para poder
 * correrlo en paralelo (Promise.all) por lote dentro de POST.
 */
async function processMovie(
  movieData: MovieDataData,
  supabase: SupabaseClient,
): Promise<MovieResult> {
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
    movieDuration,
    watches,
  } = movieData;

  // Ignorar cortometrajes (solo si la duración es un número válido y <= 40 min)
  if (
    typeof movieDuration === "number" &&
    !isNaN(movieDuration) &&
    movieDuration <= 40
  ) {
    // Marcarlo como corto para excluirlo del pipeline de pending.
    // Sin esto, volvería a aparecer en cada corrida → stuck loop infinito.
    await supabase
      .from("movies")
      .update({ is_short: true, duration: movieDuration })
      .eq("id", movieId);

    return {
      movieId,
      director,
      success: true,
      error: "Skipped: short film",
    };
  }

  // Guardar los "watches" (miembros que vieron la peli en Letterboxd).
  // El endpoint pending filtra por este campo, así que persistirlo permite
  // que las pelis de pocas vistas salgan de la cola aunque no tengan
  // director/poster resolubles.
  if (typeof watches === "number" && !isNaN(watches)) {
    await supabase
      .from("movies")
      .update({ watches })
      .eq("id", movieId);
  }

  // Filtrar pelis de nicho (pocas vistas globales): no trackear el director
  // ni crear user_directors. El pending (que ya filtra por watches >= 800)
  // las deja de devolver al tener el campo persistido → se evita el stuck
  // loop de pelis sin poster en Letterboxd.
  if (
    typeof watches === "number" &&
    !isNaN(watches) &&
    watches < MIN_WATCHES
  ) {
    return {
      movieId,
      director,
      success: true,
      error: "Skipped: low watches",
    };
  }

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

    if (movieDuration) {
      await supabase
        .from("movies")
        .update({ duration: movieDuration })
        .eq("id", movieId);
    }

    if (movieRating) {
      await supabase
        .from("movies")
        .update({ rating: movieRating })
        .eq("id", movieId);
    }

    if (movieNationalName) {
      const { error: nationalTitleError } = await supabase
        .from("movies")
        .update({ national_title: movieNationalName })
        .eq("id", movieId);

      if (nationalTitleError) {
        console.error("Error updating national_title:", nationalTitleError);
      }
    }

    if (movieSlug) {
      await supabase
        .from("movies")
        .update({ slug: movieSlug })
        .eq("id", movieId);
    }

    // Buscar director por nombre (como hace scrape:list)
    const { data: existingDirector } = await supabase
      .from("directors")
      .select("id, slug, url")
      .eq("name", director)
      .maybeSingle();

    let directorId: string | undefined;

    if (existingDirector) {
      directorId = existingDirector.id;
      // Actualizar slug/url si faltan
      const updates: Record<string, string> = {};
      if (!existingDirector.slug && directorSlug) updates.slug = directorSlug;
      if (!existingDirector.url && directorUrl) updates.url = directorUrl;
      if (Object.keys(updates).length > 0) {
        await supabase.from("directors").update(updates).eq("id", directorId);
      }
    } else {
      // Director no existe, crearlo
      const slug =
        directorSlug ||
        director
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "-");
      const { data: newDirector, error: insertError } = await supabase
        .from("directors")
        .insert({ name: director, url: directorUrl || null, slug })
        .select("id")
        .single();

      if (insertError) {
        // Si slug duplicado, buscar por nombre
        if (insertError.code === "23505") {
          const { data: retry } = await supabase
            .from("directors")
            .select("id")
            .eq("name", director)
            .maybeSingle();
          directorId = retry?.id;
        }
        if (!directorId) {
          console.error("Error creating director:", insertError);
          return {
            movieId,
            director,
            success: false,
            error: `Failed to create director: ${insertError.message}`,
          };
        }
      } else {
        directorId = newDirector.id;
      }
    }

    if (!directorId) {
      return {
        movieId,
        director,
        success: false,
        error: "Could not resolve director_id",
      };
    }

    // Actualizar la película con el director
    const { error: updateError } = await supabase
      .from("movies")
      .update({ director_id: directorId })
      .eq("id", movieId);

    if (updateError) {
      console.error("Error updating movie:", updateError);
      return {
        movieId,
        director,
        success: false,
        error: "Failed to update movie",
      };
    }

    // Sincronizar user_directors con el criterio de favoritos (fase 1)
    // Encontrar usuarios que tienen películas de este director
    const { data: usersWithMovies, error: queryError } = await supabase
      .from("user_movies")
      .select(
        `
            user_id,
            rating,
            movies!inner (
              director_id
            )
          `,
      )
      .eq("movies.director_id", directorId);

    if (!queryError && usersWithMovies && usersWithMovies.length > 0) {
      // Agrupar películas vistas por usuario
      const filmsByUser = new Map<string, { rating: number | null }[]>();

      for (const item of usersWithMovies) {
        const films = filmsByUser.get(item.user_id) ?? [];
        films.push({ rating: item.rating });
        filmsByUser.set(item.user_id, films);
      }

      const userDirectorInserts: {
        user_id: string;
        director_id: string;
        source: "auto";
      }[] = [];

      for (const [userId, films] of filmsByUser) {
        if (!shouldFollowDirector(films)) continue;

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
            source: "auto",
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

    return {
      movieId,
      director,
      directorId,
      success: true,
    };
  } catch (error) {
    console.error(`Error processing movie ${movieId}:`, error);
    return {
      movieId,
      director,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
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

    const { movieDirectors }: { movieDirectors: MovieDataData[] } =
      await request.json();

    if (!movieDirectors || !Array.isArray(movieDirectors)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 },
      );
    }

    // Procesar en lotes concurrentes para evitar agotar el timeout del gateway.
    // Cada película involucra ~12 queries seriales a Supabase; procesar las 47
    // en serie termina en 504. Acá corremos CHUNK a la vez, manteniendo el
    // orden de los resultados.
    const CHUNK_SIZE = 8;
    const results: MovieResult[] = [];

    for (let i = 0; i < movieDirectors.length; i += CHUNK_SIZE) {
      const chunk = movieDirectors.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map((movieData) => processMovie(movieData, supabase)),
      );
      results.push(...chunkResults);
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
