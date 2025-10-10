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
      for (const eventData of entries) {
        try {
          const eventDetails = await this.scrapeEventDetail(
            eventData.url,
            eventData.thumbnailUrl,
          );

          if (eventDetails) {
            screenings.push(eventDetails);
          }

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
  ): Promise<LumitonEventData | null> {
    try {
      const $ = await this.fetchPage(url);

      // Título de la película
      const titleElement = $("h1");
      const rawTitle = this.cleanTitle(titleElement.text());

      // Ejemplos:
      // PSICOSIS (PSYCHO)
      // FRANKENSTEIN
      // Si hay paréntesis, la parte antes es el título nacional (español)
      let nationalTitle = rawTitle;
      let title = rawTitle;

      const match = rawTitle.match(/^(.+?)\s*\(([^)]+)\)/);
      if (match) {
        nationalTitle = match[1].trim();
        title = match[2].trim();
      }

      if (!title) return null;

      // Director - formato "Dirección: Juanjo Pereira"
      const directorElement = $('b:contains("Dirección:")');
      const directorr = directorElement
        .parent()
        .contents()
        .filter(function () {
          return this.type === "text" && $(this).text().trim() !== "";
        })
        .text()
        .replace("Dirección:", "")
        .trim();
      const director = directorr.endsWith(".")
        ? directorr.slice(0, -1)
        : directorr;

      // Extraer bloque con datos adicionales
      const infoText = directorElement
        .parent()
        .find(".text-sm")
        .text()
        .replace(/\s+/g, " ")
        .trim();
      // Ejemplo: "Argentina. 87 min. Ficción . 2018."
      // EE.UU.. 109 min. Ficción. 1960.

      // Separar por punto (.)
      const parts = infoText
        // separa solo si hay un punto seguido de espacio y una mayúscula o dígito
        .split(/\.\s+(?=[A-ZÁÉÍÓÚÑ0-9])/)
        .map((p) => p.replace(/\.+$/, "").trim()) // limpia puntos al final
        .filter(Boolean);

      // Ejemplo → ["Argentina", "87 min", "Ficción", "2018"]

      const [country, duration, genre, year] = parts;
      const durationInMinutes = parseInt(duration, 10) || undefined;
      const yearNumber = parseInt(year, 10) || undefined;

      const $dateElement = $(".g-event-fecha");
      const dateText = $dateElement.text().trim();
      const { times, originalText } = this.parseLumitonDateTime(dateText);
      if (times.length === 0) {
        console.warn(`Could not parse datetime from: ${originalText}`);
        return null;
      }

      return {
        title,
        nationalTitle,
        director,
        screeningTimeText: originalText.replace(/\s+/g, " ").trim(),
        screeningTimes: times.map((t) => t.toISOString()),
        cinemaName: this.cinemaName,
        originalUrl: url,
        thumbnailUrl,
        genre,
        duration: durationInMinutes,
        country,
        year: yearNumber,
      };
    } catch (error) {
      console.error(`Error scraping detail page ${url}:`, error);
      return null;
    }
  }

  private parseLumitonDateTime(
    dateTimeText: string,
    timeText?: string,
  ): {
    times: Date[];
    originalText: string;
  } {
    try {
      const times: Date[] = [];

      const parts = dateTimeText
        .split("\n")
        .map((part) => part.trim())
        .filter((part) => part !== "");

      if (parts.length >= 3) {
        const [dayName, day, monthAbbr, fourthPart] = parts;

        const dayNum = parseInt(day);
        const month = this.getMonthNumber(monthAbbr);
        if (month !== null && !isNaN(dayNum)) {
          let hour = 20; // Default
          let minute = 0;
          let year = new Date().getFullYear();

          // Verificar si el cuarto elemento es año o hora
          if (fourthPart) {
            // Si contiene ":" es hora, sino es año
            const timeMatch = fourthPart.match(/(\d{1,2}):(\d{2})/);

            if (timeMatch) {
              // Es hora: "18:00hs"
              hour = parseInt(timeMatch[1]);
              minute = parseInt(timeMatch[2]);
            } else {
              // Es año: "2025"
              const yearNum = parseInt(fourthPart);
              if (!isNaN(yearNum)) {
                year = yearNum;
              }
            }
          }

          // Si tenemos timeText adicional, usarlo (puede sobrescribir la hora del cuarto elemento)
          if (timeText) {
            const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              hour = parseInt(timeMatch[1]);
              minute = parseInt(timeMatch[2]);
            }
          }

          const date = new Date(year, month, dayNum, hour, minute);

          // Si la fecha ya pasó, asumir año siguiente
          if (date < new Date()) {
            date.setFullYear(year + 1);
          }

          times.push(date);
        }
      }

      return {
        times: times.filter((date) => date > new Date()),
        originalText: dateTimeText + (timeText ? ` ${timeText}` : ""),
      };
    } catch (error) {
      console.error("Error parsing Lumiton datetime:", error);
      return { times: [], originalText: dateTimeText };
    }
  }
}
