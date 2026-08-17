import { getDirectors } from "@/app/actions/directors";

import { DirectorsGrid } from "./directors-list";
import { UploadDialog } from "./upload-dialog";

export default async function DirectorsPage() {
  const directors = await getDirectors();

  return (
    <div className="w-full">
      <DirectorsGrid directors={directors} toolbar={<UploadDialog />} />
    </div>
  );
}
