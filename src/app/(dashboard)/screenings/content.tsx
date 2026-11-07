"use client";

import { useSearchParams } from "next/navigation";

import Screening from "@/types/screening";
import ScreeningsBrowser from "@/components/screenings/screenings-browser";
import { LastScrapeBadge } from "@/components/scrape/last-scrape-badge";

export default function ScreeningsPageContent({
  isLoggedIn,
}: {
  isLoggedIn: boolean;
}) {
  const searchParams = useSearchParams();
  const highlightSlug = searchParams.get("movie");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Todas las funciones</h1>
        <p className="text-muted-foreground text-sm">
          Próximas funciones en Buenos Aires
        </p>
        <LastScrapeBadge className="mt-1" />
      </div>

      <ScreeningsBrowser
        highlightSlug={highlightSlug}
        isLoggedIn={isLoggedIn}
        loadScreenings={async (): Promise<Screening[]> => {
          const res = await fetch("/api/screenings/all");
          if (!res.ok) return [];
          const data: { data: Screening[] } = await res.json();
          return data.data ?? [];
        }}
      />
    </>
  );
}
