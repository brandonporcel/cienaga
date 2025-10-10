import { createServiceClient } from "@/lib/supabase/service";

export interface ScreeningFilters {
  userId?: string;
  cutoffDate: Date;
  includeWatched?: boolean;
  includeUnwatched?: boolean;
  minUserRating?: number;
  onlyFavoriteDirectors?: boolean;
}

export class ScreeningsService {
  private supabase;

  constructor() {
    this.supabase = createServiceClient();
  }

  /**
   * Para notificaciones (todos los usuarios con matches)
   */
  async getMatchedScreeningsForNotifications(
    cutoffDate: Date,
  ): Promise<Record<string, string>[]> {
    const now = new Date().toISOString();

    const { data: screeningTimes } = await this.supabase
      .from("screening_times")
      .select(
        `
        *,
        screenings!inner(
          *,
          movies!inner(*, directors!inner(*, user_directors!inner(*))),
          cinemas(*)
        )
      `,
      )
      .gte("screening_datetime", now)
      .lte("screening_datetime", cutoffDate.toISOString())
      .order("screening_datetime");

    return this.groupScreeningTimes(screeningTimes || []);
  }

  /**
   * Para dashboard personalizado (usuario específico)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getPersonalizedScreenings(filters: ScreeningFilters): Promise<any[]> {
    if (!filters.userId) {
      throw new Error("userId is required for personalized screenings");
    }

    const { userId, cutoffDate } = filters;
    const now = new Date().toISOString();

    // 1. Obtener preferencias del usuario
    const [userMovies, userDirectors] = await Promise.all([
      this.getUserMovies(userId),
      this.getUserDirectors(userId),
    ]);

    if (!userMovies.length && !userDirectors.length) {
      return [];
    }

    const movieIds = userMovies.map((m) => m.movie_id);
    const directorIds = userDirectors.map((d) => d.director_id);

    // 2. Obtener screenings (con chunking para evitar URLs largas)
    const allScreeningTimes = await this.fetchScreeningTimesForUser(
      movieIds,
      directorIds,
      now,
      cutoffDate.toISOString(),
    );

    // 3. Agrupar y retornar
    return this.groupScreeningTimes(allScreeningTimes);
  }

  // Métodos privados...
  private async getUserMovies(userId: string) {
    const { data } = await this.supabase
      .from("user_movies")
      .select("movie_id, rating")
      .eq("user_id", userId);
    return data || [];
  }

  private async getUserDirectors(userId: string) {
    const { data } = await this.supabase
      .from("user_directors")
      .select("director_id")
      .eq("user_id", userId);
    return data || [];
  }

  private async fetchScreeningTimesForUser(
    movieIds: string[],
    directorIds: string[],
    from: string,
    to: string,
  ) {
    const allTimes: Record<string, string>[] = [];

    // Películas vistas
    if (movieIds.length > 0) {
      const chunks = this.chunkArray(movieIds, 50);
      for (const chunk of chunks) {
        const { data } = await this.supabase
          .from("screening_times")
          .select(
            `*, screenings!inner(*, movies!inner(*, directors(*)), cinemas(*))`,
          )
          .gte("screening_datetime", from)
          .lte("screening_datetime", to)
          .in("screenings.movie_id", chunk);

        if (data) allTimes.push(...data);
      }
    }

    // Directores favoritos
    if (directorIds.length > 0) {
      const chunks = this.chunkArray(directorIds, 50);
      for (const chunk of chunks) {
        const { data } = await this.supabase
          .from("screening_times")
          .select(
            `*, screenings!inner(*, movies!inner(*, directors!inner(*)), cinemas(*))`,
          )
          .gte("screening_datetime", from)
          .lte("screening_datetime", to)
          .in("screenings.movies.director_id", chunk);

        if (data) allTimes.push(...data);
      }
    }

    return allTimes;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private groupScreeningTimes(screeningTimes: Record<string, any>[]) {
    const map = new Map();
    screeningTimes.forEach((time) => {
      const screening = time.screenings;
      if (!map.has(screening.id)) {
        map.set(screening.id, { ...screening, screening_times: [] });
      }
      map.get(screening.id).screening_times.push({
        id: time.id,
        screening_datetime: time.screening_datetime,
      });
    });
    return Array.from(map.values());
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
