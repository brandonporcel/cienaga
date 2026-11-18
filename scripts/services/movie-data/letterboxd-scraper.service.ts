import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";

import { ScrapedMovieData } from "../../types/movie.types";
import { cleanDirectorName, parseYear } from "../../utils/validation.util";

interface FirecrawlResponse {
  html: string;
  finalUrl?: string;
  metadata: Record<string, unknown>;
}

interface FetchResult {
  html: string;
  finalUrl?: string;
}

export class LetterboxdScraperService {
  private static readonly USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  private static readonly TIMEOUT = 7000;
  private static readonly FIRECRAWL_TIMEOUT = 45000;

  /**
   * Scrapea la film page de Letterboxd.
   *
   * Intenta primero el fetch directo (funciona desde IPs residenciales).
   * GitHub Actions corre desde IPs de datacenter que Cloudflare bloquea, así
   * que si el fetch directo no devuelve director, reintenta vía Firecrawl
   * (que atraviesa el challenge). Se pide `rawHtml` para conservar el
   * JSON-LD y los meta tags originales; además se usa la metadata de la API
   * como respaldo.
   */
  static async scrapeMovieData(url: string): Promise<ScrapedMovieData> {
    console.log(`🎬 Scraping: ${url}`);

    const direct = await this.fetchDirect(url);
    let data = direct
      ? this.parseHtml(direct.html, direct.finalUrl)
      : this.emptyData();

    if (data.director) {
      this.logResult(url, data);
      return data;
    }

    const firecrawl = await this.fetchByFirecrawl(url);
    if (!firecrawl) {
      this.logResult(url, data);
      return data;
    }

    console.log(`🔥 Firecrawl fallback: ${url}`);
    const fallback = this.parseHtml(
      firecrawl.html,
      firecrawl.finalUrl,
      firecrawl.metadata,
    );

    data = this.mergeData(data, fallback);
    this.logResult(url, data);

    return data;
  }

  private static emptyData(): ScrapedMovieData {
    return {
      director: null,
      directorUrl: null,
      posterUrl: null,
      year: null,
    };
  }

  /**
   * Combina los datos del fetch directo con los del fallback. El fallback
   * tiene prioridad porque fue el que encontró el director, pero conservamos
   * poster/background del directo si Firecrawl no los pudo extraer.
   */
  private static mergeData(
    direct: ScrapedMovieData,
    fallback: ScrapedMovieData,
  ): ScrapedMovieData {
    return {
      ...fallback,
      director: fallback.director ?? direct.director,
      directorSlug: fallback.directorSlug ?? direct.directorSlug,
      directorUrl: fallback.directorUrl ?? direct.directorUrl,
      posterUrl: fallback.posterUrl ?? direct.posterUrl,
      backgroundMovieImg:
        fallback.backgroundMovieImg ?? direct.backgroundMovieImg,
      movieDuration: fallback.movieDuration ?? direct.movieDuration,
      movieRating: fallback.movieRating ?? direct.movieRating,
      year: fallback.year ?? direct.year,
      movieNationalName: fallback.movieNationalName ?? direct.movieNationalName,
      movieSlug: fallback.movieSlug ?? direct.movieSlug,
      watches: fallback.watches ?? direct.watches,
    };
  }

  private static logResult(url: string, data: ScrapedMovieData): void {
    console.log(
      `✅ Extracted - Director: ${data.director || "NOT FOUND"}, Year: ${data.year || "NOT FOUND"}, Poster: ${data.posterUrl ? "FOUND" : "NOT FOUND"}`,
    );
    if (!data.director) console.warn(`⚠️  Sin director para ${url}`);
  }

  private static async fetchDirect(url: string): Promise<FetchResult | null> {
    try {
      const response: AxiosResponse = await axios.get(url, {
        headers: { "User-Agent": this.USER_AGENT },
        timeout: this.TIMEOUT,
        maxRedirects: 5,
      });

      if (typeof response.data !== "string") return null;

      return {
        html: response.data,
        finalUrl: response.request?.res?.responseUrl,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Error scraping ${url}: ${errorMessage}`);
      return null;
    }
  }

  private static async fetchByFirecrawl(
    url: string,
  ): Promise<FirecrawlResponse | null> {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await axios.post(
        "https://api.firecrawl.dev/v2/scrape",
        { url, formats: ["rawHtml"] },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: this.FIRECRAWL_TIMEOUT,
        },
      );

      const data = response.data?.data;
      // rawHtml conserva JSON-LD y meta tags (el formato "html" los limpia).
      const html =
        typeof data?.rawHtml === "string" ? data.rawHtml : data?.html;
      if (typeof html !== "string") return null;

      const metadata = (data?.metadata as Record<string, unknown>) ?? {};
      const finalUrl =
        typeof metadata.url === "string"
          ? metadata.url
          : typeof metadata.ogUrl === "string"
            ? metadata.ogUrl
            : undefined;

      return { html, finalUrl, metadata };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Firecrawl fallback error for ${url}: ${errorMessage}`);
      return null;
    }
  }

  private static parseHtml(
    html: string,
    finalUrl?: string,
    metadata: Record<string, unknown> = {},
  ): ScrapedMovieData {
    const $ = cheerio.load(html);

    return {
      movieSlug: this.extractMovieSlug($, finalUrl, metadata),
      directorSlug: this.extractDirectorSlug($),
      director: this.extractDirector($, metadata),
      directorUrl: this.extractDirectorUrl($),
      posterUrl: this.extractPosterUrl($, metadata),
      backgroundMovieImg: this.extractBackgroundMovieImg($, metadata),
      movieDuration: this.extractMovieDuration($),
      movieRating: this.extractMovieRating($, metadata),
      year: this.extractYear($, metadata),
      movieNationalName: this.extractMovieNationalName($),
      watches: this.extractWatches($),
    };
  }

  private static extractDirector(
    $: cheerio.CheerioAPI,
    metadata: Record<string, unknown> = {},
  ): string | null {
    // Método 1: Meta tag Twitter (más confiable)
    let director = $('meta[name="twitter:data1"]').attr("content") || null;

    // Método 2: metadata de Firecrawl (el HTML que devuelve no siempre
    // conserva los meta tags de Twitter)
    if (!director && typeof metadata["twitter:data1"] === "string") {
      director = metadata["twitter:data1"];
    }

    // Método 3: Link del director en el HTML
    if (!director) {
      director = $('a[href*="/director/"]').first().text().trim() || null;
    }

    // Método 4: JSON-LD structured data
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
        } catch {
          // Ignore JSON parse errors
        }
      }
    }

    // Método 5: texto tipo "Solanin (2010) directed by Takahiro Miki • ..."
    if (!director) {
      const title =
        (typeof metadata.title === "string" && metadata.title) ||
        (typeof metadata.ogTitle === "string" && metadata.ogTitle) ||
        $("title").text();
      const match = title.match(/directed by\s+([^•|]+)/i);
      if (match) director = match[1].trim();
    }

    return cleanDirectorName(director);
  }

  private static extractDirectorUrl($: cheerio.CheerioAPI): string | null {
    const directorLink = $('a[href*="/director/"]').first();
    if (directorLink.length) {
      const href = directorLink.attr("href");
      if (href) {
        // Firecrawl devuelve hrefs absolutos; el fetch directo, relativos.
        return href.startsWith("http") ? href : `https://letterboxd.com${href}`;
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

  private static extractMovieSlug(
    $: cheerio.CheerioAPI,
    finalUrl?: string,
    metadata: Record<string, unknown> = {},
  ): string | null {
    // La URL final es la fuente más confiable (boxd.it redirige a /film/slug/)
    const candidates = [
      finalUrl,
      typeof metadata.url === "string" ? metadata.url : undefined,
      typeof metadata.ogUrl === "string" ? metadata.ogUrl : undefined,
    ];

    for (const candidate of candidates) {
      const match = candidate?.match(/\/film\/([^/?#]+)/);
      if (match) return match[1];
    }

    // Fallback: link del HTML. Es menos confiable porque puede apuntar a
    // otra película (recomendadas), pero cubre casos sin URL final.
    const movieLink = $('a[href*="/film/"]').first();
    if (movieLink.length) {
      const relativeUrl = movieLink.attr("href");
      if (relativeUrl)
        return relativeUrl.split("/")[relativeUrl.split("/").length - 2];
    }
    return null;
  }

  private static extractPosterUrl(
    $: cheerio.CheerioAPI,
    metadata: Record<string, unknown> = {},
  ): string | null {
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
      } catch {
        // Continuar con método 2
      }
    }

    // Método 2: buscar el poster en el HTML. Firecrawl no devuelve JSON-LD,
    // así que este camino es imprescindible para el fallback.
    const html = $.html();
    const posters =
      html.match(
        /https:\/\/[a-z0-9.]*ltrbxd\.com\/resized\/film-poster\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi,
      ) ?? [];

    if (posters.length === 0) return null;

    // Si la metadata identifica la película (uid: "film:19677"), preferir
    // el poster cuyo path contiene ese id para no agarrar el de una
    // recomendación.
    const filmId = this.extractLetterboxdFilmId(metadata);
    const candidates = filmId
      ? posters.filter((url) => url.includes(`/${filmId}-`))
      : posters;
    const pool = candidates.length > 0 ? candidates : posters;

    const withDimensions = pool
      .map((url) => {
        const match = url.match(/-(\d+)-(\d+)-(\d+)-(\d+)-crop/);
        if (!match) return null;
        const w = parseInt(match[3], 10);
        const h = parseInt(match[4], 10);
        // Descartar imágenes landscape: no son posters.
        if (w >= h) return null;
        return { url, area: w * h };
      })
      .filter((x): x is { url: string; area: number } => x !== null)
      .sort((a, b) => b.area - a.area);

    return withDimensions[0]?.url ?? pool[0] ?? null;
  }

  private static extractLetterboxdFilmId(
    metadata: Record<string, unknown>,
  ): string | null {
    const identifier = metadata["production:identifier"];
    if (typeof identifier !== "string") return null;

    try {
      const parsed = JSON.parse(identifier);
      const uid: unknown = parsed?.uid;
      if (typeof uid !== "string") return null;
      const match = uid.match(/film:(\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  private static extractMovieRating(
    $: cheerio.CheerioAPI,
    metadata: Record<string, unknown> = {},
  ): number | null {
    // Método 0: metadata de Firecrawl ("twitter:data2": "3.94 out of 5")
    if (typeof metadata["twitter:data2"] === "string") {
      const match = (metadata["twitter:data2"] as string).match(
        /(\d+(?:\.\d+)?)/,
      );
      if (match) return parseFloat(match[1]);
    }

    // Método 1: JSON-LD
    const jsonLdScript = $('script[type="application/ld+json"]').first().text();
    // elimina cualquier bloque /* ... */
    const cleanJson = jsonLdScript.replace(/\/\*.*?\*\//gs, "").trim();

    if (cleanJson) {
      try {
        const data = JSON.parse(cleanJson);
        if (data.aggregateRating) {
          return data.aggregateRating.ratingValue;
        }
      } catch {
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
    metadata: Record<string, unknown> = {},
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

    if (images.length === 0) {
      // Firecrawl expone og:image en metadata aunque no esté en el HTML.
      const ogImage = metadata["og:image"];
      return typeof ogImage === "string" ? ogImage : null;
    }

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

  private static extractYear(
    $: cheerio.CheerioAPI,
    metadata: Record<string, unknown> = {},
  ): number | null {
    // Método 0: metadata de Firecrawl ("production:name-and-year")
    const metaYear =
      (typeof metadata["production:name-and-year"] === "string" &&
        metadata["production:name-and-year"]) ||
      (typeof metadata.title === "string" && metadata.title) ||
      "";

    if (metaYear) {
      const match = metaYear.match(/\((\d{4})\)/);
      if (match) return parseYear(match[1]);
    }

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
      } catch {
        // Ignore
      }
    }

    return null;
  }

  /**
   * "Watched by 10,600 members" ya viene en la film page. Extraerlo acá evita
   * una segunda llamada a Firecrawl al CSI endpoint por cada película.
   */
  private static extractWatches($: cheerio.CheerioAPI): number | null {
    const ariaLabel = $(".production-statistic.-watches")
      .first()
      .attr("aria-label");
    const text = ariaLabel ?? $("body").text();
    const match = text.match(/Watched by\s*([\d.,]+)/i);
    if (!match) return null;

    const value = parseInt(match[1].replace(/[.,]/g, ""), 10);
    return Number.isNaN(value) ? null : value;
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
