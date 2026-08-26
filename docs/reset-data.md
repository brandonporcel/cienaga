# Reset y Reimportación de Datos

Procedimiento para borrar datos y volver a importar desde cero.

## Concepto importante

| Tablas que se borran en reset | Tablas que se conservan |
|---|---|
| `movies` — catálogo de películas | `cinemas` — cines (seed data) |
| `directors` — catálogo de directores | `users` — auth de Google |
| `user_movies` — qué pelis viste y tu rating | |
| `user_directors` — qué directores seguís | |
| `screenings` — funciones por cine | |
| `screening_times` — horarios | |
| `notifications` — emails enviados | |

`cinemas` se conserva porque viene del seed (`db/seed.sql`) y los scrapers la necesitan.
`users` se conserva porque tiene la auth de Google.

## 1. Borrar todo (reset completo)

```sql
-- Orden: primero las dependencias (FKs)
DELETE FROM screening_times;
DELETE FROM screenings;
DELETE FROM notifications;
DELETE FROM user_directors;
DELETE FROM user_movies;
DELETE FROM movies;
DELETE FROM directors;
```

## 2. Reimportar datos (en orden)

### Paso 1: Scraping de la lista de Buenos Aires

```bash
pnpm scrape:letterboxd-list
```

**Qué crea:** `movies`, `directors` (con URL de Letterboxd), `screenings`, `screening_times`.
**Frecuencia:** lunes 6am UTC (GitHub Actions).

### Paso 2: Subir CSVs de Letterboxd (tu historial personal)

Desde la UI en `/directors` → botón **"Actualizar Datos"**.

```bash
pnpm dev  # y subir watched.csv + ratings.csv por la UI
```

**Qué crea:** `user_movies` (con ratings). Actualiza `movies` si hay nuevas.
**Nota:** sin `user_movies`, no se pueden calcular directores favoritos.

### Paso 3: Metadata de películas (TMDB)

```bash
pnpm scrape:movie-directors
```

**Qué hace:** raspa TMDB → `poster_url`, `director_id`, `duration`, `background_img_url` en movies.
**Crea `user_directors`** automáticamente según el criterio de seguimiento (≥ 2 pelis vistas, ≥ 50% con ≥ 3.5★, o ≥ 1 con 5★).
**Frecuencia:** diario 6am UTC (GitHub Actions).

### Paso 4: Perfiles de directores

```bash
pnpm scrape:director-profiles
```

**Qué hace:** raspa Letterboxd → `image_url`, `bio`, `tmdb_id` en directors. Filmografía filtrada por ≥ 800 vistas.
**Frecuencia:** cada 3 días (GitHub Actions).

## Flujo de datos

```
letterboxd-list ──→ movies, directors, screenings, screening_times
                          │
CSVs Letterboxd ──→ user_movies (ratings)
                          │
movie-directors ──→ movies (poster, director_id, duration)
                    user_directors (auto-follow)
                          │
director-profiles ─→ directors (image_url, bio, filmografía)
```

## ¿Qué pasa si corro los scripts en cualquier orden?

- **`scrape:director-profiles`** sin directors: encuentra 0, no pasa nada.
- **`scrape:movie-directors`** sin movies pendientes: no hace nada.
- **`scrape:letterboxd-list`** sin user_movies: crea movies + screenings pero no crea user_directors.

**El único paso obligatorio en orden:** letterboxd-list primero (para tener movies + directors), después movie-directors (para crear user_directors). Los CSVs pueden ir en cualquier momento después del paso 1.
