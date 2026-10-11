import { Suspense } from "react";

import { createClientForServer } from "@/lib/supabase/server";
import ScreeningsPageContent from "./content";

export default async function ScreeningsPage() {
  const supabase = await createClientForServer();

  // "Volver" va al dashboard si hay sesión; si no, al home
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const backHref = user ? "/dashboard" : "/";

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="max-w-[1320px] mx-auto px-4 py-8 md:py-12">
            <div className="mb-8">
              <div className="h-8 bg-muted animate-pulse rounded w-48 mb-4" />
              <div className="h-10 bg-muted animate-pulse rounded w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-card p-0 overflow-hidden"
                >
                  <div className="h-64 bg-muted animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ScreeningsPageContent backHref={backHref} isLoggedIn={!!user} />
    </Suspense>
  );
}