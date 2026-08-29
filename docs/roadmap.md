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

- ~~`user_directors` se genera con "vio 1 película → lo sigue" en `movies/batch`.~~
- **Implementado (2026-08-16)**: algoritmo fase 1 con umbrales en `movies/batch` + endpoint `POST /api/directors/recalculate` (respeta overrides manual) + columna `source` en `user_directors`. Ver "Cambios recientes".
- **Simplificado (2026-08-22)**: estados reducidos a `auto` | `manual` (eliminado `muted`). UI muestra solo "Seguido" y "Visto".
- **Pendiente en prod**: correr la migración SQL (columna `source`), re-subir los CSVs (para persistir ratings con el fix), y correr el recalculate.

### P3 — Bugs menores

- `count-pending` no valida Bearer y su filtro no coincide con `/api/movies/pending`.
- Filtros client-side del dashboard no filtran la grilla (solo el mensaje de "sin resultados"). ⚠️ Arreglado en `/directors` (2026-08-16: buscador + filtros por estado en `DirectorsGrid`); revisar si `/dashboard` tiene el mismo problema.
- `addToCalendar` (`src/components/screenings/card.tsx`) usa `new Date()` en vez del horario de la función.
- `email.service.ts` parsea `screening.screening_time_text` con `new Date()` → "Invalid Date" en el texto plano; `notification.service.ts` ordena por `screening.screening_time` (propiedad inexistente).
- ~~Workflows de scrape hacen `npm install` suelto (axios, cheerio...)~~ → arreglado 2026-08-16: los 3 workflows usan `pnpm install` con lockfile + `pnpm/action-setup@v4`.
- ~~`rating: isNaN(...) ? undefined : undefined` en `letterboxd.ts`~~ → arreglado 2026-08-16: el rating del CSV se persiste en `user_movies` (el upsert actualiza ratings al re-subir).

## Infraestructura

### Lint roto (errores preexistentes)

- `pnpm lint` falla con 11 errores `@typescript-eslint/no-explicit-any` en `scripts/send-notifications.ts`, `scripts/services/email.service.ts`, `scripts/services/notification.service.ts` y 1 `no-empty-object-type` en `scripts/services/screenings/lumiton.scraper.ts`. Preexistentes al 2026-08-16; tipar con `unknown` + narrowing o casts explícitos.
- Estado: pendiente.

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
- En vez de scrapear, obtener datos del JSON de Letterboxd (`https://letterboxd.com/film/<slug>/json/`). ⚠️ **Probado y descartado el 2026-08-16**: Cloudflare responde 403 al fingerprint TLS de Node (axios y fetch); solo curl/browsers pasan. Si se retoma, requeriría browser real (Playwright) o proxy — ver "Cambios recientes".

## Cambios recientes

### 2026-08-16 — Modal refinado: estrellas, buscador funcional y listado reactivo

- **Estrellas estilo Letterboxd** en la filmografía del modal (relleno fraccional por estrella, soporta medios — los ratings del CSV van de 0.5 a 5).
- **Buscador funcional** en `/directors`: `DirectorsGrid` (client) filtra por nombre en vivo; dropdown Filtrar con Seguidos/Vistos/Alfabético; contador dinámico; empty state diferenciado (sin datos vs sin resultados). `filters.tsx` eliminado (era UI muerta).
- **Listado reactivo**: al dejar de seguir desde el modal, el director se quita del grid sin recargar (callback `onPreferenceChanged`); badge se actualiza en vivo. Loader spinner en el botón de la acción en curso.

### 2026-08-16 — Algoritmo fase 1 implementado, modal de detalle, fixes de pipeline

- **Criterio en código compartido** (`src/lib/services/director-preference.ts`): `shouldFollowDirector(films)` — ≥ 2 vistas Y ≥ 50% con ≥ 3.5★, o ≥ 1 con 5★; + `getDirectorMetrics` para la justificación UI. Lo usan `movies/batch` y `recalculate` (DRY).
- **`user_directors.source`** (`auto | manual`): los overrides manuales sobreviven al recálculo. Migración pendiente en prod.
- **`POST /api/directors/recalculate`** (Bearer): recalcula para todos los usuarios, agrega los que cumplen, quita los `auto` que ya no cumplen, nunca toca `manual`. Evita re-scrapear películas.
- **Modal de detalle** (`src/components/directors/detail-dialog.tsx`): click en card → estado (badge), justificación ("Viste n pelis, m con 3.5★ (x%)" / "5★ en..."), filmografía vista con ratings, acciones Seguir / Dejar de seguir.
- **Card**: badge de estado reemplaza al botón "Deshabilitar" muerto; contador de directores en el listado.
- **Fix ratings CSV**: `letterboxd.ts` persistía `undefined` siempre; ahora parsea y `saveMoviesAction` guarda el rating en `user_movies` (upsert que actualiza al re-subir).
- **Fix workflows CI**: los 3 workflows (`scrape-directors`, `scrape-screenings`, `send-notifications`) hacían `npm install` suelto con `cache: pnpm` (→ "Path Validation Error" en GA) y `pnpm/action-setup@v2` (Node 20 deprecado). Alineados al patrón de `scrape-movie-data.yml`: `pnpm install --no-frozen-lockfile` + `pnpm exec tsx` + action-setup@v4.

### 2026-08-16 — Feature lista de Letterboxd implementada

- **`scripts/scrape-list.ts`**: scraper principal que pagina la lista "Funciones en Buenos Aires" de lamateroric (4 páginas, ~333 films). Extrae datos del film (slug, título, año), parsea las notas (cine, dirección, fechas/horarios), resuelve directores (DB primero, luego scrape de film page con rate limiting 2s), y envía batches de 50 al endpoint.
- **`scripts/services/list/list-note-parser.ts`**: parser puro de notas HTML. Maneja formatos argentinos: "Del 13 al 19", "13/8 a las 15:00 hs", "15, 22 y 29 de Agosto a las 18:00 hs", multi-cine por nota, multi-sala, URLs en `<a>`.
- **`POST /api/list/batch`** (Bearer): endpoint dedicado. Por cada entrada: find/create cinema (nuevos con `enabled: false`), find/create movie por slug, find/create director + link, upsert screening deduplicado por (movie, cinema, screening_time_text), insert screening_time con primer día de la ventana/rango a la primera hora indicada.
- **Workflow GA** semanal (lunes): `scrape-letterboxd-list.yml` con patrón pnpm.
- **`pnpm scrape:letterboxd-list`** agregado a package.json.
- **Decisión de diseño**: ventanas "Del X al Y" generan un screening con `screening_times` = primer día de la ventana a la primera hora; `screening_time_text` = texto crudo de la nota completa. El mail muestra el texto crudo (honesto, sin mentir sobre la fecha).
- **Decisión de librería**: se descartaron librerías de terceros (todas Python y frágiles) y la API oficial (by-request, OAuth2). Se usó cheerio propio, patrón ya probado en el proyecto.

### 2026-08-16 — Decisiones de producto: algoritmo fase 1, settings, CTA y feature lista

Brainstorming con el usuario; quedan definidas estas decisiones y direcciones:

**Algoritmo fase 1 — umbrales por default (definidos 2026-08-16):**

- Un director entra a `user_directors` como "seguido (auto)" si cumple **cualquiera** de:
  - **Criterio cantidad**: `pelis_vistas >= 2` Y `>= 50%` de esas pelis con `rating >= 3.5` (la "mayoría le gustó"), O
  - **Criterio estrella**: `>= 1` peli con `rating = 5` (la amó; aunque haya visto una sola).
- Regla simple y explicable en UI. El **override manual** (forzar seguimiento o dejar de seguir) cubre los edge cases restantes.
- Los **overrides manuales sobreviven** al recálculo: si el usuario deja de seguir un director, no se reactiva solo al re-importar.
- **Recálculo**: se evalúa al importar el CSV (los ratings solo cambian al re-importar). Los overrides manuales no se pisan.
- Prerequisito: **persistir ratings** del `ratings.csv` (bug P3: `rating: isNaN(...) ? undefined : undefined` en `letterboxd.ts`).
- Tooltip en la card del director: "Viste n películas, m con 3.5★ o más (x%)" mostrando el cálculo.
- **Explicar el porqué también en los emails** (template.builder.ts): "X se proyecta en Malba — de Christopher Nolan, tu director favorito".

**Sidebar:**

- Nuevo ítem **Configuración** ✅ (implementado 2026-08-16 — ruta `/settings`, antes "Perfil").
- Botón **Actualizar Datos** reutilizando `UploadDialog` (componente standalone — cero duplicación) — pendiente.

**Configuración (v1 hardcodeada, solo diseño ✅ implementada 2026-08-16 en `/settings`):**

- Pantalla con secciones y controles **disabled**: rango de notificaciones (próxima semana vs 14 días), frecuencia de resumen, umbrales de directores favoritos (con la regla actual explicada), cines monitoreados.
- Sin lógica de envío todavía.

**Detalle de director — formato decidido: MODAL** (aprobado 2026-08-16):

- Al clickear la card del director se abre un modal con: estado (seguido/visto), acciones seguir/dejar de seguir, y filmografía vista con sus ratings (mini-lista).

**Feature lista de Letterboxd ("Funciones en Buenos Aires"):**

- **Implementado (2026-08-16)**: `scrape-list.ts` + `list-note-parser.ts` + `POST /api/list/batch` + workflow semanal. Ver "Cambios recientes" arriba para detalles.
- Decisión: cines nuevos se crean con `enabled=false` (la lista ES la fuente). Ventanas sin horario puntual generan un screening con primer día de la ventana + texto crudo en `screening_time_text`.

### 2026-08-16 — Descartado el refactor del scraper al JSON de Letterboxd

- Se intentó reemplazar el parseo HTML por el endpoint `/film/<slug>/json/`. Resultado: **403 de Cloudflare** para axios y fetch de Node ("Just a moment..."); curl y el HTML público pasan (200). La protección es selectiva por TLS fingerprint sobre la ruta `/json/`.
- Se revirtió el cambio completo; el scraper HTML actual (cheerio) sigue siendo la vía correcta para el pipeline Node de GitHub Actions.

### 2026-08-28 — Lista de Letterboxd bloqueada por challenge de Cloudflare → Firecrawl

- **Síntoma**: `scrape:letterboxd-list` devolvía "Found 0 valid entries" en el runner de GitHub Actions. La lista `/list/funciones-en-buenos-aires/detail/` empezó a devolver el challenge de Cloudflare ("Just a moment...", `cf-mitigated: challenge`, HTTP 403) para clientes HTTP no-navegador.
- **Diagnóstico (verificado empíricamente)**:
  - En IPs de datacenter (GitHub Actions) el challenge es **sistemático** para la página de lista, sin importar método (axios o curl) ni User-Agent.
  - Desde IP residencial, **curl local pasa** (200 + contenido); axios local NO (403 challenge). La protección combina reputación de IP + TLS fingerprint.
  - Las páginas de film/prefil individuales (`/film/x/`, `/director/x/`) **no** reciben challenge (director-profiles procesó 245/254 por axios en el runner).
- **Solución implementada**: `scrape-list.ts` ahora fetcha las páginas de la **lista** vía **Firecrawl** (`POST /v2/scrape` con `formats: ["html"]`), que atraviesa el challenge y devuelve el HTML crudo con la misma estructura (`div.listitem.js-listitem`, `data-item-slug`, notas). Las **film pages** siguen por axios (`fetchFilmPage`, no gastan créditos).
- **Config**: requiere `FIRECRAWL_API_KEY` (`.env` local + secret `FIRECRAWL_API_KEY` en GitHub Actions). Plan gratis: 1.000 créditos/mes recurrentes (~4 páginas de lista por corrida semanal → ~16/mes; sobra de sobra).
- **Fix extra**: `scrape-list.ts` no cargaba `dotenv` en local → agregado `import "dotenv/config"` (ya lo hacían send-notifications y cleanup-orphans).
- **Fallback**: si Firecrawl falla, `fetchPage` intenta curl local (solo útil con IP residencial local).

### 2026-08-26 — Filtrado de películas por vistas + slug + rediseño mail

- **Filtro de vistas**: `scrape-directors.ts` ahora obtiene watch count de cada película vía el CSI endpoint de Letterboxd (`/csi/film/{slug}/stats/`) y filtra las que tengan < 800 vistas. Usa curl vía child_process (Cloudflare bloquea TLS fingerprint de Node.js — axios y fetch devuelven 403).
- **Slug en filmografía**: `batch-update` ahora guarda el slug al crear películas desde la filmografía (antes se perdía).
- **Rediseño de mail**: eliminados links de Instagram, Twitter, Facebook y "Powered by Ciénaga" del footer; eliminado botón "Reservar →" de las cards de películas; actualizado ©2025 a ©2026.
- **RLS en Supabase**: Supabase envía warning sobre RLS deshabilitado. Es una **decisión consciente** — proyecto personal, la anon key tiene acceso total. No activar RLS salvo que cambie el modelo de datos.
