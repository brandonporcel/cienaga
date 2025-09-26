import { NextRequest, NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClientForServer();

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cutoff = searchParams.get("cutoff");

    const { data: matches } = await supabase
      .from("screenings")
      .select(
        `
      *,
      movies!inner(
        *,
        directors!inner(
          *,
          user_directors!inner(*) 
        )
      ),
      cinemas(*)
    `,
      )
      .gte("screening_time", new Date().toISOString())
      .order("screening_time");

    return NextResponse.json(matches);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
