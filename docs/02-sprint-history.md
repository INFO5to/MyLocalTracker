# Historial por sprints

## Resumen general

El proyecto ha avanzado por etapas cortas y acumulativas. Este es el registro de
lo construido hasta el momento.

## Sprint 1 - Base funcional del producto

### Objetivo

Levantar la base del sistema y conectarlo a Supabase con una primera capa
operativa.

### Entregables logrados

- estructura inicial en Next.js 16 + React 19
- PWA base con `manifest` e iconos
- landing page inicial
- dashboard operativo
- tracking publico basico
- integracion base con Supabase
- modelo inicial de datos con:
  - `couriers`
  - `orders`
  - `order_events`

### SQL asociado

- `supabase/migrations/20260415_phase1.sql`

### Resultado del sprint

Se logro crear pedidos reales, leerlos desde Supabase y mostrar su estado.

## Sprint 2 - Tracking en vivo y vista repartidor

### Objetivo

Convertir el MVP en un sistema que muestre movimiento real del pedido.

### Entregables logrados

- tabla `courier_locations`
- mapa con Leaflet + OpenStreetMap
- vista de repartidor `/driver/[code]`
- tracking publico enriquecido
- captura de ubicacion desde navegador
- envio manual de ubicacion
- tracking continuo cada 5 segundos
- simulacion de avance para pruebas de escritorio
- actualizacion del tracking del cliente
- notificaciones por WhatsApp/SMS via Twilio

### SQL asociado

- `supabase/migrations/20260415_phase2_tracking.sql`

### Resultado del sprint

Ya se pudo mover el pedido en un mapa real y validar el flujo principal del
producto.

### Estado de cierre

Fase 2 cerrada aproximadamente al 95%.

## Sprint 2.5 - Pruebas reales fuera de red local

### Objetivo

Sacar el MVP de la prueba puramente local y permitir pruebas reales en distintas
redes.

### Entregables logrados

- despliegue en Vercel
- configuracion de variables de entorno en Vercel
- ajuste de `TRACKING_PUBLIC_BASE_URL`
- pruebas desde distintas redes y celulares
- correccion de horas por zona horaria
- validacion del tracking publico desde URL real

### Resultado del sprint

El producto dejo de depender exclusivamente de IP local para la parte publica y
ya se pudo probar en una URL publica.

## Sprint 3 - Seguridad, separacion de vistas y endurecimiento inicial

### Objetivo

Separar por completo panel interno y vista cliente, con control de acceso real.

### Entregables logrados

- login interno con Supabase Auth
- tabla `profiles`
- roles internos:
  - `owner`
  - `staff`
  - `driver`
- proteccion de `/dashboard`
- proteccion de `/driver/[code]`
- token privado por pedido para `/track/[token]`
- cierre inicial de RLS
- RPCs publicos para leer tracking sin abrir tablas internas

### SQL asociado

- `supabase/migrations/20260416_phase3_auth.sql`

### Resultado del sprint

Ya no cualquiera puede abrir el panel operativo y el cliente solo ve su pedido.

## Sprint visual - Pulido de interfaz

### Objetivo

Mejorar la percepcion de producto con una interfaz mas intencional y agradable.

### Entregables logrados

- paleta rojo pastel
- modo claro y oscuro
- toggle con sol y luna
- botones tipo iPhone
- mejora visual en home, login, dashboard, tracking y driver

### Resultado

El sistema ya no solo funciona: tambien empieza a sentirse como producto.

## Estado actual consolidado

- MVP tecnico: listo
- MVP visual: bien encaminado
- seguridad interna: lista para operacion basica
- tracking vivo: validado
- mensajeria: funcional para pruebas via sandbox

## Pendiente mayor para etapas futuras

- salir del sandbox de Twilio
- usar un remitente real de empresa
- seguir refinando UX y confiabilidad movil
