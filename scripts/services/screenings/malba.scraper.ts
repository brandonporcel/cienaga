import CinemaClass from "@/types/class/cinema.class";

import { BaseCinemaScraper, ScrapedScreening } from "./base-scraper.service";

interface MalbaEventData extends ScrapedScreening {
  eventType?: string;
}

export class MalbaScraper extends BaseCinemaScraper {
  constructor(cinema: CinemaClass) {
    super(cinema);
  }

  async scrapeScreenings(): Promise<ScrapedScreening[]> {
    const screenings: ScrapedScreening[] = [];

    try {
      // Obtener URLs y datos básicos del listado
      const eventUrls: Array<{
        url: string;
        thumbnailUrl?: string;
        eventType?: string;
      }> = [];
      const $ = await this.fetchPage(`${this.baseUrl}/cine/`);

      const entriesClass =
        ".elementor.event.type-event.status-publish.has-post-thumbnail.hentry.event-category-cine";
      const events$ = $(entriesClass);

      events$.each((_, element) => {
        const $event = $(element);

        // URL del evento
        const urlElement = $event.find(".elementor-widget-image a");
        const originalUrl = urlElement.attr("href");
        if (!originalUrl) return;

        // Tipo
        const eventType = $event.find("p").text();
        if (!eventType) return;

        // Thumbnail
        const thumbnailUrl = $event
          .find(".elementor-widget-container img")
          .attr("src");

        eventUrls.push({
          url: originalUrl.startsWith("http")
            ? originalUrl
            : `${this.baseUrl}${originalUrl}`,
          thumbnailUrl,
          eventType,
        });
      });

      console.log(`Found ${eventUrls.length} events to process`);

      // Procesar cada evento individualmente
      const eventUrlss = eventUrls.filter(
        (e) =>
          e.eventType !== "Ciclo" &&
          e.eventType !== "Proyecciones" &&
          e.eventType !== "37º Festival",
      );

      for (const eventData of eventUrlss.slice(0, 1)) {
        try {
          const eventDetails = await this.scrapeEventDetail(
            eventData.url,
            eventData.thumbnailUrl,
          );
          if (eventDetails) {
            screenings.push({
              ...eventDetails,
              eventType: eventData.eventType,
            });
          }

          // Delay para ser respetuosos con el servidor
          await this.delay(1000);
        } catch (error) {
          console.error(`Error processing event ${eventData.url}:`, error);
        }
      }

      return screenings;
    } catch (error) {
      console.error(`Error scraping ${this.cinemaName}:`, error);
      return [];
    }
  }

  private async scrapeEventDetail(
    url: string,
    thumbnailUrl?: string,
  ): Promise<MalbaEventData | null> {
    try {
      const $ = await this.fetchPage(url);

      // Título de la película
      const titleElement = $(
        "h1.elementor-heading-title.elementor-size-default",
      );
      const title = this.cleanTitle(titleElement.text());
      if (!title) return null;

      // Director - formato "De Juanjo Pereira"
      const grandParent = titleElement.parent().parent();
      const directorElement = grandParent.next();
      const directorText = directorElement.find("p").text().trim();
      let director: string | undefined;
      if (directorText.startsWith("De ")) {
        director = directorText.replace(/^De\s+/i, "").trim();
      }

      // Fecha y hora - formato "Viernes a las 20:00, a partir del 10 de octubre"
      const $dateTimeElement = directorElement.next();
      const dateTimeText = $dateTimeElement.text().trim();
      const datetime = this.parseMalbaDateTime(dateTimeText);

      if (!datetime) {
        // console.warn(`Could not parse datetime: ${dateTimeText}`);
        return null;
      }

      // Sala (si está mencionada en la descripción)
      const roomElement = $dateTimeElement.parent();
      const room = roomElement.next().text().trim();

      return {
        title,
        director,
        datetime,
        cinemaName: this.cinemaName,
        originalUrl: url,
        thumbnailUrl,
        room,
      };
    } catch (error) {
      console.error(`Error scraping detail page ${url}:`, error);
      return null;
    }
  }

  private async scrapeCiclo(url: string): Promise<MalbaEventData | null> {
    return null;
  }

  private parseMalbaDateTime(dateTimeText: string): Date | null {
    try {
      // Regex para extraer día, hora y fecha
      // "Viernes a las 20:00, a partir del 10 de octubre"
      const timeMatch = dateTimeText.match(/(\d{1,2}):(\d{2})/);
      const dateMatch = dateTimeText.match(/(\d{1,2})\s+de\s+(\w+)/i);

      if (!timeMatch || !dateMatch) return null;

      const hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2]);
      const day = parseInt(dateMatch[1]);
      const monthName = dateMatch[2].toLowerCase();

      // Mapear meses en español
      const months: Record<string, number> = {
        enero: 0,
        febrero: 1,
        marzo: 2,
        abril: 3,
        mayo: 4,
        junio: 5,
        julio: 6,
        agosto: 7,
        septiembre: 8,
        octubre: 9,
        noviembre: 10,
        diciembre: 11,
      };

      const month = months[monthName];
      if (month === undefined) return null;

      // Asumir año actual o siguiente si ya pasó
      const currentYear = new Date().getFullYear();
      const date = new Date(currentYear, month, day, hour, minute);

      // Si la fecha ya pasó, asumir año siguiente
      if (date < new Date()) {
        date.setFullYear(currentYear + 1);
      }

      return date;
    } catch (error) {
      console.error("Error parsing Malba datetime:", error);
      return null;
    }
  }
}
