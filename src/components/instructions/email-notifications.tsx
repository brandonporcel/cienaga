const EmailNotifications = () => {
  return (
    <div className="h-full bg-white/40 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden border border-white/20">
      {/* Background decoration */}
      <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-lg"></div>

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-emerald-100/80 rounded-full flex items-center justify-center border border-emerald-200/40">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <span className="text-gray-800 font-semibold text-sm">
            Notificaciones
          </span>
        </div>

        {/* Email notification mockup */}
        <div className="bg-gray-50/60 backdrop-blur-sm rounded-xl p-4 mb-4 border border-emerald-200/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100/80 rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-200/40">
              <svg
                className="w-4 h-4 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-gray-800 text-xs font-semibold mb-1">
                ¡Nueva película de Nolan!
              </p>
              <p className="text-gray-600 text-xs leading-relaxed">
                "Oppenheimer" se estrena en Gaumont Recoleta este viernes.
              </p>
            </div>
          </div>
        </div>

        {/* Bell icon with pulse animation */}
        <div className="flex-1 flex items-end justify-center">
          <div className="relative">
            <div className="w-12 h-12 bg-emerald-100/80 rounded-full flex items-center justify-center animate-pulse border border-emerald-200/40">
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
                  d="M15 17h5l-5 5v-5zM3 3h12v12H3V3z"
                />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailNotifications;
