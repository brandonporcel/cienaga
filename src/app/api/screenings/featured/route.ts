import { NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";
import Screening from "@/types/screening";

export async function GET() {
  const supabase = await createClientForServer();

  // Traer funciones próximas con info de director y cine.
  // NOTA: no usar .order() en nested selects de Supabase (PostgREST no lo soporta bien).
  // El filtro sobre `screening_times` con !inner hace inner join: solo screenings
  // con al menos un horario futuro, y los screening_times vienen ya filtrados.
  const now = new Date();
  const { data: screenings, error } = await supabase
    .from("screenings")
    .select(
      "*, screening_times!inner(*), movies(*, directors(id, name)), cinemas(*)",
    )
    .gte("screening_times.screening_datetime", now.toISOString())
    .limit(1000) as { data: Screening[] | null; error: unknown };

  if (error || !screenings || screenings.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Contar seguidores por director
  const directorIds = [
    ...new Set(
      screenings
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
  const ranked = screenings
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
