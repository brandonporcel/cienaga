import CinemaClass from "@/types/class/cinema.class";

import { BaseCinemaScraper, ScrapedScreening } from "./base-scraper.service";

interface LumitonEventData extends ScrapedScreening {}

export class LumitonScraper extends BaseCinemaScraper {
  constructor(cinema: CinemaClass) {
    super(cinema);
  }

  async scrapeScreenings(): Promise<ScrapedScreening[]> {
    const screenings: LumitonEventData[] = [];

    try {
      const $ = await this.fetchPage(`${this.baseUrl}/agenda-presencial/`);
      const entriesClass = "article";
      const entries$ = $(entriesClass);

      // Obtener URLs y datos básicos del listado
      const entries: Array<{
        url: string;
        thumbnailUrl?: string;
      }> = [];

      entries$.each((_, element) => {
        const $event = $(element);

        // URL del evento
        const urlEntry = $event.find("a").attr("href");
        if (!urlEntry) return;

        // Thumbnail
        const thumbnailUrl = $event.find("img").attr("src");

        entries.push({
          url: urlEntry.startsWith("http")
            ? urlEntry
            : `${this.baseUrl}${urlEntry}`,
          thumbnailUrl,
        });
      });

      console.log(`Found ${entries.length} events to process`);

      // Procesar cada evento individualmente

      for (const eventData of entries.slice(0, 1)) {
        try {
          const eventDetails = await this.scrapeEventDetail(
            eventData.url,
            eventData.thumbnailUrl,
          );
          console.log({ eventDetails });
          if (eventDetails) {
            screenings.push(eventDetails);
          }

          await this.delay(1000);
        } catch (error) {
          console.error(`Error processing event ${eventData.url}:`, error);
        }
      }

      console.log(screenings.length + "screeningsscreeningsscreenings");
      return screenings;
    } catch (error) {
      console.error(`Error scraping ${this.cinemaName}:`, error);
      return [];
    }
  }

  private async scrapeEventDetail(
    url: string,
    thumbnailUrl?: string,
  ): Promise<LumitonEventData | null> {
    try {
      const $ = await this.fetchPage(url);

      // Título de la película
      const titleElement = $("h1");
      const title = this.cleanTitle(titleElement.text());

      if (!title) return null;

      // Director - formato "Dirección: Juanjo Pereira"
      const directorText = $('*:contains("Dirección:")').text().trim();
      let director: string | undefined;
      if (directorText.startsWith("Dirección:")) {
        director = directorText.replace(/^Dirección:\s+/i, "").trim();
      }

      return {
        title,
        director,
        datetime: new Date(),
        cinemaName: this.cinemaName,
        originalUrl: url,
        thumbnailUrl,
      };
    } catch (error) {
      console.error(`Error scraping detail page ${url}:`, error);
      return null;
    }
  }
}
