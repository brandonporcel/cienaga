import { NextRequest, NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET_KEY;

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const title = request.nextUrl.searchParams.get("title");
  const year = request.nextUrl.searchParams.get("year");

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const supabase = await createClientForServer();

  let query = supabase
    .from("movies")
    .select("id, title, year, director_id, directors(name)")
    .ilike("title", `%${title}%`);

  if (year) {
    query = query.eq("year", parseInt(year));
  }

  const { data: movies, error } = await query.limit(5);

  if (error) {
    console.error("Error searching movies:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!movies || movies.length === 0) {
    return NextResponse.json({ found: false });
  }

  const best = movies[0];
  const directors = best.directors as { name: string }[] | null;
  return NextResponse.json({
    found: true,
    movieId: best.id,
    title: best.title,
    year: best.year,
    directorId: best.director_id,
    directorName: directors?.[0]?.name || null,
  });
}
