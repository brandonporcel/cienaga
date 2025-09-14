"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/config/routes";
import createClientForBrowser from "@/lib/supabase/client";
import { signOut } from "@/app/actions/auth";

export function useSignOut() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const logout = async (redirectTo: string = ROUTES.home.path) => {
    startTransition(async () => {
      try {
        // 1. Sign out en cliente (actualización inmediata del estado)
        const supabase = createClientForBrowser();
        await supabase.auth.signOut();

        // 2. Sign out en servidor (limpiar cookies y sesión)
        await signOut();

        if (redirectTo) {
          router.replace(redirectTo);
        }
      } catch (error) {
        console.error("Error signing out:", error);
        window.location.href = redirectTo;
      }
    });
  };

  return {
    logout,
    isPending,
  };
}
