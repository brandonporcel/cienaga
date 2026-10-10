import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClientForServer } from "@/lib/supabase/server";
import CinemasBrowser, {
  CinemaWithCount,
} from "@/components/cinemas/cinemas-browser";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Cines | Ciénaga",
  description: "Cines y espacios de Buenos Aires con funciones en cartelera",
};

export default async function CinemasPage() {
  const supabase = await createClientForServer();

  const now = new Date().toISOString();

  // Cines + conteo de funciones futuras (solo los que tienen algo en cartelera)
  const { data: screenings, error: screeningsError } = await supabase
    .from("screenings")
    .select("cinema_id, screening_times(screening_datetime)")
    .filter("screening_times.screening_datetime", "gte", now);

  if (screeningsError) {
    console.error("Error fetching screenings:", screeningsError);
  }

  const counts = new Map<number, number>();
  for (const s of screenings ?? []) {
    counts.set(s.cinema_id, (counts.get(s.cinema_id) ?? 0) + 1);
  }

  const { data: cinemas, error } = await supabase
    .from("cinemas")
    .select("*")
    .in("id", [...counts.keys()]);

  if (error) {
    console.error("Error fetching cinemas:", error);
  }

  const list: CinemaWithCount[] = (cinemas ?? [])
    .map((c) => ({ ...c, futureCount: counts.get(c.id) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  // Si el usuario está logueado, "Volver al inicio" va al dashboard;
  // si no, al home (el middleware ya protege /dashboard).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const backHref = user ? "/dashboard" : "/";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1320px] mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <Link href={backHref}>
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
          <h1 className="text-3xl md:text-5xl font-semibold">Cines</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Cines y espacios de Buenos Aires con funciones en cartelera
          </p>
        </div>

        <CinemasBrowser cinemas={list} />
      </div>
    </div>
  );
}