"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ScrapingInfo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="inline-block">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-muted-foreground"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
      </Button>
      {open && (
        <div className="mt-2 p-4 rounded-lg border bg-muted/50 text-sm text-muted-foreground space-y-2 max-w-lg">
          <p>
            <strong>¿Cómo funciona?</strong> Ciénaga detecta automáticamente tus directores favoritos
            a partir de tu historial de Letterboxd.
          </p>
          <p>
            El perfil de cada director (foto, filmografía) se actualiza automáticamente
            todos los días. Si recién subiste tus CSVs, puede tardar unas horas en completarse.
          </p>
          <p>
            <strong>Estados:</strong> Seguido (cumple las reglas), Favorito (lo seguís manualmente),
            Visto (en tu historial pero no cumple las reglas), Silenciado (no querés notificaciones).
          </p>
        </div>
      )}
    </div>
  );
}
