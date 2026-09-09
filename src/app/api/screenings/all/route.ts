import { NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";
import Screening from "@/types/screening";

export async function GET() {
  const supabase = await createClientForServer();

  // Solo screenings con al menos un horario futuro: el filtro sobre
  // `screening_times` con !inner hace inner join (descartando screenings
  // sin funciones futuras) y los screening_times embebidos ya vienen
  // filtrados a los futuros. Sin esto, .limit(200) sin order traía las
  // primeras por orden de inserción (viejas) y escondía las nuevas.
  const now = new Date();
  const { data: screenings, error } = await supabase
    .from("screenings")
    .select(
      "*, screening_times!inner(*), movies(*, directors(id, name)), cinemas(*)",
    )
    .gte("screening_times.screening_datetime", now.toISOString())
    .limit(1000) as { data: Screening[] | null; error: unknown };

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
