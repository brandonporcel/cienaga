// actions/directors.ts
"use server";

import { Director } from "@/types/director";
import { MESSAGES } from "@/lib/constants/messages";
import handleServerError from "@/lib/errors/server";
import { getUserOrThrow } from "@/lib/helpers/get-server-user";

async function getDirectors(): Promise<Director[]> {
  const { supabase, user } = await getUserOrThrow();

  const { data, error } = await supabase
    .from("user_directors")
    .select("directors(*)")
    .eq("user_id", user.id);

  if (error) {
    return handleServerError({
      error,
      message: MESSAGES.errors.gettingDirectors,
    });
  }

  // Flatten para devolver un array de directores
  return data?.map((row) => row.directors).flat();
  // return data?.map((row) => row.directors) as ?? [];
}

export { getDirectors };
