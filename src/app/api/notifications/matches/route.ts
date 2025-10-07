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
    const now = new Date().toISOString();

    // Obtener todos los screening_times futuros
    const { data: screeningTimes, error: timesError } = await supabase
      .from("screening_times")
      .select(
        `
        *,
        screenings!inner(
          *,
          movies!inner(
            *,
            directors!inner(
              *,
              user_directors!inner(*)
            )
          ),
          cinemas(*)
        )
      `,
      )
      .gte("screening_datetime", now)
      .lte("screening_datetime", cutoff)
      .order("screening_datetime");

    if (timesError) {
      console.error("Error fetching screening times:", timesError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Agrupar por screening para evitar duplicados
    const screeningsMap = new Map();

    screeningTimes?.forEach((time) => {
      const screening = time.screenings;
      const screeningId = screening.id;

      if (!screeningsMap.has(screeningId)) {
        screeningsMap.set(screeningId, {
          ...screening,
          screening_times: [],
        });
      }

      screeningsMap.get(screeningId).screening_times.push({
        id: time.id,
        screening_datetime: time.screening_datetime,
      });
    });

    const matches = Array.from(screeningsMap.values());

    return NextResponse.json(matches);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
