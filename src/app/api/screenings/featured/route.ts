import { NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClientForServer();

  const { data } = await supabase
    .from("screenings")
    .select(
      `
      *,
      movies(*, directors(*)),
      cinemas(*)
    `,
    )
    .gte("screening_time", new Date().toISOString())
    .order("movies.rating", { ascending: false })
    .limit(6);

  return NextResponse.json({ data });
}
