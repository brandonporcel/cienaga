export interface ScrapedMovieData {
  director: string | null;
  directorUrl: string | null;
  posterUrl: string | null;
  year: number | null;
}

export interface MovieDirector {
  movieId: string;
  director: string;
  directorUrl?: string;
  posterUrl?: string;
  backgroundMovieImg?: string;
  movieRating?: number;
  year?: number;
}

export interface ProcessingResult {
  movieId: string;
  director: string;
  success: boolean;
  error?: string;
  directorId?: number;
}
