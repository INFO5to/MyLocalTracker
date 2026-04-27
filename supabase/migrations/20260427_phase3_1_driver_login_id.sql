alter table public.couriers
add column if not exists driver_login_id text;

with ranked_couriers as (
  select
    id,
    row_number() over (order by created_at, id) as sequence_number
  from public.couriers
  where driver_login_id is null
     or length(trim(driver_login_id)) = 0
)
update public.couriers
set driver_login_id = 'DRV-' || lpad(ranked_couriers.sequence_number::text, 3, '0')
from ranked_couriers
where public.couriers.id = ranked_couriers.id;

alter table public.couriers
alter column driver_login_id set not null;

create unique index if not exists couriers_driver_login_id_unique
  on public.couriers (lower(driver_login_id));

create or replace function public.resolve_driver_login(login_id text)
returns table (email text)
language sql
stable
security definer
set search_path = public
as $$
  select profiles.email
  from public.couriers
  join public.profiles
    on profiles.id = couriers.profile_id
  where lower(couriers.driver_login_id) = lower(login_id)
    and profiles.role = 'driver'
    and profiles.is_active = true
  limit 1;
$$;

grant execute on function public.resolve_driver_login(text) to anon, authenticated;
