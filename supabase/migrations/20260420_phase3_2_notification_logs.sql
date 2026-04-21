create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  tracking_code text not null,
  destination_phone text,
  channel text,
  delivery_status text not null,
  reason text,
  triggered_by_status public.order_status not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notification_logs_order_id_created_at_idx
  on public.notification_logs (order_id, created_at desc);

create index if not exists notification_logs_tracking_code_created_at_idx
  on public.notification_logs (tracking_code, created_at desc);

alter table public.notification_logs enable row level security;

grant select, insert on public.notification_logs to authenticated;

drop policy if exists "internal_read_notification_logs" on public.notification_logs;
create policy "internal_read_notification_logs"
on public.notification_logs
for select
to authenticated
using (
  public.has_internal_role(
    array['owner', 'staff']::public.app_role[]
  )
);

drop policy if exists "driver_read_assigned_notification_logs" on public.notification_logs;
create policy "driver_read_assigned_notification_logs"
on public.notification_logs
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
    where orders.id = notification_logs.order_id
      and couriers.profile_id = auth.uid()
  )
);

drop policy if exists "internal_insert_notification_logs" on public.notification_logs;
create policy "internal_insert_notification_logs"
on public.notification_logs
for insert
to authenticated
with check (
  public.has_internal_role(
    array['owner', 'staff', 'driver']::public.app_role[]
  )
);
