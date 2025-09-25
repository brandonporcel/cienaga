import axios from "axios";
import * as cheerio from "cheerio";

import CinemaClass from "@/types/class/cinema.class";

export interface ScrapedScreening {
  title: string;
  director?: string;
  datetime: Date;
  cinemaName: string;
  originalUrl: string;
  eventType?: string;
  description?: string;
  room?: string;
  thumbnailUrl?: string;
}

export abstract class BaseCinemaScraper {
  protected cinema = new CinemaClass();

  constructor(cinema: CinemaClass) {
    this.cinema = cinema;
  }

  get cinemaId(): number {
    return this.cinema.id;
  }
  get cinemaName(): string {
    return this.cinema.name;
  }
  get baseUrl(): string {
    return this.cinema.url;
  }
  get appUrl(): string {
    return process.env.APP_URL || "http://localhost:3000";
  }

  // Cada cine implementa su lógica específica
  abstract scrapeScreenings(): Promise<ScrapedScreening[]>;

  // Método común para hacer requests
  protected async fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      });

      return cheerio.load(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error}`);
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Método común para limpiar títulos
  protected cleanTitle(title: string): string {
    return title
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'");
  }

  // Método común para parsear fechas argentinas
  protected parseArgentineDate(dateStr: string): Date | null {
    try {
      // Manejar formatos como "14/1/2025", "Lunes 14 de Enero", etc.
      // Implementar lógica específica según los formatos que encuentres
      return new Date(dateStr);
    } catch {
      return null;
    }
  }

  // Método común para encontrar película existente
  protected async findExistingMovie(
    title: string,
    year?: number,
  ): Promise<string | null> {
    // Llamar a tu API para buscar si la película ya existe
    try {
      const response = await axios.get(
        `${process.env.APP_URL}/api/movies/search`,
        {
          params: { title, year },
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET_KEY}` },
        },
      );

      return response.data.movieId || null;
    } catch {
      return null;
    }
  }

  // Método para ejecutar todo el proceso
  async execute(): Promise<{
    success: boolean;
    count: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      console.log(`🎬 Starting scraper for ${this.cinemaName}...`);

      const screenings = await this.scrapeScreenings();
      console.log(
        `📋 Found ${screenings.length} screenings at ${this.cinemaName}`,
      );

      if (screenings.length === 0) {
        return { success: true, count: 0, errors: [] };
      }

      // Enviar a tu API para guardar
      const response = await axios.post(
        `${this.appUrl}/api/screenings/batch`,
        {
          screenings,
          cinemaId: this.cinemaId,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET_KEY}`,
          },
        },
      );

      console.log(
        `✅ ${this.cinemaName}: Saved ${response.data.successful} screenings`,
      );

      return {
        success: true,
        count: response.data.successful,
        errors:
          response.data.failed > 0
            ? [`${response.data.failed} failed to save`]
            : [],
      };
    } catch (error) {
      const errorMsg = `${this.cinemaName} scraper failed: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);

      return { success: false, count: 0, errors };
    }
  }
}
