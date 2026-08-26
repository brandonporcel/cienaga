"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Bell, BellOff } from "lucide-react";
import { setUnsubscribed } from "@/app/actions/unsubscribe";

interface Props {
  userId: string;
  userName: string;
  isCurrentlySubscribed: boolean;
}

export default function UnsubscribeClient({
  userId,
  userName,
  isCurrentlySubscribed,
}: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [isSubscribed, setIsSubscribed] = useState(isCurrentlySubscribed);

  const handleToggle = async () => {
    setState("loading");
    const result = await setUnsubscribed(userId, isSubscribed);
    if (result.success) {
      setIsSubscribed(!isSubscribed);
      setState("done");
    } else {
      setState("idle");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {isSubscribed ? (
          <>
            <Bell className="w-16 h-16 text-amber-500 mx-auto" />
            <h1 className="text-2xl font-bold text-white">
              Hola, {userName}
            </h1>
            <p className="text-gray-400 leading-relaxed">
              Actualmente estás recibiendo notificaciones cuando se proyectan
              películas de tus directores favoritos en Buenos Aires.
            </p>
            <p className="text-gray-500 text-sm">
              Si ya no querés recibir más notificaciones, podés desuscribirte.
            </p>
            <button
              onClick={handleToggle}
              disabled={state === "loading"}
              className="w-full py-3 px-6 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <BellOff className="w-5 h-5" />
              {state === "loading"
                ? "Procesando..."
                : "Desuscribirme de las notificaciones"}
            </button>
          </>
        ) : state === "done" ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-white">Desuscrito</h1>
            <p className="text-gray-400 leading-relaxed">
              No recibirás más notificaciones de Ciénaga.
            </p>
            <p className="text-gray-500 text-sm">
              Si cambias de opinión, podés volver a suscribirte desde tu
              configuración.
            </p>
            <button
              onClick={handleToggle}
              className="w-full py-3 px-6 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Bell className="w-5 h-5" />
              Volver a suscribirme
            </button>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-white">Error</h1>
            <p className="text-gray-400">
              No se pudo procesar tu solicitud. Intentá de nuevo.
            </p>
            <button
              onClick={() => setState("idle")}
              className="py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm transition-colors"
            >
              Reintentar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
