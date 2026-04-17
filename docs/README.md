# Documentacion de LocalTracker

Esta carpeta concentra la documentacion funcional, tecnica y operativa del
proyecto.

## Indice

1. [Vision del producto](./01-product-vision.md)
2. [Historial por sprints](./02-sprint-history.md)
3. [Arquitectura de la aplicacion](./03-architecture.md)
4. [Supabase y modelo de datos](./04-supabase-and-data-model.md)
5. [Entornos, despliegue y Vercel](./05-environments-and-deployment.md)
6. [Guia operativa y pruebas](./06-operations-and-testing.md)
7. [Roadmap y siguientes pasos](./07-roadmap.md)

## Estado actual resumido

- Producto: funcionando como MVP real.
- Panel interno: protegido por login con Supabase Auth.
- Cliente final: entra solo con link privado por pedido.
- Tracking: mapa en vivo funcionando en web publica.
- Mensajeria: Twilio Sandbox conservado por ahora para pruebas.
- Despliegue: Vercel publico.

## Convencion recomendada

Cuando se agreguen nuevas funciones, actualiza primero:

1. `docs/02-sprint-history.md` para registrar el sprint.
2. `docs/03-architecture.md` si cambia el flujo o la estructura tecnica.
3. `docs/04-supabase-and-data-model.md` si cambia SQL, RLS o tablas.
4. `docs/07-roadmap.md` para mover tareas entre backlog, en curso y listo.
