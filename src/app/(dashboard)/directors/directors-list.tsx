import DirectorCard from "@/components/directors/card";

export function DirectorsList() {
  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {/* <DirectorCard key={d.id} director={d} /> */}
      <DirectorCard />
      <DirectorCard />
      <DirectorCard />
      <DirectorCard />
      <DirectorCard />
    </div>
  );
}
