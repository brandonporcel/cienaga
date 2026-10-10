import { NextRequest, NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";
import Screening from "@/types/screening";

export async function GET(request: NextRequest) {
  const supabase = await createClientForServer();
  const { searchParams } = new URL(request.url);
  const cinemaId = searchParams.get("cinema_id");

  // Solo screenings con al menos un horario futuro: el filtro sobre
  // `screening_times` con !inner hace inner join (descartando screenings
  // sin funciones futuras) y los screening_times embebidos ya vienen
  // filtrados a los futuros. Sin esto, .limit(200) sin order traía las
  // primeras por orden de inserción (viejas) y escondía las nuevas.
  const now = new Date();
  let query = supabase
    .from("screenings")
    .select(
      "*, screening_times!inner(*), movies(*, directors(id, name)), cinemas(*)",
    )
    .gte("screening_times.screening_datetime", now.toISOString());

  if (cinemaId) {
    query = query.eq("cinema_id", Number(cinemaId));
  }

  const { data: screenings, error } = (await query.limit(1000)) as {
    data: Screening[] | null;
    error: unknown;
  };

  if (error || !screenings) {
    return NextResponse.json({ data: [] });
  }

  // Ordenar por primera función más cercana
  const upcoming = screenings.sort((a, b) => {
    const nextA = a.screening_times
      ?.filter((t) => new Date(t.screening_datetime) >= now)
      .sort(
        (x, y) =>
          new Date(x.screening_datetime).getTime() -
          new Date(y.screening_datetime).getTime(),
      )[0]?.screening_datetime;
    const nextB = b.screening_times
      ?.filter((t) => new Date(t.screening_datetime) >= now)
      .sort(
        (x, y) =>
          new Date(x.screening_datetime).getTime() -
          new Date(y.screening_datetime).getTime(),
      )[0]?.screening_datetime;

    return (nextA ?? "").localeCompare(nextB ?? "");
  });

  return NextResponse.json({ data: upcoming });
}
