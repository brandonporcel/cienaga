import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { execSync } from "child_process";

import { validateEnvironmentVariables } from "./utils/validation.util";
import { parseListNote } from "./services/list/list-note-parser";

interface ListEntry {
  filmSlug: string;
  filmTitle: string;
  filmYear: number;
  directorName?: string;
  directorUrl?: string;
  posterUrl?: string;
  cinemaName: string;
  cinemaAddress?: string;
  screeningTimeText: string;
  screeningDatetime: string;
  description?: string;
  originalUrl: string;
}

interface FilmInfo {
  director?: string;
  directorUrl?: string;
  posterUrl?: string;
}

interface ParsedFilmName {
  title: string;
  year: number;
}

class ListScrapingOrchestrator {
  private apiBaseUrl: string;
  private secretKey: string;
  private baseUrl = "https://letterboxd.com";
  private listSlug = "lamateroric/list/funciones-en-buenos-aires";
  private userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

  constructor() {
    const { baseUrl, secretKey } = validateEnvironmentVariables();
    this.apiBaseUrl = baseUrl;
    this.secretKey = secretKey;
  }

  async execute(): Promise<void> {
    console.log("🎬 Starting Letterboxd list scraping...");

    try {
      const totalPages = await this.getTotalPages();
      console.log(`📋 Found ${totalPages} pages to process`);

      const allEntries: ListEntry[] = [];

      for (let page = 1; page <= totalPages; page++) {
        console.log(`\n📄 Processing page ${page}/${totalPages}...`);
        const entries = await this.scrapePage(page);
        allEntries.push(...entries);
        console.log(`   Found ${entries.length} valid entries on page ${page}`);

        if (page < totalPages) {
          await this.delay(2000);
        }
      }

      console.log(`\n📊 Total entries collected: ${allEntries.length}`);

      if (allEntries.length === 0) {
        console.log("✅ No valid entries found");
        return;
      }

      const batchSize = 20;
      let totalCreated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      for (let i = 0; i < allEntries.length; i += batchSize) {
        const batch = allEntries.slice(i, i + batchSize);
        console.log(
          `\n📤 Sending batch ${Math.floor(i / batchSize) + 1} (${batch.length} entries)...`,
        );

        try {
          const result = await this.sendBatch(batch);
          totalCreated += result.created;
          totalSkipped += result.skipped;
          totalErrors += result.errors.length;
        } catch (error) {
          console.error(`❌ Batch failed: ${error}`);
          totalErrors += batch.length;
        }

        if (i + batchSize < allEntries.length) {
          await this.delay(1000);
        }
      }

      console.log("\n📊 Scraping completed:");
      console.log(`   ✅ Created: ${totalCreated}`);
      console.log(`   ⏭️  Skipped: ${totalSkipped}`);
      console.log(`   ❌ Errors: ${totalErrors}`);
    } catch (error) {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    }
  }

  private async getTotalPages(): Promise<number> {
    const $ = await this.fetchPage(`${this.baseUrl}/${this.listSlug}/detail/`);
    const pages = $(".pagination li.paginate-page").length;
    return pages > 0 ? pages : 1;
  }

  private async scrapePage(page: number): Promise<ListEntry[]> {
    const pageUrl =
      page === 1
        ? `${this.baseUrl}/${this.listSlug}/detail/`
        : `${this.baseUrl}/${this.listSlug}/detail/page/${page}/`;

    const $ = await this.fetchPage(pageUrl);
    const entries: ListEntry[] = [];

    $("div.listitem.js-listitem").each((_, element) => {
      try {
        const $entry = $(element);
        const $poster = $entry.find(
          'div.react-component[data-component-class="LazyPoster"]',
        );

        const filmSlug = $poster.attr("data-item-slug");
        const filmNameRaw = $poster.attr("data-item-name") || "";


        if (!filmSlug || !filmNameRaw) return;

        const film = this.parseFilmName(filmNameRaw);
        if (!film) return;

        const noteHtml = $entry
          .find("div.body-text.-prose.-reset.notes.js-collapsible-text")
          .html();

        if (!noteHtml) return;

        const parsedNotes = parseListNote(noteHtml);
        const originalUrl = `${this.baseUrl}/film/${filmSlug}/`;

        for (const note of parsedNotes) {
          if (!note.cinemaName || !note.schedule) continue;

          entries.push({
            filmSlug,
            filmTitle: film.title,
            filmYear: film.year,
            cinemaName: note.cinemaName,
            cinemaAddress: note.cinemaAddress,
            screeningTimeText: note.fullTimeText,
            screeningDatetime: note.schedule.datetime,
            description: note.description,
            originalUrl,
          });
        }
      } catch (error) {
        console.error(`❌ Error processing entry: ${error}`);
      }
    });

    // Deduplicar por filmSlug para no scrapear la misma peli dos veces
    const resolvedSlugs = new Map<string, FilmInfo>();

    for (const entry of entries) {
      const needPoster = !entry.posterUrl;
      const needDirector = !entry.directorName;
      const alreadyResolved = resolvedSlugs.has(entry.filmSlug);

      if (alreadyResolved) {
        // Reusar info ya resuelta
        const cached = resolvedSlugs.get(entry.filmSlug)!;
        if (!entry.directorName && cached.director) entry.directorName = cached.director;
        if (!entry.directorUrl && cached.directorUrl) entry.directorUrl = cached.directorUrl;
        if (!entry.posterUrl && cached.posterUrl) entry.posterUrl = cached.posterUrl;
        continue;
      }

      if (needDirector || needPoster) {
        try {
          const filmInfo = await this.resolveDirector(
            entry.filmSlug,
            entry.filmTitle,
            entry.filmYear,
            needPoster,
          );
          resolvedSlugs.set(entry.filmSlug, filmInfo);

          if (!entry.directorName && filmInfo.director) {
            entry.directorName = filmInfo.director;
          }
          if (!entry.directorUrl && filmInfo.directorUrl) {
            entry.directorUrl = filmInfo.directorUrl;
          }
          if (!entry.posterUrl && filmInfo.posterUrl) {
            entry.posterUrl = filmInfo.posterUrl;
          }
          await this.delay(2000);
        } catch (error) {
          console.error(
            `   ⚠️  Could not resolve info for ${entry.filmTitle}: ${error}`,
          );
          resolvedSlugs.set(entry.filmSlug, {});
        }
      }
    }

    return entries;
  }

  private parseFilmName(raw: string): ParsedFilmName | null {
    const match = raw.match(/^(.+?)\s*\((\d{4})\)$/);
    if (!match) return null;
    return { title: match[1].trim(), year: parseInt(match[2]) };
  }

  private async resolveDirector(
    filmSlug: string,
    title: string,
    year: number,
    needPoster: boolean,
  ): Promise<FilmInfo> {
    // Si no necesitamos poster, intentar resolver导演 de la DB
    if (!needPoster) {
      try {
        const response = await axios.get(
          `${this.apiBaseUrl}/api/movies/search`,
          {
            params: { title, year },
            headers: { Authorization: `Bearer ${this.secretKey}` },
          },
        );

        if (response.data.directorId || response.data.director) {
          return { director: response.data.directorName || undefined };
        }
      } catch {
        // Movie not found in DB, fall through to scraping
      }
    }

    // Scrapear film page para director + poster
    const filmUrl = `${this.baseUrl}/film/${filmSlug}/`;
    const $ = await this.fetchPage(filmUrl);

    let director: string | null = null;
    let directorUrl: string | null = null;

    // Intentar extraer director + URL del link
    const $directorLink = $('a[href*="/director/"]').first();
    if ($directorLink.length) {
      director = $directorLink.text().trim() || null;
      const href = $directorLink.attr("href");
      if (href) {
        directorUrl = href.startsWith("http")
          ? href
          : `${this.baseUrl}${href}`;
      }
    }

    if (!director) {
      director = $('meta[name="twitter:data1"]').attr("content") || null;
    }

    if (!director) {
      const jsonLdScript = $('script[type="application/ld+json"]').first().text();
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

    // Extraer poster del OG image
    const posterUrl =
      $('meta[property="og:image"]').attr("content") || undefined;

    return { director: director?.trim() || undefined, directorUrl: directorUrl || undefined, posterUrl };
  }

  private async sendBatch(
    entries: ListEntry[],
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.apiBaseUrl}/api/list/batch`,
        { entries },
        {
        headers: { Authorization: `Bearer ${this.secretKey}` },
        timeout: 60000,
        },
      );

      const data = response.data;
      console.log(
        `   ✅ Processed: ${data.processed}, Created: ${data.created}, Skipped: ${data.skipped}`,
      );

      if (data.errors?.length > 0) {
        console.log(`   ❌ Errors: ${data.errors.length}`);
        data.errors.forEach((e: string) => console.log(`      - ${e}`));
      }

      return {
        created: data.created || 0,
        skipped: data.skipped || 0,
        errors: data.errors || [],
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error(`   ❌ Batch ${error.response.status}:`, JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  private async fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), 15000);
      });

      const scrapePromise = axios.get(url, {
        headers: { "User-Agent": this.userAgent },
        timeout: 10000,
      });

      const response: AxiosResponse = await Promise.race([
        scrapePromise,
        timeoutPromise,
      ]);
      return cheerio.load(response.data);
    } catch {
      // Siempre intentar curl como fallback
      return this.fetchPageWithCurl(url);
    }
  }

  private fetchPageWithCurl(url: string): cheerio.CheerioAPI {
    try {
      const html = execSync(
        `curl -s -L --max-time 15 -H "User-Agent: ${this.userAgent}" "${url}"`,
        { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
      );
      return cheerio.load(html);
    } catch (error) {
      throw new Error(`curl fallback failed for ${url}: ${error}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

async function main(): Promise<void> {
  const orchestrator = new ListScrapingOrchestrator();
  await orchestrator.execute();
}

if (require.main === module) {
  main();
}
