import { getDirectors } from "@/app/actions/directors";

import { DirectorsGrid } from "./directors-list";
import { UploadDialog } from "./upload-dialog";

export default async function DirectorsPage() {
  const directors = await getDirectors();

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-end mb-4">
        <UploadDialog />
      </div>

      <DirectorsGrid directors={directors} />
    </div>
  );
}
