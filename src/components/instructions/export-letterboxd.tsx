import Image from "next/image";

const ExportLetterboxd = () => {
  return (
    <div className="h-full bg-white/40 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden border border-white/20">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 left-4 w-8 h-8 border border-gray-400/30 rounded"></div>
        <div className="absolute top-12 right-8 w-6 h-6 border border-gray-400/30 rounded"></div>
        <div className="absolute bottom-8 left-8 w-4 h-4 border border-gray-400/30 rounded"></div>
      </div>

      {/* Letterboxd logo */}
      <div className="relative w-32 h-16 mb-4 bg-[#202932] rounded-lg p-2">
        <Image
          src="https://a.ltrbxd.com/logos/letterboxd-logo-v-neg-rgb.svg"
          alt="Letterboxd logo"
          fill
          className="object-contain"
        />
      </div>

      {/* CSV file icon */}
      <div className="bg-gray-100/60 backdrop-blur-sm rounded-xl p-4 mb-4 border border-gray-200/40">
        <div className="w-12 h-12 bg-emerald-100/80 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>

      <p className="text-gray-700 text-sm text-center font-medium">
        Subí tu archivo CSV
      </p>
    </div>
  );
};

export default ExportLetterboxd;
