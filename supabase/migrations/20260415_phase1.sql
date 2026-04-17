create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'order_status'
  ) then
    create type public.order_status as enum (
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'on_the_way',
      'delivered'
    );
  end if;
end
$$;

create table if not exists public.couriers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text unique,
  vehicle_type text,
  vehicle_plate text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique,
  business_name text not null default 'LocalTracker',
  customer_name text not null,
  customer_phone text,
  delivery_address text not null,
  delivery_lat double precision,
  delivery_lng double precision,
  notes text,
  items text[] not null default '{}',
  total_amount numeric(10, 2) not null default 0,
  eta_minutes integer,
  status public.order_status not null default 'pending',
  courier_id uuid references public.couriers(id) on delete set null,
  is_tracking_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  tracking_code text not null,
  event_type text not null,
  title text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_tracking_code_idx on public.orders (tracking_code);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_courier_id_idx on public.orders (courier_id);
create index if not exists order_events_order_id_created_at_idx on public.order_events (order_id, created_at desc);
create index if not exists order_events_tracking_code_created_at_idx on public.order_events (tracking_code, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.generate_tracking_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'LT-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    exit when not exists (
      select 1 from public.orders where tracking_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.assign_tracking_code()
returns trigger
language plpgsql
as $$
begin
  if new.tracking_code is null or length(trim(new.tracking_code)) = 0 then
    new.tracking_code = public.generate_tracking_code();
  end if;

  return new;
end;
$$;

create or replace function public.log_order_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_title text;
  event_description text;
  event_type_value text;
begin
  if tg_op = 'INSERT' then
    event_type_value := 'created';
    event_title := 'Pedido creado';
    event_description := 'El pedido fue registrado y quedo pendiente de confirmacion.';
  elsif new.status is distinct from old.status then
    event_type_value := new.status::text;

    case new.status
      when 'confirmed' then
        event_title := 'Pedido confirmado';
        event_description := 'El pedido fue aceptado por el negocio.';
      when 'preparing' then
        event_title := 'Pedido en preparacion';
        event_description := 'La orden entro en cocina o en proceso de armado.';
      when 'ready' then
        event_title := 'Pedido listo para salir';
        event_description := 'El pedido ya esta preparado para entrega.';
      when 'on_the_way' then
        event_title := 'Pedido en camino';
        event_description := 'El repartidor salio rumbo al cliente.';
      when 'delivered' then
        event_title := 'Pedido entregado';
        event_description := 'La entrega fue marcada como completada.';
      else
        event_title := 'Estado actualizado';
        event_description := 'El pedido cambio de estado.';
    end case;
  else
    return new;
  end if;

  insert into public.order_events (
    order_id,
    tracking_code,
    event_type,
    title,
    description
  )
  values (
    new.id,
    new.tracking_code,
    event_type_value,
    event_title,
    event_description
  );

  return new;
end;
$$;

drop trigger if exists couriers_set_updated_at on public.couriers;
create trigger couriers_set_updated_at
before update on public.couriers
for each row
execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists orders_assign_tracking_code on public.orders;
create trigger orders_assign_tracking_code
before insert on public.orders
for each row
execute function public.assign_tracking_code();

drop trigger if exists orders_log_status_event on public.orders;
create trigger orders_log_status_event
after insert or update of status on public.orders
for each row
execute function public.log_order_status_event();

alter table public.couriers enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;

drop policy if exists "phase1_read_couriers" on public.couriers;
create policy "phase1_read_couriers"
on public.couriers
for select
to anon, authenticated
using (true);

drop policy if exists "phase1_read_orders" on public.orders;
create policy "phase1_read_orders"
on public.orders
for select
to anon, authenticated
using (true);

drop policy if exists "phase1_insert_orders" on public.orders;
create policy "phase1_insert_orders"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "phase1_update_orders" on public.orders;
create policy "phase1_update_orders"
on public.orders
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "phase1_read_order_events" on public.order_events;
create policy "phase1_read_order_events"
on public.order_events
for select
to anon, authenticated
using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'order_events'
  ) then
    alter publication supabase_realtime add table public.order_events;
  end if;
end
$$;

insert into public.couriers (
  full_name,
  phone,
  vehicle_type,
  vehicle_plate
)
values
  ('Luis Vega', '+52 55 0147 2231', 'Moto', 'MX-21'),
  ('Dani Solis', '+52 55 3321 8110', 'Bicicleta', null),
  ('Irene Paz', '+52 55 4410 9002', 'Moto', 'RP-08')
on conflict (phone) do nothing;
