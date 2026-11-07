import { Suspense } from "react";

import { getCurrentUser } from "@/lib/supabase/auth";
import ScreeningsPageContent from "./content";

function ScreeningsFallback() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 bg-muted animate-pulse rounded w-56 mb-2" />
        <div className="h-4 bg-muted animate-pulse rounded w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-2xl border bg-card p-3 animate-pulse"
          >
            <div className="w-[120px] aspect-[2/3] bg-muted rounded-xl flex-shrink-0" />
            <div className="flex-1 py-1 space-y-2">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ScreeningsPage() {
  const user = await getCurrentUser();

  return (
    <Suspense fallback={<ScreeningsFallback />}>
      <ScreeningsPageContent isLoggedIn={!!user} />
    </Suspense>
  );
}
