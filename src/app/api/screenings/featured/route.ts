import { NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";
import Screening from "@/types/screening";

export async function GET() {
  const supabase = await createClientForServer();

  // Traer funciones próximas con info de director y cine
  // NOTA: no usar .order() en nested selects de Supabase (PostgREST no lo soporta bien)
  const { data: screenings, error } = await supabase
    .from("screenings")
    .select(
      "*, screening_times(*), movies(*, directors(id, name)), cinemas(*)",
    )
    .limit(100) as { data: Screening[] | null; error: unknown };

  if (error || !screenings || screenings.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Filtrar funciones con al menos una fecha futura
  const now = new Date();
  const upcoming = screenings.filter((s) => {
    const times = s.screening_times ?? [];
    return times.some((t) => new Date(t.screening_datetime) >= now);
  });

  // Si no hay funciones próximas, devolver 6 random como fallback
  if (upcoming.length === 0) {
    const shuffled = [...screenings].sort(() => Math.random() - 0.5);
    return NextResponse.json({ data: shuffled.slice(0, 6) });
  }

  // Contar seguidores por director
  const directorIds = [
    ...new Set(
      upcoming
        .map((s) => s.movies?.directors?.id)
        .filter(Boolean) as string[],
    ),
  ];

  const { data: followerCounts } = await supabase
    .from("user_directors")
    .select("director_id")
    .in("director_id", directorIds);

  const countMap = new Map<string, number>();
  for (const row of followerCounts ?? []) {
    countMap.set(row.director_id, (countMap.get(row.director_id) ?? 0) + 1);
  }

  // Rankear por cantidad de seguidores del director
  const ranked = upcoming
    .map((s) => ({
      ...s,
      _followers: countMap.get(s.movies?.directors?.id ?? "") ?? 0,
    }))
    .sort((a, b) => b._followers - a._followers)
    .slice(0, 6)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _followers, ...rest }) => rest);

  return NextResponse.json({ data: ranked });
}
