-- Helfer-App Ostern 2027 – Datenbank-Schema
-- Im Supabase-Dashboard unter "SQL Editor" einmal komplett ausführen.

create extension if not exists pgcrypto;

-- Bereiche (z. B. Gastro, Gebet, Aufbau) mit Bereichsleitung
create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  leader_name text,
  leader_email text,
  leader_phone text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Helfereinsätze
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas(id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  task text not null,
  capacity int not null default 1 check (capacity > 0),
  note text,
  location text,
  created_at timestamptz not null default now()
);
create index if not exists shifts_area_idx on public.shifts(area_id, shift_date, start_time);

-- Registrierte Helfer (1:1 zu auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

-- Administratoren (werden per SQL eingetragen, siehe README)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Anmeldungen zu Einsätzen
create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (shift_id, user_id)
);

-- Profil automatisch anlegen, wenn sich jemand registriert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Übersicht der Einsätze: nur Anzahl Belegungen, keine Namen
create or replace function public.shift_overview(p_area uuid default null)
returns table (
  id uuid, area_id uuid, shift_date date, start_time time, end_time time,
  task text, capacity int, note text, location text, taken int, mine boolean
)
language sql stable security definer set search_path = public as $$
  select s.id, s.area_id, s.shift_date, s.start_time, s.end_time,
         s.task, s.capacity, s.note, s.location,
         (select count(*)::int from public.signups x where x.shift_id = s.id) as taken,
         exists (select 1 from public.signups x where x.shift_id = s.id and x.user_id = auth.uid()) as mine
  from public.shifts s
  where auth.uid() is not null and (p_area is null or s.area_id = p_area)
  order by s.shift_date, s.start_time, s.task;
$$;

-- Für einen Einsatz eintragen (prüft freie Plätze, sicher bei gleichzeitigen Anmeldungen)
create or replace function public.take_shift(p_shift uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  cap int;
  cnt int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select capacity into cap from public.shifts where id = p_shift for update;
  if cap is null then raise exception 'shift_not_found'; end if;
  if exists (select 1 from public.signups where shift_id = p_shift and user_id = auth.uid()) then
    raise exception 'already_signed_up';
  end if;
  select count(*) into cnt from public.signups where shift_id = p_shift;
  if cnt >= cap then raise exception 'shift_full'; end if;
  insert into public.signups (shift_id, user_id) values (p_shift, auth.uid());
  return cnt + 1;
end $$;

-- Sich wieder austragen
create or replace function public.leave_shift(p_shift uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  delete from public.signups where shift_id = p_shift and user_id = auth.uid();
  return found;
end $$;

-- Zugriffsrechte (Row Level Security)
alter table public.areas enable row level security;
alter table public.shifts enable row level security;
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.signups enable row level security;

drop policy if exists "areas read" on public.areas;
create policy "areas read" on public.areas for select to authenticated using (true);

drop policy if exists "shifts read" on public.shifts;
create policy "shifts read" on public.shifts for select to authenticated using (true);

drop policy if exists "profile read own" on public.profiles;
create policy "profile read own" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "admins read own" on public.admins;
create policy "admins read own" on public.admins for select to authenticated using (user_id = auth.uid());

drop policy if exists "signups read own" on public.signups;
create policy "signups read own" on public.signups for select to authenticated using (user_id = auth.uid());

-- E-Mail der Bereichsleitung ist für Helfer nicht abrufbar (nur Name)
revoke select on public.areas from anon, authenticated;
grant select (id, name, description, leader_name, sort_order) on public.areas to authenticated;

revoke execute on function public.shift_overview(uuid) from public, anon;
revoke execute on function public.take_shift(uuid) from public, anon;
revoke execute on function public.leave_shift(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.shift_overview(uuid) to authenticated;
grant execute on function public.take_shift(uuid) to authenticated;
grant execute on function public.leave_shift(uuid) to authenticated;
