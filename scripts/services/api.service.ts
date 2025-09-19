import axios from "axios";

import { ApiConfig, ApiResponse, SaveResponse } from "../types/api.types";
import { Movie, MovieDirector } from "../types/movie.types";

export class ApiService {
  private config: ApiConfig;

  constructor(baseUrl: string, secretKey: string) {
    this.config = {
      baseUrl,
      secretKey,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    };
  }

  async fetchPendingMovies(limit: number = 50): Promise<Movie[]> {
    try {
      console.log(`📡 Fetching up to ${limit} pending movies...`);

      const response = await axios.get<ApiResponse>(
        `${this.config.baseUrl}/api/movies/pending?limit=${limit}`,
        { headers: this.config.headers },
      );

      console.log(`📋 Received ${response.data.movies.length} movies from API`);
      return response.data.movies;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Error fetching pending movies:", errorMessage);
      throw new Error(`Failed to fetch movies: ${errorMessage}`);
    }
  }

  async saveDirectors(movieDirectors: MovieDirector[]): Promise<SaveResponse> {
    try {
      console.log(`💾 Saving ${movieDirectors.length} movie-director pairs...`);

      const response = await axios.post<SaveResponse>(
        `${this.config.baseUrl}/api/directors/batch`,
        { movieDirectors },
        { headers: this.config.headers },
      );

      console.log(
        `✅ Save result: ${response.data.successful} successful, ${response.data.failed} failed`,
      );
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Error saving directors:", errorMessage);
      throw new Error(`Failed to save directors: ${errorMessage}`);
    }
  }

  async checkPendingCount(): Promise<{ count: number; hasWork: boolean }> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/api/movies/count-pending`,
        { headers: this.config.headers },
      );

      return {
        count: response.data.pendingMovies,
        hasWork: response.data.hasWork,
      };
    } catch (error) {
      console.error("❌ Error checking pending count:", error);
      // Si falla el check, asumimos que hay trabajo para no perder ejecuciones
      return { count: -1, hasWork: true };
    }
  }
}
