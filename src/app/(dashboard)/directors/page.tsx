import { getDirectors } from "@/app/actions/directors";

import { DirectorsGrid } from "./directors-list";

export default async function DirectorsPage() {
  const { directors, pendingMovies, recentImports } = await getDirectors();

  return (
    <div className="w-full">
      <DirectorsGrid
        directors={directors}
        pendingMovies={pendingMovies}
        recentImports={recentImports}
      />
    </div>
  );
}
