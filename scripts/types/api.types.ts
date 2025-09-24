import Movie from "@/types/movie";

import { ProcessingResult } from "./movie.types";

export interface ApiResponse {
  movies: Movie[];
  count: number;
}

export interface SaveResponse {
  processed: number;
  successful: number;
  failed: number;
  results: ProcessingResult[];
}

export interface ApiConfig {
  baseUrl: string;
  secretKey: string;
  headers: Record<string, string>;
}
