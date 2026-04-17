# LocalTracker

Sistema web de seguimiento de pedidos en tiempo real para negocios pequenos.

## Que es hoy

LocalTracker ya funciona como MVP real:

- panel interno protegido por login
- vista de repartidor
- tracking publico por link privado
- mapa en vivo
- Supabase como backend
- Vercel como despliegue publico
- Twilio Sandbox como canal de prueba para avisos

## Stack

- Next.js 16.2.3
- React 19.2.4
- Supabase
- Tailwind CSS 4
- Leaflet + OpenStreetMap
- Twilio
- Vercel

## Rutas principales

- `/`: portada del producto
- `/login`: acceso interno
- `/dashboard`: panel operativo
- `/driver/[code]`: vista de repartidor
- `/track/[token]`: tracking del cliente

## Comandos

```bash
npm run dev
npm run lint
npm run build
```

## Variables de entorno base

Usa `.env.example` como base:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
TRACKING_PUBLIC_BASE_URL=http://192.168.1.25:3000
APP_TIME_ZONE=America/Mexico_City
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_CONTENT_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SMS_FROM=+1234567890
```

## Migraciones SQL

Ejecutar en este orden:

1. `supabase/migrations/20260415_phase1.sql`
2. `supabase/migrations/20260415_phase2_tracking.sql`
3. `supabase/migrations/20260416_phase3_auth.sql`

## Documentacion completa

Toda la historia y documentacion detallada del proyecto esta en:

- [docs/README.md](./docs/README.md)
- [docs/01-product-vision.md](./docs/01-product-vision.md)
- [docs/02-sprint-history.md](./docs/02-sprint-history.md)
- [docs/03-architecture.md](./docs/03-architecture.md)
- [docs/04-supabase-and-data-model.md](./docs/04-supabase-and-data-model.md)
- [docs/05-environments-and-deployment.md](./docs/05-environments-and-deployment.md)
- [docs/06-operations-and-testing.md](./docs/06-operations-and-testing.md)
- [docs/07-roadmap.md](./docs/07-roadmap.md)

## Estado actual

- Fase 1: lista
- Fase 2: lista en un 95%
- Sprint 2.5: listo
- Sprint 3: iniciado con auth, seguridad y pulido visual

## Nota importante

El cliente final nunca debe entrar al panel interno. El flujo correcto es:

1. negocio entra por `/login`
2. negocio opera en `/dashboard`
3. repartidor usa `/driver/[code]`
4. cliente abre solo `/track/[token]`
