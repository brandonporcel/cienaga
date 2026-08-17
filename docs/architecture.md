# Arquitectura

> Fuente de verdad de flujo de datos y decisiones de arquitectura. Última actualización: 2026-08-15.

## Visión general

Ciénaga cruza el historial de Letterboxd de un usuario con la cartelera de cines de Buenos Aires y le avisa por email cuando se proyecta una película relevante. Es un proyecto personal: un solo dueño, sin planes de multi-tenant por ahora.

## Stack y despliegue

- **App**: Next.js 15.5 (App Router, Turbopack) + React 19, desplegada en Vercel.
- **Base de datos + Auth**: Supabase (PostgreSQL, PostgREST, Auth).
- **Email**: Resend.
- **Scraping**: scripts `tsx` en `scripts/`, ejecutados por GitHub Actions con cron.
- **Paquete**: pnpm. Node.js 24+ (ver `docs/roadmap.md` — upgrade pendiente desde Node 20).

## Clientes de Supabase

| Cliente | Archivo | Key | Uso |
| --- | --- | --- | --- |
| Server (SSR) | `src/lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server actions, API routes |
| Service | `src/lib/supabase/service.ts` | `SUPABASE_SERVICE_ROLE_KEY` | `ScreeningsService`, endpoints de batch — **salta RLS** |
| Browser | `src/lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente (auth) |

⚠️ La service key vive en el runtime de la app (server actions del dashboard la usan), no solo en scripts. No debe filtrarse al bundle del cliente.

## Autenticación y rutas protegidas

- `src/middleware.ts` protege `/dashboard` y `/directors` (redirige al home sin sesión). `/settings` queda público.
- Server actions validan sesión con `getUserOrThrow()` (`src/lib/helpers/get-server-user.ts`).
- Los endpoints consumidos por scripts validan `Authorization: Bearer <CRON_SECRET_KEY>` (comparación de strings). Excepciones públicas: `GET /api/cinemas`, `GET /api/screenings/featured`, `GET /api/movies/count-pending`.

## Flujo 1 — Importación de Letterboxd (usuario)

1. El usuario sube `watched.csv` y `ratings.csv` desde `/directors` (upload dialog).
2. `src/lib/services/letterboxd.ts` parsea los CSVs en el **cliente** (Papa.parse) y deduplica por título+año.
3. `saveMoviesAction` (`src/app/actions/movies.ts`) — server action:
   - Busca cada película por `title + year + url`; si no existe, la inserta.
   - Hace upsert de las relaciones en `user_movies` (`onConflict: user_id,movie_id`).
   - Marca `users.has_upload_csv = true`.

⚠️ **Bug conocido**: el insert no incluye `national_title` (NOT NULL) → todas las inserciones fallan silenciosamente. Ver `docs/roadmap.md`.

## Flujo 2 — Scraping de datos de películas (GitHub Actions, diario)

```
scrape-movie-data.ts
  → GET /api/movies/pending          (Bearer; movies sin director_id ni poster_url)
  → scraper Letterboxd por película  (cheerio, boxd.it, JSON-LD)
  → POST /api/movies/batch           (Bearer; asigna director_id, poster, duración, etc.)
      └─ además genera user_directors: cualquier user con user_movies de un director lo sigue
```

⚠️ **Hallazgo (2026-08-16)**: el endpoint JSON de Letterboxd (`/film/<slug>/json/`) responde **403 a clientes Node** (axios y fetch — fingerprint TLS bloqueado por Cloudflare); solo responde a curl/browsers. No usar ese endpoint desde los scripts. Ver `docs/roadmap.md`.

## Flujo 3 — Scraping de perfiles de directores (GitHub Actions, cada 3 días)

```
scrape-directors.ts
  → GET /api/directors/pending       (Bearer; directores sin tmdb_id)
  → scraper de perfil                (avatar, bio, filmografía, tmdb_id)
  → POST /api/directors/batch-update (Bearer)
```

⚠️ **Bug conocido**: `processMovie` inserta películas sin `national_title` (NOT NULL) → falla. Ver `docs/roadmap.md`.

## Flujo 4 — Scraping de carteleras (GitHub Actions, diario)

```
scrape-screenings.ts
  → GET /api/cinemas?enabled=true    (público)
  → ScraperFactory                   (solo Malba y Lumiton tienen scraper)
  → POST /api/screenings/batch       (Bearer; crea screenings + screening_times)
```

⚠️ **Bug conocido**: `findOrCreateDirector` inserta directores sin `slug` (NOT NULL) → los directores nuevos nunca se crean y las películas asociadas se descartan. Ver `docs/roadmap.md`.

## Flujo 4.5 — Scraping de lista Letterboxd (GitHub Actions, semanal)

```
scrape-list.ts
  → pagina la lista /list/funciones-en-buenos-aires/detail/ (4 páginas, ~333 films)
  → extrae datos del film (slug, título, año) y nota HTML
  → parseListNote() → cinema + dirección + fechas/horarios (formatos argentinos)
  → resuelve director: movies table primero, luego scrape de /film/<slug>/ (rate limiting 2s)
  → POST /api/list/batch (Bearer; batches de 50)
      → find/create cinema (enabled=false para nuevos)
      → find/create movie por slug
      → find/create director + link
      → upsert screening (deduplicado por movie+cinema+text)
      → insert screening_time (primer día de ventana/rango)
```

⚠️ Los cines nuevos se crean con `enabled=false` porque la lista ES la fuente (no necesitan scraper). Las ventanas "Del X al Y" generan un screening con `screening_times` = primer día a la primera hora indicada; el `screening_time_text` contiene el texto crudo de la nota.

## Flujo 5 — Dashboard personalizado

- Server action `getPersonalizedScreenings` (`src/app/actions/screenings.ts`) → `ScreeningsService.getPersonalizedScreenings` (`src/lib/services/screenings.service.ts`).
- Usa el **service client** (salta RLS). Consulta `screening_times` entre `now` y `now + 30 días`:
  - por `screenings.movie_id IN (user_movies del usuario)`, y
  - por `screenings.movies.director_id IN (user_directors del usuario)`.
- Agrupa por `screening.id` con sus `screening_times` ordenados por fecha.
- Los filtros de cine/búsqueda se aplican client-side en `/dashboard` (bug conocido: no filtran la grilla — ver roadmap).
- Los campos `includeWatched`, `includeUnwatched`, `minUserRating`, `onlyFavoriteDirectors` de `ScreeningFilters` están **sin uso** (código muerto).

## Flujo 6 — Notificaciones (GitHub Actions, cada 3 días)

```
send-notifications.ts
  → ScreeningsService.getMatchedScreeningsForNotifications(cutoff = now + 14 días)
  → notification.service.ts          (agrupa por usuario vía user_directors)
  → POST /api/users/bulk             (Bearer; emails de usuarios)
  → email.service.ts                 (Resend, templates en scripts/templates/)
  → POST /api/notifications/log      (Bearer; registra envíos en notifications)
```

⚠️ **Bugs conocidos**: no hay dedup entre corridas (se reenvía todo cada 3 días), link de unsubscribe inexistente, `from` usa `onboarding@resend.dev` (dominio de prueba). Ver `docs/roadmap.md`.

## Seguridad (estado actual, proyecto personal)

- RLS habilitado **solo** en `public.users` (sin policies). Todas las demás tablas están abiertas a la anon key por PostgREST: `movies`, `directors`, `screenings`, `screening_times`, `user_movies`, `user_directors`, `notifications`, `cinemas`.
- Decisión consciente: no priorizar RLS mientras el proyecto sea personal (ver `docs/roadmap.md`). No asumir seguridad de datos en el diseño nuevo.
- El `CRON_SECRET_KEY` es la única barrera real de los endpoints de scripts.

## Endpoints de la API (estado real, agosto 2026)

### Consumidos por scripts (Bearer)

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/movies/pending?limit=` | Películas sin director ni poster |
| GET | `/api/movies/count-pending` | Conteo (público, filtro distinto al de pending) |
| POST | `/api/movies/batch` | Asigna directores/metadatos + genera user_directors |
| GET | `/api/directors/pending?limit=` | Directores sin tmdb_id |
| POST | `/api/directors/batch-update` | Actualiza perfiles de directores |
| POST | `/api/screenings/batch` | Crea screenings + screening_times |
| POST | `/api/list/batch` | Crea screenings desde la lista Letterboxd (crea cines nuevos) |
| POST | `/api/users/bulk` | Emails de usuarios por ids |
| POST | `/api/notifications/log` | Registra envíos (GET y POST validan Bearer) |

### Públicos

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/cinemas?enabled=true` | Cines monitoreados |
| GET | `/api/screenings/featured` | Home público (⚠️ sin orden ni filtro de fecha — roadmap) |

### Server actions (sesión del usuario)

- `saveMoviesAction` (importación CSV), `getPersonalizedScreenings` (dashboard), más actions de directores/cinemas en `src/app/actions/`.

> El README documenta `POST /api/movies/upload`, `GET /api/user/dashboard` y `GET /api/screenings/personalized` — **no existen** (reemplazados por server actions). Actualizar README pendiente en roadmap.

## Convenciones de datos

- `screening_times.screening_datetime` es la única fuente de horarios parseados; `screenings.screening_time_text` es el texto crudo del cine (o de la nota de la lista Letterboxd).
- Horarios en `timestamptz` (UTC). Filtros de dashboard/notificaciones usan `now()` del runtime.
- Dedupe de películas: `title + year + url`.
