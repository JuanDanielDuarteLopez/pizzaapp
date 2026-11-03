# Konys Pizza · App móvil de reservas de mesas

App para **Android e iOS** hecha con **React Native + Expo** y **Supabase** como base de datos.
Permite que los clientes reserven mesa desde el celular (sin llamar ni escribir por WhatsApp)
y que el administrador gestione mesas, horarios, reservas y la carta.

## Qué incluye

**Cliente (sin registro)**
- Inicio con el horario y las tarjetas de mesas (terraza / salón, capacidad).
- Reservar: elegir fecha, hora (franjas de almuerzo y noche), nombre, personas y teléfono opcional.
- Las horas ocupadas aparecen en gris; no se puede reservar dos veces la misma mesa a la misma hora.
- Confirmación con el resumen de la reserva.
- Carta digital por categorías (pizzas, entradas, postres, bebidas).

**Administrador (protegido con PIN de 4 números)**
- Mesas: crear, editar, borrar y activar/desactivar.
- Horarios: jornadas por día de la semana y duración de cada reserva.
- Reservas: filtros Hoy / Mañana / Todas, detalle y cambio de estado (confirmada, completada, cancelada).
- Carta: agregar, editar, ocultar y eliminar platos.
- Cambiar el PIN y cerrar sesión.

## Puesta en marcha (paso a paso)

### 1. Crear la base de datos en Supabase
1. Entra a [supabase.com](https://supabase.com), crea un proyecto (o usa uno que ya tengas).
2. Ve a **SQL Editor → New query**, pega todo el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
   Esto crea las tablas, las reglas de seguridad y datos de ejemplo (5 mesas, horarios y una carta de muestra).
3. Ve a **Project Settings → API** y copia la **Project URL** y la clave **anon / publishable**.
   ⚠️ Nunca uses la clave `service_role` en la app.

### 2. Configurar las claves
Copia `.env.example` como `.env` y pega tus datos:

```
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
```

### 3. Instalar y ejecutar
Necesitas [Node.js](https://nodejs.org) (versión LTS) y la app **Expo Go** en tu celular
(el celular y el computador en la misma red Wi-Fi).

```bash
npm install
npx expo start
```

Escanea el código QR con Expo Go (Android) o con la cámara (iPhone).
Si cambias el archivo `.env`, reinicia con `npx expo start -c`.

### 4. Entrar como administrador
En la pestaña **Admin** ingresa el PIN **1234** (el de ejemplo) y **cámbialo de inmediato**
con el botón de la llave 🔑 del panel.

## Generar el APK para instalar en Android

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

Al terminar, Expo te da un enlace para descargar el APK. (El perfil `preview` ya está en `eas.json`.)
Las variables del `.env` deben estar disponibles en el build: súbelas en **expo.dev → tu proyecto → Environment variables**
con los mismos nombres (`EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

## Estructura del proyecto

```
app/                     Pantallas (Expo Router: cada archivo es una pantalla)
  (tabs)/index.js        Inicio: mesas
  (tabs)/carta.js        Carta
  (tabs)/admin.js        Acceso con PIN + panel
  reservar/[mesaId].js   Reservar mesa
  confirmacion.js        Confirmación
components/              Piezas reutilizables (botones, tarjetas, etc.)
  admin/                 Secciones del panel: mesas, horarios, reservas, carta
services/                Lógica: conexión a Supabase, horas disponibles, fechas
constants/               Colores y datos fijos del negocio
supabase/schema.sql      Base de datos completa (tablas, seguridad, funciones)
docs/mockups/            Mockups de baja fidelidad
```

Para cambiar colores o textos fijos (nombre, eslogan, horario del encabezado):
`constants/colors.js` y `constants/negocio.js`.

## Cómo evita las dobles reservas

Al confirmar, la app llama a la función `crear_reserva` de la base de datos, que bloquea la mesa
para esa fecha, revisa que ninguna otra reserva se cruce en el horario y recién ahí guarda.
Si dos personas tocan "Confirmar" al mismo tiempo, solo una gana y la otra recibe un aviso para elegir otra hora.

## Seguridad: lo que debes saber

- Los clientes **no pueden leer** las reservas ni los datos de otros clientes; solo ven qué horas están ocupadas.
- Todas las acciones de administración exigen el PIN en el servidor (no solo en la app).
- El PIN es de 4 números: es suficiente para un negocio pequeño, pero no es una autenticación fuerte.
  Si más adelante quieres más seguridad, el siguiente paso es usar Supabase Auth con correo y contraseña.
- El PIN se guarda cifrado en la base de datos y, en el celular del administrador, en el almacenamiento local
  para no pedirlo cada vez. Usa "cerrar sesión" (icono de salida) si prestas el celular.

## Decisiones de diseño

- Las horas se ofrecen **cada 30 minutos** (12:30, 13:00, 13:30…) y cada reserva dura lo que indique el horario (60 min por defecto).
  Una reserva a las 17:30 bloquea también las 17:00 y 18:00 de esa mesa, porque se cruzan.
- La **foto de la mesa** es opcional y se agrega pegando el enlace de una imagen.
- La zona horaria usada para validar fechas pasadas es la de Colombia (`America/Bogota`).

## Plan de commits sugerido (mínimo 5, en días distintos)

1. `chore: proyecto Expo inicial y README`
2. `docs: agregar documento de proyecto y mockups`
3. `feat: navegación por pestañas y pantalla de inicio con mesas`
4. `feat: pantalla de reserva con fecha, jornada y formulario`
5. `feat: integración con Supabase`
6. `feat: módulo de administración (mesas, horarios, reservas, carta)`
7. `fix: ajustes tras pruebas en Android e iOS`
8. `chore: configuración de EAS Build y enlaces en el README`

```bash
git init
git add .
git commit -m "chore: proyecto Expo inicial y README"
git branch -M main
git remote add origin https://github.com/<usuario>/konys-reservas-app.git
git push -u origin main
```

El archivo `.env` está en `.gitignore`: nunca lo subas al repositorio.
