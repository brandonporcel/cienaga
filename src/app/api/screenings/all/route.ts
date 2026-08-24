import { NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";
import Screening from "@/types/screening";

export async function GET() {
  const supabase = await createClientForServer();

  const { data: screenings, error } = await supabase
    .from("screenings")
    .select(
      "*, screening_times(*), movies(*, directors(id, name)), cinemas(*)",
    )
    .limit(200) as { data: Screening[] | null; error: unknown };

  if (error || !screenings) {
    return NextResponse.json({ data: [] });
  }

  // Filtrar funciones con al menos una fecha futura
  const now = new Date();
  const upcoming = screenings.filter((s) => {
    const times = s.screening_times ?? [];
    return times.some((t) => new Date(t.screening_datetime) >= now);
  });

  // Ordenar por primera función más cercana
  upcoming.sort((a, b) => {
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
