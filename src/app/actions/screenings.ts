// actions/screenings.actions.ts
"use server";

import { ScreeningsService } from "@/lib/services/screenings.service";
import { createClientForServer } from "@/lib/supabase/server";

export async function getPersonalizedScreenings() {
  const supabase = await createClientForServer();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    throw new Error("Not authenticated");
  }

  const screeningsService = new ScreeningsService();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + 30);

  return await screeningsService.getPersonalizedScreenings({
    userId: userData.user.id,
    cutoffDate,
  });
}
