# Roadmap

> Bugs conocidos, decisiones y pendientes. Última actualización: 2026-08-16.

## Bugs conocidos (priorizados)

### P2 — Links de unsubscribe inexistentes
- `email.service.ts` y `template.builder.ts` arman `/unsubscribe?token=...` pero la ruta no existe. Crear la ruta (con token por usuario) o sacar el link.
- Estado: pendiente.

### P2 — Emails salen del dominio de prueba de Resend
- `from: "onboarding@resend.dev"` no entrega en producción. Para no pagar: verificar un dominio propio en Resend (plan free: 100 emails/día, 3000/mes — sobra para uso personal). Vercel: el subdominio `.vercel.app` no se puede verificar en Resend; se necesita un dominio propio.
- Estado: pendiente (requiere dominio propio).

### P2 — `/api/screenings/featured` no es "top"
- Filtro de fecha y order por rating comentados (`src/app/api/screenings/featured/route.ts`). Devuelve 6 screenings en orden físico, incluyendo funciones pasadas y screenings sin `screening_times`.
- **Decisión**: quedó a medias; retomar con orden determinista + filtro de fecha + `screening_times` no vacíos.
- Estado: pendiente.

### P2 — "Directores favoritos" no existe
- `user_directors` se genera con "vio 1 película → lo sigue" en `movies/batch`. Sin umbral, rating mínimo ni selección explícita.
- **Decisión de producto pendiente**: ¿umbral (≥3 pelis), rating ≥ 4, o selección manual? Definir antes de invertir en notificaciones.
- Estado: pendiente.

### P2 — El workflow de screenings siempre falla
- Seed con 8 cines `enabled` pero solo Malba y Lumiton tienen scraper; `scrape-screenings.ts` hace `process.exit(1)` cuando failed > successful.
- **Fix**: deshabilitar cines sin scraper en el seed, o que el script no falle por cines sin scraper.
- Estado: pendiente.

### P3 — Bugs menores
- `movies/batch` actualiza columna inexistente `national_name` (la real es `national_title`) — error no chequeado.
- `count-pending` no valida Bearer y su filtro no coincide con `/api/movies/pending`.
- Filtros client-side del dashboard no filtran la grilla (solo el mensaje de "sin resultados").
- `addToCalendar` (`src/components/screenings/card.tsx`) usa `new Date()` en vez del horario de la función.
- `email.service.ts` parsea `screening.screening_time_text` con `new Date()` → "Invalid Date" en el texto plano; `notification.service.ts` ordena por `screening.screening_time` (propiedad inexistente).
- `template.builder.ts` asume `cinema.image_url` no null (Cine Lorca lo tiene null) → crash del email.
- Workflows de scrape hacen `npm install` suelto (axios, cheerio...) en vez de instalar el proyecto con lockfile.
- `rating: isNaN(...) ? undefined : undefined` en `letterboxd.ts` — no-op; el rating nunca se persiste.
- `Director.id` tipado como `number` vs uuid real.
- `next.config.ts` no lista el dominio de posters de Letterboxd (`a.ltrbxd.com`).
- `/settings` sin proteger en middleware (y dice "Fecha de registro en Gasti" — copy-paste).
- Scrapers: Cine York activo en seed con scraper Lumiton; verificar coincidencia de URLs entre seed y README.

## Infraestructura

### Upgrade de Node 20 → 24
- Node 20 está EOL desde abril 2026. Cambios: README, 4 workflows (`.github/workflows/*.yml`, `node-version: "20"` → `"24"`), `@types/node ^24`, agregar `engines: { "node": ">=24" }` en package.json, y localmente instalar Node 24 (nvm/fnm o instalador). `pnpm install` no instala Node; solo actualiza el lockfile.
- Estado: pendiente.

### README desactualizado
- Documenta endpoints inexistentes (`POST /api/movies/upload`, `GET /api/user/dashboard`, `GET /api/screenings/personalized`, `POST /api/directors/batch`), árbol de `scripts/` inexistente (`gaumont.scraper.ts`, `api.service.ts`), `pnpm type-check` que no existe, URL de Cine York distinta del seed.
- Estado: pendiente (los datos reales están en `docs/architecture.md`).

### Sin CI de verificación
- No hay tests ni workflow de lint/build en PRs. Mínimo viable: agregar `pnpm lint` + `pnpm build` (o `tsc --noEmit`) a un workflow de PR.
- Estado: pendiente.

## Mejoras pendientes (ideas de producto)

- Integración con Google Calendar (ver `addToCalendar` roto como base).
- Códigos QR para funciones.
- Soporte para más ciudades.
- Terminar scrapers de cines (Sala Lugones, CCK, Gaumont, Lorca, Cosmos, Sigilio).
- Al guardar pelis, skipear cortos (<= 40 min).
- Tests (vitest para servicios y scrapers).
- Personalización de ventana temporal para notificaciones (próximas x horas/días).
- Tablas en listados (referencia: justinmind data table).
- En vez de scrapear, obtener datos del JSON de Letterboxd (`https://letterboxd.com/film/<slug>/json/`).

## Decisiones registradas

- `national_title NOT NULL` es correcto; el bug es del código que no lo guarda (2026-08-15).
- RLS en todas las tablas: **no priorizar** — proyecto personal, sin datos sensibles (2026-08-15).
- Resend: no pagar por ahora; plan free con dominio propio cuando se configure (2026-08-15).
- `/api/screenings/featured` quedó a medias; retomar con criterio definido (2026-08-15).
- Las tablas públicas sin RLS son una decisión consciente; no asumir seguridad de datos en diseño nuevo (2026-08-15).
