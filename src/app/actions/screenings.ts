"use server";

import { MESSAGES } from "@/lib/constants/messages";
import { createClientForServer } from "@/lib/supabase/server";

async function getPersonalizedScreenings() {
  const supabase = await createClientForServer();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error(MESSAGES.errors.noSession);
  }

  // const userId = userData.user.id;

  // Query corregida: ir desde screenings hacia arriba
  const { data: screenings, error } = await supabase
    .from("screenings")
    .select("*, movies!inner(*,directors!inner(*)), cinemas!inner(*)")
    .gte("screening_time", new Date().toISOString())
    .order("screening_time", { ascending: true });

  if (error) {
    console.error("Error fetching screenings:", error);
    return [];
  }

  return screenings || [];
}

export { getPersonalizedScreenings };
