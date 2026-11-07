import { cache } from "react";

import { createClientForServer } from "./server";

/**
 * Usuario de la request actual. `cache()` deduplica la llamada a
 * `supabase.auth.getUser()` entre layout y page en el mismo render.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClientForServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});
