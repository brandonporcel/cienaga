import { createClientForServer } from "@/lib/supabase/server";
import CinemasBrowser, {
  CinemaWithCount,
} from "@/components/cinemas/cinemas-browser";

export const metadata = {
  title: "Cines | Ciénaga",
  description: "Cines y espacios de Buenos Aires con funciones en cartelera",
};

export default async function CinemasPage() {
  const supabase = await createClientForServer();

  const now = new Date().toISOString();

  // Cines + películas únicas con funciones futuras. El `!inner` en
  // screening_times hace inner join: sin él, el filtro gte traía TODAS
  // las screenings (incluidas las viejas sin funciones futuras) y el
  // contador de películas quedaba inflado.
  const { data: screenings, error: screeningsError } = await supabase
    .from("screenings")
    .select("cinema_id, movie_id, screening_times!inner(screening_datetime)")
    .gte("screening_times.screening_datetime", now);

  if (screeningsError) {
    console.error("Error fetching screenings:", screeningsError);
  }

  const movieCounts = new Map<number, Set<string>>();
  for (const s of screenings ?? []) {
    const set = movieCounts.get(s.cinema_id) ?? new Set<string>();
    set.add(s.movie_id);
    movieCounts.set(s.cinema_id, set);
  }

  const { data: cinemas, error } = await supabase
    .from("cinemas")
    .select("*")
    .in("id", [...movieCounts.keys()]);

  if (error) {
    console.error("Error fetching cinemas:", error);
  }

  const list: CinemaWithCount[] = (cinemas ?? [])
    .map((c) => ({ ...c, movieCount: movieCounts.get(c.id)?.size ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Cines</h1>
        <p className="text-muted-foreground text-sm">
          {list.length === 1
            ? "1 cine con funciones en cartelera"
            : `${list.length} cines con funciones en cartelera`}
        </p>
      </div>

      <CinemasBrowser cinemas={list} />
    </>
  );
}
