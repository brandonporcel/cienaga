// import { MalbaScraper } from './services/screenings/malba.scraper';
// import { GaumontScraper } from './services/screenings/gaumont.scraper';
// import { CosmosScraper } from './services/screenings/cosmos.scraper';
// import { SalaLugonesScraper } from './services/screenings/sala-lugones.scraper';

import { MalbaScraper } from "./services/screenings/malba.scraper";

class ScreeningScrapingOrchestrator {
  private scrapers = [
    new MalbaScraper(),
    // new GaumontScraper(),
    // new CosmosScraper(),
    // new SalaLugonesScraper(),
    // Agregar más scrapers aquí
  ];

  async execute(): Promise<void> {
    console.log("🎬 Starting cinema screenings scraping...");

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Procesar cada cine secuencialmente (para no sobrecargar)
    for (const scraper of this.scrapers) {
      try {
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

        // Delay entre scrapers para ser respetuosos
        await this.delay(2000);
      } catch (error) {
        results.failed += 1;
        const errorMsg = `Fatal error in ${scraper.constructor.name}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
