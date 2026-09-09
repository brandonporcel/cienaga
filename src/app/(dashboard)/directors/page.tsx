import { ScrapingInfo } from "@/components/directors/scraping-info";
import { getDirectors } from "@/app/actions/directors";

import { DirectorsGrid } from "./directors-list";
import { UploadDialog } from "./upload-dialog";

export default async function DirectorsPage() {
  const { directors, pendingMovies, recentImports } = await getDirectors();

  return (
    <div className="w-full">
      <DirectorsGrid
        directors={directors}
        pendingMovies={pendingMovies}
        recentImports={recentImports}
        toolbar={
          <>
            <UploadDialog />
            <ScrapingInfo />
          </>
        }
      />
    </div>
  );
}
