type Route = {
  path: string;
  label?: string;
};
export const ROUTES: Record<string, Route> = {
  home: { path: "/" },
  login: { path: "/login" },
  dashboard: { path: "/dashboard", label: "Dashboard" },
  help: { path: "/help", label: "Centro de Ayuda" },
  settings: { path: "/settings", label: "Perfil" },
  billing: { path: "/billing", label: "Facturación" },
} as const;
