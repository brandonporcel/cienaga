# Reset y Reimportación de Datos

Procedimiento para borrar tus datos de usuario y volver a importar desde cero.

## Concepto importante

Hay dos tipos de tablas:

| Tablas compartidas (de la app) | Tablas per-usuario |
|---|---|
| `movies` — catálogo de películas | `user_movies` — qué pelis viste y tu rating |
| `directors` — catálogo de directores | `user_directors` — qué directores seguís |
| `cinemas` — cines de Buenos Aires | `screenings` — funciones por cine |
| | `screening_times` — horarios |
| | `notifications` — emails enviados |

**No borres tablas compartidas** — son de todos los usuarios.

## 1. Borrar tablas per-usuario

```sql
-- Primero las dependencias
DELETE FROM screening_times;
DELETE FROM screenings;
DELETE FROM notifications;

-- Luego las relaciones usuario-dato
DELETE FROM user_directors;
DELETE FROM user_movies;
```

## 2. Reimportar datos (en orden)

### Paso 1: Subir CSVs de Letterboxd

Desde la UI en `/directors` → botón **"Actualizar Datos"**.

```bash
pnpm dev  # y subir watched.csv + ratings.csv por la UI
```

**Qué crea:** `movies` (si no existen) + `user_movies` (con ratings).

### Paso 2: Scraping de la lista de Buenos Aires

```bash
pnpm scrape:letterboxd-list
```

**Qué crea:** `movies` (faltantes), `directors` (con URL de Letterboxd), `cinemas`, `screenings`, `screening_times`.

**Frecuencia:** lunes 6am UTC (GitHub Actions).

### Paso 3: Perfiles de directores

```bash
pnpm scrape:director-profiles
```

**Qué actualiza:** `directors` → agrega `tmdb_id`, `image_url`, `bio`.

**Frecuencia:** diario (GitHub Actions).

### Paso 4: Metadata de películas (TMDB)

```bash
pnpm scrape:movie-directors
```

**Qué hace:** raspa TMDB → `poster_url`, `director_id` en movies. **Crea `user_directors`** automáticamente según el criterio de seguimiento.

**Frecuencia:** diario 6am UTC (GitHub Actions).

## Flujo de datos

```
CSVs Letterboxd ──→ movies, user_movies
                         │
letterboxd-list ──→ movies (faltantes), directors (con URL),
                    cinemas, screenings, screening_times
                         │
director-profiles ─→ directors (tmdb_id, image_url)
                         │
movie-metadata ───→ movies (poster, director_id)
                    user_directors (auto-follow)
```

## ¿Qué pasa si corro los scripts en cualquier orden?

- **`scrape:director-profiles`** sin directors: encuentra 0, no pasa nada.
- **`scrape:movie-metadata`** sin movies pendientes: no hace nada.
- **`scrape:letterboxd-list`** sin user_movies: crea movies + screenings pero no crea user_directors.

**El único paso obligatorio en orden:** CSVs primero (para tener `user_movies`), después `movie-metadata` (para crear `user_directors`).
