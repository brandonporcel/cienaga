import fs from "fs/promises";
import path from "path";

import Cinema from "@/types/cinema";
import { ScreeningTime } from "@/types/screening";

interface User {
  id: string;
  email: string;
  full_name?: string;
}
interface Screening {
  screening_time_text: string;
  room?: string;
  thumbnail_url?: string;
  original_url?: string;
  screening_times: ScreeningTime[];
  movies: {
    title: string;
    year?: number;
    duration?: number;
    poster_url?: string;
    directors: {
      name: string;
    };
  };
  cinemas: Cinema;
}

export class EmailTemplateBuilder {
  private templatesDir = path.join(
    process.cwd(),
    "scripts",
    "templates",
    "notifications",
  );

  async loadTemplate(name: string): Promise<string> {
    try {
      const templatePath = path.join(this.templatesDir, `${name}.html`);
      return await fs.readFile(templatePath, "utf-8");
    } catch (error) {
      console.warn(`Template ${name} not found, using fallback`);
      return this.getFallbackTemplate(name);
    }
  }

  async buildNotificationEmail(data: {
    user: User;
    screenings: Screening[];
    totalMatches: number;
  }): Promise<string> {
    try {
      const [base, header, screeningTemplate, cta, footer] = await Promise.all([
        this.loadTemplate("base"),
        this.loadTemplate("header"),
        this.loadTemplate("screening"),
        this.loadTemplate("cta"),
        this.loadTemplate("footer"),
      ]);

      // Cargar templates de cine (con fallbacks)
      let cinemaGroupTemplate: string;
      let cinemaGroupFooterTemplate: string;
      try {
        cinemaGroupTemplate = await this.loadTemplate("cinema-group");
      } catch {
        cinemaGroupTemplate = this.getFallbackTemplate("cinema-group");
      }
      try {
        cinemaGroupFooterTemplate = await this.loadTemplate("cinema-group-footer");
      } catch {
        cinemaGroupFooterTemplate = this.getFallbackTemplate("cinema-group-footer");
      }

      // Header
      const headerHtml = this.populateTemplate(header, {
        user_name: data.user.full_name || "Cinéfilo",
        greeting: this.getGreeting(data.totalMatches),
        total_matches: data.totalMatches.toString(),
      });

      // Agrupar screenings por cine
      const cinemaGroups = this.groupScreeningsByCinema(data.screenings);

      // Construir HTML de cada grupo de cine
      const screeningsHtml = cinemaGroups
        .map((group) => {
          const cinemaHeader = this.buildCinemaGroupHeader(
            cinemaGroupTemplate,
            group.cinema,
            group.screenings.length,
          );

          const filmRows = group.screenings
            .map((screening) =>
              this.buildScreeningHtml(screeningTemplate, screening),
            )
            .join("");

          return cinemaHeader + filmRows + cinemaGroupFooterTemplate;
        })
        .join("");

      // Footer
      const footerHtml = this.populateTemplate(footer, {
        app_url: process.env.APP_URL || "#",
        unsubscribe_url: `${process.env.APP_URL}/unsubscribe?token=${data.user.id}`,
      });

      const ctaHtml = this.populateTemplate(cta, {});

      // Ensamblar email completo
      return this.populateTemplate(base, {
        header: headerHtml,
        screenings: `<tr>
                        <td style="padding: 0 24px 24px 24px;">
                        ${screeningsHtml}
                        </td>
                        </tr>
                        `,
        footer: footerHtml,
        user_name: data.user.full_name || "Cinéfilo",
        total_matches: data.totalMatches.toString(),
        cta: ctaHtml,
      });
    } catch (error) {
      console.error("Error building email template:", error);
      return this.buildFallbackEmail(data);
    }
  }

  private groupScreeningsByCinema(
    screenings: Screening[],
  ): { cinema: Cinema; screenings: Screening[] }[] {
    const groups = new Map<string, { cinema: Cinema; screenings: Screening[] }>();

    for (const screening of screenings) {
      const cinemaId = String(screening.cinemas?.id || screening.cinemas?.name || "unknown");

      if (!groups.has(cinemaId)) {
        groups.set(cinemaId, {
          cinema: screening.cinemas,
          screenings: [],
        });
      }
      groups.get(cinemaId)!.screenings.push(screening);
    }

    // Ordenar cines alfabéticamente
    return Array.from(groups.values()).sort((a, b) =>
      a.cinema.name.localeCompare(b.cinema.name),
    );
  }

  private buildCinemaGroupHeader(
    template: string,
    cinema: Cinema,
    filmCount: number,
  ): string {
    const cinemaLogoHtml =
      cinema.image_url && !cinema.image_url.endsWith(".svg")
        ? `<img src="${cinema.image_url}" alt="${cinema.name}" style="width: 28px; height: 28px; border-radius: 50%; margin-right: 10px; vertical-align: middle;">`
        : "";

    return this.populateTemplate(template, {
      cinema_name: cinema.name,
      cinema_logo: cinemaLogoHtml,
      film_count: `${filmCount} película${filmCount > 1 ? "s" : ""}`,
    });
  }

  private buildScreeningHtml(template: string, screening: Screening): string {
    const movie = screening.movies;
    const director = movie.directors;

    const date =
      screening.screening_times.length > 0
        ? new Date(screening.screening_times[0].screening_datetime)
        : new Date();
    const formattedDate = date.toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "America/Argentina/Buenos_Aires",
    });

    // Poster: usar movie.poster_url primero, luego screening.thumbnail_url
    const posterUrl = movie.poster_url || screening.thumbnail_url || "";

    return this.populateTemplate(template, {
      movie_title: movie.title,
      director_name: director.name,
      movie_year: movie.year?.toString() || "",
      cinema_name: screening.cinemas.name,
      cinema_logo: "",
      duration_display: "",
      screening_hours:
        screening.screening_times.length > 0
          ? screening.screening_times
              .map((t) => {
                const time = new Date(t.screening_datetime);
                const formattedTime = time.toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Argentina/Buenos_Aires",
                });
                return `<td style="background-color: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #fcd34d; white-space: nowrap;">
                ${formattedTime}
                </td>`;
              })
              .join(" ")
          : `<td></td>`,
      formatted_date: formattedDate,
      formatted_time: "",
      room: screening.room || "",
      room_display: "",
      thumbnail_url: posterUrl,
      thumbnail_display: this.getThumbnailDisplay(posterUrl, movie.title),
      original_url: screening.original_url || "",
      details_button: "",
    });
  }

  private getThumbnailDisplay(
    thumbnailUrl?: string,
    movieTitle?: string,
  ): string {
    if (thumbnailUrl) {
      return `<img src="${thumbnailUrl}" alt="${movieTitle}" style="width: 44px; height: 66px; object-fit: cover; border-radius: 4px;">`;
    }
    return `<div style="width: 44px; height: 66px; background: #1f2937; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6b7280;">🎬</div>`;
  }

  private getGreeting(totalMatches: number): string {
    return totalMatches === 1
      ? "Hay una nueva película que te puede interesar"
      : `Hay ${totalMatches} películas nuevas que te pueden interesar`;
  }

  private populateTemplate(
    template: string,
    data: Record<string, string>,
  ): string {
    return Object.entries(data).reduce((html, [key, value]) => {
      return html.replace(new RegExp(`{{${key}}}`, "g"), value);
    }, template);
  }

  private getFallbackTemplate(name: string): string {
    switch (name) {
      case "base":
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ciénaga - Nuevas películas</title>
</head>
<body style="font-family: Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px;">
  {{header}}
  <table style="width: 100%; max-width: 600px; margin: 0 auto; background: #111; border-radius: 8px;">
    {{screenings}}
  </table>
  {{footer}}
</body>
</html>`;

      case "header":
        return `
<div style="text-align: center; padding: 20px 0;">
  <h1 style="color: #ffd700; margin: 0 0 10px 0;">¡Hola {{user_name}}!</h1>
  <p style="color: #ccc; font-size: 16px; margin: 0;">{{greeting}} en Buenos Aires</p>
</div>`;

      case "cinema-group":
        return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
  <tr>
    <td style="padding: 14px 16px; background-color: #111827; border-radius: 8px 8px 0 0; border-bottom: 2px solid #d97706;">
      <span style="font-size: 16px; font-weight: 700; color: #f9fafb;">{{cinema_name}}</span>
      <span style="font-size: 12px; color: #9ca3af; float: right;">{{film_count}}</span>
    </td>
  </tr>
</table>`;

      case "cinema-group-footer":
        return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="height: 1px; background-color: #374151; margin-bottom: 24px;"></td>
  </tr>
</table>
<div style="height: 24px;"></div>`;

      case "screening":
        return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 2px; background-color: #1a1a2e;">
  <tr>
    <td style="padding: 10px 16px; vertical-align: top;">
      <span style="color: #fff; font-size: 14px; font-weight: 600;">{{movie_title}}</span>
      <span style="color: #999; font-size: 12px; margin-left: 6px;">{{movie_year}}</span>
      <br>
      <span style="color: #d97706; font-size: 12px;">{{director_name}}</span>
      <span style="color: #666; font-size: 12px; margin-left: 4px;">•</span>
      <span style="color: #999; font-size: 12px; margin-left: 4px;">{{formatted_date}}</span>
      <br>
      <a href="{{original_url}}" style="color: #d97706; font-size: 12px; text-decoration: none; margin-top: 6px; display: inline-block;">Reservar →</a>
    </td>
  </tr>
</table>`;

      case "footer":
        return `
<div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
  <p>Ciénaga - Películas de tus directores favoritos en Buenos Aires</p>
  <p>
    <a href="{{app_url}}" style="color: #ffd700;">Ver todas las películas</a> | 
    <a href="{{unsubscribe_url}}" style="color: #999;">Darse de baja</a>
  </p>
</div>`;

      default:
        return "";
    }
  }

  private buildFallbackEmail(data: {
    user: User;
    screenings: Screening[];
    totalMatches: number;
  }) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; background: #000; color: #fff;">
          <h2>Hola ${data.user.full_name || "Cinéfilo"},</h2>
          <p>Hay ${data.totalMatches} película${data.totalMatches > 1 ? "s" : ""} nueva${data.totalMatches > 1 ? "s" : ""} en Buenos Aires:</p>
          ${data.screenings.map((s) => `<p>• ${s.movies.title} (${s.movies.directors.name}) - ${s.cinemas.name}</p>`).join("")}
          <p><small>Ciénaga - <a href="${process.env.APP_URL}">Ver todas las películas</a></small></p>
        </body>
      </html>
    `;
  }
}
