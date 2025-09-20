import { NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClientForServer();

  const { count, error } = await supabase
    .from("movies")
    .select("*", { count: "exact", head: true })
    .is("director_id", null)
    .not("url", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    pendingMovies: count || 0,
    hasWork: (count || 0) > 0,
  });
}
