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
        movieDuration: this.extractMovieDuration($),
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
        if (data.image && typeof data.image === "string") {
          // Safety net: descartar si el aspect ratio es landscape (>1.2 ancho/alto)
          // porque sería una imagen de fondo, no un poster
          // Formato URL: .../film-poster/{id}-{slug}-{x}-{w}-{y}-{h}-crop.jpg
          const dimMatch = data.image.match(/-\d+-(\d+)-\d+-(\d+)-crop/);
          if (dimMatch) {
            const w = parseInt(dimMatch[1]);
            const h = parseInt(dimMatch[2]);
            if (w > h * 1.2) return null;
          }
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

  private static extractMovieDuration($: cheerio.CheerioAPI): number | null {
    const $el = $("p.text-link.text-footer");
    const durationText = $el.text().trim();
    return LetterboxdScraperService.parseDuration(durationText);
  }

  /**
   * Parsea duraciones de Letterboxd en distintos formatos:
   *   "105 mins" → 105
   *   "1h 45m"   → 105
   *   "2 h 3 min" → 123
   *   "86"       → 86
   *   "PT12M" (ISO 8601 del JSON-LD) → 12
   *   "PT1H30M" → 90
   */
  private static parseDuration(text: string): number | null {
    if (!text) return null;

    // Formato ISO 8601: "PT1H45M", "PT12M", "PT2H"
    const isoMatch = text.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
    if (isoMatch && (isoMatch[1] || isoMatch[2])) {
      const hours = isoMatch[1] ? parseInt(isoMatch[1], 10) : 0;
      const minutes = isoMatch[2] ? parseInt(isoMatch[2], 10) : 0;
      const total = hours * 60 + minutes;
      return total > 0 ? total : null;
    }

    // Formato con horas: "1h 45m", "2 h 3 min", "1hr 30min"
    const hourMatch = text.match(/(\d+)\s*h/i);
    const minMatch = text.match(/(\d+)\s*m/i);

    if (hourMatch || minMatch) {
      const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
      const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
      const total = hours * 60 + minutes;
      return total > 0 ? total : null;
    }

    // Formato solo número: "105 mins", "86"
    const numMatch = text.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      return num > 0 ? num : null;
    }

    return null;
  }

  private static extractBackgroundMovieImg(
    $: cheerio.CheerioAPI,
  ): string | null {
    // El fondo de Letterboxd es la imagen landscape (backdrop) alojada en
    // /resized/sm/upload/... con sufijo -<W>-<H>-crop-000000. Ya NO se puede
    // usar meta[og:image]: Letterboxd dejó de emitirlo en las film pages
    // vigentes (2026).
    const html = $.html();

    // Todas las imágenes sm/upload presentes en la página (backdrops).
    const images =
      html.match(
        /https:\/\/[a-z0-9.]*ltrbxd\.com\/resized\/sm\/upload\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi,
      ) ?? [];

    if (images.length === 0) return null;

    // Elegir el backdrop landscape de mayor resolución. Formato de la URL:
    // ...-<W>-<W>-<H>-<H>-crop-000000.jpg (W = ancho, H = alto del recorte).
    // Ej: -1920-1920-1080-1080-crop-000000.jpg. Preferimos W grande (1920→1200→960).
    const crop = /-(\d+)-(\d+)-(\d+)-(\d+)-crop-000000\.(?:jpg|jpeg|png|webp)/;

    const landscape =
      images
        .map((url) => {
          const m = url.match(crop);
          return { url, w: m ? parseInt(m[1], 10) : 0 };
        })
        .filter((x) => x.w > 0 && x.w >= 1280) // solo backdrops de alta resolución
        .sort((a, b) => b.w - a.w)[0]?.url ??
      // Fallback: cualquier imagen crop landscape (W > H)
      images.find((u) => {
        const m = u.match(/-(\d+)-(\d+)-(\d+)-(\d+)-crop-000000/);
        return m && parseInt(m[1], 10) > parseInt(m[3], 10);
      }) ??
      null;

    return landscape;
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
