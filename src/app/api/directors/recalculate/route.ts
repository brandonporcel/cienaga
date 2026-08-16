import { NextRequest, NextResponse } from "next/server";

import {
  DirectorSource,
  shouldFollowDirector,
} from "@/lib/services/director-preference";
import { createClientForServer } from "@/lib/supabase/server";

/**
 * Recalcula user_directors para todos los usuarios aplicando el criterio de
 * favoritos (fase 1). Respeta los overrides: las relaciones con source
 * 'manual' o 'muted' nunca se modifican.
 *
 * Uso: POST /api/directors/recalculate
 * Headers: Authorization: Bearer <CRON_SECRET_KEY>
 */
export async function POST(request: NextRequest) {
  const supabase = await createClientForServer();

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id");

    if (usersError) throw usersError;

    let added = 0;
    let removed = 0;
    let keptOverrides = 0;

    for (const user of users) {
      // Películas vistas del usuario con su director asignado
      const { data: films, error: filmsError } = await supabase
        .from("user_movies")
        .select(
          `
          rating,
          movies!inner (
            director_id
          )
        `,
        )
        .eq("user_id", user.id)
        .not("movies.director_id", "is", null);

      if (filmsError) throw filmsError;

      // Relaciones actuales del usuario (para respetar overrides)
      const { data: currentRelations, error: relationsError } = await supabase
        .from("user_directors")
        .select("director_id, source")
        .eq("user_id", user.id);

      if (relationsError) throw relationsError;

      const relationsByDirector = new Map<string, DirectorSource>(
        currentRelations.map((rel) => [rel.director_id, rel.source]),
      );

      // Agrupar películas vistas por director
      const filmsByDirector = new Map<
        string,
        { rating: number | null }[]
      >();

      for (const filmRow of films) {
        const film = filmRow as unknown as {
          rating: number | null;
          movies: { director_id: string } | null;
        };

        const directorId = film.movies?.director_id;
        if (!directorId) continue;

        const directorFilms = filmsByDirector.get(directorId) ?? [];
        directorFilms.push({ rating: film.rating });
        filmsByDirector.set(directorId, directorFilms);
      }

      // 1) Agregar/actualizar los que cumplen el criterio
      for (const [directorId, directorFilms] of filmsByDirector) {
        if (!shouldFollowDirector(directorFilms)) continue;

        const currentSource = relationsByDirector.get(directorId);
        if (currentSource && currentSource !== "auto") {
          // Override del usuario: no tocar
          keptOverrides++;
          continue;
        }

        if (currentSource === "auto") continue; // ya existe y sigue cumpliendo

        const { error } = await supabase.from("user_directors").insert({
          user_id: user.id,
          director_id: directorId,
          source: "auto",
        });

        if (error && error.code !== "23505") throw error; // 23505 = duplicado
        added++;
      }

      // 2) Quitar los 'auto' que ya no cumplen el criterio
      for (const [directorId, currentSource] of relationsByDirector) {
        if (currentSource !== "auto") continue;

        const directorFilms = filmsByDirector.get(directorId);
        if (directorFilms && shouldFollowDirector(directorFilms)) continue;

        const { error } = await supabase
          .from("user_directors")
          .delete()
          .eq("user_id", user.id)
          .eq("director_id", directorId)
          .eq("source", "auto");

        if (error) throw error;
        removed++;
      }
    }

    console.log(
      `Recalculate done: ${added} added, ${removed} removed, ${keptOverrides} overrides kept`,
    );

    return NextResponse.json({ added, removed, keptOverrides });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
