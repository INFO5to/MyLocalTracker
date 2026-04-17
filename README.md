# LocalTracker

Base de un sistema web de seguimiento de pedidos en tiempo real para negocios pequenos.

## Stack

- Next.js 16.2 + React 19
- Supabase como backend (Postgres, Auth y Realtime)
- PWA con `manifest` e iconos generados
- Tailwind CSS 4
- Leaflet + OpenStreetMap para mapa en vivo

## Lo que ya queda listo

- Landing del producto con enfoque comercial y roadmap Scrum.
- Dashboard operativo en `/dashboard`.
- Tracking publico por pedido en `/track/[code]`.
- Vista de repartidor en `/driver/[code]`.
- Cliente server/browser de Supabase reusable.
- Realtime UI refresh por cambios en `orders` y `order_events`.

## Variables de entorno

Usa `.env.example` como base:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
TRACKING_PUBLIC_BASE_URL=http://192.168.1.25:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_CONTENT_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SMS_FROM=+1234567890
```

Tambien se soporta la clave legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`, pero la
app ya prioriza la `publishable key`.

En este workspace ya deje creada tu conexion local en `.env.local`.

Para notificaciones al cliente:

- `TWILIO_WHATSAPP_FROM` activa WhatsApp outbound.
- `TWILIO_WHATSAPP_CONTENT_SID` es el template aprobado de WhatsApp para mensajes iniciados por el negocio.
- `TWILIO_SMS_FROM` queda como respaldo si WhatsApp falla o aun no esta configurado.
- `TRACKING_PUBLIC_BASE_URL` define la URL que se enviara al cliente dentro del mensaje. En pruebas locales puede ser la IP privada de tu PC; en produccion debe ser tu dominio publico.
- Si no defines `TRACKING_PUBLIC_BASE_URL` y `NEXT_PUBLIC_APP_URL` sigue en `localhost`, la app intentara derivar una IP privada automaticamente para pruebas en la misma red Wi-Fi.

## Rutas principales

- `/`: portada del producto
- `/dashboard`: panel operativo
- `/track/[code]`: tracking publico real
- `/driver/[code]`: vista de repartidor para pedidos reales

## Supuestos actuales para Supabase

La capa de datos intenta leer estas tablas:

- `orders`
- `order_events`

Y asume, por ahora, columnas como:

- En `orders`: `tracking_code`, `customer_name`, `business_name`, `delivery_address`, `courier_name`, `courier_phone`, `courier_vehicle`, `status`, `eta_minutes`, `total_amount`, `items`, `updated_at`
- En `order_events`: `tracking_code`, `title`, `description`, `created_at`

Si tu schema real cambia, solo hay que ajustar el mapeo en `lib/tracking.ts`.

## Fase 1 SQL

La migracion inicial esta lista en:

- `supabase/migrations/20260415_phase1.sql`

Pegala completa en `SQL Editor` de Supabase y ejecútala. Esa migracion crea:

- `couriers`
- `orders`
- `order_events`
- triggers para `tracking_code`, `updated_at` y eventos automaticos
- politicas temporales de Fase 1 para que el formulario funcione sin auth
- seed inicial de repartidores

## Fase 2 SQL

La migracion de tracking en vivo esta en:

- `supabase/migrations/20260415_phase2_tracking.sql`

Pegala tambien en `SQL Editor` de Supabase. Esa migracion crea:

- `courier_locations`
- indices para lectura de ultima posicion
- politicas temporales para insertar y leer posiciones desde la app
- publicacion en `supabase_realtime`

## Flujo de prueba de Fase 2

1. Crea o abre un pedido en `/dashboard`.
2. Si puedes, captura `delivery_lat` y `delivery_lng` para ver tambien el destino en el mapa.
3. Entra a `/driver/[tracking_code]`.
4. Lleva el pedido a `En camino`.
5. Usa `Enviar ubicacion una vez`, `Iniciar tracking cada 5s` o `Simular avance de prueba`.
6. Abre `/track/[tracking_code]` en otra ventana y veras el mapa actualizarse por Realtime.

## Notificaciones al cliente

Cuando el pedido avanza a estos estados desde el panel:

- `on_the_way`
- `delivered`

la app intentara avisar al cliente automaticamente con:

1. WhatsApp via Twilio, si configuraste `TWILIO_WHATSAPP_FROM`
2. SMS via Twilio, si WhatsApp falla y existe `TWILIO_SMS_FROM`

El mensaje incluye:

- nombre del cliente
- codigo del pedido
- negocio
- estado actual
- link publico de tracking

Importante para el link del cliente:

- `http://localhost:3000` solo abre en la misma computadora donde corre la app.
- Para probar en el celular, el telefono debe estar en la misma red y el link debe salir con una IP privada como `http://192.168.x.x:3000`.
- Para clientes reales fuera de tu red, necesitas desplegar la app en internet y usar esa URL en `TRACKING_PUBLIC_BASE_URL`.

Nota importante:

- Para mensajes de WhatsApp iniciados por el negocio normalmente necesitas un template aprobado y su `ContentSid`.
- Si no configuras Twilio, el flujo del pedido sigue funcionando pero la notificacion se omite sin romper la operacion.

## Comandos

```bash
npm run dev
npm run lint
npm run build
```

## Backlog sugerido

1. Crear pedidos y updates desde formularios/server actions.
2. Endurecer seguridad con autenticacion, roles y RLS real.
3. Mejorar el tracking de repartidor para background tracking en celular.
4. Agregar push notifications, ETA inteligente y estados automaticos.
