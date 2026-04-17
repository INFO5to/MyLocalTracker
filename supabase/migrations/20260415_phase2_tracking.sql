create table if not exists public.courier_locations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  courier_id uuid references public.couriers(id) on delete set null,
  tracking_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters double precision,
  speed_mps double precision,
  heading_degrees double precision,
  source text not null default 'browser',
  recorded_at timestamptz not null default timezone('utc', now())
);

create index if not exists courier_locations_order_id_recorded_at_idx
  on public.courier_locations (order_id, recorded_at desc);

create index if not exists courier_locations_tracking_code_recorded_at_idx
  on public.courier_locations (tracking_code, recorded_at desc);

create index if not exists courier_locations_courier_id_recorded_at_idx
  on public.courier_locations (courier_id, recorded_at desc);

alter table public.courier_locations enable row level security;

drop policy if exists "phase2_read_courier_locations" on public.courier_locations;
create policy "phase2_read_courier_locations"
on public.courier_locations
for select
to anon, authenticated
using (true);

drop policy if exists "phase2_insert_courier_locations" on public.courier_locations;
create policy "phase2_insert_courier_locations"
on public.courier_locations
for insert
to anon, authenticated
with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'courier_locations'
  ) then
    alter publication supabase_realtime add table public.courier_locations;
  end if;
end
$$;
