const CinemaListings = () => {
  const cinemas = [
    { name: "Gaumont", status: "online" },
    { name: "Cosmos", status: "online" },
    { name: "Malba", status: "online" },
    { name: "Sala Lugones", status: "updating" },
  ];

  return (
    <div className="h-full bg-white/40 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden border border-white/20">
      {/* Background decoration */}
      <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-bl from-amber-200/30 to-transparent rounded-full blur-lg"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-amber-100/80 rounded-full flex items-center justify-center border border-amber-200/40">
            <svg
              className="w-4 h-4 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <span className="text-gray-800 font-semibold text-sm">
            Cartelera Porteña
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {cinemas.map((cinema) => (
            <div
              key={cinema.name}
              className="bg-gray-50/60 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center border border-gray-200/30"
            >
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-gray-800 text-xs font-medium">
                  {cinema.name}
                </span>
                <div
                  className={`w-2 h-2 rounded-full ${cinema.status === "online" ? "bg-emerald-500" : "bg-amber-500"}`}
                ></div>
              </div>
              <div className="w-full h-8 bg-gradient-to-r from-amber-100/80 to-orange-100/80 rounded-lg flex items-center justify-center border border-amber-200/30">
                <span className="text-amber-700 text-xs font-medium">
                  {cinema.status === "online"
                    ? "Actualizado"
                    : "Actualizando..."}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CinemaListings;
