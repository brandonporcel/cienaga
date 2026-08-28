-- Marcar cortometrajes para excluirlos del pipeline de scraping
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS is_short boolean DEFAULT false;
