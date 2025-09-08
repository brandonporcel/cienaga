const CTAFinal = () => {
  return (
    <div className="h-full bg-white/40 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden border border-white/20">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-4 left-4 w-6 h-6 bg-indigo-500/20 rounded rotate-45"></div>
        <div className="absolute bottom-8 right-8 w-8 h-8 bg-purple-500/20 rounded rotate-12"></div>
        <div className="absolute top-12 right-6 w-4 h-4 bg-indigo-400/30 rounded-full"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
        {/* Rocket icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100/80 to-purple-100/80 rounded-full flex items-center justify-center mb-4 border border-indigo-200/40 shadow-sm">
          <svg
            className="w-8 h-8 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <h3 className="text-gray-800 font-semibold text-lg mb-2">
          ¡Empezá ahora!
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Subí tu CSV y recibí
          <br />
          alertas hoy mismo
        </p>

        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg">
          Comenzar
        </button>
      </div>
    </div>
  );
};

export default CTAFinal;
