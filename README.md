# 🌊 Ciénaga

**Ciénaga** es una aplicación web que te avisa cuando en los cines de Buenos Aires se proyectan películas de directores que te gustan.

---

## 🚀 Funcionalidad

- **Importar tu historial de Letterboxd** (`watched.csv` y `ratings.csv`).
- A partir de las URLs de las películas, el sistema obtiene automáticamente los directores.
- Guarda tus directores favoritos en la base de datos.
- Scrapea periódicamente la cartelera de distintos cines porteños (Gaumont, Cosmos, Malba, Sala Lugones, Cine York, etc).
- Hace un _match_ entre tus directores favoritos y la programación.
- Te notifica por **mail** cuando hay una peli de un director que te interesa.
- Si no estás logueado, la app igual muestra una selección de películas destacadas o recomendadas.

---

## 🏗️ Tecnologías

- **Frontend**: Next.js, Tailwind, shadcn/ui
- **Backend/DB**: Supabase (Postgres + Auth + Storage)
- **Scraping**: GitHub Actions + Cheerio
- **Mailing**: Resend / SendGrid / Postmark

---

## 🔄 Flujo

1. El usuario sube su CSV exportado desde Letterboxd.
2. Se guardan las URLs de películas en Supabase.
3. Un cron job (GitHub Actions) se ejecuta cada 12h:
   - Scrapea esas URLs y obtiene los directores.
   - Scrapea carteleras de cines y actualiza screenings en la DB.
4. La app cruza tus directores favoritos con la cartelera.
5. Te avisa por mail y muestra la info en tu dashboard.

---

## 📂 Estructura de datos (Supabase)

- **users** → info de usuario + login con Google
- **directors** → nombre único de cada director
- **user_directors** → relación entre user y director
- **movies** → título, año, url, director_id
- **screenings** → fecha, hora, cine, movie_id
- **cinemas** → nombre + url de scraper

---

## ⚙️ Instalación

```bash
git clone https://github.com/tuusuario/cienaga.git
cd cienaga
npm install
npm run dev
```

### Configurar variables de entorno en .env.local:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

RESEND_API_KEY=...
```

## 📅 Roadmap

- [x] Importar CSV de Letterboxd
- [x] Guardar directores en Supabase
- [ ] Scraping automático con GitHub Actions
- [ ] Notificaciones por mail
- [ ] Dashboard con coincidencias
- [ ] Recomendaciones basadas en ratings
