import axios from "axios";

import { EmailService } from "./email.service";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface ProcessedMatches {
  user: User;
  screenings: any[];
}

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async getUserScreeningMatches(cutoffDate: Date): Promise<any[]> {
    try {
      const response = await axios.get(
        `${process.env.APP_URL || "http://localhost:3000"}/api/notifications/matches`,
        {
          params: { cutoff: cutoffDate.toISOString() },
          headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET_KEY}`,
          },
        },
      );

      return response.data || [];
    } catch (error) {
      console.error("Error fetching user screening matches:", error);
      throw new Error("Failed to fetch screening matches from API");
    }
  }

  async processMatches(matches: any[]): Promise<ProcessedMatches[]> {
    if (!matches || matches.length === 0) {
      return [];
    }

    // Obtener IDs únicos de usuarios
    const userIds = [
      ...new Set(
        matches
          .flatMap(
            (match) =>
              match.movies?.directors?.user_directors?.map(
                (ud: any) => ud.user_id,
              ) || [],
          )
          .filter(Boolean),
      ),
    ];
    if (userIds.length === 0) {
      console.log("No users found in matches");
      return [];
    }

    // Obtener datos completos de usuarios
    const users = await this.fetchUsers(userIds);

    // Agrupar screenings por usuario
    const userGroups = this.groupScreeningsByUser(matches, users);

    return userGroups;
  }

  private async fetchUsers(userIds: string[]): Promise<User[]> {
    try {
      const response = await axios.post(
        `${process.env.APP_URL || "http://localhost:3000"}/api/users/bulk`,
        { userIds },
        {
          headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET_KEY}`,
          },
        },
      );

      return response.data || [];
    } catch (error) {
      console.error("Error fetching users:", (error as Error)?.message);
      // Fallback: crear usuarios básicos con IDs únicamente
      return userIds.map((id) => ({
        id,
        email: `user-${id}@unknown.com`,
        full_name: "Usuario",
      }));
    }
  }

  private groupScreeningsByUser(
    matches: any[],
    users: User[],
  ): ProcessedMatches[] {
    const userMap = new Map(users.map((user) => [user.id, user]));
    const groupedData = new Map<string, any[]>();

    // Agrupar screenings por usuario
    matches.forEach((match) => {
      const userDirectors = match.movies?.directors?.user_directors || [];

      userDirectors.forEach((ud: any) => {
        const userId = ud.user_id;
        if (!userId) return;

        if (!groupedData.has(userId)) {
          groupedData.set(userId, []);
        }
        groupedData.get(userId)!.push(match);
      });
    });

    // Convertir a array de ProcessedMatches
    const result: ProcessedMatches[] = [];

    groupedData.forEach((screenings, userId) => {
      const user = userMap.get(userId);
      if (!user) {
        console.warn(`User not found for ID: ${userId}`);
        return;
      }

      // Eliminar duplicados de screenings (mismo ID)
      const uniqueScreenings = screenings.filter(
        (screening, index, arr) =>
          arr.findIndex((s) => s.id === screening.id) === index,
      );

      // Ordenar por fecha de screening
      uniqueScreenings.sort(
        (a, b) =>
          new Date(a.screening_time).getTime() -
          new Date(b.screening_time).getTime(),
      );

      result.push({
        user,
        screenings: uniqueScreenings,
      });
    });

    return result;
  }

  async sendNotifications(processedMatches: ProcessedMatches[]): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const match of processedMatches) {
      try {
        if (match.screenings.length === 0) {
          continue;
        }

        const success = await this.emailService.sendNotificationEmail({
          user: match.user,
          screenings: match.screenings,
          totalMatches: match.screenings.length,
        });

        if (success) {
          results.sent++;

          await this.logNotification(
            match.user.id,
            match.screenings.map((s) => s.id),
          );
        } else {
          results.failed++;
          results.errors.push(`Failed to send email to ${match.user.email}`);
        }

        // Rate limiting - esperar entre emails
        await this.delay(1000);
      } catch (error) {
        results.failed++;
        const errorMsg = `Error sending notification to ${match.user.email}: ${(error as Error)?.message}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    return results;
  }

  private async logNotification(
    userId: string,
    screeningIds: string[],
  ): Promise<void> {
    try {
      await axios.post(
        `${process.env.APP_URL || "http://localhost:3000"}/api/notifications/log`,
        {
          userId,
          screeningIds,
          emailSubject: `Nuevas películas en Buenos Aires`,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET_KEY}`,
          },
        },
      );
    } catch (error) {
      console.warn("Failed to log notification:", (error as Error)?.message);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
