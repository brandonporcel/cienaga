"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Filter, LayoutGrid, List, Search } from "lucide-react";

import { Director, DirectorSource } from "@/types/director";
import DirectorCard from "@/components/directors/card";
import { DirectorDetailDialog } from "@/components/directors/detail-dialog";
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
import { cn } from "@/lib/utils";

type ListFilter = "all" | "auto" | "manual" | "muted" | "alpha";
type ViewMode = "grid" | "table";

const FILTER_LABELS: Record<Exclude<ListFilter, "all" | "alpha">, string> = {
  auto: "Seguidos",
  manual: "Favoritos",
  muted: "Silenciados",
};

const SOURCE_BADGE_CLASSES: Record<DirectorSource, string> = {
  auto: "bg-emerald-500/90 text-white",
  manual: "bg-sky-500/90 text-white",
  muted: "bg-zinc-500/90 text-white",
};

const SOURCE_BADGE_LABELS: Record<DirectorSource, string> = {
  auto: "Seguido",
  manual: "Favorito",
  muted: "Silenciado",
};

export function DirectorsGrid({ directors: initial, toolbar }: { directors: Director[]; toolbar?: React.ReactNode }) {
  const [directors, setDirectors] = useState(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ListFilter>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [detailDirector, setDetailDirector] = useState<Director | null>(null);

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

          <div className="flex items-center border rounded-md">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setView("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {toolbar}
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
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((director) => (
            <DirectorCard
              key={director.id}
              director={director}
              onPreferenceChanged={handlePreferenceChanged}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Director</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Detectado</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((director) => (
                <tr
                  key={director.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setDetailDirector(director)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={
                          director.image_url ||
                          "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg"
                        }
                        alt={director.name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover w-8 h-8"
                      />
                      <span className="font-medium">{director.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {director.source && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-xs font-medium",
                          SOURCE_BADGE_CLASSES[director.source],
                        )}
                      >
                        {SOURCE_BADGE_LABELS[director.source]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {new Date(director.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={director.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md hover:bg-muted transition-colors inline-flex"
                    >
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailDirector && (
        <DirectorDetailDialog
          director={detailDirector}
          open={detailDirector !== null}
          onOpenChange={(open) => !open && setDetailDirector(null)}
          onPreferenceChanged={handlePreferenceChanged}
        />
      )}
    </>
  );
}
