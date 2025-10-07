import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";

import { ScrapedMovieData } from "../../types/movie.types";
import { cleanDirectorName, parseYear } from "../../utils/validation.util";

export class LetterboxdScraperService {
  private static readonly USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  private static readonly TIMEOUT = 7000;
  private static readonly SCRAPE_TIMEOUT = 8000;

  static async scrapeMovieData(url: string): Promise<ScrapedMovieData> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Scraping timeout")),
        this.SCRAPE_TIMEOUT,
      );
    });

    try {
      console.log(`🎬 Scraping: ${url}`);

      const scrapePromise = axios.get(url, {
        headers: { "User-Agent": this.USER_AGENT },
        timeout: this.TIMEOUT,
      });

      const response: AxiosResponse = await Promise.race([
        scrapePromise,
        timeoutPromise,
      ]);
      const $ = cheerio.load(response.data);

      const data: ScrapedMovieData = {
        movieSlug: this.extractMovieSlug($),
        directorSlug: this.extractDirectorSlug($),
        director: this.extractDirector($),
        directorUrl: this.extractDirectorUrl($),
        posterUrl: this.extractPosterUrl($),
        backgroundMovieImg: this.extractBackgroundMovieImg($),
        movieRating: this.extractMovieRating($),
        year: this.extractYear($),
        movieNationalName: this.extractMovieNationalName($),
      };

      console.log(
        `✅ Extracted - Director: ${data.director || "NOT FOUND"}, Year: ${data.year || "NOT FOUND"}, Poster: ${data.posterUrl ? "FOUND" : "NOT FOUND"}`,
      );

      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Error scraping ${url}: ${errorMessage}`);

      return {
        director: null,
        directorUrl: null,
        posterUrl: null,
        year: null,
      };
    }
  }

  private static extractDirector($: cheerio.CheerioAPI): string | null {
    // Método 1: Meta tag Twitter (más confiable)
    let director = $('meta[name="twitter:data1"]').attr("content") || null;

    // Método 2: Link del director en el HTML
    if (!director) {
      director = $('a[href*="/director/"]').first().text().trim() || null;
    }

    // Método 3: JSON-LD structured data
    if (!director) {
      const jsonLdScript = $('script[type="application/ld+json"]')
        .first()
        .text();
      if (jsonLdScript) {
        try {
          const data = JSON.parse(jsonLdScript);
          if (data.director?.name) {
            director = data.director.name;
          } else if (Array.isArray(data.director) && data.director[0]?.name) {
            director = data.director[0].name;
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    }

    return cleanDirectorName(director);
  }

  private static extractDirectorUrl($: cheerio.CheerioAPI): string | null {
    const directorLink = $('a[href*="/director/"]').first();
    if (directorLink.length) {
      const relativeUrl = directorLink.attr("href");
      if (relativeUrl) {
        return `https://letterboxd.com${relativeUrl}`;
      }
    }
    return null;
  }

  private static extractDirectorSlug($: cheerio.CheerioAPI): string | null {
    const directorLink = $('a[href*="/director/"]').first();
    if (directorLink.length) {
      const relativeUrl = directorLink.attr("href");
      if (relativeUrl)
        return relativeUrl.split("/")[relativeUrl.split("/").length - 2];
    }
    return null;
  }

  private static extractMovieSlug($: cheerio.CheerioAPI): string | null {
    const movieLink = $('a[href*="/film/"]').first();
    if (movieLink.length) {
      const relativeUrl = movieLink.attr("href");
      if (relativeUrl)
        return relativeUrl.split("/")[relativeUrl.split("/").length - 2];
    }
    return null;
  }

  private static extractPosterUrl($: cheerio.CheerioAPI): string | null {
    // Método 1: JSON-LD (mejor calidad, poster oficial)
    const jsonLdScript = $('script[type="application/ld+json"]').first().text();
    // elimina cualquier bloque /* ... */
    const cleanJson = jsonLdScript.replace(/\/\*.*?\*\//gs, "").trim();

    if (cleanJson) {
      try {
        const data = JSON.parse(cleanJson);
        if (data.image) {
          return data.image;
        }
      } catch (e) {
        // Continuar con método 2
      }
    }

    return null;
  }

  private static extractMovieRating($: cheerio.CheerioAPI): number | null {
    // Método 1: JSON-LD (mejor calidad, poster oficial)
    const jsonLdScript = $('script[type="application/ld+json"]').first().text();
    // elimina cualquier bloque /* ... */
    const cleanJson = jsonLdScript.replace(/\/\*.*?\*\//gs, "").trim();

    if (cleanJson) {
      try {
        const data = JSON.parse(cleanJson);
        if (data.aggregateRating) {
          return data.aggregateRating.ratingValue;
        }
      } catch (e) {
        // Continuar con método 2
      }
    }

    return null;
  }

  private static extractBackgroundMovieImg(
    $: cheerio.CheerioAPI,
  ): string | null {
    return $('meta[property="og:image"]').attr("content") || null;
  }

  private static extractYear($: cheerio.CheerioAPI): number | null {
    // Método 1: Del título de la página
    const titleMatch = $("title")
      .text()
      .match(/\((\d{4})\)/);
    if (titleMatch) {
      return parseYear(titleMatch[1]);
    }

    // Método 2: Del link del año
    const yearLink = $('a[href*="/films/year/"]').first().text();
    const year = parseYear(yearLink);
    if (year) {
      return year;
    }

    // Método 3: JSON-LD
    const jsonLdScript = $('script[type="application/ld+json"]').first().text();
    if (jsonLdScript) {
      try {
        const data = JSON.parse(jsonLdScript);
        if (data.dateCreated) {
          return parseYear(data.dateCreated);
        }
      } catch (e) {
        // Ignore
      }
    }

    return null;
  }

  private static extractMovieNationalName(
    $: cheerio.CheerioAPI,
  ): string | null {
    const nationalNameLink = $(".originalname").first();
    if (nationalNameLink.length) {
      return nationalNameLink.text().trim();
    }
    return null;
  }
}
