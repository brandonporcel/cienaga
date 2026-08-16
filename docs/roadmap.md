# Roadmap

> Bugs conocidos y pendientes. Última actualización: 2026-08-16.

## Bugs conocidos (priorizados)

### P2 — Links de unsubscribe inexistentes
- `email.service.ts` y `template.builder.ts` arman `/unsubscribe?token=...` pero la ruta no existe. Crear la ruta (con token por usuario) o sacar el link.
- Estado: pendiente.

### P2 — Emails salen del dominio de prueba de Resend
- `from: "onboarding@resend.dev"` no entrega en producción. Para no pagar: verificar un dominio propio en Resend (plan free: 100 emails/día, 3000/mes — sobra para uso personal). Vercel: el subdominio `.vercel.app` no se puede verificar en Resend; se necesita un dominio propio.
- Estado: pendiente (requiere dominio propio; postergado por el usuario).

### P2 — `/api/screenings/featured` no es "top"
- Filtro de fecha y order por rating comentados (`src/app/api/screenings/featured/route.ts`). Devuelve 6 screenings en orden físico, incluyendo funciones pasadas y screenings sin `screening_times`.
- **Decisión**: quedó a medias; retomar con orden determinista + filtro de fecha + `screening_times` no vacíos.
- Estado: pendiente (pateado por el usuario).

### P2 — "Directores favoritos" no existe
- `user_directors` se genera con "vio 1 película → lo sigue" en `movies/batch`. Sin umbral, rating mínimo ni selección explícita.
- **Decisión de producto pendiente**: ¿umbral (≥3 pelis), rating ≥ 4, o selección manual? Definir antes de invertir en notificaciones.
- Estado: pendiente (el usuario quiere pensar varias validaciones antes de definirlo).

### P3 — Bugs menores
- `count-pending` no valida Bearer y su filtro no coincide con `/api/movies/pending`.
- Filtros client-side del dashboard no filtran la grilla (solo el mensaje de "sin resultados").
- `addToCalendar` (`src/components/screenings/card.tsx`) usa `new Date()` en vez del horario de la función.
- `email.service.ts` parsea `screening.screening_time_text` con `new Date()` → "Invalid Date" en el texto plano; `notification.service.ts` ordena por `screening.screening_time` (propiedad inexistente).
- Workflows de scrape hacen `npm install` suelto (axios, cheerio...) en vez de instalar el proyecto con lockfile.
- `rating: isNaN(...) ? undefined : undefined` en `letterboxd.ts` — no-op; el rating nunca se persiste.

## Infraestructura

### Sin CI de verificación
- No hay tests ni workflow de lint/build en PRs. Mínimo viable: agregar `pnpm lint` + `pnpm type-check` a un workflow de PR.
- Estado: pendiente.

## Mejoras pendientes (ideas de producto)

- Integración con Google Calendar (ver `addToCalendar` roto como base).
- Códigos QR para funciones.
- Soporte para más ciudades.
- Terminar scrapers de cines (Sala Lugones, CCK, Gaumont, Lorca, Cosmos, Sigilio).
- Tests (vitest para servicios y scrapers).
- Personalización de ventana temporal para notificaciones (próximas x horas/días).
- Tablas en listados (referencia: justinmind data table).
- En vez de scrapear, obtener datos del JSON de Letterboxd (`https://letterboxd.com/film/<slug>/json/`).
