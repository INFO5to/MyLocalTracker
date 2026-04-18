alter table public.couriers
add column if not exists profile_id uuid references public.profiles(id) on delete set null;

create unique index if not exists couriers_profile_id_unique
  on public.couriers (profile_id)
  where profile_id is not null;

drop policy if exists "internal_read_orders" on public.orders;
drop policy if exists "internal_update_orders" on public.orders;
drop policy if exists "internal_read_order_events" on public.order_events;
drop policy if exists "internal_read_couriers" on public.couriers;
drop policy if exists "internal_read_courier_locations" on public.courier_locations;
drop policy if exists "internal_insert_courier_locations" on public.courier_locations;

create policy "internal_read_orders_staff"
on public.orders
for select
to authenticated
using (
  public.has_internal_role(
    array['owner', 'staff']::public.app_role[]
  )
);

create policy "driver_read_assigned_orders"
on public.orders
for select
to authenticated
using (
  public.has_internal_role(
    array['driver']::public.app_role[]
  )
  and exists (
    select 1
    from public.couriers
    where couriers.id = orders.courier_id
      and couriers.profile_id = auth.uid()
  )
);

create policy "internal_update_orders_staff"
on public.orders
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

create policy "driver_update_assigned_orders"
on public.orders
for update
to authenticated
using (
  public.has_internal_role(
    array['driver']::public.app_role[]
  )
  and exists (
    select 1
    from public.couriers
    where couriers.id = orders.courier_id
      and couriers.profile_id = auth.uid()
  )
)
with check (
  public.has_internal_role(
    array['driver']::public.app_role[]
  )
  and exists (
    select 1
    from public.couriers
    where couriers.id = orders.courier_id
      and couriers.profile_id = auth.uid()
  )
);

create policy "internal_read_order_events_staff"
on public.order_events
for select
to authenticated
using (
  public.has_internal_role(
    array['owner', 'staff']::public.app_role[]
  )
);

create policy "driver_read_assigned_order_events"
on public.order_events
for select
to authenticated
using (
  public.has_internal_role(
    array['driver']::public.app_role[]
  )
  and exists (
    select 1
    from public.orders
    join public.couriers
      on couriers.id = orders.courier_id
    where orders.id = order_events.order_id
      and couriers.profile_id = auth.uid()
  )
);

create policy "internal_read_couriers_staff"
on public.couriers
for select
to authenticated
using (
  public.has_internal_role(
    array['owner', 'staff']::public.app_role[]
  )
);

create policy "driver_read_own_courier"
on public.couriers
for select
to authenticated
using (
  public.has_internal_role(
    array['driver']::public.app_role[]
  )
  and profile_id = auth.uid()
);

create policy "internal_read_courier_locations_staff"
on public.courier_locations
for select
to authenticated
using (
  public.has_internal_role(
    array['owner', 'staff']::public.app_role[]
  )
);

create policy "driver_read_assigned_courier_locations"
on public.courier_locations
for select
to authenticated
using (
  public.has_internal_role(
    array['driver']::public.app_role[]
  )
  and exists (
    select 1
    from public.couriers
    where couriers.id = courier_locations.courier_id
      and couriers.profile_id = auth.uid()
  )
);

create policy "internal_insert_courier_locations_staff"
on public.courier_locations
for insert
to authenticated
with check (
  public.has_internal_role(
    array['owner', 'staff']::public.app_role[]
  )
);

create policy "driver_insert_own_courier_locations"
on public.courier_locations
for insert
to authenticated
with check (
  public.has_internal_role(
    array['driver']::public.app_role[]
  )
  and exists (
    select 1
    from public.couriers
    where couriers.id = courier_locations.courier_id
      and couriers.profile_id = auth.uid()
  )
);
