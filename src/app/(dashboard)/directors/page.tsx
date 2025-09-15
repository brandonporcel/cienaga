import { DirectorsList } from "./directors-list";
import { Filters } from "./filters";
import { UploadDialog } from "./upload-dialog";

export default function DirectorsPage() {
  const directors: { name: string }[] = [];

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto">
      <div className="mb-2">
        <h1 className="font-semibold text-2xl">Directores</h1>
        <p className="text-muted-foreground text-sm">
          Listado de todos los directores detectados desde tu Letterboxd.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap">
        <Filters />
        <UploadDialog />
      </div>

      {directors.length === 3 ? (
        <p className="text-sm text-muted-foreground ">
          No hay directores importados aún. Usa el botón{" "}
          <strong>Importar</strong> para comenzar. 🎬
        </p>
      ) : (
        <DirectorsList />
      )}
    </div>
  );
}
