import { NextRequest, NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

// Endpoint para el backfill de background_img_url. Lista pelis que todavía no
// fueron procesadas (background_scraped = false) y permite persistir el fondo
// scrapeado y/o marcar que se intentó (con o sin resultado), para que no se
// reintente una peli que no tiene fanart en Letterboxd.

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
    const screeningSet = new Set(
      (screeningRows ?? []).map((s) => s.movie_id),
    );

    // Una sola query simple, sin `.in`/`.not().in()` masivos (que rompen el
    // parser de PostgREST con UUIDs). Traigo de sobra y priorizo por función
    // en memoria.
    const { data: movies, error } = await supabase
      .from("movies")
      .select("id, title, url, year, watches")
      .is("background_img_url", null)
      .eq("background_scraped", false)
      .eq("is_short", false)
      .not("url", "is", null)
      .limit(limit * 3)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching movies sin procesar:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Priorizar pelis con función al frente (las de cartelera son las que
    // más importan para la UI).
    const prioritized = [...(movies ?? [])].sort(
      (a, b) =>
        Number(screeningSet.has(b.id)) - Number(screeningSet.has(a.id)),
    );

    return NextResponse.json({
      movies: prioritized.slice(0, limit),
      count: Math.min(prioritized.length, limit),
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
    const { movieId, backgroundMovieImg, markScraped } = body as {
      movieId?: string;
      backgroundMovieImg?: string | null;
      markScraped?: boolean;
    };

    if (!movieId) {
      return NextResponse.json(
        { error: "movieId es requerido" },
        { status: 400 },
      );
    }

    const patch: Record<string, unknown> = { background_scraped: true };
    if (typeof backgroundMovieImg === "string") {
      patch.background_img_url = backgroundMovieImg;
    }
    if (markScraped === true) {
      patch.background_scraped = true;
    }

    const { error } = await supabase
      .from("movies")
      .update(patch)
      .eq("id", movieId);

    if (error) {
      console.error("Error actualizando movie:", error);
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
