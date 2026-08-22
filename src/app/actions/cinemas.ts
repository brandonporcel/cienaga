"use server";

import { createClientForServer } from "@/lib/supabase/server";

/**
 * Devuelve todos los cines que tienen al menos una función en cartelera,
 * sin filtrar por el flag de scraping habilitado.
 */
async function getCinemasWithScreenings() {
  const supabase = await createClientForServer();

  // IDs de cines con funciones cargadas
  const { data: screenings, error: screeningsError } = await supabase
    .from("screenings")
    .select("cinema_id");

  if (screeningsError) {
    console.error("Error fetching screenings:", screeningsError);
    return [];
  }

  const cinemaIds = [
    ...new Set((screenings ?? []).map((s) => s.cinema_id)),
  ];

  if (cinemaIds.length === 0) return [];

  const { data: cinemas, error } = await supabase
    .from("cinemas")
    .select("*")
    .in("id", cinemaIds);

  if (error) {
    console.error("Error fetching cinemas:", error);
    return [];
  }

  return cinemas || [];
}

export { getCinemasWithScreenings };
