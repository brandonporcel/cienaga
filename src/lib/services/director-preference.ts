// Lógica única del criterio de "directores favoritos".
// La usan POST /api/movies/batch y POST /api/directors/recalculate.

export type DirectorSource = "auto" | "manual";

export interface RatedFilm {
  rating: number | null;
}

/**
 * Criterio de seguimiento automático:
 * - ≥ 4 películas vistas, o
 * - ≥ 1 película con rating ≥ 4★.
 */
export function shouldFollowDirector(films: RatedFilm[]): boolean {
  if (films.length === 0) return false;

  // ≥ 4 pelis vistas → seguir
  if (films.length >= 4) return true;

  // 1+ peli con ≥ 4★ → seguir
  const hasHighRating = films.some(
    (film) => film.rating !== null && film.rating >= 4,
  );
  if (hasHighRating) return true;

  return false;
}

/** Métricas para la justificación que se muestra en la UI. */
export function getDirectorMetrics(films: RatedFilm[]) {
  const watched = films.length;
  const rated4Plus = films.filter(
    (film) => film.rating !== null && film.rating >= 4,
  ).length;

  return {
    watched,
    rated4Plus,
    pct4Plus: watched > 0 ? Math.round((rated4Plus / watched) * 100) : 0,
  };
}
