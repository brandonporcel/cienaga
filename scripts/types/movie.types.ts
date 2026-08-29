export interface ScrapedMovieData {
  movieSlug?: string | null;
  movieId?: string | null;
  directorSlug?: string | null;
  director?: string | null;
  directorUrl?: string | null;
  posterUrl?: string | null;
  backgroundMovieImg?: string | null;
  movieDuration?: number | null;
  movieRating?: number | null;
  year?: number | null;
  movieNationalName?: string | null;
  // Membres que vieron la peli en Letterboxd (CSI). Usado para filtrar
  // pelis de nicho que rompen el pipeline (sin poster en Letterboxd).
  watches?: number | null;
}

export interface ProcessingResult {
  movieId: string;
  director: string;
  success: boolean;
  error?: string;
  directorId?: number;
}
