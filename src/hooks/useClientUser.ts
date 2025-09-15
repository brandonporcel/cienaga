"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

import createClientForBrowser from "@/lib/supabase/client";

export function useClientUser() {
  const supabase = createClientForBrowser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) setUser(data.user);
      setLoading(false);
    };
    getUser();

    // Suscribirse a cambios de sesión (login/logout/token refresh)
    // para mantener el estado del usuario sincronizado en el cliente
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}
