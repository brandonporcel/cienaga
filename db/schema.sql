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
  url         text not null unique,
  image_url   text unique,
  enabled     boolean not null default true,
  slug        text not null unique,
  last_scraped timestamptz,
  scraping_frequency interval DEFAULT '12 hours'
);


-- Directores
create table public.directors (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  url         text,
  image_url   text,
  description text,
  tmdb_id     text,
  created_at  timestamptz default now()
);

-- Relación muchos-a-muchos entre usuario y director favorito
create table public.user_directors (
  user_id     uuid not null references public.users(id) on delete cascade,
  director_id uuid not null references public.directors(id) on delete cascade,
  created_at  timestamptz default now(),

  primary key (user_id, director_id)
);

-- Películas
create table public.movies (
  id                 uuid primary key default uuid_generate_v4(),
  title              text not null,
  poster_url         text,
  background_img_url text,
  url                text,
  year               int,
  rating             numeric(3, 1),
  director_id        uuid references public.directors(id) on delete set null,
  created_at         timestamptz default now()
);

-- Relación muchos-a-muchos entre usuario y peliculas
create table public.user_movies (
  user_id     uuid not null references public.users(id) on delete cascade,
  movie_id    uuid not null references public.movies(id) on delete cascade,
  rating      numeric(3, 1),
  created_at  timestamptz default now(),

  primary key (user_id, movie_id)
);


-- Proyecciones
create table public.screenings (
  id                  uuid primary key default uuid_generate_v4(),
  event_type          text,
  description         text,
  room                text,
  original_url        text,
  thumbnail_url       text,
  screening_time_text text,
  cinema_id           int  not null references public.cinemas(id) on delete cascade,
  movie_id            uuid not null references public.movies(id) on delete cascade,
  created_at          timestamptz default now()
);

CREATE TABLE public.screening_times (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  screening_id       uuid NOT NULL REFERENCES public.screenings(id) ON DELETE CASCADE,
  screening_datetime timestamptz NOT NULL,
  created_at         timestamptz DEFAULT now()
);

-- Index para búsquedas eficientes
CREATE INDEX idx_screening_times_datetime ON public.screening_times(screening_datetime);
CREATE INDEX idx_screening_times_screening_id ON public.screening_times(screening_id);

CREATE TABLE public.notifications (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid REFERENCES users(id),
  screening_ids uuid[],
  sent_at       timestamptz DEFAULT now(),
  email_subject text,
  metadata      jsonb,
  created_at    timestamptz DEFAULT now()
);

-- Index para búsquedas eficientes por usuario
CREATE INDEX idx_notifications_user_id_sent_at 
ON public.notifications(user_id, sent_at DESC);