# Base de datos

> Fuente de verdad: `db/schema.sql`. Este documento lo refleja y anota decisiones. Si cambiás el schema, actualizá ambos + `docs/roadmap.md` si corresponde.

## General

- PostgreSQL en Supabase. `uuid_generate_v4()` requiere la extensión `uuid-ossp` (preinstalada en Supabase).
- `db/reset.sql` dropea todo; `db/seed.sql` inserta datos iniciales (8 cines).

## Tablas

### `users`

| Columna | Tipo | Notas |
| --- | --- | --- |
| id | uuid PK | FK → `auth.users(id)` ON DELETE CASCADE |
| full_name / email / avatar_url | text | Se llenan desde `raw_user_meta_data` en el trigger |
| created_at | timestamptz | default now() |

- **Única tabla con RLS habilitado** (sin policies → denegado a anon/authenticated; el trigger `handle_new_user` es `security definer`).
- Trigger `on_auth_user_created` crea la fila al registrarse.

### `cinemas`

| Columna | Tipo | Notas |
| --- | --- | --- |
| id | serial PK | |
| name / url / slug | text NOT NULL UNIQUE | |
| image_url | text UNIQUE | nullable (Cine Lorca no tiene — cuidar `image_url.endsWith` en el template de emails) |
| enabled | boolean NOT NULL default true | ⚠️ 8 cines enabled en seed pero solo Malba/Lumiton tienen scraper |
| last_scraped | timestamptz | |
| scraping_frequency | interval default '12 hours' | |

### `directors`

| Columna | Tipo | Notas |
| --- | --- | --- |
| id | uuid PK default uuid_generate_v4() | |
| name | text NOT NULL | |
| url | text | |
| slug | text NOT NULL UNIQUE | ⚠️ `findOrCreateDirector` de screenings/batch inserta sin slug → falla |
| image_url / description / tmdb_id | text | tmdb_id usado por el pipeline de perfiles |
| created_at | timestamptz | |

### `user_directors`

- PK compuesta `(user_id, director_id)`, FKs CASCADE.
- `source` indica cómo se creó la relación: `auto` (calculado por el algoritmo) o `manual` (override del usuario). Los overrides manuales nunca se pisan al recalcular.
- Se genera en `POST /api/movies/batch` y `POST /api/directors/recalculate` con el criterio: **≥ 2 películas vistas Y ≥ 50% con rating ≥ 3.5, o ≥ 1 película con rating 5** (ver `src/lib/services/director-preference.ts`).
- ⚠️ Sin índice sobre `user_id`.

### `movies`

| Columna | Tipo | Notas |
| --- | --- | --- |
| id | uuid PK | |
| title | text NOT NULL | |
| national_title | text NOT NULL | ⚠️ `saveMoviesAction` y `processMovie` (batch-update) insertan sin este campo → fallan |
| poster_url / background_img_url | text | |
| url | text | Dedupe con `title + year + url` |
| year | int | |
| duration / country / genre | int / text / text | |
| slug | text UNIQUE | nullable |
| rating | numeric(3,1) | |
| director_id | uuid FK → directors ON DELETE SET NULL | ⚠️ sin índice (filtrado frecuente) |

### `user_movies`

- PK compuesta `(user_id, movie_id)`, FKs CASCADE. `rating` nullable (rating del usuario para la película, desde el CSV de ratings).
- ⚠️ Sin índices sobre `user_id` ni `movie_id`.

### `screenings`

| Columna | Tipo | Notas |
| --- | --- | --- |
| id | uuid PK | |
| event_type / description / room / original_url / thumbnail_url | text | |
| screening_time_text | text | Texto crudo del cine (no parseado) |
| cinema_id | int NOT NULL FK → cinemas CASCADE | ⚠️ sin índice |
| movie_id | uuid NOT NULL FK → movies CASCADE | ⚠️ sin índice |
| created_at | timestamptz | |

- ⚠️ Sin constraint UNIQUE en `(movie_id, cinema_id, screening_time_text)` → duplicados posibles en re-runs del scraper.

### `screening_times`

| Columna | Tipo | Notas |
| --- | --- | --- |
| id | uuid PK | |
| screening_id | uuid NOT NULL FK → screenings CASCADE | índice `idx_screening_times_screening_id` |
| screening_datetime | timestamptz NOT NULL | índice `idx_screening_times_datetime` |

- Única fuente de horarios parseados.

### `notifications`

| Columna | Tipo | Notas |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK → users | |
| screening_ids | uuid[] | |
| sent_at | timestamptz default now() | |
| email_subject | text | |
| metadata | jsonb | |
| created_at | timestamptz | |

- Índice `idx_notifications_user_id_sent_at (user_id, sent_at DESC)`.
- ⚠️ Se escribe pero nunca se lee para deduplicar envíos (ver roadmap).

## RLS (estado actual)

- Habilitado únicamente en `public.users`, sin policies.
- Todas las demás tablas: acceso total de lectura/escritura para la anon key vía PostgREST.
- Decisión consciente (proyecto personal, ver `docs/roadmap.md`).

## Índices y constraints faltantes (candidatos)

| Objeto | Motivo |
| --- | --- |
| Índice en `movies.director_id` | Filtrado en movies/batch y ScreeningsService |
| Índice en `movies.url` | Lookup exacto en batch-update |
| Índice en `user_movies.user_id` y `user_directors.user_id` | Filtros por usuario |
| Índice en `screenings.movie_id` y `screenings.cinema_id` | Joins frecuentes |
| UNIQUE en `(movie_id, cinema_id, screening_time_text)` | Dedupe real de screenings |
| UNIQUE en `movies.url` | Evitar duplicados de películas |
| Índice en `directors.name` | Lookup por nombre en screenings/batch |
