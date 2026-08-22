import { getDirectors } from "@/app/actions/directors";
import { ScrapingInfo } from "@/components/directors/scraping-info";

import { DirectorsGrid } from "./directors-list";
import { UploadDialog } from "./upload-dialog";

export default async function DirectorsPage() {
  const directors = await getDirectors();

  return (
    <div className="w-full">
      <DirectorsGrid
        directors={directors}
        toolbar={
          <>
            <ScrapingInfo />
            <UploadDialog />
          </>
        }
      />
    </div>
  );
}
