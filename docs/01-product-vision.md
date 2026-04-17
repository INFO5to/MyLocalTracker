# Vision del producto

## Nombre

LocalTracker

## Idea central

Sistema web para que negocios pequenos puedan:

- crear pedidos
- asignar repartidor
- mover el pedido por estados operativos
- enviar un solo aviso al cliente cuando el pedido sale a ruta
- compartir un link privado donde el cliente ve su pedido en un mapa en vivo

## Problema que resuelve

Muchos negocios pequenos coordinan entregas por WhatsApp, llamadas o memoria.
Eso produce:

- poca visibilidad para el cliente
- incertidumbre de entrega
- desorden operativo
- dependencia de responder mensajes manuales

LocalTracker busca resolver eso con una experiencia simple:

1. el negocio opera en un panel interno
2. el repartidor actualiza la ruta desde una vista propia
3. el cliente solo abre su link privado de seguimiento

## Resultado esperado para el cliente final

El cliente no necesita entrar al panel ni instalar una app nativa.

Recibe un mensaje con un link y, al abrirlo, puede ver:

- estado actual del pedido
- ETA estimada
- eventos del flujo
- repartidor asignado
- mapa en tiempo real cuando el pedido ya esta en ruta

## Resultado esperado para el negocio

El negocio obtiene:

- un panel unico para crear y mover pedidos
- visibilidad de pedidos en curso
- vista de repartidor para activar tracking
- control de acceso por login
- una base lista para seguir creciendo

## Actores del sistema

### Negocio / staff

- entra por login
- usa `/dashboard`
- crea pedidos
- asigna repartidor
- mueve estados

### Repartidor

- entra por login
- usa `/driver/[code]`
- marca el avance del pedido
- emite coordenadas al sistema

### Cliente

- no entra al panel
- no necesita cuenta
- usa solo `/track/[token]`
- ve exclusivamente su pedido

## Propuesta de valor

"Un solo mensaje al cliente. El resto del seguimiento vive en tu mapa en tiempo real."

## Limites actuales del MVP

- WhatsApp sigue en sandbox de Twilio para pruebas
- tracking continuo depende del navegador y de que la pantalla siga activa
- el fondo total del seguimiento tipo Uber nativo aun no esta planteado como app movil nativa

## Meta del MVP actual

Validar que un negocio pequeno puede operar pedidos y compartir un tracking vivo
sin necesidad de construir una app nativa compleja.
