import { Resend } from "resend";

import { EmailTemplateBuilder } from "./template.builder";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface ScreeningNotificationData {
  user: User;
  screenings: any[];
  totalMatches: number;
}

export class EmailService {
  private resend: Resend;
  private templateBuilder: EmailTemplateBuilder;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    this.resend = new Resend(apiKey);
    this.templateBuilder = new EmailTemplateBuilder();
  }

  async sendNotificationEmail(
    data: ScreeningNotificationData,
  ): Promise<boolean> {
    try {
      const { user, screenings, totalMatches } = data;

      // Generar contenido usando el template builder
      const htmlContent = await this.templateBuilder.buildNotificationEmail({
        user,
        screenings,
        totalMatches,
      });

      const textContent = this.generateTextContent(
        user,
        screenings,
        totalMatches,
      );
      const subject = this.generateSubject(
        user.full_name || "Cinéfilo",
        totalMatches,
      );

      const emailData = {
        from: "onboarding@resend.dev",
        to: [user.email],
        subject,
        html: htmlContent,
        text: textContent,
      };

      console.log(
        `Sending notification to ${user.email} (${totalMatches} matches)`,
      );

      const result = await this.resend.emails.send(emailData);

      if (result.error) {
        console.error("Resend error:", result.error);
        return false;
      }

      console.log(
        `Email sent successfully to ${user.email}, ID: ${result.data?.id}`,
      );
      return true;
    } catch (error) {
      console.error(
        `Failed to send email to ${data.user.email}:`,
        (error as Error).message,
      );
      return false;
    }
  }

  private generateSubject(userName: string, matchCount: number): string {
    if (matchCount === 1) {
      return `${userName}, hay una nueva película de un director que seguís en Buenos Aires`;
    }
    return `${userName}, hay ${matchCount} nuevas películas de directores que seguís en Buenos Aires`;
  }

  private generateTextContent(
    user: User,
    screenings: any[],
    totalMatches: number,
  ): string {
    const userName = user.full_name || "Cinéfilo";
    const greeting =
      totalMatches === 1
        ? "Hay una nueva película que te puede interesar"
        : `Hay ${totalMatches} películas nuevas que te pueden interesar`;

    let textContent = `Hola ${userName},\n\n${greeting} en los cines de Buenos Aires:\n\n`;

    screenings.forEach((screening, index) => {
      const movie = screening.movies;
      const director = movie.directors;
      const cinema = screening.cinemas;

      const date = new Date(screening.screening_time_text);
      const formattedDate = date.toLocaleDateString("es-AR");
      const formattedTime = date.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      textContent += `${index + 1}. ${movie.title}\n`;
      textContent += `   Director: ${director.name}\n`;
      textContent += `   Cine: ${cinema.name}\n`;
      textContent += `   Fecha: ${formattedDate} a las ${formattedTime}\n`;
      if (screening.room) {
        textContent += `   Sala: ${screening.room}\n`;
      }
      if (screening.original_url) {
        textContent += `   Más info: ${screening.original_url}\n`;
      }
      textContent += "\n";
    });

    textContent += `\n---\nCiénaga - Películas de tus directores favoritos en Buenos Aires\n`;
    textContent += `Para darte de baja: ${process.env.APP_URL}/unsubscribe?token=${user.id}`;

    return textContent;
  }
}
