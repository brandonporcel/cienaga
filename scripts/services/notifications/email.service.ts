import nodemailer from "nodemailer";
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

type EmailProvider = "resend" | "brevo";

interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

export class EmailService {
  private provider: EmailProvider;
  private resend: Resend | null = null;
  private brevoTransport: nodemailer.Transporter | null = null;
  private templateBuilder: EmailTemplateBuilder;
  private senderEmail: string;

  constructor() {
    this.templateBuilder = new EmailTemplateBuilder();
    this.provider = this.resolveProvider();

    if (this.provider === "resend") {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error("RESEND_API_KEY environment variable is required");
      }
      this.resend = new Resend(apiKey);
      this.senderEmail = "onboarding@resend.dev";
    } else {
      const smtpKey = process.env.BREVO_SMTP_KEY;
      const smtpUser = process.env.BREVO_SMTP_USER;
      const senderEmail = process.env.BREVO_SENDER_EMAIL;
      if (!smtpKey || !smtpUser || !senderEmail) {
        throw new Error(
          "BREVO_SMTP_KEY, BREVO_SMTP_USER and BREVO_SENDER_EMAIL are required",
        );
      }
      this.brevoTransport = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false, // STARTTLS
        auth: {
          user: smtpUser,
          pass: smtpKey,
        },
      });
      this.senderEmail = senderEmail;
    }

    console.log(`📧 Email provider: ${this.provider}`);
  }

  private resolveProvider(): EmailProvider {
    const raw = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
    if (raw === "brevo" || raw === "smtp") return "brevo";
    return "resend";
  }

  async sendNotificationEmail(
    data: ScreeningNotificationData,
  ): Promise<boolean> {
    try {
      const { user, screenings, totalMatches } = data;

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

      console.log(
        `Sending notification to ${user.email} (${totalMatches} matches) via ${this.provider}`,
      );

      let result: SendResult;

      if (this.provider === "resend") {
        result = await this.sendViaResend({
          to: user.email,
          subject,
          html: htmlContent,
          text: textContent,
        });
      } else {
        result = await this.sendViaBrevo({
          to: user.email,
          subject,
          html: htmlContent,
          text: textContent,
        });
      }

      if (!result.success) {
        console.error(`${this.provider} error:`, result.error);
        return false;
      }

      console.log(
        `Email sent successfully to ${user.email}, ID: ${result.id}`,
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

  private async sendViaResend(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<SendResult> {
    const result = await this.resend!.emails.send({
      from: this.senderEmail,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (result.error) {
      return { success: false, error: JSON.stringify(result.error) };
    }

    return { success: true, id: result.data?.id };
  }

  private async sendViaBrevo(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<SendResult> {
    const info = await this.brevoTransport!.sendMail({
      from: `Ciénaga <${this.senderEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    return { success: true, id: info.messageId };
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
