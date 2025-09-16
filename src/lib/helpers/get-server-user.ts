"use server";

import { MESSAGES } from "@/lib/constants/messages";
import { createClientForServer } from "@/lib/supabase/server";

export async function getUserOrThrow() {
  const supabase = await createClientForServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    throw new Error(MESSAGES.errors.noSession);
  }

  return { supabase, user: data.user };
}
