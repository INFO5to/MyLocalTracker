create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) then
    create type public.app_role as enum (
      'owner',
      'staff',
      'driver'
    );
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    coalesce(new.email, 'sin-correo@localtracker.app'),
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        split_part(coalesce(new.email, 'usuario'), '@', 1)
      ),
      ''
    )
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

insert into public.profiles (
  id,
  email,
  full_name,
  role,
  is_active
)
select
  users.id,
  coalesce(users.email, 'sin-correo@localtracker.app'),
  nullif(
    coalesce(
      users.raw_user_meta_data ->> 'full_name',
      users.raw_user_meta_data ->> 'name',
      split_part(coalesce(users.email, 'usuario'), '@', 1)
    ),
    ''
  ),
  'staff'::public.app_role,
  true
from auth.users as users
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(public.profiles.full_name, excluded.full_name);

alter table public.orders
add column if not exists public_tracking_token text;

create unique index if not exists orders_public_tracking_token_idx
  on public.orders (public_tracking_token);

create or replace function public.generate_public_tracking_token()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'trk_' || encode(gen_random_bytes(12), 'hex');
    exit when not exists (
      select 1
      from public.orders
      where public_tracking_token = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.assign_public_tracking_token()
returns trigger
language plpgsql
as $$
begin
  if new.public_tracking_token is null or length(trim(new.public_tracking_token)) = 0 then
    new.public_tracking_token = public.generate_public_tracking_token();
  end if;

  return new;
end;
$$;

drop trigger if exists orders_assign_public_tracking_token on public.orders;
create trigger orders_assign_public_tracking_token
before insert on public.orders
for each row
execute function public.assign_public_tracking_token();

update public.orders
set public_tracking_token = public.generate_public_tracking_token()
where public_tracking_token is null
   or length(trim(public_tracking_token)) = 0;

create or replace function public.has_internal_role(allowed_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = any(allowed_roles)
  );
$$;

grant execute on function public.has_internal_role(public.app_role[]) to authenticated;

create or replace function public.get_public_tracking_order(lookup_token text)
returns table (
  id uuid,
  tracking_code text,
  public_tracking_token text,
  business_name text,
  customer_name text,
  status public.order_status,
  delivery_address text,
  delivery_lat double precision,
  delivery_lng double precision,
  eta_minutes integer,
  updated_at timestamptz,
  is_tracking_enabled boolean,
  items text[],
  courier_id uuid,
  courier_full_name text,
  courier_phone text,
  courier_vehicle_type text,
  courier_vehicle_plate text,
  live_latitude double precision,
  live_longitude double precision,
  live_accuracy_meters double precision,
  live_speed_mps double precision,
  live_heading_degrees double precision,
  live_source text,
  live_recorded_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    orders.id,
    orders.tracking_code,
    orders.public_tracking_token,
    orders.business_name,
    orders.customer_name,
    orders.status,
    orders.delivery_address,
    orders.delivery_lat,
    orders.delivery_lng,
    orders.eta_minutes,
    orders.updated_at,
    orders.is_tracking_enabled,
    orders.items,
    orders.courier_id,
    couriers.full_name,
    couriers.phone,
    couriers.vehicle_type,
    couriers.vehicle_plate,
    latest_location.latitude,
    latest_location.longitude,
    latest_location.accuracy_meters,
    latest_location.speed_mps,
    latest_location.heading_degrees,
    latest_location.source,
    latest_location.recorded_at
  from public.orders as orders
  left join public.couriers as couriers
    on couriers.id = orders.courier_id
  left join lateral (
    select
      courier_locations.latitude,
      courier_locations.longitude,
      courier_locations.accuracy_meters,
      courier_locations.speed_mps,
      courier_locations.heading_degrees,
      courier_locations.source,
      courier_locations.recorded_at
    from public.courier_locations as courier_locations
    where courier_locations.order_id = orders.id
    order by courier_locations.recorded_at desc
    limit 1
  ) as latest_location on true
  where orders.public_tracking_token = lookup_token
  limit 1;
$$;

create or replace function public.get_public_tracking_events(lookup_token text)
returns table (
  id uuid,
  title text,
  description text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    events.id,
    events.title,
    events.description,
    events.created_at
  from public.order_events as events
  inner join public.orders as orders
    on orders.id = events.order_id
  where orders.public_tracking_token = lookup_token
  order by events.created_at desc;
$$;

grant execute on function public.get_public_tracking_order(text) to anon, authenticated;
grant execute on function public.get_public_tracking_events(text) to anon, authenticated;

drop policy if exists "phase1_read_couriers" on public.couriers;
drop policy if exists "phase1_read_orders" on public.orders;
drop policy if exists "phase1_insert_orders" on public.orders;
drop policy if exists "phase1_update_orders" on public.orders;
drop policy if exists "phase1_read_order_events" on public.order_events;
drop policy if exists "phase2_read_courier_locations" on public.courier_locations;
drop policy if exists "phase2_insert_courier_locations" on public.courier_locations;

drop policy if exists "profiles_self_read" on public.profiles;
drop policy if exists "profiles_owner_read_all" on public.profiles;
drop policy if exists "internal_read_orders" on public.orders;
drop policy if exists "internal_insert_orders" on public.orders;
drop policy if exists "internal_update_orders" on public.orders;
drop policy if exists "internal_read_order_events" on public.order_events;
drop policy if exists "internal_read_couriers" on public.couriers;
drop policy if exists "internal_manage_couriers" on public.couriers;
drop policy if exists "internal_read_courier_locations" on public.courier_locations;
drop policy if exists "internal_insert_courier_locations" on public.courier_locations;

revoke all on public.profiles from anon;
revoke all on public.orders from anon;
revoke all on public.order_events from anon;
revoke all on public.couriers from anon;
revoke all on public.courier_locations from anon;

grant select on public.profiles to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select on public.order_events to authenticated;
grant select, update on public.couriers to authenticated;
grant select, insert on public.courier_locations to authenticated;

create policy "profiles_self_read"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_owner_read_all"
on public.profiles
for select
to authenticated
using (
  public.has_internal_role(
    array['owner']::public.app_role[]
  )
);

create policy "internal_read_orders"
on public.orders
for select
to authenticated
using (
  public.has_internal_role(
    array['owner', 'staff', 'driver']::public.app_role[]
  )
);

create policy "internal_insert_orders"
on public.orders
for insert
to authenticated
with check (
  public.has_internal_role(
    array['owner', 'staff']::public.app_role[]
  )
);

create policy "internal_update_orders"
on public.orders
for update
to authenticated
using (
  public.has_internal_role(
    array['owner', 'staff', 'driver']::public.app_role[]
  )
)
with check (
  public.has_internal_role(
    array['owner', 'staff', 'driver']::public.app_role[]
  )
);

create policy "internal_read_order_events"
on public.order_events
for select
to authenticated
using (
  public.has_internal_role(
    array['owner', 'staff', 'driver']::public.app_role[]
  )
);

create policy "internal_read_couriers"
on public.couriers
for select
to authenticated
using (
  public.has_internal_role(
    array['owner', 'staff', 'driver']::public.app_role[]
  )
);

create policy "internal_manage_couriers"
on public.couriers
for update
to authenticated
using (
  public.has_internal_role(
    array['owner', 'staff']::public.app_role[]
  )
)
with check (
  public.has_internal_role(
    array['owner', 'staff']::public.app_role[]
  )
);

create policy "internal_read_courier_locations"
on public.courier_locations
for select
to authenticated
using (
  public.has_internal_role(
    array['owner', 'staff', 'driver']::public.app_role[]
  )
);

create policy "internal_insert_courier_locations"
on public.courier_locations
for insert
to authenticated
with check (
  public.has_internal_role(
    array['owner', 'staff', 'driver']::public.app_role[]
  )
);

-- Despues de crear tu primer usuario en Supabase Auth > Users, conviertelo en owner.
-- Ejemplo:
-- update public.profiles
-- set role = 'owner', full_name = 'Tu Nombre'
-- where email = 'tu-correo@dominio.com';
