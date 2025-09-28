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
      const entries$ = $(entriesClass);

      entries$.each((_, element) => {
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
          // e.url ===
          // "https://malba.org.ar/evento/algo-viejo-algo-nuevo-algo-prestado/",
          e.eventType !== "Ciclo" &&
          e.eventType !== "Proyecciones" &&
          e.eventType !== "37º Festival",
      );

      for (const eventData of eventUrlss) {
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

      const $dateTimeElement = directorElement.next();
      const dateTimeText = $dateTimeElement.text().trim();
      const { times, originalText } = this.parseMalbaDateTime(dateTimeText);

      if (times.length === 0) {
        console.warn(`Could not parse any valid dates from: ${originalText}`);

        return null;
      }

      // Sala (si está mencionada en la descripción)
      const roomElement = $dateTimeElement.parent();
      const room = roomElement.next().text().trim();

      return {
        title,
        director,
        screeningTimes: times.map((t) => t.toISOString()),
        screeningTimeText: originalText,
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

  private parseMalbaDateTime(dateTimeText: string): {
    times: Date[];
    originalText: string;
  } {
    try {
      const times: Date[] = [];
      const text = dateTimeText.toLowerCase().trim();

      // "Sábados 4 y 11 de octubre a las 18:00"
      const multipleDatesMatch = text.match(
        /(\w+)s?\s+(\d+)\s+y\s+(\d+)\s+de\s+(\w+)\s+a\s+las\s+(\d{1,2}):(\d{2})/,
      );
      if (multipleDatesMatch) {
        const [, , day1, day2, monthName, hour, minute] = multipleDatesMatch;
        const month = this.getMonthNumber(monthName);
        if (month !== null) {
          times.push(
            this.createDate(
              parseInt(day1),
              month,
              parseInt(hour),
              parseInt(minute),
            ),
          );
          times.push(
            this.createDate(
              parseInt(day2),
              month,
              parseInt(hour),
              parseInt(minute),
            ),
          );
        }
      }

      // "Viernes a las 20:00, a partir del 10 de octubre"
      if (times.length === 0) {
        const singleDateMatch = text.match(
          /(\w+)\s+a\s+las\s+(\d{1,2}):(\d{2}),\s+a\s+partir\s+del\s+(\d{1,2})\s+de\s+(\w+)/,
        );
        if (singleDateMatch) {
          const [, , hour, minute, day, monthName] = singleDateMatch;
          const month = this.getMonthNumber(monthName);
          if (month !== null) {
            times.push(
              this.createDate(
                parseInt(day),
                month,
                parseInt(hour),
                parseInt(minute),
              ),
            );
          }
        }
      }

      // "Sábado 27 y domingo 28 de septiembre"
      if (times.length === 0) {
        const consecutiveDaysMatch = text.match(
          /(\w+)\s+(\d+)\s+y\s+(\w+)\s+(\d+)\s+de\s+(\w+)(?:\s+a\s+las\s+(\d{1,2}):(\d{2}))?/,
        );
        if (consecutiveDaysMatch) {
          const [, , day1, , day2, monthName, hour = "20", minute = "00"] =
            consecutiveDaysMatch;
          const month = this.getMonthNumber(monthName);
          if (month !== null) {
            times.push(
              this.createDate(
                parseInt(day1),
                month,
                parseInt(hour),
                parseInt(minute),
              ),
            );
            times.push(
              this.createDate(
                parseInt(day2),
                month,
                parseInt(hour),
                parseInt(minute),
              ),
            );
          }
        }
      }

      // "Sábados de septiembre a las 20:00"
      if (times.length === 0) {
        const monthRangeMatch = text.match(
          /(\w+)s?\s+de\s+(\w+)\s+a\s+las\s+(\d{1,2}):(\d{2})/,
        );
        if (monthRangeMatch) {
          const [, dayName, monthName, hour, minute] = monthRangeMatch;
          const month = this.getMonthNumber(monthName);
          if (month !== null) {
            const monthDates = this.getAllWeekdaysInMonth(
              dayName,
              month,
              parseInt(hour),
              parseInt(minute),
            );
            times.push(...monthDates);
          }
        }
      }

      // "Sábados a las 22:00" (próximo sábado únicamente)
      if (times.length === 0) {
        // Expresión para capturar un nombre de día (con o sin tildes),
        // opcionalmente seguido de la palabra "s" (como en "Sábados" o "lunes"),
        // luego la frase "a las" y finalmente la hora y los minutos en formato HH:MM.
        // Se usa "i" para permitir la captura de letras mayúsculas o minúsculas.
        // También maneja letras acentuadas y la letra "ñ" en el nombre del día.
        const recurringMatch = text.match(
          /([a-záéíóúüñ]+)s?\s+a\s+las\s+(\d{1,2}):(\d{2})/i,
        );

        if (recurringMatch) {
          const [, dayName, hour, minute] = recurringMatch;
          const nextDate = this.getNextWeekday(
            dayName,
            parseInt(hour),
            parseInt(minute),
          );

          if (nextDate) {
            times.push(nextDate);
          }
        }
      }

      // "Sábado 4 de octubre a las 20:00" — una única fecha pactada
      if (times.length === 0) {
        const singleScheduledDateMatch = text.match(
          /([a-záéíóúüñ]+)\s+(\d{1,2})\s+de\s+([a-záéíóúüñ]+)\s+a\s+las\s+(\d{1,2}):(\d{2})/i,
        );
        if (singleScheduledDateMatch) {
          const [, , day, monthName, hour, minute] = singleScheduledDateMatch;
          const month = this.getMonthNumber(monthName);
          if (month !== null) {
            times.push(
              this.createDate(
                parseInt(day),
                month,
                parseInt(hour),
                parseInt(minute),
              ),
            );
          }
        }
      }

      return {
        times: times.filter((date) => date > new Date()),
        originalText: dateTimeText,
      };
    } catch (error) {
      console.error("Error parsing Malba datetime:", error);
      return { times: [], originalText: dateTimeText };
    }
  }

  private getMonthNumber(monthName: string): number | null {
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

    return months[monthName.toLowerCase()] ?? null;
  }

  private createDate(
    day: number,
    month: number,
    hour: number,
    minute: number,
  ): Date {
    const currentYear = new Date().getFullYear();
    const date = new Date(currentYear, month, day, hour, minute);

    // Si la fecha ya pasó, asumir año siguiente
    if (date < new Date()) {
      date.setFullYear(currentYear + 1);
    }

    return date;
  }

  private getDayOfWeek(dayName: string): number {
    const days: Record<string, number> = {
      domingo: 0,
      lunes: 1,
      martes: 2,
      miércoles: 3,
      jueves: 4,
      viernes: 5,
      sábado: 6,
      // Variaciones
      miercoles: 3,
      sabado: 6,
      sabados: 6,
      sábados: 6,
      domingos: 0,
    };

    return days[dayName.toLowerCase()] ?? -1;
  }

  private getNextWeekday(
    dayName: string,
    hour: number,
    minute: number,
  ): Date | null {
    const targetDay = this.getDayOfWeek(dayName);
    if (targetDay === -1) return null;

    const today = new Date();
    const currentDay = today.getDay();

    // Calcular días hasta el próximo día objetivo
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Próxima semana
    }

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    targetDate.setHours(hour, minute, 0, 0);

    return targetDate;
  }

  private getAllWeekdaysInMonth(
    dayName: string,
    month: number,
    hour: number,
    minute: number,
  ): Date[] {
    const dates: Date[] = [];
    const year = new Date().getFullYear();
    const targetDay = this.getDayOfWeek(dayName);

    if (targetDay === -1) return dates;

    // Determinar si es el año actual o siguiente basado en el mes
    const currentMonth = new Date().getMonth();
    const targetYear = month < currentMonth ? year + 1 : year;

    const firstDay = new Date(targetYear, month, 1);
    const lastDay = new Date(targetYear, month + 1, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(targetYear, month, day, hour, minute);
      if (date.getDay() === targetDay && date > new Date()) {
        dates.push(date);
      }
    }

    return dates;
  }
}
