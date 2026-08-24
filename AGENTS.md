# AGENTS.md

## Fuente de verdad

Considerá siempre los siguientes documentos como fuente de verdad:

- `docs/architecture.md` — flujo de datos, pipelines de scraping y decisiones de arquitectura
- `docs/database.md` — schema, RLS e índices (debe reflejar `db/schema.sql`)
- `docs/roadmap.md` — bugs conocidos, pendientes y decisiones de producto

Si una implementación pedida entra en conflicto con esos documentos, actualizá la documentación primero o preguntá antes de escribir el código.

## Reglas

- **Nunca dupliques lógica de negocio**: reutilizá `src/lib/services/*`, `src/app/actions/*` y los servicios de `scripts/services/*`. Si una función hace lo mismo en otro lugar, refactorizá en vez de copiar.
- **Mantené la documentación al día** siempre que cambie la arquitectura, la base de datos o el roadmap.
- **Registrá bugs y decisiones nuevas** en `docs/roadmap.md` (o actualizalo) en el momento en que aparezcan.
- Si encontrás código muerto (endpoints, funciones o params sin uso), eliminarlo o anotarlo en el roadmap antes de dar el trabajo por terminado.

## Stack

- Next.js 15 (App Router + Turbopack) + React 19
- Supabase (PostgreSQL, Auth) — clientes en `src/lib/supabase/`
- Scripts de scraping y notificaciones en `scripts/` (tsx), orquestados por GitHub Actions
- Resend para emails
- pnpm como gestor de paquetes
- Node.js 24+ (Node 20 está EOL desde abril 2026)

## Convenciones

- UI copy y comentarios en español, consistentes con el estilo existente.
- Conventional commits (`fix:`, `feat:`, `chore:`), descripción en español.
- Validación con Zod.
- Protección de endpoints: server actions usan la sesión del usuario; los endpoints de scripts usan `Authorization: Bearer <CRON_SECRET_KEY>` (ver `docs/architecture.md`).
- Las tablas públicas no tienen RLS: la anon key tiene acceso total. No asumas seguridad de datos a nivel de base (decisión consciente, proyecto personal).

## Comandos útiles

```bash
pnpm dev                          # Servidor de desarrollo
pnpm build                        # Build de producción
pnpm lint                         # ESLint
pnpm scrape:letterboxd-list       # Lista Letterboxd Buenos Aires → movies, directors, screenings
pnpm scrape:director-profiles     # Perfiles Letterboxd → tmdb_id, image_url de directores
pnpm scrape:movie-directors        # TMDB → poster, director de movies. Crea user_directors
pnpm scrape:cinema-screenings     # Sitios de cines → screening times
pnpm send:notifications           # Envío manual de notificaciones
```
