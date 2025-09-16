-- create a table for users
create table public.users (
  id uuid not null references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  has_upload_csv boolean default false,
  created_at timestamptz default now(),
  primary key (id)
);

alter table public.users enable row level security;

-- trigger inserts a row into public.users
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users
    (id, full_name, email, avatar_url)
  values
    (
      new.id,
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'email',
      new.raw_user_meta_data ->> 'avatar_url'
    );
  return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();


-- Cines
create table public.cinemas (
  id          serial primary key,
  name        text not null unique,
  year        int not null,
  url         text not null unique
);

-- Directores
create table public.directors (
  id          serial primary key,
  name        text not null unique,
  created_at  timestamptz default now()
);

-- Relación muchos-a-muchos entre usuario y director favorito
create table public.user_directors (
  user_id     uuid not null references public.users(id) on delete cascade,
  director_id int  not null references public.directors(id) on delete cascade,
  created_at  timestamptz default now(),

  primary key (user_id, director_id)
);

-- Películas
create table public.movies (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  url          text,
  year         int,
  director_id  int references public.directors(id) on delete set null,
  created_at   timestamptz default now()
);

-- Proyecciones
create table public.screenings (
  id             serial primary key,
  screening_time timestamptz not null,
  cinema_id      int not null references public.cinemas(id) on delete cascade,
  movie_id       int not null references public.movies(id) on delete cascade,
  created_at     timestamptz default now()
);