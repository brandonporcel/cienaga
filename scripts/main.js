// import axios from "axios";
// import * as cheerio from "cheerio";
const axios = require("axios");
const cheerio = require("cheerio");

const API_BASE_URL = "http://localhost:3000";
const CRON_SECRET = "secreto-de-cienaga";
const BATCH_SIZE = 2;
const DELAY_BETWEEN_REQUESTS = 800;
const MAX_CONCURRENT = 5;
const MAX_EXECUTION_TIME = 8 * 60 * 1000; // 8 minutos

const headers = {
  Authorization: `Bearer ${CRON_SECRET}`,
  "Content-Type": "application/json",
};

let startTime = Date.now();

function shouldContinue() {
  return Date.now() - startTime < MAX_EXECUTION_TIME;
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeDirectorFromLetterboxd(url) {
  try {
    console.log(`🎬 Scraping: ${url}`);

    const scrapePromise = axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 7000,
    });

    const response = await Promise.race([scrapePromise]);
    const $ = cheerio.load(response.data);

    let director = null;
    let directorUrl = null;
    let posterUrl = null;
    let year = null;

    // 1. Director desde meta tag (más confiable)
    director = $('meta[name="twitter:data1"]').attr("content") || null;

    // 2. Director URL desde el HTML body
    const directorLink = $('a[href*="/director/"]').first();
    if (directorLink.length) {
      const relativeUrl = directorLink.attr("href");
      if (relativeUrl) {
        directorUrl = `https://letterboxd.com${relativeUrl}`;
        // Si no encontramos el director en meta, lo sacamos del link
        if (!director) {
          director = directorLink.text().trim() || null;
        }
      }
    }

    // 3. Poster desde Open Graph
    posterUrl = $('meta[property="og:image"]').attr("content") || null;

    // 4. Año desde múltiples fuentes
    // Primero desde el título de la página
    const titleMatch = $("title")
      .text()
      .match(/\((\d{4})\)/);
    if (titleMatch) {
      year = parseInt(titleMatch[1]);
    }

    // Si no, desde el link del año
    if (!year) {
      const yearLink = $('a[href*="/films/year/"]').first().text();
      const yearNumber = parseInt(yearLink);
      if (!isNaN(yearNumber)) {
        year = yearNumber;
      }
    }

    // 5. JSON-LD como fallback
    if (!director || !year) {
      const jsonLdScript = $('script[type="application/ld+json"]')
        .first()
        .text();
      if (jsonLdScript) {
        try {
          const data = JSON.parse(jsonLdScript);

          if (!director && data.director?.name) {
            director = data.director.name;
          }

          if (!year && data.dateCreated) {
            const jsonYear = parseInt(data.dateCreated);
            if (!isNaN(jsonYear)) {
              year = jsonYear;
            }
          }
        } catch (e) {
          // Continuar sin JSON-LD
        }
      }
    }

    // Limpiar datos
    if (director) {
      director = director.trim().replace(/\s+/g, " ");
      if (director.length < 2 || director.length > 100) {
        director = null;
      }
    }

    console.log(
      `✅ Extracted - Director: ${director || "NOT FOUND"}, Year: ${year || "NOT FOUND"}, Poster: ${posterUrl ? "FOUND" : "NOT FOUND"}`,
    );

    return {
      director,
      directorUrl,
      posterUrl,
      year,
    };
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

async function processBatch(movies) {
  const results = [];

  for (let i = 0; i < movies.length; i++) {
    const promises = movies.map(async (movie) => {
      if (movie.url) {
        console.log("pre");
        const scrapedData = await scrapeDirectorFromLetterboxd(movie.url);
        console.log("aft");
        await delay(DELAY_BETWEEN_REQUESTS / MAX_CONCURRENT);

        if (scrapedData.director) {
          return {
            movieId: movie.id,
            director: scrapedData.director,
            directorUrl: scrapedData.directorUrl || undefined,
            posterUrl: scrapedData.posterUrl || undefined,
            year: scrapedData.year || undefined,
          };
        }
      }
      return null;
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults.filter((r) => r !== null));

    const foundInBatch = batchResults.filter((r) => r !== null).length;
    console.log(
      `📦 Batch ${Math.floor(i / MAX_CONCURRENT) + 1} completed, found ${foundInBatch} directors`,
    );
  }

  return results;
}

async function fetchPendingMovies() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/movies/pending?limit=${BATCH_SIZE}`,
      { headers },
    );
    return response.data.movies;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching movies:", errorMessage);
    throw error;
  }
}

async function saveDirectors(movieDirectors) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/directors/batch`,
      { movieDirectors },
      { headers },
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error saving directors:", errorMessage);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting TypeScript director scraping...");
  console.log(`⏱️  Max execution time: ${MAX_EXECUTION_TIME / 60000} minutes`);

  try {
    // Validar variables de entorno
    if (!API_BASE_URL || !CRON_SECRET) {
      throw new Error("Missing required environment variables");
    }

    // const movies = await fetchPendingMovies();
    const movies = [
      {
        id: "d3e3eb0c-83e4-40cb-ba30-8d4a048fc071",
        title: "Mr. Nobody",
        url: "https://boxd.it/1k44",
        year: 2009,
      },
      {
        id: "bd55e672-4cd6-4beb-9a75-35e43c249ce3",
        title: "Coherence",
        url: "https://boxd.it/6xza",
        year: 2013,
      },
    ];
    console.log(`📋 Found ${movies.length} movies to process`);

    if (movies.length === 0) {
      console.log("✅ No movies to process.");
      return;
    }
    const movieDirectors = await processBatch(movies);
    console.log(4);
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    console.log(
      `🎯 Scraped ${movieDirectors.length} directors in ${elapsedSeconds}s`,
    );

    if (movieDirectors.length > 0) {
      const result = await saveDirectors(movieDirectors);
      console.log(
        `💾 Database result: ${result.successful} saved, ${result.failed} failed`,
      );

      // Log de errores si los hay
      const failures = result.results.filter((r) => !r.success);
      if (failures.length > 0) {
        console.log("❌ Failed saves:");
        failures.forEach((f) => console.log(`   - ${f.movieId}: ${f.error}`));
      }
    }

    const totalSeconds = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ Completed! Total time: ${totalSeconds}s`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("💥 Fatal error:", errorMessage);
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}
