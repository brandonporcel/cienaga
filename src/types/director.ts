import { DirectorSource } from "@/lib/services/director-preference";

export type { DirectorSource };

export interface Director {
  id: string;
  name: string;
  url: string;
  image_url: string;
  tmdb_id: number | null;
  user_directors?: { user_id: string }[];
  created_at: string;
  source?: DirectorSource;
  movies_count?: number;
}

export interface DirectorDetail {
  director: Director;
  /** null = el usuario no tiene relación con este director */
  source: DirectorSource | null;
  metrics: {
    watched: number;
    rated35Plus: number;
    ratedFiveStars: number;
    pct35Plus: number;
  };
  filmography: {
    title: string;
    year: number | null;
    poster_url: string | null;
    rating: number | null;
  }[];
}
