import Movie from "@/types/movie";

import { ScrapedMovieData } from "../../types/movie.types";
import { delay, ExecutionTimer } from "../../utils/delay.util";
import { LetterboxdScraperService } from "./letterboxd-scraper.service";
import { getFilmStats } from "./letterboxd-stats.service";

export interface BatchConfig {
  maxConcurrent: number;
  delayBetweenRequests: number;
  timer: ExecutionTimer;
}

export class BatchProcessorService {
  private config: BatchConfig;

  constructor(config: BatchConfig) {
    this.config = config;
  }

  async processBatch(movies: Movie[]): Promise<ScrapedMovieData[]> {
    const results: ScrapedMovieData[] = [];
    const { maxConcurrent, delayBetweenRequests, timer } = this.config;

    console.log(
      `🔄 Processing ${movies.length} movies in batches of ${maxConcurrent}...`,
    );

    for (let i = 0; i < movies.length; i += maxConcurrent) {
      if (!timer.shouldContinue()) {
        console.log(
          `⏰ Time limit reached after ${timer.getElapsedMinutes()} minutes, stopping...`,
        );
        break;
      }

      const batch = movies.slice(i, i + maxConcurrent);
      const batchNumber = Math.floor(i / maxConcurrent) + 1;
      const totalBatches = Math.ceil(movies.length / maxConcurrent);

      console.log(
        `📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} movies)...`,
      );

      const promises = batch.map(
        async (movie): Promise<ScrapedMovieData | null> => {
          if (!movie.url) return null;

          const scrapedData = await LetterboxdScraperService.scrapeMovieData(
            movie.url,
          );
          await delay(delayBetweenRequests / maxConcurrent);

          if (!scrapedData.director) return null;

          // Obtener los "watches" (miembros que vieron la peli) desde el
          // CSI endpoint para filtrar pelis de nicho en el backend.
          const slug = extractFilmSlug(movie.url);
          const stats = slug ? await getFilmStats(slug) : null;

          return {
            movieId: movie.id,
            ...scrapedData,
            watches: stats?.watches ?? null,
          };
        },
      );

      const batchResults = await Promise.all(promises);
      const validResults = batchResults.filter(
        (r): r is ScrapedMovieData => r !== null,
      );
      results.push(...validResults);

      console.log(
        `✅ Batch ${batchNumber} completed: found ${validResults.length} directors`,
      );
    }

    return results;
  }
}

/**
 * Extrae el slug de la URL de Letterboxd: "https://letterboxd.com/film/fugs-film/"
 * → "fugs-film". Se usa para pedir los "watches" al CSI endpoint.
 */
function extractFilmSlug(url: string): string | null {
  const m = url.match(/\/film\/([^/?#]+)\/?/);
  return m ? m[1] : null;
}
