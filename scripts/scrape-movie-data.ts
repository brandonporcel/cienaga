import { ApiService } from "./services/movie-data/api.director.service";
import { BatchProcessorService } from "./services/movie-data/batch-processor.service";
import { ExecutionTimer } from "./utils/delay.util";
import { validateEnvironmentVariables } from "./utils/validation.util";

// Configuration constants
const CONFIG = {
  BATCH_SIZE: 50,
  DELAY_BETWEEN_REQUESTS: 800,
  MAX_CONCURRENT: 5,
  MAX_EXECUTION_TIME: 8 * 60 * 1000, // 8 minutes
} as const;

class MovieDataScrapingOrchestrator {
  private apiService: ApiService;
  private timer: ExecutionTimer;

  constructor() {
    const { baseUrl, secretKey } = validateEnvironmentVariables();
    this.apiService = new ApiService(baseUrl, secretKey);
    this.timer = new ExecutionTimer(CONFIG.MAX_EXECUTION_TIME);
  }

  async execute(): Promise<void> {
    console.log("🚀 Starting TypeScript director scraping orchestrator...");
    console.log(
      `⏱️  Max execution time: ${CONFIG.MAX_EXECUTION_TIME / 60000} minutes`,
    );
    console.log(
      `📊 Config: batch=${CONFIG.BATCH_SIZE}, concurrent=${CONFIG.MAX_CONCURRENT}, delay=${CONFIG.DELAY_BETWEEN_REQUESTS}ms`,
    );

    try {
      let totalProcessed = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;

      // Loop until no more pending movies or timeout
      while (true) {
        // 1. Fetch movies to process
        const movies = await this.apiService.fetchPendingMovies(
          CONFIG.BATCH_SIZE,
        );

        if (movies.length === 0) {
          console.log("✅ No more movies to process.");
          break;
        }

        console.log(
          `📦 Processing batch: ${movies.length} movies (${totalProcessed} already done)`,
        );

        // 2. Process movies in batches
        const batchProcessor = new BatchProcessorService({
          maxConcurrent: CONFIG.MAX_CONCURRENT,
          delayBetweenRequests: CONFIG.DELAY_BETWEEN_REQUESTS,
          timer: this.timer,
        });

        const movieDirectors = await batchProcessor.processBatch(movies);

        console.log(
          `🎯 Scraped ${movieDirectors.length}/${movies.length} directors in ${this.timer.getElapsedSeconds()}s`,
        );

        // 3. Save results if any found
        if (movieDirectors.length > 0) {
          const saveResult = await this.apiService.saveDirectors(movieDirectors);

          totalProcessed += movies.length;
          totalSuccessful += saveResult.successful;
          totalFailed += saveResult.failed;

          console.log(`💾 Batch results: ${saveResult.successful} ok, ${saveResult.failed} failed`);

          // Show failure details if any
          this.logFailures(saveResult.results.filter((r) => !r.success));
        } else {
          totalProcessed += movies.length;
          console.log("ℹ️  No directors found in this batch");
        }

        // Check timeout before next batch
        if (!this.timer.shouldContinue()) {
          console.log(
            `⏱️  Time limit reached (${CONFIG.MAX_EXECUTION_TIME / 60000}min). Processed ${totalProcessed} movies. Re-run to continue.`,
          );
          break;
        }
      }

      // Final summary
      console.log(`\n📊 Total summary:`);
      console.log(`   🎬 Movies processed: ${totalProcessed}`);
      console.log(`   ✅ Directors saved: ${totalSuccessful}`);
      console.log(`   ❌ Failed: ${totalFailed}`);
      console.log(
        `⏱️  Total execution time: ${this.timer.getElapsedSeconds()}s`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("💥 Fatal error in scraping orchestrator:", errorMessage);

      // Exit with error code for GitHub Actions to detect failure
      process.exit(1);
    }
  }

  private logFailures(
    failures: Array<{ movieId: string; director: string; error?: string }>,
  ): void {
    if (failures.length === 0) return;

    console.log("❌ Failed operations:");
    failures.forEach((failure) => {
      console.log(
        `   - Movie ${failure.movieId} (${failure.director}): ${failure.error || "Unknown error"}`,
      );
    });
  }
}

// Execute only if called directly
async function main(): Promise<void> {
  const orchestrator = new MovieDataScrapingOrchestrator();
  await orchestrator.execute();
}

if (require.main === module) {
  main();
}
