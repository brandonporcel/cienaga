import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedRoutes = ["/dashboard"];

/**
 * Middleware de autenticación con Supabase
 * - Se ejecuta en cada request que matchee el `config.matcher`
 */
export async function middleware(request: NextRequest) {
  // Esta será la respuesta por defecto (si no hay redirección ni error)
  let supabaseResponse = NextResponse.next({ request });

  // Crear cliente de Supabase en el lado del servidor (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Persistir cookies en la request
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          // Persistir cookies en la response
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(pathname);

  // Obtener sesión del usuario
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Si intenta acceder a ruta protegida sin estar logueado → redirigir al home
  if (isProtectedRoute && (!user || error)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Si todo está bien, continuar
  return supabaseResponse;
}

// Configuración: excluir assets estáticos y favicon
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
