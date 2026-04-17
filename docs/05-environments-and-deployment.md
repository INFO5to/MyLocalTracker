# Entornos, despliegue y Vercel

## Entornos usados

### Local

Se usa para desarrollo rapido:

- `npm run dev`
- pruebas de formulario
- pruebas locales del driver

### Publico

Se usa Vercel para exponer la app en internet y probarla desde cualquier red.

## Variables de entorno

Base recomendada:

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

## Variables importantes

### `NEXT_PUBLIC_APP_URL`

URL base de la app.

### `TRACKING_PUBLIC_BASE_URL`

URL que se envia al cliente dentro del link de tracking.

### `APP_TIME_ZONE`

Zona horaria usada para formatear horas en la UI.

### `NEXT_PUBLIC_SUPABASE_URL`

URL del proyecto de Supabase.

### `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Clave publica de Supabase para navegador.

### `TWILIO_*`

Variables de mensajeria para sandbox o produccion.

## Vercel

## Flujo recomendado

1. Subir cambios a GitHub
2. Conectar repo con Vercel
3. Configurar variables del proyecto
4. Hacer deploy
5. Validar rutas publicas

## Variables ya necesarias en Vercel

- `APP_TIME_ZONE`
- `NEXT_PUBLIC_APP_URL`
- `TRACKING_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`

## Paso adicional en Supabase

Ir a:

- `Authentication > URL Configuration`

Y definir:

- `Site URL = https://tu-proyecto.vercel.app`

## Deploy manual de cambios

Cada vez que agregues o cambies variables de entorno en Vercel:

1. guardar variables
2. hacer `Redeploy`

## Deploy de codigo

Desde el proyecto local:

```bash
git add .
git commit -m "mensaje"
git push
```

Vercel detecta el push y despliega automaticamente.

## Diferencia clave entre local y publico

### Local con IP privada

- sirve para pruebas en la misma red
- cambia al cambiar de domicilio o Wi-Fi

### Vercel publico

- sirve desde cualquier red
- no depende de IP privada
- es el modo correcto para demos y clientes reales

## Problemas comunes ya vistos

### Hora incorrecta

Solucion:

- agregar `APP_TIME_ZONE=America/Mexico_City`
- redeploy

### Cambios no reflejados

Solucion:

- confirmar `git push`
- confirmar deploy nuevo en Vercel
- redeploy si cambiaste env vars

### Link abre pero no el mapa

Posibles causas:

- no hay coordenadas de destino
- no hay posicion enviada por repartidor
- el pedido aun no esta en ruta

## Nota sobre sandbox

Twilio Sandbox se mantiene para pruebas, pero no se considera solucion de
produccion.
