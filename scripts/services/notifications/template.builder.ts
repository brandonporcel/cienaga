import fs from "fs/promises";
import path from "path";

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
  movies: {
    title: string;
    year?: number;
    directors: {
      name: string;
    };
  };
  cinemas: {
    name: string;
  };
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
      // Cargar templates
      const [base, header, screeningTemplate, cta, footer] = await Promise.all([
        this.loadTemplate("base"),
        this.loadTemplate("header"),
        this.loadTemplate("screening"),
        this.loadTemplate("cta"),
        this.loadTemplate("footer"),
      ]);

      // Construir header
      const headerHtml = this.populateTemplate(header, {
        user_name: data.user.full_name || "Cinéfilo",
        greeting: this.getGreeting(data.totalMatches),
        total_matches: data.totalMatches.toString(),
      });

      // Construir screenings
      const screeningsHtml = data.screenings
        .map((screening) =>
          this.buildScreeningHtml(screeningTemplate, screening),
        )
        .join("");

      // Construir footer
      const footerHtml = this.populateTemplate(footer, {
        app_url: process.env.APP_URL || "#",
        unsubscribe_url: `${process.env.APP_URL}/unsubscribe?token=${data.user.id}`,
      });

      const ctaHtml = this.populateTemplate(cta, {});

      // Ensamblar email completo
      return this.populateTemplate(base, {
        header: headerHtml,
        screenings: `<tr>
                        <td style="padding: 0 40px 40px 40px;">
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

  private buildScreeningHtml(template: string, screening: Screening): string {
    const movie = screening.movies;
    const director = movie.directors;
    const cinema = screening.cinemas;

    const date = new Date();
    const formattedDate = date.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return this.populateTemplate(template, {
      movie_title: movie.title,
      director_name: director.name,
      movie_year: movie.year?.toString() || "",
      cinema_name: cinema.name,
      formatted_date: formattedDate,
      formatted_time: formattedTime,
      room: screening.room || "",
      room_display: screening.room
        ? `<p style="margin: 0 0 10px 0; color: #ccc; font-size: 12px;">Sala: ${screening.room}</p>`
        : "",
      thumbnail_url: screening.thumbnail_url || "",
      thumbnail_display: this.getThumbnailDisplay(
        screening.thumbnail_url,
        movie.title,
      ),
      original_url: screening.original_url || "",
      details_button: screening.original_url
        ? `<a href="${screening.original_url}" style="background: #ffd700; color: #000; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold;">Ver detalles</a>`
        : "",
    });
  }

  private getThumbnailDisplay(
    thumbnailUrl?: string,
    movieTitle?: string,
  ): string {
    if (thumbnailUrl) {
      return `<img src="${thumbnailUrl}" alt="${movieTitle}" style="width: 70px; height: 100px; object-fit: cover; border-radius: 4px;">`;
    }
    return `<div style="width: 70px; height: 100px; background: #333; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">Sin imagen</div>`;
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

      case "screening":
        return `
<tr style="border-bottom: 1px solid #333;">
  <td style="padding: 20px;">
    <table style="width: 100%;">
      <tr>
        <td style="width: 80px; vertical-align: top;">
          {{thumbnail_display}}
        </td>
        <td style="padding-left: 15px; vertical-align: top;">
          <h3 style="margin: 0 0 5px 0; color: #fff; font-size: 18px;">{{movie_title}}</h3>
          <p style="margin: 0 0 10px 0; color: #ccc; font-size: 14px;">
            De {{director_name}} {{movie_year}}
          </p>
          <p style="margin: 0 0 8px 0; color: #ffd700; font-size: 14px;">
            📍 {{cinema_name}}
          </p>
          <p style="margin: 0 0 10px 0; color: #fff; font-size: 14px;">
            🗓️ {{formatted_date}} a las {{formatted_time}}
          </p>
          {{room_display}}
          {{details_button}}
        </td>
      </tr>
    </table>
  </td>
</tr>`;

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
  }): string {
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
