-- Migración: coordenadas y dirección para la página /cinemas (mapa Leaflet)
-- Ejecutar en el SQL editor de Supabase.
-- Reflejado en db/schema.sql y docs/database.md (2026-10-10).

alter table public.cinemas
  add column if not exists address text,
  add column if not exists lat double precision,
  add column if not exists lng double precision;