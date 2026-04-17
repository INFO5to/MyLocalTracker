# Guia operativa y pruebas

## Flujo operativo del negocio

1. entrar por `/login`
2. abrir `/dashboard`
3. crear pedido
4. asignar repartidor
5. avanzar el flujo:
   - `pending`
   - `confirmed`
   - `preparing`
   - `ready`
   - `on_the_way`
   - `delivered`

## Flujo del repartidor

1. entrar a `/driver/[code]`
2. revisar estado actual
3. compartir tracking publico si aplica
4. cambiar a `En camino`
5. enviar ubicacion:
   - una vez
   - cada 5 segundos
   - simulacion de prueba

## Flujo del cliente

1. recibe un link
2. abre `/track/[token]`
3. ve su pedido
4. observa estado, ETA, timeline y mapa

## Checklist de prueba manual

### Pedido nuevo

- [ ] el pedido se crea
- [ ] genera tracking code
- [ ] genera token publico
- [ ] aparece en dashboard
- [ ] crea evento inicial

### Seguridad

- [ ] usuario sin login no entra a `/dashboard`
- [ ] usuario sin login no entra a `/driver/[code]`
- [ ] cliente solo puede abrir `/track/[token]`
- [ ] el cliente no ve el panel interno

### Tracking

- [ ] el pedido pasa a `En camino`
- [ ] el link publico abre
- [ ] el mapa aparece
- [ ] la ultima posicion cambia
- [ ] el marcador se mueve si hay nueva ubicacion

### Notificaciones

- [ ] el mensaje se dispara al pasar a `En camino`
- [ ] el cliente recibe el link correcto
- [ ] el link abre la vista publica

## Casos especiales ya entendidos

### Si el pedido no tiene coordenadas

El mapa puede seguir vacio hasta que:

- se capture `delivery_lat` y `delivery_lng`
- o el repartidor mande su primera ubicacion

### Si el tracking no se actualiza

Revisar:

- permisos de geolocalizacion
- internet del celular
- si la pantalla sigue activa
- si el pedido ya esta en `on_the_way`

### Si WhatsApp no entrega

Revisar:

- limite diario del sandbox
- si el numero hizo `join` al sandbox
- formato del numero
- variables de Twilio

## Comandos utiles

```bash
npm run dev
npm run lint
npm run build
```

## Git basico del proyecto

Para subir cambios:

```bash
git add .
git commit -m "mensaje"
git push
```

## Buenas practicas operativas

- no compartir links internos del panel
- compartir solo el link publico del cliente
- usar pedidos de prueba cuando se toque mensajeria
- si cambias entorno en Vercel, redeployar
- si cambias SQL, documentarlo en el sprint correspondiente
