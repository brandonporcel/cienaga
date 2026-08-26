import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase/service";
import UnsubscribeClient from "./unsubscribe-client";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Enlace inválido</h1>
          <p className="text-gray-400">El enlace de desuscripción no es válido.</p>
        </div>
      </div>
    );
  }

  // Validate user exists using service client (bypasses RLS)
  const supabase = createServiceClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, full_name, email, unsubscribed")
    .eq("id", token)
    .single();

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Usuario no encontrado</h1>
          <p className="text-gray-400">
            No se encontró una cuenta asociada a este enlace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
          <p className="text-gray-400">Cargando...</p>
        </div>
      }
    >
      <UnsubscribeClient
        userId={user.id}
        userName={user.full_name || "Cinéfilo"}
        isCurrentlySubscribed={!user.unsubscribed}
      />
    </Suspense>
  );
}

export default UnsubscribePage;
