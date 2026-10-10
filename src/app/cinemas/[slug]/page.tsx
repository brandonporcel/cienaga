import { notFound } from "next/navigation";

import { createClientForServer } from "@/lib/supabase/server";
import Cinema from "@/types/cinema";
import CinemaDetailClient from "@/components/cinemas/cinema-detail-client";

export const metadata = {
  title: "Cine | Ciénaga",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CinemaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClientForServer();

  const { data: cinema, error } = await supabase
    .from("cinemas")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !cinema) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1320px] mx-auto px-4 py-8 md:py-12">
        <CinemaDetailClient cinema={cinema as Cinema} />
      </div>
    </div>
  );
}