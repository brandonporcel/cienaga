/**
 * Limpia películas huérfanas: sin poster, sin screenings, sin user_movies.
 * Ejecutar con: npx tsx scripts/cleanup-orphans.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  console.log("🔍 Buscando películas huérfanas...");
  console.log(
    "   (sin poster, sin screenings referenciados, sin user_movies)\n",
  );

  // 1. Obtener IDs de películas que tienen screenings o user_movies
  const [screeningsRes, userMoviesRes] = await Promise.all([
    supabase.from("screenings").select("movie_id"),
    supabase.from("user_movies").select("movie_id"),
  ]);

  const protectedIds = new Set<string>();
  for (const row of screeningsRes.data ?? []) protectedIds.add(row.movie_id);
  for (const row of userMoviesRes.data ?? []) protectedIds.add(row.movie_id);

  console.log(
    `   📊 ${protectedIds.size} películas protegidas (con screening o vista)`,
  );

  // 2. Buscar películas sin poster
  const { data: noPoster, error } = await supabase
    .from("movies")
    .select("id, title")
    .is("poster_url", null);

  if (error) {
    console.error("Error:", error);
    return;
  }

  // 3. Filtrar huérfanas (las que no están protegidas)
  const orphans = (noPoster ?? []).filter((m) => !protectedIds.has(m.id));

  console.log(
    `   🗑️  ${orphans.length} películas huérfanas de ${noPoster?.length ?? 0} sin poster\n`,
  );

  if (orphans.length === 0) {
    console.log("✅ Nada que limpiar.");
    return;
  }

  // Mostrar algunas de ejemplo
  console.log("   Ejemplos:");
  orphans.slice(0, 10).forEach((m) => console.log(`   - ${m.title}`));
  if (orphans.length > 10) console.log(`   ... y ${orphans.length - 10} más\n`);

  // 4. Eliminar en batches de 100
  const BATCH = 100;
  let deleted = 0;

  for (let i = 0; i < orphans.length; i += BATCH) {
    const batch = orphans.slice(i, i + BATCH);
    const ids = batch.map((m) => m.id);

    const { error: delError } = await supabase
      .from("movies")
      .delete()
      .in("id", ids);

    if (delError) {
      console.error(`Error deleting batch ${i / BATCH + 1}:`, delError);
      break;
    }

    deleted += batch.length;
    process.stdout.write(`   🗑️  ${deleted}/${orphans.length}\r`);
  }

  console.log(`\n✅ ${deleted} películas huérfanas eliminadas.`);

  // 5. Contar resultado
  const { count: remaining } = await supabase
    .from("movies")
    .select("id", { count: "exact", head: true });

  console.log(`   📊 ${remaining} películas restantes en la base.`);
}

main().catch(console.error);
