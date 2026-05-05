-- ============================================================
-- Weekend Planner – Supabase Schema
-- Run this in the Supabase SQL editor to bootstrap the database.
-- ============================================================

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table if not exists events (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  date       date not null,
  location   text not null
);

-- Auth-free: id is a client-generated UUID stored in localStorage.
-- No FK to auth.users — the join form works without Supabase Auth.
create table if not exists users (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  phone            text,
  dietary          text,
  beer_level       smallint check (beer_level between 0 and 5),
  spirits_level    smallint check (spirits_level between 0 and 5),
  snoring_warning  boolean not null default false
);

-- Migration: if the table already exists with the auth FK, run:
-- alter table users drop constraint users_id_fkey;

create table if not exists cars (
  id                  uuid primary key default uuid_generate_v4(),
  event_id            uuid not null references events(id) on delete cascade,
  driver_id           uuid not null references users(id) on delete cascade,
  address             text not null,
  seats_total         smallint not null check (seats_total > 0),
  departure_datetime  timestamptz not null
);

create table if not exists car_passengers (
  car_id   uuid not null references cars(id) on delete cascade,
  user_id  uuid not null references users(id) on delete cascade,
  primary key (car_id, user_id)
);

create table if not exists tents (
  id        uuid primary key default uuid_generate_v4(),
  event_id  uuid not null references events(id) on delete cascade,
  host_id   uuid not null references users(id) on delete cascade,
  name      text not null,
  type      text not null,
  capacity  smallint not null check (capacity > 0)
);

create table if not exists tent_guests (
  tent_id  uuid not null references tents(id) on delete cascade,
  user_id  uuid not null references users(id) on delete cascade,
  primary key (tent_id, user_id)
);

create table if not exists announcements (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid not null references events(id) on delete cascade,
  message    text not null,
  pinned     boolean not null default false,
  reactions  jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- If the table already exists, add the reactions column:
-- alter table announcements add column if not exists reactions jsonb not null default '{}'::jsonb;

create table if not exists djs (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid not null references events(id) on delete cascade,
  name       text not null,
  photo_url  text,
  bio        text,
  set_time   timestamptz,
  revealed   boolean not null default false
);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table events         enable row level security;
alter table users          enable row level security;
alter table cars           enable row level security;
alter table car_passengers enable row level security;
alter table tents          enable row level security;
alter table tent_guests    enable row level security;
alter table announcements  enable row level security;
alter table djs            enable row level security;

-- events: read-only for all authenticated users
create policy "events: authenticated read"
  on events for select
  to authenticated
  using (true);

-- users: fully public — auth-free join form, private festival
create policy "users: public read"
  on users for select
  to anon, authenticated
  using (true);

create policy "users: public insert"
  on users for insert
  to anon, authenticated
  with check (true);

create policy "users: public update"
  on users for update
  to anon, authenticated
  using (true)
  with check (true);

-- cars: anyone authenticated can read; only driver can write
create policy "cars: authenticated read"
  on cars for select
  to authenticated
  using (true);

create policy "cars: driver insert"
  on cars for insert
  to authenticated
  with check (driver_id = auth.uid());

create policy "cars: driver update"
  on cars for update
  to authenticated
  using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

create policy "cars: driver delete"
  on cars for delete
  to authenticated
  using (driver_id = auth.uid());

-- car_passengers: authenticated read; passenger manages own row;
-- driver can also remove passengers from their car
create policy "car_passengers: authenticated read"
  on car_passengers for select
  to authenticated
  using (true);

create policy "car_passengers: self insert"
  on car_passengers for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "car_passengers: self or driver delete"
  on car_passengers for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from cars
      where cars.id = car_passengers.car_id
        and cars.driver_id = auth.uid()
    )
  );

-- tents: authenticated read; only host can write
create policy "tents: authenticated read"
  on tents for select
  to authenticated
  using (true);

create policy "tents: host insert"
  on tents for insert
  to authenticated
  with check (host_id = auth.uid());

create policy "tents: host update"
  on tents for update
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create policy "tents: host delete"
  on tents for delete
  to authenticated
  using (host_id = auth.uid());

-- tent_guests: authenticated read; guest manages own row;
-- host can also remove guests from their tent
create policy "tent_guests: authenticated read"
  on tent_guests for select
  to authenticated
  using (true);

create policy "tent_guests: self insert"
  on tent_guests for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "tent_guests: self or host delete"
  on tent_guests for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from tents
      where tents.id = tent_guests.tent_id
        and tents.host_id = auth.uid()
    )
  );

-- announcements: public read (anon + authenticated); writes via service role only
create policy "announcements: authenticated read"
  on announcements for select
  to authenticated
  using (true);

create policy "announcements: anon read"
  on announcements for select
  to anon
  using (true);

-- djs: authenticated read of revealed rows only; unrevealed visible to
-- service role only (admins use service role key to manage djs)
create policy "djs: authenticated read revealed"
  on djs for select
  to authenticated
  using (revealed = true);
