import CinemaClass from "@/types/class/cinema.class";
import { CinemaSlug } from "@/lib/enums/cinema.enum";

import { BaseCinemaScraper } from "./base-scraper.service";
import { LumitonScraper } from "./lumiton.scraper";
import { MalbaScraper } from "./malba.scraper";

export class ScraperFactory {
  private static scraperClasses = {
    malba: MalbaScraper,
    lumiton: LumitonScraper,
  };

  static createScraper(
    cinemaSlug: CinemaSlug,
    cinemaData: CinemaClass,
  ): BaseCinemaScraper | null {
    const ScraperClass = this.scraperClasses[cinemaSlug];

    if (!ScraperClass) {
      console.warn(`No scraper found for cinema: ${cinemaSlug}`);
      return null;
    }

    return new ScraperClass(cinemaData);
  }
}
