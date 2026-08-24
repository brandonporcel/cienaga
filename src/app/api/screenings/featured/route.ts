import { NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

import Screening from "@/types/screening";

export async function GET() {
  const supabase = await createClientForServer();

  // 1. Traer funciones próximas con info de director
  const { data: screenings } = await supabase
    .from("screenings")
    .select(
      "*, screening_times(*), movies(*, directors(id, name)), cinemas(*)",
    )
    .order("screening_times.screening_datetime", { ascending: true })
    .limit(50) as { data: Screening[] | null };

  if (!screenings || screenings.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // 2. Contar seguidores por director
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

  // Agrupar por director_id
  const countMap = new Map<string, number>();
  for (const row of followerCounts ?? []) {
    countMap.set(row.director_id, (countMap.get(row.director_id) ?? 0) + 1);
  }

  // 3. Filtrar funciones con fechas futuras, rankear por seguidores y devolver top 6
  const now = new Date();
  const ranked = screenings
    .filter((s) => {
      const times = s.screening_times ?? [];
      return times.some((t) => new Date(t.screening_datetime) >= now);
    })
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
