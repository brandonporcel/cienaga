"use server";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Actualiza el estado de desuscripción de un usuario.
 * Usado por la página /unsubscribe (token validation) y /settings (toggle).
 *
 * Usa el service client (service_role) porque la tabla `users` tiene RLS
 * habilitado sin policies: el UPDATE con la anon key no da error pero afecta
 * 0 filas, así que el cambio nunca se persistía.
 */
export async function setUnsubscribed(
  userId: string,
  unsubscribed: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

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
