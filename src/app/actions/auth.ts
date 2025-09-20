"use server";

import { redirect } from "next/navigation";

import { createClientForServer } from "@/lib/supabase/server";

type AuthProvider = "google";

const getURL = () => {
  const url =
    process?.env?.APP_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000";

  return url;
};

const signInWith = (provider: AuthProvider) => async () => {
  const supabase = await createClientForServer();

  const auth_callback_url = `${getURL()}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: auth_callback_url,
    },
  });

  if (error) {
    console.log(error);
  }

  if (!data.url) {
    throw new Error("No URL returned from Supabase");
  }

  redirect(data.url);
};

const signOut = async () => {
  const supabase = await createClientForServer();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

const signInWithGoogle = signInWith("google");

export { signInWithGoogle, signOut };
