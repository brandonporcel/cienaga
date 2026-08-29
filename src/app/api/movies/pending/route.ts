import { NextRequest, NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

// Umbral de "vistas globales en Letterboxd" (ver api/movies/batch/route.ts
// y scrape-directors.ts). Las pelis con menos watchers (de nicho, a menudo
// sin poster en Letterboxd) quedan fuera de la cola: no se pueden completar
// y atascan el pipeline en un loop infinito.
const MIN_WATCHES = 800;

export async function GET(request: NextRequest) {
  const supabase = await createClientForServer();

  try {
    // Verificar clave de acceso
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener limit desde query params (default 50)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Obtener películas sin director asignado O sin poster_url,
    // excluyendo cortometrajes ya procesados (is_short = true).
    // Sobre eso, excluir pelis de nicho ya detectadas (watches < MIN_WATCHES);
    // las que aún no tienen watches (NULL) se incluyen para poder scrapearlas
    // y obtener el valor por primera vez.
    const { data: movies, error } = await supabase
      .from("movies")
      .select("id, title, url, year")
      .or("director_id.is.null,poster_url.is.null")
      .eq("is_short", false)
      .not("url", "is", null)
      .or(`watches.is.null,watches.gte.${MIN_WATCHES}`)
      .limit(limit)
      .order("created_at", { ascending: true }); // Procesar las más viejas primero

    if (error) {
      console.error("Error fetching movies:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({
      movies: movies || [],
      count: movies?.length || 0,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
