"use server";

import { LetterboxdMovie } from "@/types/letterboxd";
import { MESSAGES } from "@/lib/constants/messages";
import handleServerError from "@/lib/errors/server";
import { createClientForServer } from "@/lib/supabase/server";

async function saveMoviesAction(movies: LetterboxdMovie[]) {
  const supabase = await createClientForServer();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error(MESSAGES.errors.noSession);
  }

  const userId = userData.user.id;

  const { error } = await supabase.from("movies").insert(movies);

  if (error) {
    return handleServerError({ error, message: MESSAGES.errors.saveMovies });
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ has_upload_csv: true })
    .eq("id", userId);

  if (updateError) {
    return handleServerError({ error: updateError });
  }
}

export { saveMoviesAction };
