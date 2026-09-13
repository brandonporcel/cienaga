"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowUpRight, Filter, LayoutGrid, List, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Director, DirectorSource } from "@/types/director";
import { cn } from "@/lib/utils";
import {
  DirectorSearchResult,
  RecentImport,
  searchDirectors,
  updateDirectorPreference,
} from "@/app/actions/directors";
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

type ListFilter = "all" | "seguidos" | "vistos" | "alpha";
type ViewMode = "grid" | "table";

const SOURCE_BADGE_CLASSES: Record<DirectorSource, string> = {
  auto: "bg-emerald-500/90 text-white",
  manual: "bg-sky-500/90 text-white",
};

const SOURCE_BADGE_LABELS: Record<DirectorSource, string> = {
  auto: "Seguido",
  manual: "Seguido",
};

export function DirectorsGrid({
  directors: initial,
  toolbar,
  pendingMovies = 0,
  recentImports = [],
}: {
  directors: Director[];
  toolbar?: React.ReactNode;
  pendingMovies?: number;
  recentImports?: RecentImport[];
}) {
  const router = useRouter();
  const [directors, setDirectors] = useState(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ListFilter>("seguidos");
  const [view, setView] = useState<ViewMode>("grid");
  const [detailDirector, setDetailDirector] = useState<Director | null>(null);
  const [searchResults, setSearchResults] = useState<DirectorSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Sincronizar con las props nuevas (router.refresh() tras importar):
  // reemplaza el estado local solo si el set de directores cambió.
  useEffect(() => {
    setDirectors((prev) => {
      const sameIds =
        prev.length === initial.length &&
        prev.every((d) => initial.some((i) => i.id === d.id));
      return sameIds ? prev : initial;
    });
  }, [initial]);

  // Búsqueda global en la DB (debounce 300ms): busca directores que no
  // están en la lista del usuario (ej. para seguir directores nuevos).
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchDirectors(query)
        .then((results) => {
          if (!cancelled) setSearchResults(results);
        })
        .catch(() => {
          if (!cancelled) setSearchResults(null);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleFollowSearchResult = async (directorId: string) => {
    try {
      await updateDirectorPreference(directorId, "follow");
      setSearchResults((prev) =>
        prev?.map((r) =>
          r.id === directorId ? { ...r, relation: "followed" } : r,
        ) ?? null,
      );
      toast.success("Director seguido");
      router.refresh();
    } catch {
      toast.error("No se pudo seguir al director");
    }
  };

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
      case "seguidos":
        return byQuery.filter((d) => d.source === "auto" || d.source === "manual");
      case "vistos":
        return byQuery.filter((d) => !d.source);
      case "alpha":
        return [...byQuery].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return byQuery;
    }
  }, [directors, query, filter]);

  // Resultados globales que NO están visibles en la grilla actual (los
  // ocultos por el filtro, ej. "Seguidos" con directores solo vistos,
  // sí se muestran acá para poder seguirlos).
  const globalResults = (searchResults ?? []).filter(
    (r) => !filtered.some((d) => d.id === r.id),
  );

  const pendingScraping = directors.filter((d) => !d.tmdb_id && d.url);
  const pendingNames = pendingScraping.map((d) => d.name).join(", ");

  // Pelis subidas recientemente que aún no tienen director detectado
  const pendingImports = recentImports.filter((m) => !m.hasDirector);

  return (
    <>
      <div className="mb-2">
        <h1 className="font-semibold text-2xl">Directores</h1>
        <p className="text-muted-foreground text-sm">
          {directors.length === 0
            ? "Listado de todos los directores detectados desde tu Letterboxd."
            : (() => {
                const followed = directors.filter(
                  (d) => d.source === "auto" || d.source === "manual",
                ).length;
                return `${followed} Seguido${followed === 1 ? "" : "s"} · ${directors.length} detectado${directors.length === 1 ? "" : "s"} desde tu Letterboxd.`;
              })()}
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
              <DropdownMenuItem onClick={() => setFilter("seguidos")}>
                Seguidos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("vistos")}>
                Vistos
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
        <div className="flex items-center gap-2">{toolbar}</div>
      </div>

      {pendingScraping.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-700 dark:text-blue-300">
          ℹ️ {pendingScraping.length} director
          {pendingScraping.length !== 1 ? "es" : ""} pendiente
          {pendingScraping.length !== 1 ? "s" : ""} de procesar: {pendingNames}.
        </div>
      )}

      {pendingImports.length > 0 && (
        <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
            📥 Subiste {recentImports.length}{" "}
            {recentImports.length === 1 ? "película" : "películas"}:{" "}
            {pendingImports.length} en proceso de detección de directores.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
            {pendingImports.map((movie) => (
              <li key={movie.id} className="flex items-center gap-2">
                <span aria-hidden>⏳</span>
                <span>
                  {movie.title}
                  {movie.year ? ` (${movie.year})` : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-300/80">
            En las próximas corridas del cron detectamos los directores de
            las películas pendientes y aparecen acá automáticamente.
          </p>
        </div>
      )}

      {pendingMovies > 0 && pendingImports.length === 0 && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-300">
          📥 {pendingMovies} película{pendingMovies !== 1 ? "s" : ""} en
          proceso de detección de directores. En las próximas corridas del
          cron los vas a ver aparecer acá automáticamente.
        </div>
      )}

      {searching && query.trim() && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Buscando en todos los directores...
        </div>
      )}

      {!searching && globalResults.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Otros directores en la base
          </p>
          <div className="border rounded-lg divide-y">
            {globalResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center gap-3 px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() =>
                    setDetailDirector(result as unknown as Director)
                  }
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <Image
                    src={
                      result.image_url ||
                      "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg"
                    }
                    alt={result.name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover w-8 h-8 hover:ring-2 hover:ring-primary transition-all"
                  />
                  <span className="truncate font-medium">{result.name}</span>
                  {result.relation === "watched" && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/90 text-white shrink-0">
                      Visto
                    </span>
                  )}
                </button>
                {result.relation === "followed" ? (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/90 text-white shrink-0">
                    Seguido
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFollowSearchResult(result.id)}
                  >
                    Seguir
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        directors.length === 0 ? (
          pendingMovies > 0 ? (
            <p className="text-sm text-muted-foreground">
              Tus {pendingMovies} película{pendingMovies !== 1 ? "s" : ""} se
              están procesando. En las próximas corridas del cron aparecerán
              tus directores detectados acá. 🎬
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay directores importados aún. Usa el botón{" "}
              <strong>Actualizar Datos</strong> para comenzar. 🎬
            </p>
          )
        ) : filter === "seguidos" &&
          directors.some((d) => !d.source) ? (
          <p className="text-sm text-muted-foreground">
            Todavía no seguís directores. Los detectados desde tus películas
            aparecen al filtrar por <strong>Vistos</strong> o{" "}
            <strong>Todos</strong>.
          </p>
        ) : globalResults.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            No tenés directores propios para esa búsqueda, pero hay otros
            directores en la base arriba. Tocá <strong>Seguir</strong> para
            agregarlos a tu lista.
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
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  Vistas
                </th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  Detectado
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((director) => (
                <tr
                  key={director.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDetailDirector(director)}
                        className="cursor-pointer"
                      >
                        <Image
                          src={
                            director.image_url ||
                            "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg"
                          }
                          alt={director.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover w-8 h-8 hover:ring-2 hover:ring-primary transition-all"
                        />
                      </button>
                      <span className="font-medium">{director.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {director.source ? (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-xs font-medium",
                          SOURCE_BADGE_CLASSES[director.source],
                        )}
                      >
                        {SOURCE_BADGE_LABELS[director.source]}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/90 text-white">
                        Visto
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {director.movies_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {new Date(director.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailDirector(director)}
                        className="p-1 rounded-md hover:bg-muted transition-colors text-xs text-muted-foreground cursor-pointer"
                      >
                        Ver filmo
                      </button>
                      <a
                        href={director.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-md hover:bg-muted transition-colors inline-flex"
                      >
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>
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
