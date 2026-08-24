type RouteObject = {
  path: string;
  label?: string;
};
type Route =
  | "home"
  | "login"
  | "dashboard"
  | "directors"
  | "help"
  | "settings"
  | "notifications";

export const ROUTES: Record<Route, RouteObject> = {
  home: { path: "/" },
  login: { path: "/login" },
  dashboard: { path: "/dashboard", label: "Cartelera" },
  directors: { path: "/directors", label: "Directores" },
  help: { path: "/help", label: "Centro de Ayuda" },
  settings: { path: "/settings", label: "Configuración" },
  notifications: { path: "/notifications", label: "Notificaciones" },
} as const;
