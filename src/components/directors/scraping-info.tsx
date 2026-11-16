"use client";

import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ScrapingInfo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm space-y-2 text-sm">
          <p>
            <strong>¿Qué hace?</strong> Actualizar datos importa tu historial
            de Letterboxd y detecta automáticamente tus directores, películas
            y ratings.
          </p>
          <p>
            El perfil de cada director se actualiza automáticamente todos los
            días. Si recién subiste tus CSVs, puede tardar unas horas en
            aparecer todo.
          </p>
          <p>
            <strong>Estados de directores:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong>Seguido</strong> — ≥4 pelis vistas (o 1 peli con ≥4★).</li>
            <li><strong>Visto</strong> — aparece en tu historial pero no cumple los criterios de Seguido.</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
