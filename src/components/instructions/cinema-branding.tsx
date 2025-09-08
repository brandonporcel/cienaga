const CinemaBranding = () => {
  return (
    <div className="h-full bg-white/40 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden border border-white/20">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-8 left-8 w-16 h-16 border border-rose-300/40 rounded-full"></div>
        <div className="absolute bottom-12 right-6 w-12 h-12 border border-pink-300/40 rounded-full"></div>
        <div className="absolute top-16 right-12 w-8 h-8 bg-rose-200/40 rounded-full blur-sm"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
        {/* Film reel icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-rose-100/80 to-pink-100/80 rounded-full flex items-center justify-center mb-4 border border-rose-200/40 shadow-sm">
          <svg
            className="w-8 h-8 text-rose-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v1M7 4V3a1 1 0 011-1v0M7 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1M7 4h10"
            />
          </svg>
        </div>

        <h3 className="text-gray-800 font-bold text-lg mb-2">Ciénaga</h3>
        <p className="text-gray-600 text-sm leading-relaxed font-medium">
          Diseño simple,
          <br />
          centrado en vos
        </p>

        {/* Decorative elements */}
        <div className="mt-4 flex gap-2">
          <div className="w-2 h-2 bg-rose-400 rounded-full shadow-sm"></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full shadow-sm"></div>
          <div className="w-2 h-2 bg-rose-400 rounded-full shadow-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default CinemaBranding;
