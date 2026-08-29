/**
 * Backfill de background_img_url para pelis que ya pasaron por el pipeline
 * de movie-directors y quedaron sin fondo (el pipeline solo procesa pelis
 * "pending" por director/poster, y una vez completadas deja el fondo null).
 *
 * Uso: pnpm exec tsx scripts/scrape-backgrounds.ts
 * Requiere: APP_URL, CRON_SECRET_KEY (para auth contra los endpoints).
 *
 * Reutiliza LetterboxdScraperService.scrapeMovieData (que ya extrae el
 * background de la film page) y el mismo patrón axios con Bearer del
 * pipeline de movie-directors.
 */

import axios from "axios";

import Movie from "@/types/movie";

import { ApiConfig } from "./types/api.types";
import { LetterboxdScraperService } from "./services/movie-data/letterboxd-scraper.service";
import { validateEnvironmentVariables } from "./utils/validation.util";

const CONFIG = {
  BATCH_SIZE: 25,
  DELAY_BETWEEN_REQUESTS: 800,
} as const;

class BackgroundScrapingOrchestrator {
  private config: ApiConfig;

  constructor() {
    const { baseUrl, secretKey } = validateEnvironmentVariables();
    this.config = {
      baseUrl,
      secretKey,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    };
  }

  async execute(): Promise<void> {
    console.log("🚀 Starting background image backfill...");
    console.log(
      `📊 Config: batch=${CONFIG.BATCH_SIZE}, delay=${CONFIG.DELAY_BETWEEN_REQUESTS}ms`,
    );

    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    let offset = 0;

    // Loop por lotes. Termina cuando un lote viene vacío (no quedan más
    // pelis sin fondo).
    while (true) {
      const movies = await this.fetchMoviesWithoutBackground();

      if (movies.length === 0) {
        console.log("✅ No more movies without background.");
        break;
      }

      console.log(
        `📦 Processing batch: ${movies.length} movies (offset=${offset})`,
      );

      for (const movie of movies) {
        await this.processMovie(movie);
        totalUpdated += 0; // se cuenta dentro de processMovie
        await this.delay(CONFIG.DELAY_BETWEEN_REQUESTS);
      }

      offset += movies.length;
    }

    console.log(`\n📊 Total summary:`);
    console.log(`   🎬 Updated backgrounds: ${totalUpdated}`);
    console.log(`   ⏭️  Skipped (sin fondo en Letterboxd): ${totalSkipped}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
  }

  private async fetchMoviesWithoutBackground(): Promise<Movie[]> {
    try {
      console.log(`📡 Fetching up to ${CONFIG.BATCH_SIZE} movies sin fondo...`);
      const response = await axios.get<{ movies: Movie[]; count: number }>(
        `${this.config.baseUrl}/api/movies/backgrounds?limit=${CONFIG.BATCH_SIZE}`,
        { headers: this.config.headers },
      );
      const movies = response.data.movies ?? [];
      console.log(`📋 Received ${movies.length} movies from API`);
      return movies;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Error fetching movies sin fondo:", message);
      throw new Error(`Failed to fetch movies: ${message}`);
    }
  }

  private async processMovie(movie: Movie): Promise<void> {
    if (!movie.url) {
      // Marcar como scraped para no reintentar pelis sin URL.
      await this.saveBackground(movie.id, null, true).catch(() => {});
      console.log(`   ⏭️  ${movie.title} sin URL, se marca como procesado`);
      return;
    }

    console.log(`🎬 Scraping fondo para: ${movie.url}`);

    // Reutiliza el scraper que ya extrae backgroundMovieImg de la film page.
    const data = await LetterboxdScraperService.scrapeMovieData(movie.url);
    const background = data.backgroundMovieImg;

    if (!background) {
      // No encontró fondo en Letterboxd. Se marca como scraped para que el
      // endpoint deje de devolverla (no reintentar en cada corrida).
      console.log(
        `   ⏭️  Sin fondo en Letterboxd para "${movie.title}". Se marca como procesado.`,
      );
      const ok = await this.saveBackground(movie.id, null, true);
      if (!ok) console.log(`   ❌ No se pudo marcar ${movie.title}`);
      return;
    }

    const ok = await this.saveBackground(movie.id, background, true);
    if (ok) {
      console.log(`   ✅ ${movie.title} → fondo actualizado`);
    } else {
      console.log(`   ❌ ${movie.title} → error al persistir`);
    }
  }

  private async saveBackground(
    movieId: string,
    backgroundMovieImg: string | null,
    markScraped = true,
  ): Promise<boolean> {
    try {
      const response = await axios.post<{ success: boolean }>(
        `${this.config.baseUrl}/api/movies/backgrounds`,
        { movieId, backgroundMovieImg, markScraped },
        { headers: this.config.headers },
      );
      return response.data.success === true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`   ❌ Error guardando fondo: ${message}`);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

async function main(): Promise<void> {
  const orchestrator = new BackgroundScrapingOrchestrator();
  await orchestrator.execute();
}

if (require.main === module) {
  main();
}
