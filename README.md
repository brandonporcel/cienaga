<p align="center">
<img src="public/og.png" alt="Cienaga Screenshot" />
</p>

<h1 align="center">🌊 Ciénaga</h1>

<p align="center">Aplicación web que te avisa cuando en los cines de Buenos Aires se proyectan películas de directores que te gustan.</p>

<p align="center">
  <a href="#-características-principales">Características</a> •
  <a href="#-cómo-funciona">Cómo funciona</a> •
  <a href="#-instalación">Instalación</a> •
  <a href="#-api-endpoints">API</a> •
  <a href="#-arquitectura">Arquitectura</a>
</p>

---

## 🚀 Características principales

- **Importar historial de Letterboxd**: Sube tus archivos `watched.csv` y `ratings.csv`
- **Extracción automática de directores**: Sistema de scraping que obtiene directores, posters, y metadatos desde Letterboxd
- **Scraping de carteleras**: Monitoreo automático de cines porteños con datos detallados (horarios, salas, precios)
- **Seguimiento inteligente**: Automáticamente identifica directores favoritos basado en tu historial
- **Notificaciones personalizadas**: Te avisa por email cuando hay películas de directores que seguís
- **Dashboard rico**: Muestra coincidencias con información completa de eventos
- **Cartelera pública**: Mejores películas en cartelera sin necesidad de registro

---

## 🔄 Cómo funciona

### 1. **Importación y procesamiento**

- Subís tu CSV exportado de Letterboxd
- Se crean automáticamente las relaciones usuario-película-director
- Sistema inteligente evita duplicados y mantiene consistencia

### 2. **Scraping automatizado** (GitHub Actions)

- **Directores y metadatos**: Extrae información completa desde Letterboxd (directors, posters, ratings)
- **Carteleras detalladas**: Procesa eventos de cada cine con fechas, horarios, salas y descripciones
- **Sincronización**: Mantiene actualizada la relación usuario-directores automáticamente

### 3. **Matching y experiencia personalizada**

- Cruza tus directores favoritos con la programación actual
- Dashboard con filtros avanzados (fecha, cine, rating, horarios)
- Notificaciones por email de coincidencias relevantes

---

## 📂 Arquitectura de datos

### Base de datos (Supabase)

| Tabla            | Descripción                         | Campos clave                                                    |
| ---------------- | ----------------------------------- | --------------------------------------------------------------- |
| `users`          | Información de usuarios             | `id`, `email`, `has_upload_csv`                                 |
| `movies`         | Películas con metadatos completos   | `title`, `year`, `rating`, `director_id`, `poster_url`          |
| `directors`      | Directores con URLs de Letterboxd   | `name`, `url`, `image_url`                                      |
| `user_movies`    | Películas de usuarios con ratings   | `user_id`, `movie_id`, `rating`                                 |
| `user_directors` | Directores seguidos (auto-generado) | `user_id`, `director_id`                                        |
| `cinemas`        | Cines monitoreados                  | `name`, `url`                                                   |
| `screenings`     | Eventos con detalles completos      | `movie_id`, `cinema_id`, `screening_time`, `event_type`, `room` |

### Scripts automatizados

```
scripts/
├── scrape-directors.ts           # Extrae metadatos de Letterboxd
├── scrape-screenings.ts          # Orchestrator de carteleras
└── services/
    ├── screenings/               # Scrapers específicos por cine
    │   ├── base-scraper.service.ts
    │   ├── malba.scraper.ts
    │   └── gaumont.scraper.ts
    └── api.service.ts           # Comunicación con endpoints
```

---

## ⚙️ Instalación

### Prerrequisitos

- Node.js 20+
- pnpm
- Cuenta de Supabase
- Cuenta de GitHub (para Actions)

### Setup local

```bash
git clone https://github.com/brandonporcel/cienaga.git
cd cienaga
pnpm install
```

### Variables de entorno

Crear `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

CRON_SECRET_KEY=tu_clave_secreta_para_cron

RESEND_API_KEY=tu_resend_key
```

### Base de datos

```bash
# Importar schema y datos iniciales
psql -f db/schema.sql
psql -f db/seed.sql
```

### GitHub Actions

1. Ir a Settings → Secrets and variables → Actions
2. Agregar secrets:
   - `APP_URL`: URL de tu app desplegada
   - `CRON_SECRET_KEY`: Misma clave del .env

### Desarrollo

```bash
pnpm dev                    # Servidor de desarrollo
pnpm scrape:directors      # Probar scraping local
pnpm type-check            # Verificar TypeScript
```

---

## 🌐 API Endpoints

### Scraping automatizado (protegidos con Bearer token)

```
GET  /api/movies/pending           # Películas sin director asignado
GET  /api/movies/count-pending     # Verificar si hay trabajo pendiente
POST /api/directors/batch          # Guardar directores con metadatos
POST /api/screenings/batch         # Guardar eventos de cines en lote
```

### Gestión de usuario

```
POST /api/movies/upload            # Subir CSV de Letterboxd
GET  /api/user/dashboard           # Dashboard personalizado
```

### Carteleras públicas

```
GET  /api/screenings/featured      # Top películas en cartelera
GET  /api/screenings/personalized  # Cartelera filtrada por gustos
```

**Validaciones**: Todos los endpoints usan Zod para validación robusta de datos

---

## 🎬 Cines monitoreados

| Cine             | URL                                                            | Estado          |
| ---------------- | -------------------------------------------------------------- | --------------- |
| **Malba**        | https://malba.org.ar/cine/                                     | ✅              |
| **Cine York**    | https://www.vicentelopez.gov.ar/agenda/agenda-lumiton          | ✅              |
| **Sala Lugones** | https://complejoteatral.gob.ar/cine                            | 🔄 Próximamente |
| **CCK**          | https://palaciolibertad.gob.ar/cine/                           | 🔄 Próximamente |
| **Gaumont**      | https://www.cinegaumont.ar/                                    | 🔄 Próximamente |
| **Cine Lorca**   | https://www.lanacion.com.ar/cartelera-de-cine/sala/lorca-sa110 | 🔄 Próximamente |
| **Cine Cosmos**  | https://www.cinecosmos.uba.ar/                                 | 🔄 Próximamente |

---

## 🏗️ Stack

- Next.js - Supabase (PostgreSQL, Auth, Storage) - GitHub Actions - Resend

---

## 📋 To-Do

- [ ] Integración con Google Calendar
- [ ] Códigos QR para funciones
- [ ] Soporte para más ciudades
- [ ] Usar funciones lambda
- [ ] Docker
- [ ] Terminar scrapers de cines
- [ ] Al guardar pelis skipear cortos. (<=40 min)
- [ ] Tests

---

## 🤝 Contribuir

Si tienes ideas o mejoras, no dudes en hacer un fork del proyecto y enviar un pull request.

---

## 📞 Feedback

Me encantaría conocer tu opinión sobre el proyecto. Puedes enviarme un [email](https://mail.google.com/mail/?view=cm&fs=1&to=brandon7.7porcel@gmail.com&su=Cienaga) o a través de [LinkedIn](https://www.linkedin.com/in/brandonporcel/).
