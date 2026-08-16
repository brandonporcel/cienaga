"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";

import { Director, DirectorSource } from "@/types/director";
import DirectorCard from "@/components/directors/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type ListFilter = "all" | "auto" | "manual" | "muted" | "alpha";

const FILTER_LABELS: Record<Exclude<ListFilter, "all" | "alpha">, string> = {
  auto: "Seguidos",
  manual: "Favoritos",
  muted: "Silenciados",
};

export function DirectorsGrid({ directors: initial }: { directors: Director[] }) {
  const [directors, setDirectors] = useState(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ListFilter>("all");

  const handlePreferenceChanged = (
    directorId: string,
    source: DirectorSource | null,
  ) => {
    setDirectors((prev) =>
      source === null
        ? prev.filter((d) => d.id !== directorId)
        : prev.map((d) => (d.id === directorId ? { ...d, source } : d)),
    );
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const byQuery = normalized
      ? directors.filter((d) => d.name.toLowerCase().includes(normalized))
      : directors;

    switch (filter) {
      case "auto":
      case "manual":
      case "muted":
        return byQuery.filter((d) => d.source === filter);
      case "alpha":
        return [...byQuery].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return byQuery;
    }
  }, [directors, query, filter]);

  return (
    <>
      <div className="mb-2">
        <h1 className="font-semibold text-2xl">Directores</h1>
        <p className="text-muted-foreground text-sm">
          {directors.length === 0
            ? "Listado de todos los directores detectados desde tu Letterboxd."
            : `${directors.length} directore${directors.length === 1 ? "r" : "s"} detectado${directors.length === 1 ? "" : "s"} desde tu Letterboxd.`}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar directores..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-[300px] pl-8"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" /> Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter("all")}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("auto")}>
                Seguidos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("manual")}>
                Favoritos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("muted")}>
                Silenciados
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter("alpha")}>
                Alfabéticamente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filtered.length === 0 ? (
        directors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay directores importados aún. Usa el botón{" "}
            <strong>Actualizar Datos</strong> para comenzar. 🎬
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No se encontraron directores para esa búsqueda o filtro.
          </p>
        )
      ) : (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((director) => (
            <DirectorCard
              key={director.id}
              director={director}
              onPreferenceChanged={handlePreferenceChanged}
            />
          ))}
        </div>
      )}
    </>
  );
}
