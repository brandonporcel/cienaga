const FavoriteDirectors = () => {
  const directors = [
    { name: "Christopher Nolan", films: 12 },
    { name: "Denis Villeneuve", films: 8 },
    { name: "Greta Gerwig", films: 5 },
    { name: "Jordan Peele", films: 4 },
  ];

  return (
    <div className="h-full bg-white/40 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden border border-white/20">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full blur-xl"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-purple-100/80 rounded-full flex items-center justify-center border border-purple-200/40">
            <svg
              className="w-4 h-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <span className="text-gray-800 font-semibold text-sm">
            Tus Directores
          </span>
        </div>

        <div className="space-y-3">
          {directors.map((director, index) => (
            <div
              key={director.name}
              className="flex items-center justify-between bg-gray-50/60 backdrop-blur-sm rounded-xl p-3 border border-gray-200/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-purple-800 text-xs font-bold shadow-sm border border-purple-200">
                  {director.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <span className="text-gray-800 text-sm font-medium">
                  {director.name}
                </span>
              </div>
              <span className="text-purple-600 text-xs font-semibold">
                {director.films} films
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FavoriteDirectors;
