import DirectorCard from "@/components/directors/card";
import { getDirectors } from "@/app/actions/directors";

import { Filters } from "./filters";
import { UploadDialog } from "./upload-dialog";

export default async function DirectorsPage() {
  const directors = await getDirectors();

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto">
      <div className="mb-2">
        <h1 className="font-semibold text-2xl">Directores</h1>
        <p className="text-muted-foreeground text-sm">
          Listado de todos los directores detectados desde tu Letterboxd.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap">
        <Filters />
        <UploadDialog />
      </div>

      {directors.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay directores importados aún. Usa el botón{" "}
          <strong>Actualizar Datos</strong> para comenzar. 🎬
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {directors.map((director) => (
            <DirectorCard key={director.id} director={director} />
          ))}
        </div>
      )}
    </div>
  );
}
