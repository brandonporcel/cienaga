import { NextRequest, NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

// Umbral de "vistas globales en Letterboxd". Las pelis de nicho (< 800) casi
// nunca tienen fanart/backdrop en Letterboxd, así que scrapearlas siempre da
// "no encontrado". Excluirlas evita el loop infinito del backfill.
const MIN_WATCHES = 800;

// Endpoint para el backfill de background_img_url: permite listar pelis que
// aún no tienen fondo y persistir el fondo scrapeado, sin tocar el pipeline
// principal de movie-directors (que solo procesa pelis "pending" por director
// o poster y, una vez completadas, deja el fondo null para siempre).

export async function GET(request: NextRequest) {
  const supabase = await createClientForServer();

  try {
    // Verificar clave de acceso
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "25");

    // IDs de pelis que tienen al menos una proyección (funciones en cartelera).
    const screeningMovies =
      (
        await supabase
          .from("screenings")
          .select("movie_id")
          .not("movie_id", "is", null)
      ).data?.map((s) => s.movie_id) ?? [];

    // Prioridad 1: pelis con screenings (funciones).
    const { data: withS, error: errS } = await supabase
      .from("movies")
      .select("id, title, url, year, watches")
      .is("background_img_url", null)
      .eq("is_short", false)
      .not("url", "is", null)
      .gte("watches", MIN_WATCHES)
      .in("id", screeningMovies)
      .limit(limit)
      .order("created_at", { ascending: true });

    const movies = withS ?? [];

    if (movies.length < limit) {
      // Prioridad 2: rellenar con pelis sin screenings (pero con watches>=800).
      const { data: withoutS, error: errW } = await supabase
        .from("movies")
        .select("id, title, url, year, watches")
        .is("background_img_url", null)
        .eq("is_short", false)
        .not("url", "is", null)
        .gte("watches", MIN_WATCHES)
        .not("id", "in", screeningMovies)
        .limit(limit - movies.length)
        .order("created_at", { ascending: true });

      if (errS || errW) {
        console.error("Error fetching movies sin fondo:", errS ?? errW);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      movies.push(...(withoutS ?? []));
    } else if (errS) {
      console.error("Error fetching movies sin fondo:", errS);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({
      movies,
      count: movies.length,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClientForServer();

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { movieId, backgroundMovieImg } = body as {
      movieId?: string;
      backgroundMovieImg?: string | null;
    };

    if (!movieId || typeof backgroundMovieImg !== "string") {
      return NextResponse.json(
        { error: "movieId y backgroundMovieImg (string) son requeridos" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("movies")
      .update({ background_img_url: backgroundMovieImg })
      .eq("id", movieId);

    if (error) {
      console.error("Error actualizando background_img_url:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
