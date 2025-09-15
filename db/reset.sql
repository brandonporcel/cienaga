-- Borrar trigger
drop trigger if exists on_auth_user_created on auth.users;

-- Borrar la función que usaba el trigger
drop function if exists public.handle_new_user();

-- Borrar la tabla de usuarios propia
drop table if exists public.users;
