# Supabase y modelo de datos

## Proyecto actual

Supabase es el backend principal del sistema.

Usos actuales:

- base de datos Postgres
- autenticacion interna
- Realtime
- RPCs publicos de tracking

## Orden de migraciones

1. `supabase/migrations/20260415_phase1.sql`
2. `supabase/migrations/20260415_phase2_tracking.sql`
3. `supabase/migrations/20260416_phase3_auth.sql`

## Tablas principales

### `couriers`

Guarda repartidores disponibles.

Campos relevantes:

- `id`
- `full_name`
- `phone`
- `vehicle_type`
- `vehicle_plate`
- `is_active`
- `created_at`
- `updated_at`

### `orders`

Tabla central del sistema.

Campos relevantes:

- `id`
- `tracking_code`
- `public_tracking_token`
- `business_name`
- `customer_name`
- `customer_phone`
- `delivery_address`
- `delivery_lat`
- `delivery_lng`
- `items`
- `total_amount`
- `eta_minutes`
- `status`
- `courier_id`
- `notes`
- `is_tracking_enabled`
- `created_at`
- `updated_at`

### `order_events`

Timeline del pedido.

Campos relevantes:

- `id`
- `order_id`
- `tracking_code`
- `event_type`
- `title`
- `description`
- `created_at`

### `courier_locations`

Ultimas posiciones del repartidor para cada pedido.

Campos relevantes:

- `id`
- `order_id`
- `courier_id`
- `tracking_code`
- `latitude`
- `longitude`
- `accuracy_meters`
- `speed_mps`
- `heading_degrees`
- `source`
- `recorded_at`

### `profiles`

Perfiles internos ligados a `auth.users`.

Campos relevantes:

- `id`
- `email`
- `full_name`
- `role`
- `is_active`
- `created_at`
- `updated_at`

## Roles internos

Definidos como enum `app_role`:

- `owner`
- `staff`
- `driver`

## Triggers y funciones importantes

### Generacion automatica de tracking code

Se asigna automaticamente al insertar pedidos.

### Generacion automatica de public tracking token

Se asigna al insertar pedidos y se backfillea para pedidos antiguos.

### Registro automatico de eventos

Cada cambio importante del pedido genera una fila en `order_events`.

### `handle_new_user_profile()`

Cuando se crea un usuario en `auth.users`, se crea tambien su fila en
`public.profiles`.

### `has_internal_role()`

Funcion auxiliar para politicas de acceso.

### RPCs publicos

- `get_public_tracking_order(text)`
- `get_public_tracking_events(text)`

Estas permiten construir el tracking del cliente sin exponer directamente las
tablas internas al navegador publico.

## Seguridad actual

### Interno

- autenticado por Supabase Auth
- acceso por rol
- RLS activo

### Publico

- lectura publica solo por token
- sin acceso al dashboard
- sin acceso libre a `orders`, `order_events`, `courier_locations` o `couriers`

## Como crear un owner nuevo

1. Crear usuario en `Authentication > Users`
2. Ejecutar:

```sql
update public.profiles
set role = 'owner',
    full_name = 'Tu Nombre'
where email = 'tu-correo@dominio.com';
```

## Nota operativa

El cliente no debe conocer el `tracking_code` interno como llave de negocio.

La vista publica ya opera sobre `public_tracking_token`.
