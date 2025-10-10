import { ScreeningsService } from "@/lib/services/screenings.service";

import { NotificationService } from "./services/notifications/notification.service";

import "dotenv/config";

class NotificationOrchestrator {
  private notificationService: NotificationService;
  private screeningsService: ScreeningsService;

  constructor() {
    this.notificationService = new NotificationService();
    this.screeningsService = new ScreeningsService();
  }

  async execute(): Promise<void> {
    console.log("🔔 Starting notification process...");

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + 14); // Próximos 14 días

      console.log(
        `📅 Looking for screenings until: ${cutoffDate.toISOString()}`,
      );

      // 1. Obtener coincidencias usuario-screening
      const matches =
        await this.screeningsService.getMatchedScreeningsForNotifications(
          cutoffDate,
        );

      if (matches.length === 0) {
        console.log("✅ No matches found. No notifications to send.");
        return;
      } else {
        console.log(`🎬 Found ${matches.length} screening matches`);
      }

      // 2. Procesar y agrupar por usuario
      const processedMatches =
        await this.notificationService.processMatches(matches);
      console.log(
        `👥 Grouped into ${processedMatches.length} user notifications`,
      );

      if (processedMatches.length === 0) {
        console.log("⚠️ No valid users found for notifications.");
        return;
      }

      // 3. Enviar notificaciones
      const results =
        await this.notificationService.sendNotifications(processedMatches);

      // 4. Reporte final
      console.log("📊 Notification Results:");
      console.log(`   ✅ Sent: ${results.sent}`);
      console.log(`   ❌ Failed: ${results.failed}`);
      console.log(`   📧 Total users: ${processedMatches.length}`);
      console.log(`   🎬 Total screenings processed: ${matches.length}`);

      if (results.errors.length > 0) {
        console.log("❌ Errors:");
        results.errors.forEach((error: any) => console.log(`   - ${error}`));
      }

      if (results.failed > results.sent) {
        console.error("💥 More failures than successes!");
        process.exit(1);
      }

      console.log("✅ Notification process completed successfully");
    } catch (error) {
      console.error("💥 Fatal error in notification process:", error);
      process.exit(1);
    }
  }
}

async function main(): Promise<void> {
  const orchestrator = new NotificationOrchestrator();
  await orchestrator.execute();
}

if (require.main === module) {
  main();
}
