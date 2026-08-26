-- Agregar columna de desuscripción a users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS unsubscribed boolean DEFAULT false;
