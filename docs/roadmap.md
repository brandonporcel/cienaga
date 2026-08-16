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
- **Decisión tomada (2026-08-16)**: algoritmo fase 1 con umbrales por default — ver "Algoritmo fase 1" en Cambios recientes.
- Estado: pendiente de implementar (prerequisito: persistir ratings — bug P3 de `letterboxd.ts`).

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
- En vez de scrapear, obtener datos del JSON de Letterboxd (`https://letterboxd.com/film/<slug>/json/`). ⚠️ **Probado y descartado el 2026-08-16**: Cloudflare responde 403 al fingerprint TLS de Node (axios y fetch); solo curl/browsers pasan. Si se retoma, requeriría browser real (Playwright) o proxy — ver "Cambios recientes".

## Cambios recientes

### 2026-08-16 — Decisiones de producto: algoritmo fase 1, settings, CTA y feature lista
Brainstorming con el usuario; quedan definidas estas decisiones y direcciones:

**Algoritmo fase 1 — umbrales por default (definidos 2026-08-16):**
- Un director entra a `user_directors` como "seguido (auto)" si cumple **cualquiera** de:
  - **Criterio cantidad**: `pelis_vistas >= 2` Y `>= 50%` de esas pelis con `rating >= 3.5` (la "mayoría le gustó"), O
  - **Criterio estrella**: `>= 1` peli con `rating = 5` (la amó; aunque haya visto una sola).
- Regla simple y explicable en UI. El **override manual** (forzar seguimiento o silenciar) cubre los edge cases restantes.
- Los **overrides manuales sobreviven** al recálculo: si el usuario silencia un director, no se reactiva solo al re-importar.
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
- Al clickear la card del director se abre un modal con: estado (auto/manual/silenciado), acciones seguir/ocultar/silenciar, y filmografía vista con sus ratings (mini-lista).

**Feature lista de Letterboxd ("Funciones en Buenos Aires"):**
- Scrape del HTML `/list/<slug>/detail/` (paginado, 4 páginas) + parser de notas en texto libre (formatos: "Del 13 al 19", "13/8 a las 15:00 hs", "13, 14 y 18 de Agosto a las 17:00 hs").
- **Match contra TODOS los cines** (no solo los habilitados): el objetivo es **descubrir cines nuevos** — si la peli favorita del usuario está en otro cine, la ve igual.
- Los cines de la lista no necesitan scraper: la lista ES la fuente (los screenings se marcan con origen lista).
- Cines nuevos encontrados → crear en tabla `cinemas` (decidir `enabled` default) y vincular screenings.

### 2026-08-16 — Descartado el refactor del scraper al JSON de Letterboxd
- Se intentó reemplazar el parseo HTML por el endpoint `/film/<slug>/json/`. Resultado: **403 de Cloudflare** para axios y fetch de Node ("Just a moment..."); curl y el HTML público pasan (200). La protección es selectiva por TLS fingerprint sobre la ruta `/json/`.
- Se revirtió el cambio completo; el scraper HTML actual (cheerio) sigue siendo la vía correcta para el pipeline Node de GitHub Actions.
