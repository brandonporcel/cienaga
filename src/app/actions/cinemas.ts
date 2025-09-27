"use server";

import { createClientForServer } from "@/lib/supabase/server";

async function getEnabledCinemas() {
  const supabase = await createClientForServer();

  const { data: cinemas, error } = await supabase
    .from("cinemas")
    .select("*")
    .eq("enabled", true);

  if (error) {
    console.error("Error fetching cinemas:", error);
    return [];
  }

  return cinemas || [];
}

export { getEnabledCinemas };
