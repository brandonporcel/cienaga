import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";

import { validateEnvironmentVariables } from "./utils/validation.util";

interface BasicMovie {
  title: string;
  slug: string;
  url: string;
  year: number;
}

interface ScrapedDirectorData {
  avatarUrl: string | null;
  bio: string | null;
  basicMovies: BasicMovie[];
  TMDBId: number | null;
}

interface PendingDirector {
  id: string;
  name: string;
  url: string;
}

interface UpdateDirectorPayload {
  directorId: string;
  avatarUrl: string | null;
  bio: string | null;
  basicMovies: BasicMovie[];
  TMDBId: number | null;
}

class DirectorScrapingOrchestrator {
  private apiBaseUrl: string;
  private secretKey: string;

  constructor() {
    const { baseUrl, secretKey } = validateEnvironmentVariables();
    this.apiBaseUrl = baseUrl;
    this.secretKey = secretKey;
  }

  async execute(): Promise<void> {
    console.log("🎬 Starting director profile scraping...");

    try {
      // 1. Obtener directores pendientes
      const pendingDirectors = await this.getPendingDirectors();
      console.log(`📋 Found ${pendingDirectors.length} directors to process`);

      if (pendingDirectors.length === 0) {
        console.log("✅ No pending directors to process");
        return;
      }

      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[],
      };

      // 2. Procesar cada director
      for (const director of pendingDirectors) {
        try {
          console.log(`\n🔍 Processing: ${director.name}`);

          if (!director.url) {
            console.warn(`⚠️  No URL for director: ${director.name}`);
            results.failed++;
            continue;
          }

          const directorData = await this.scrapeDirectorProfile(director.url);
          await this.updateDirector(director.id, directorData);

          results.successful++;
          console.log(`✅ Updated ${director.name}`);

          // Rate limiting
          await this.delay(2000);
        } catch (error) {
          results.failed++;
          const errorMsg = `Failed to process ${director.name}: ${error}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }

      // 3. Resumen final
      console.log("\n📊 Scraping completed:");
      console.log(`   ✅ Successful: ${results.successful}`);
      console.log(`   ❌ Failed: ${results.failed}`);

      if (results.errors.length > 0) {
        console.log("\n❌ Errors:");
        results.errors.forEach((error) => console.log(`   - ${error}`));
      }
    } catch (error) {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    }
  }

  private async getPendingDirectors(): Promise<PendingDirector[]> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/api/directors/pending`,
        { headers: { Authorization: `Bearer ${this.secretKey}` } },
      );

      return response.data.directors || [];
    } catch (error) {
      console.error("Error fetching pending directors:", error);
      throw new Error("Failed to fetch pending directors from API");
    }
  }

  private async scrapeDirectorProfile(
    url: string,
  ): Promise<ScrapedDirectorData> {
    console.log(`   🌐 Fetching: ${url}`);

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), 10000);
      });

      const scrapePromise = axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const response: AxiosResponse = await Promise.race([
        scrapePromise,
        timeoutPromise,
      ]);
      const $ = cheerio.load(response.data);

      const data: ScrapedDirectorData = {
        avatarUrl: this.extractAvatarUrl($),
        bio: this.extractBio($),
        basicMovies: this.extractBasicMovies($),
        TMDBId: this.extractTMDBId($),
      };

      console.log(
        `   📊 Extracted: ${data.basicMovies.length} movies, bio: ${data.bio ? "yes" : "no"}, avatar: ${data.avatarUrl ? "yes" : "no"}`,
      );

      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to scrape ${url}: ${errorMsg}`);
    }
  }

  private async updateDirector(
    directorId: string,
    directorData: ScrapedDirectorData,
  ): Promise<void> {
    try {
      const payload: UpdateDirectorPayload = {
        directorId,
        ...directorData,
      };

      await axios.post(
        `${this.apiBaseUrl}/api/directors/batch-update`,
        payload,
        { headers: { Authorization: `Bearer ${this.secretKey}` } },
      );
    } catch (error) {
      console.error("Error updating director:", error);
      throw new Error("Failed to update director in database");
    }
  }

  private extractAvatarUrl($: cheerio.CheerioAPI): string | null {
    const avatarImg = $(".avatar.person-image img").first();
    const avatarUrl = avatarImg.attr("data-image");

    if (avatarUrl && avatarUrl.startsWith("http")) {
      return avatarUrl;
    }

    return null;
  }

  private extractBio($: cheerio.CheerioAPI): string | null {
    const bioElement = $(".section.panel-text.js-tmdb-bio").first();
    const bio = bioElement.find("p").text().trim();

    return bio || null;
  }

  private extractBasicMovies($: cheerio.CheerioAPI): BasicMovie[] {
    const movies: BasicMovie[] = [];
    const movies$ = $("ul.grid.-grid.-p125.-constrained li.griditem");

    movies$.each((_, element) => {
      const $item = $(element);
      const moreInfo$ = $item.find(".react-component");
      const lid$ = moreInfo$.attr("data-postered-identifier");

      const titleWithYear = $item.attr("title") || "";
      const slug = moreInfo$.attr("data-item-slug");
      const lid = lid$ ? JSON.parse(lid$).lid : null;

      const titleMatch = titleWithYear.match(/^(.+?)\s*\((\d{4})\)$/);

      if (titleMatch && lid && slug) {
        const [, title, yearStr] = titleMatch;
        const year = parseInt(yearStr);

        movies.push({
          title: title.trim(),
          url: `https://boxd.it/${lid}`,
          slug,
          year,
        });
      }
    });

    return movies;
  }

  private extractTMDBId($: cheerio.CheerioAPI): number | null {
    // Buscar TMDB ID en data attributes o enlaces
    const tmdbLink = $('a[href*="themoviedb.org"]').first().attr("href");

    if (tmdbLink) {
      const match = tmdbLink.match(/person\/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Execute only if called directly
async function main(): Promise<void> {
  const orchestrator = new DirectorScrapingOrchestrator();
  await orchestrator.execute();
}

if (require.main === module) {
  main();
}
