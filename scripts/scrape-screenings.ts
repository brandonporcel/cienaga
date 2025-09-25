import axios from "axios";

import Cinema from "@/types/cinema";
import CinemaClass from "@/types/class/cinema.class";
import { CinemaSlug } from "@/lib/enums/cinema.enum";

import { ScraperFactory } from "./services/screenings/scraper.factory";

class ScreeningScrapingOrchestrator {
  async getEnabledCinemas(): Promise<Cinema[]> {
    const url = `${process.env.APP_URL || "http://localhost:3000"}/api/cinemas?enabled=true`;
    const { data: cinemas } = await axios.get(url);
    return cinemas;
  }

  async execute(): Promise<void> {
    console.log("🎬 Starting cinema screenings scraping...");
    const enabledCinemas = await this.getEnabledCinemas();

    if (enabledCinemas.length === 0) {
      console.log("No enabled cinemas found");
      return;
    }

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Procesar cada cine secuencialmente (para no sobrecargar)
    for (const cinema of enabledCinemas) {
      try {
        const scraper = ScraperFactory.createScraper(
          cinema.slug as CinemaSlug,
          cinema as CinemaClass,
        );

        if (!scraper) {
          results.failed += 1;
          results.errors.push(`No scraper available for ${cinema.name}`);
          continue;
        }

        const result = await scraper.execute();

        results.total += 1;
        if (result.success) {
          results.successful += 1;
          console.log(
            `✅ ${scraper.constructor.name}: ${result.count} screenings`,
          );
        } else {
          results.failed += 1;
          results.errors.push(...result.errors);
        }
      } catch (error) {
        results.failed += 1;
        results.errors.push(`Fatal error in ${cinema.name}: ${error}`);
      }
    }

    // Resumen final
    console.log(`📊 Scraping completed:`);
    console.log(`   - Total cinemas: ${results.total}`);
    console.log(`   - Successful: ${results.successful}`);
    console.log(`   - Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log(`❌ Errors:`);
      results.errors.forEach((error) => console.log(`   - ${error}`));
    }

    if (results.failed > results.successful) {
      console.error("💥 More failures than successes, check your scrapers!");
      process.exit(1);
    }
  }
}

// Ejecutar solo si es llamado directamente
async function main(): Promise<void> {
  const orchestrator = new ScreeningScrapingOrchestrator();
  await orchestrator.execute();
}

if (require.main === module) {
  main();
}
