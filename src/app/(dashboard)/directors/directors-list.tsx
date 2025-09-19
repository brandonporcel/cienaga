import { Director } from "@/types/director";
import DirectorCard from "@/components/directors/card";

export function DirectorsList({ directors }: { directors: Director[] }) {
  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {directors.map((director) => (
        <DirectorCard key={director.id} director={director} />
      ))}
    </div>
  );
}
