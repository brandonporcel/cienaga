-- Migración: registro de corridas de scraping ("última búsqueda")
-- Ejecutar en el SQL editor de Supabase (pendiente de aplicar en prod).
-- Reflejado en db/schema.sql y docs/database.md.
-- Sin RLS (decisión del proyecto: tablas públicas sin RLS, anon key con acceso total).

create table if not exists public.scrape_runs (
  id                uuid primary key default uuid_generate_v4(),
  source            text not null,
  status            text not null default 'running'
                      check (status in ('running', 'success', 'error')),
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  entries_processed int,
  error_message     text
);

-- Última corrida exitosa (para el badge "Última búsqueda").
create index if not exists idx_scrape_runs_status_started_at
  on public.scrape_runs (status, started_at desc);

create index if not exists idx_scrape_runs_source_started_at
  on public.scrape_runs (source, started_at desc);
