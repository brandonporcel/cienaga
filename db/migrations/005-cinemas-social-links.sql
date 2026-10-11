-- Migración: enlaces de web e Instagram por cine (detalle de cine)
-- Ejecutar en el SQL editor de Supabase (ya aplicada en prod 2026-10-11).
-- Reflejado en db/schema.sql y docs/database.md.
-- NOTA: `cinemas.url` es un placeholder de la app (https://cienaga.app/cinemas/...) para
-- cines auto-descubiertos, por eso NO hay backfill de website_url desde url: los enlaces
-- reales se completan a mano (MALBA: malba.org.ar + @museomalba, Lumiton: lumiton.ar).

alter table public.cinemas
  add column if not exists website_url text,
  add column if not exists instagram_url text;