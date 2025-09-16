import Papa from "papaparse";

import { LetterboxdCSVRow, LetterboxdMovie } from "@/types/letterboxd";

export default class LetterboxdService {
  static parseLetterboxdMovieCSV(ratings: File): Promise<LetterboxdMovie[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(ratings, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const movies = (results.data as LetterboxdCSVRow[]).map((row) => ({
              title: row["Name"],
              year: Number(row["Year"]),
              rating: isNaN(Number(row["Rating"])) ? undefined : undefined,
              url: row["Letterboxd URI"],
            }));
            resolve(movies);
          } catch (err) {
            reject(err);
          }
        },
        error: (error) => reject(error),
      });
    });
  }

  /**
   * @description Get list of movies from export CSV files.
   * @param files - The first number.
   * @returns The list of movies.
   */
  static async getMovies(
    files: Record<string, File>,
  ): Promise<LetterboxdMovie[]> {
    const allResults = await Promise.all(
      Object.values(files)
        .filter(Boolean)
        .map((file) => this.parseLetterboxdMovieCSV(file)),
    );

    const allMovies = allResults.flat();

    // Eliminar duplicados
    const deduped = allMovies.reduce<LetterboxdMovie[]>((acc, movie) => {
      const existing = acc.find(
        (m) => m.title === movie.title && m.year === movie.year,
      );
      if (!existing) {
        acc.push(movie);
      }
      return acc;
    }, []);

    return deduped;
  }
}
