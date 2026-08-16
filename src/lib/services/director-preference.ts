// Lógica única del criterio de "directores favoritos" (fase 1).
// La usan POST /api/movies/batch y POST /api/directors/recalculate.

export type DirectorSource = "auto" | "manual" | "muted";

export interface RatedFilm {
  rating: number | null;
}

/**
 * Criterio fase 1:
 * - ≥ 2 películas vistas Y ≥ 50% de ellas con rating ≥ 3.5, o
 * - ≥ 1 película con rating 5 (vi una película y la amé).
 */
export function shouldFollowDirector(films: RatedFilm[]): boolean {
  if (films.length === 0) return false;

  const hasFiveStars = films.some(
    (film) => film.rating !== null && film.rating === 5,
  );
  if (hasFiveStars) return true;

  if (films.length < 2) return false;

  const rated35Plus = films.filter(
    (film) => film.rating !== null && film.rating >= 3.5,
  ).length;

  return rated35Plus / films.length >= 0.5;
}

/** Métricas para la justificación que se muestra en la UI. */
export function getDirectorMetrics(films: RatedFilm[]) {
  const watched = films.length;
  const rated35Plus = films.filter(
    (film) => film.rating !== null && film.rating >= 3.5,
  ).length;
  const ratedFiveStars = films.filter(
    (film) => film.rating !== null && film.rating === 5,
  ).length;

  return {
    watched,
    rated35Plus,
    ratedFiveStars,
    pct35Plus: watched > 0 ? Math.round((rated35Plus / watched) * 100) : 0,
  };
}
