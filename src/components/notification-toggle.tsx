"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { setUnsubscribed } from "@/app/actions/unsubscribe";

interface Props {
  userId: string;
  initialSubscribed: boolean;
}

export function NotificationToggle({ userId, initialSubscribed }: Props) {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const result = await setUnsubscribed(userId, isSubscribed);
    if (result.success) {
      setIsSubscribed(!isSubscribed);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="w-5 h-5 text-amber-500" />
        ) : (
          <BellOff className="w-5 h-5 text-gray-500" />
        )}
        <div>
          <p className="text-sm font-medium">
            {isSubscribed ? "Recibiendo notificaciones" : "Notificaciones desactivadas"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isSubscribed
              ? "Te avisamos cuando haya películas de tus directores favoritos"
              : "No recibirás correos de nuevas funciones"}
          </p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isSubscribed ? "bg-amber-600" : "bg-gray-600"
        } disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 text-white animate-spin ml-3" />
        ) : (
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isSubscribed ? "translate-x-6" : "translate-x-1"
            }`}
          />
        )}
      </button>
    </div>
  );
}
