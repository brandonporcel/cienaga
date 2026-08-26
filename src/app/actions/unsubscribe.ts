"use server";

import { createClientForServer } from "@/lib/supabase/server";

/**
 * Actualiza el estado de desuscripción de un usuario.
 * Usado por la página /unsubscribe (token validation) y /settings (toggle).
 */
export async function setUnsubscribed(
  userId: string,
  unsubscribed: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClientForServer();

  const { error } = await supabase
    .from("users")
    .update({ unsubscribed })
    .eq("id", userId);

  if (error) {
    console.error("Error updating unsubscribe status:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
