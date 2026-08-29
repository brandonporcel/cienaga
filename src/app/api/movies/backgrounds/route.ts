import { NextRequest, NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

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
    const { data: screeningRows, error: errScreenings } = await supabase
      .from("screenings")
      .select("movie_id")
      .not("movie_id", "is", null);
    if (errScreenings) {
      console.error("Error fetching screenings:", errScreenings);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    const screeningIds = [...new Set((screeningRows ?? []).map((s) => s.movie_id))];

    // Query 1: pelis sin fondo QUE TIENEN función (screenings). Usamos
    // `.in` (tolera listas largas, a diferencia de `.not().in()`).
    const { data: withScreenings, error: errS } = await supabase
      .from("movies")
      .select("id, title, url, year, watches")
      .is("background_img_url", null)
      .eq("is_short", false)
      .not("url", "is", null)
      .in("id", screeningIds)
      .limit(limit)
      .order("created_at", { ascending: true });

    if (errS) {
      console.error("Error fetching movies sin fondo (con funciones):", errS);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const withIds = new Set((withScreenings ?? []).map((m) => m.id));
    const movies = [...(withScreenings ?? [])];

    // Query 2: relleno con pelis sin fondo que NO tienen función, excluyendo
    // solo los IDs ya devueltos (set acotado → `.not().in` chico, no rompe).
    if (movies.length < limit) {
      const { data: withoutScreenings, error: errW } = await supabase
        .from("movies")
        .select("id, title, url, year, watches")
        .is("background_img_url", null)
        .eq("is_short", false)
        .not("url", "is", null)
        .limit(limit - movies.length)
        .not("id", "in", [...withIds])
        .order("created_at", { ascending: true });

      if (errW) {
        console.error("Error fetching movies sin fondo:", errW);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      movies.push(...(withoutScreenings ?? []));
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
