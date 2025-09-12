# 🌊 Ciénaga

Aplicación web que te avisa cuando en los cines de Buenos Aires se proyectan películas de directores que te gustan.

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

## ✅ To-Do

1. Autenticación y rutas

- [ ] Implementar login con Clerk (Google como proveedor principal).
- [ ] Configurar rutas privadas → si no está logueado, redirect a /login.
- [ ] Crear middleware en Next.js para proteger páginas privadas.
- [ ] Guardar en Supabase el email del user (o su clerk_user_id) al momento de login.

2. Dashboard + Historial

- [ ] Subida de watched.csv / ratings.csv.
- [ ] Parseo del CSV en frontend o backend.
- [ ] Guardar en Supabase:
  - [ ] Películas (movies).
  - [ ] Directores (directors).
  - [ ] Relación user ↔ director (user_directors).
- [ ] Mostrar historial de uploads en el dashboard.

3. Cartelera / Scraping

- [ ] Setear GitHub Actions con un script Node + Cheerio.
- [ ] Scrapear cines básicos (Gaumont, Cosmos, Lugones).
- [ ] Guardar screenings en screenings.
- [ ] Endpoint/API en Supabase (o Edge Function) para exponer la cartelera.

### Paginas/cines:

<!-- 2. check cartelera sigilio website every day -->

1. malba (quizas no hace falta porque tiene un newsletter que avisa mensualmente programacion): https://www.malba.org.ar/eventos/de/actividades-cine/
2. Sala Lugones: https://complejoteatral.gob.ar/cine
3. Cine york: https://www.vicentelopez.gov.ar/agenda/agenda-lumiton
4. CCK: https://palaciolibertad.gob.ar/cine/
5. gaumont: https://www.cinegaumont.ar/ / https://letterboxd.com/franco2601/list/cine-gaumont-cartelera/
6. cine lorca: https://cinelorca.wixsite.com/cine-lorca/current-production - https://www.lanacion.com.ar/cartelera-de-cine/sala/lorca-sa110
7. cine cosmos: https://www.cinecosmos.uba.ar/
8. Teatro Municipal Gregorio de Laferrere: https://ellaferrere.com.ar/programacion/
9. CC San Martín
10. Bafici
11. Hoyts

---

- agregar debajo de todo https://thegithubshop.com/ algo relacionado al cine
  usar supabase
- me gusta landing de https://www.canva.com/es_es/ como idea de landing

📱 ¿Tiene sentido integrar QR codes en tu app de cine?

Depende del caso de uso. Algunas ideas:

Compartir tu perfil
Cada usuario podría tener un QR que linkee a su perfil público de Ciénaga (sus directores favoritos + próximas pelis). Ej: “escaneá y seguí mis directores”.

Compartir películas/eventos
QR en cada función: “Escaneá y agregala a tu calendario” o “Abrir en la web del cine”.

En newsletters o afiches físicos
Podrías generar un QR que apunte a “Cartelera personalizada” para un user. Ej: en un mail → QR que abre la agenda de esa semana.

👉 Conclusión: no es esencial para el MVP, pero es un nice-to-have para compartir. Podés dejarlo como feature futura con una lib como qrcode.react
.

login con google para obtener email

<!--
diseño en base a
- https://gasti.pro/en/
- https://v0.app/chat/pointer-ai-landing-page-b3xq2HC1JCs
- https://www.miscuentas.com.ar/dashboard
- https://ui.shadcn.com/blocks: A dashboard with sidebar, charts and data table
- https://youtu.be/XgqCh2FwNVY: 2. How to add Google OAuth in Nextjs with Supabase | Server Component | Server Action | Google Login
 -->

compartir noticia peli via qr con whastapp?

usar lambda
