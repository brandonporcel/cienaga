-- Borrar trigger
drop trigger if exists on_auth_user_created on auth.users;

-- Borrar la función que usaba el trigger
drop function if exists public.handle_new_user();

-- Borrar las tablas que dependen de otras
drop table if exists public.notifications;
drop table if exists public.user_directors; 
drop table if exists public.user_movies; 
drop table if exists public.screenings cascade; 
drop table if exists public.screening_times; 
drop table if exists public.cinemas cascade;
drop table if exists public.users cascade; 
drop table if exists public.directors cascade;
drop table if exists public.movies cascade;
