"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import Screening from "@/types/screening";
import ScreeningsBrowser from "@/components/screenings/screenings-browser";
import { Button } from "@/components/ui/button";

export default function ScreeningsPageContent() {
  const searchParams = useSearchParams();
  const highlightSlug = searchParams.get("movie");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1320px] mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
          <h1 className="text-3xl md:text-5xl font-semibold">
            Todas las funciones
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Próximas funciones en Buenos Aires
          </p>
        </div>

        <ScreeningsBrowser
          highlightSlug={highlightSlug}
          loadScreenings={async (): Promise<Screening[]> => {
            const res = await fetch("/api/screenings/all");
            if (!res.ok) return [];
            const data: { data: Screening[] } = await res.json();
            return data.data ?? [];
          }}
        />
      </div>
    </div>
  );
}