# 🛒 Rilmar Tech — E-Commerce REST API

Backend REST API para una plataforma de comercio electrónico desarrollada con Node.js, Express, PostgreSQL, Prisma, MongoDB Atlas y Mongoose.

El proyecto implementa autenticación segura mediante JWT almacenado exclusivamente en cookies HTTP-Only, gestión administrativa de productos, carrito persistente, checkout transaccional, wishlist, reseñas, alertas de reposición y emails transaccionales.

La arquitectura utiliza PostgreSQL para el dominio relacional y transaccional, MongoDB para funcionalidades documentales y servicios externos como Cloudinary y Resend.

---

## 🚀 Demo y documentación

### API desplegada

https://backend-modulo2-api.onrender.com

> La versión desplegada puede diferir temporalmente de la rama de desarrollo actual hasta completar un nuevo despliegue.

### Swagger UI

https://backend-modulo2-api.onrender.com/api/docs/

---

## 📸 Capturas del proyecto

### Swagger UI

![Swagger](docs/swagger-production.png)

### Despliegue en Render

![Render](docs/render-deploy.png)

### Reviews almacenadas en MongoDB Atlas

![MongoDB Reviews](docs/mongodb-reviews.png)

---

## 📊 Características principales

### Autenticación y seguridad

- Registro, login, persistencia de sesión y logout
- JWT almacenado exclusivamente en cookies HTTP-Only
- JWT no expuesto en el cuerpo de las respuestas
- Ausencia de tokens de autenticación en `localStorage`
- Expiración de JWT y cookie alineada a 1 hora
- Autorización basada en roles `USER` y `ADMIN`
- Middleware de autenticación con validación del usuario actual
- Invalidación de sesiones anteriores mediante `authVersion`
- Política fuerte de contraseñas
- Recuperación segura de contraseña
- Tokens de recuperación de un solo uso
- Expiración de tokens de recuperación a los 15 minutos
- Rate limiting específico para endpoints de autenticación
- Respuesta anti-enumeración en recuperación de contraseña
- CORS configurado con credenciales
- Helmet para cabeceras de seguridad HTTP
- bcrypt para almacenamiento seguro de contraseñas

### Productos y administración

- CRUD administrativo de productos
- Protección de operaciones administrativas mediante rol `ADMIN`
- Desactivación lógica mediante `isActive`
- Restauración de productos desactivados
- Múltiples imágenes por producto
- Carga de imágenes mediante Cloudinary
- Búsqueda y paginación
- Filtrado por categoría
- Filtrado por estado
- Filtrado por stock
- Filtrado por precio
- Filtrado por disponibilidad
- Ordenación por fecha y precio
- Ordenación priorizando productos disponibles

### Comercio

- Carrito persistente en PostgreSQL
- Un único carrito activo por usuario
- Un único elemento por producto dentro del carrito
- Checkout transaccional
- Control atómico de stock
- Protección frente a overselling concurrente
- Creación de pedidos
- Snapshots comerciales de productos comprados
- Importes monetarios mediante `Decimal(10,2)`
- Conservación del histórico aunque cambie posteriormente el producto

### Funcionalidades adicionales

- Wishlist persistente mediante MongoDB Atlas
- Reseñas de productos mediante MongoDB Atlas
- Alertas de reposición persistentes
- Email de bienvenida
- Email de recuperación de contraseña
- Email automático cuando un producto vuelve a tener stock
- Integración con Resend
- Manejo centralizado de errores HTTP
- Serialización centralizada de respuestas
- Migraciones mediante Prisma Migrate
- Documentación OpenAPI / Swagger
- Tests automatizados con Jest y Supertest
- Despliegue mediante Render

---

## 🏗️ Arquitectura

La aplicación utiliza dos sistemas de persistencia con responsabilidades diferenciadas.

### PostgreSQL + Prisma

PostgreSQL contiene la información relacional y transaccional:

- Usuarios
- Roles
- Productos
- Carritos
- Elementos del carrito
- Pedidos
- Elementos de pedido
- Alertas de reposición
- Tokens hash de recuperación de contraseña
- Control de versión de autenticación

Las operaciones críticas de checkout se ejecutan mediante transacciones de Prisma.

### MongoDB Atlas + Mongoose

MongoDB almacena información documental:

- Wishlists
- Reviews

### Cloudinary

Cloudinary se utiliza para almacenar y distribuir las imágenes de los productos.

### Resend

Resend se utiliza para emails transaccionales:

- Bienvenida al registrar una cuenta
- Recuperación de contraseña
- Notificaciones de reposición

```text
                         Cliente HTTP
                              │
                              ▼
                         Express API
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
         PostgreSQL + Prisma       MongoDB + Mongoose
         ───────────────────       ──────────────────
         • Usuarios                • Wishlists
         • Roles                   • Reviews
         • Productos
         • Carritos
         • CartItems
         • Pedidos
         • OrderItems
         • RestockAlerts
         • Auth security data
                 │
                 ▼
           Servicios externos
           ─────────────────
           • Cloudinary
           • Resend
```

---

## 🧰 Stack tecnológico

| Tecnología | Uso |
| --- | --- |
| Node.js | Runtime |
| Express 5 | Framework HTTP |
| PostgreSQL | Base de datos relacional y transaccional |
| Prisma 7 | ORM y migraciones |
| PostgreSQL Adapter | Adaptador de Prisma para PostgreSQL |
| MongoDB Atlas | Base de datos documental |
| Mongoose | ODM para MongoDB |
| JWT | Autenticación |
| Cookie Parser | Lectura de cookies |
| CORS | Control de orígenes y credenciales |
| Helmet | Cabeceras de seguridad HTTP |
| Express Rate Limit | Protección frente a abuso |
| bcrypt | Hash de contraseñas |
| Node Crypto | Generación y hash de tokens de recuperación |
| Cloudinary | Gestión de imágenes |
| Multer | Procesamiento de archivos |
| Resend | Emails transaccionales |
| Jest | Testing |
| Supertest | Tests HTTP |
| Swagger / OpenAPI | Documentación de la API |
| Render | Despliegue |

---

## 📁 Estructura del proyecto

```text
prisma/
├── migrations/
└── schema.prisma

src/
├── config/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── services/
├── utils/
├── app.js
└── server.js

tests/
├── integration/
└── unit/
```

### Organización por capas

- **Controllers:** gestionan peticiones y respuestas HTTP.
- **Services:** contienen lógica de negocio y acceso a datos.
- **Routes:** definen los endpoints.
- **Middlewares:** autenticación, autorización, rate limiting, errores y otras operaciones intermedias.
- **Models:** esquemas de MongoDB/Mongoose.
- **Config:** configuración de servicios y entorno.
- **Utils:** utilidades compartidas.
- **Prisma:** esquema relacional y migraciones.

---

## ⚙️ Variables de entorno

Crear un archivo `.env` en la raíz.

> Nunca deben almacenarse secretos reales ni el archivo `.env` dentro del repositorio.

Ejemplo:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"

MONGO_URI="mongodb+srv://user:password@cluster.mongodb.net/database"

JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="1h"

FRONTEND_URL="http://localhost:5173"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

RESEND_API_KEY="your_resend_api_key"
EMAIL_FROM="Rilmar Tech <onboarding@resend.dev>"
```

La expiración del JWT está alineada con la duración de la cookie de autenticación.

---

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/J-Mateo/modulo2.git
cd modulo2
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear `.env` con las variables necesarias para PostgreSQL, MongoDB Atlas, JWT, Cloudinary, Resend y el frontend.

### 4. Generar Prisma Client

```bash
npx prisma generate
```

### 5. Aplicar migraciones

Desarrollo:

```bash
npx prisma migrate dev
```

Producción:

```bash
npx prisma migrate deploy
```

> En producción debe utilizarse `prisma migrate deploy`, no `prisma migrate dev`.

### 6. Iniciar el servidor

Desarrollo:

```bash
npm run dev
```

Producción:

```bash
npm start
```

---

## 🗃️ Prisma y migraciones

El esquema relacional está versionado mediante Prisma Migrate.

Entre las migraciones actuales se encuentran:

```text
prisma/
├── migrations/
│   ├── 0_init/
│   ├── 20260825072752_add_user_name/
│   ├── 20260825073233_make_user_name_required/
│   ├── 20260903111751_harden_commerce_domain/
│   └── 20260907070501_add_secure_password_reset/
└── schema.prisma
```

La migración de endurecimiento del dominio comercial incorpora garantías como:

- Importes mediante `Decimal(10,2)`
- Estados de pedidos
- Estado de activación de productos
- Snapshots en `OrderItem`
- Relación opcional entre `OrderItem` y `Product`
- Restricciones de integridad del carrito
- Índices para consultas frecuentes
- Unicidad de producto dentro de un carrito
- Un único carrito `ACTIVE` por usuario

La migración de recuperación segura incorpora en `User`:

- `authVersion`
- `passwordResetTokenHash`
- `passwordResetExpiresAt`
- Índice para expiración de tokens

Para comprobar las migraciones:

```bash
npx prisma migrate status
```

---

## 💰 Tratamiento de importes monetarios

Los importes monetarios no utilizan números de coma flotante para su persistencia.

Los precios, totales y precios históricos se almacenan mediante:

```text
Decimal(10,2)
```

Los cálculos críticos del checkout utilizan `Prisma.Decimal`.

En las respuestas HTTP los importes se serializan manteniendo dos decimales.

Ejemplo:

```json
{
  "price": "26.00"
}
```

Esto evita problemas derivados de la aritmética binaria de coma flotante y preserva el contrato monetario de la API.

---

# 🔐 Autenticación y seguridad

## JWT y cookies HTTP-Only

La autenticación utiliza JWT almacenado en una cookie HTTP-Only denominada `access_token`.

El JWT:

- No se almacena en `localStorage`
- No se devuelve en el JSON
- No necesita enviarse manualmente mediante `Authorization: Bearer`
- Se transmite mediante la cookie
- Es validado por el backend en las rutas protegidas

El frontend debe habilitar credenciales.

Ejemplo con Axios:

```js
axios.create({
  withCredentials: true,
});
```

La cookie y el JWT tienen actualmente una duración de **1 hora**.

---

## 📝 Registro

```http
POST /api/auth/register
```

Ejemplo:

```json
{
  "name": "Test User",
  "email": "user@example.com",
  "password": "Password123!"
}
```

Al registrarse:

1. Se validan los datos.
2. Se comprueba la política de contraseña.
3. La contraseña se procesa mediante bcrypt.
4. Se crea el usuario.
5. Se genera el JWT.
6. Se establece la cookie HTTP-Only.
7. Se intenta enviar un email de bienvenida mediante Resend.

Un fallo del proveedor de email no revierte la creación correcta de la cuenta.

La respuesta nunca expone:

- `passwordHash`
- JWT
- `authVersion`
- Información de recuperación de contraseña

---

## 🔑 Login

```http
POST /api/auth/login
```

Ejemplo:

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

El backend verifica las credenciales y genera un JWT asociado al estado actual de autenticación del usuario.

La cookie se configura como HTTP-Only y el JWT no se devuelve en el JSON.

---

## 🚪 Logout

```http
POST /api/auth/logout
```

El endpoint elimina la cookie `access_token`.

---

## 👤 Perfil

```http
GET /api/users/profile
```

Requiere una cookie válida.

El middleware:

1. Lee `access_token`.
2. Verifica la firma y expiración del JWT.
3. Obtiene el usuario actual.
4. Comprueba su `authVersion`.
5. Rechaza tokens pertenecientes a una versión anterior.

Esto permite también recuperar la sesión desde el frontend después de recargar la aplicación.

---

# 🔒 Política de contraseñas

Las nuevas contraseñas deben contener:

- Al menos 8 caracteres
- Al menos una letra minúscula
- Al menos una letra mayúscula
- Al menos un número
- Al menos un carácter especial

Ejemplo válido:

```text
Password123!
```

La política se aplica tanto al registro como al establecimiento de una nueva contraseña mediante recuperación.

---

# 🔄 Recuperación segura de contraseña

## Solicitar recuperación

```http
POST /api/auth/forgot-password
```

Body:

```json
{
  "email": "user@example.com"
}
```

La respuesta pública es deliberadamente genérica:

```text
Si existe una cuenta asociada a ese correo, recibirás instrucciones para restablecer la contraseña.
```

El backend devuelve la misma respuesta independientemente de si el email existe.

Esto reduce la posibilidad de utilizar el endpoint para enumerar cuentas registradas.

### Generación del token

Si existe el usuario:

1. Se genera un token criptográficamente aleatorio mediante `crypto.randomBytes`.
2. El token real se incluye únicamente en el enlace enviado por email.
3. PostgreSQL almacena únicamente un hash SHA-256 del token.
4. Se establece una expiración de 15 minutos.
5. Una nueva solicitud invalida el token anterior.

El token original nunca se almacena en la base de datos.

---

## Establecer nueva contraseña

```http
POST /api/auth/reset-password
```

Body:

```json
{
  "token": "reset-token-received-by-email",
  "password": "NewPassword123!"
}
```

El backend:

1. Valida la nueva contraseña.
2. Calcula el hash SHA-256 del token recibido.
3. Busca un token válido y no expirado.
4. Genera el nuevo hash bcrypt de contraseña.
5. Consume el token.
6. Elimina los datos de recuperación.
7. Incrementa `authVersion`.

El consumo del token y el cambio de contraseña utilizan una operación condicional atómica.

Por tanto, un mismo token no puede consumirse correctamente dos veces.

---

## Invalidación de sesiones tras reset

Cada usuario dispone de:

```text
authVersion
```

La versión actual se incorpora al JWT.

Cuando se restablece una contraseña:

```text
authVersion = authVersion + 1
```

A partir de ese momento, los JWT emitidos con una versión anterior dejan de ser aceptados por el middleware de autenticación aunque todavía no hayan alcanzado su expiración temporal.

De esta forma, un cambio de contraseña invalida las sesiones anteriores.

---

## 🛡️ Rate limiting de autenticación

Los endpoints sensibles disponen de límites específicos.

| Operación | Límite |
| --- | --- |
| Login | 10 intentos / 15 min |
| Registro | 10 intentos / hora |
| Forgot password | 5 solicitudes / 15 min |
| Reset password | 10 intentos / 15 min |

Los logins correctos no consumen permanentemente el límite configurado para intentos fallidos.

Durante `NODE_ENV=test`, estos limitadores se omiten para evitar que el estado interno del rate limiter interfiera entre tests automatizados.

---

## 🍪 Cookies y CORS

El backend utiliza CORS con credenciales.

El origen permitido se configura mediante:

```env
FRONTEND_URL=http://localhost:5173
```

En producción debe contener la URL del frontend desplegado.

El cliente debe enviar las peticiones autenticadas con credenciales habilitadas.

---

# 📦 Productos

## Catálogo público

```http
GET /api/products
```

El catálogo público expone únicamente productos activos.

Admite búsqueda, filtrado, ordenación y paginación.

Entre los filtros soportados actualmente se encuentran:

- Búsqueda por texto
- Categoría
- Precio mínimo
- Precio máximo
- Disponibilidad

También admite ordenación por:

- Más recientes
- Precio
- Disponibilidad

Ejemplo:

```http
GET /api/products?page=1&limit=12&category=Audio&minPrice=20&maxPrice=300&availability=inStock&sortBy=price&sortOrder=asc
```

La respuesta incluye metadatos de paginación:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 0,
    "totalPages": 0
  }
}
```

---

## Obtener producto por ID

```http
GET /api/products/:id
```

Los productos inactivos no se exponen mediante el endpoint público.

---

# 🛠️ Administración de productos

Las operaciones administrativas requieren autenticación y rol `ADMIN`.

El backend permite:

- Crear productos
- Actualizar productos
- Desactivar productos
- Restaurar productos
- Gestionar múltiples imágenes
- Filtrar productos administrativos
- Buscar productos
- Filtrar por categoría
- Filtrar por estado
- Filtrar por stock

### Crear

```http
POST /api/products
```

### Actualizar

```http
PUT /api/products/:id
```

### Desactivar

```http
DELETE /api/products/:id
```

La eliminación administrativa es lógica:

```text
isActive = false
```

Esto permite retirar un producto del catálogo sin destruir información histórica relacionada con el dominio comercial.

---

# 🖼️ Imágenes

Los productos admiten múltiples imágenes:

```text
images: String[]
```

Las imágenes se procesan mediante Multer y pueden almacenarse en Cloudinary.

---

# ❤️ Wishlist

La wishlist se almacena en MongoDB Atlas y está vinculada al usuario autenticado.

### Consultar

```http
GET /api/wishlist
```

### Añadir o eliminar

```http
POST /api/wishlist/:productId
```

El endpoint funciona como toggle.

La wishlist persiste entre sesiones porque no depende del almacenamiento local del navegador.

---

# ⭐ Reviews

Las reseñas se almacenan mediante MongoDB Atlas y Mongoose.

MongoDB se utiliza para este dominio documental mientras PostgreSQL conserva la información relacional y transaccional del ecommerce.

---

# 🛒 Carrito

El carrito está asociado al usuario autenticado y se almacena en PostgreSQL.

La base de datos garantiza:

- Un único carrito `ACTIVE` por usuario
- Un único `CartItem` por producto dentro del carrito
- Persistencia entre sesiones

Las rutas protegidas obtienen la identidad directamente de la sesión autenticada.

---

# 💳 Checkout transaccional

El checkout actual se ejecuta dentro de una transacción de Prisma.

Durante la operación:

1. Se obtiene el carrito activo.
2. Se comprueba que contiene productos.
3. Se valida la disponibilidad.
4. Se decrementa stock mediante operaciones condicionales atómicas.
5. Se calcula el total mediante `Prisma.Decimal`.
6. Se crea el pedido.
7. Se almacenan snapshots comerciales.
8. El carrito pasa a `CHECKED_OUT`.

Si cualquier operación falla, la transacción se revierte.

La actualización condicional de stock evita que dos checkouts concurrentes puedan vender correctamente la misma última unidad.

---

# 📋 Pedidos

Los pedidos se almacenan en PostgreSQL.

Estados disponibles:

```text
PENDING
PAID
CANCELLED
REFUNDED
```

Cada pedido conserva:

- Usuario propietario
- Total
- Estado
- Fechas
- Elementos comprados

Cada `OrderItem` conserva:

- Nombre del producto
- Imagen
- Cantidad
- Precio aplicado en la compra
- Referencia opcional al producto original

Esto permite mantener el histórico aunque posteriormente cambien o desaparezcan datos del producto.

### Estado actual del checkout

El checkout interno actual mantiene la semántica existente de pedidos completados.

La integración real con Stripe está prevista como siguiente evolución del flujo de pago.

Con Stripe, el objetivo es evolucionar a:

```text
PENDING
   │
   ▼
Stripe Checkout / Payment
   │
   ▼
Webhook verificado
   │
   ▼
PAID
```

La API completa de consulta y gestión del historial de pedidos continúa pendiente de desarrollo.

---

# 🔔 Alertas de reposición

Los usuarios autenticados pueden solicitar una notificación cuando un producto agotado vuelva a estar disponible.

Estados:

```text
PENDING
NOTIFIED
CANCELLED
```

### Consultar

```http
GET /api/products/:id/restock-alert
```

### Activar

```http
POST /api/products/:id/restock-alert
```

### Cancelar

```http
DELETE /api/products/:id/restock-alert
```

Cuando el stock cambia:

```text
0 → stock positivo
```

el backend procesa las alertas `PENDING`.

Si Resend confirma correctamente el envío:

```text
PENDING → NOTIFIED
```

y se registra `notifiedAt`.

Si el proveedor falla:

- El cambio de stock no se revierte
- La alerta permanece `PENDING`
- El resto del procesamiento puede continuar

Un incremento sobre un producto que ya tenía stock no genera una nueva notificación:

```text
0 → 5   notifica
5 → 8   no vuelve a notificar
```

---

# ✉️ Emails transaccionales

El backend integra Resend para tres tipos de emails.

## Bienvenida

Se intenta enviar después de crear correctamente una cuenta.

El fallo del email no invalida el registro.

## Recuperación de contraseña

Incluye un enlace:

```text
FRONTEND_URL/reset-password?token=...
```

El token:

- Expira en 15 minutos
- Es de un solo uso
- No se almacena en texto plano

## Reposición

Se envía cuando un producto pasa de agotado a disponible y existen alertas pendientes.

### Seguridad del contenido

El contenido dinámico insertado en HTML se escapa antes de construir los emails.

---

## 🧪 Resend durante desarrollo y testing

Los tests automatizados **no envían emails reales**.

El servicio de email se mockea para comprobar:

- Que se intenta enviar el email correspondiente
- El destinatario
- El asunto
- La generación de enlaces
- El contenido relevante
- La gestión de errores del proveedor
- El escape del HTML dinámico

Esto evita que la suite dependa de un servicio externo.

### Pruebas manuales

En el modo de testing de Resend, sin un dominio propio verificado, el proveedor puede limitar los destinatarios a la dirección autorizada de la cuenta.

Esta es una restricción del proveedor durante testing y no del flujo de negocio de la aplicación.

Para enviar emails a destinatarios arbitrarios en producción sería necesario verificar un dominio en Resend y configurar `EMAIL_FROM` con una dirección perteneciente a dicho dominio.

No es necesario disponer de un dominio propio para ejecutar los tests automatizados del proyecto.

---

# ⚠️ Manejo de errores

La aplicación utiliza un sistema centralizado basado en:

- `AppError`
- `ErrorSelector`
- Middleware global `errorHandler`

Las respuestas mantienen una estructura consistente.

Ejemplo:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

Los errores inesperados no deben exponer información interna sensible en producción.

El sistema contempla también respuestas `429 Too Many Requests` para límites de autenticación.

---

# 🧪 Testing

El proyecto utiliza Jest y Supertest.

Ejecutar:

```bash
npm test
```

La suite se ejecuta secuencialmente mediante `--runInBand`.

## Tests de integración

Actualmente se cubren, entre otros:

- Auth
- Users
- Products
- Cart
- Commerce Domain
- Wishlist
- Health Check

## Tests unitarios

Se cubren:

- Password hashing
- Password policy
- Products Service
- Reviews Service
- Wishlist Service
- Restock Alerts Service
- Email Service

---

## 🔐 Seguridad verificada mediante tests

Los tests comprueban:

- Registro
- Login
- Credenciales incorrectas
- Cookie `access_token`
- Atributo `HttpOnly`
- JWT ausente del JSON
- `passwordHash` ausente del JSON
- Política fuerte de contraseñas
- Rechazo de contraseñas débiles
- Recuperación de contraseña
- Respuesta anti-enumeración
- Token válido de recuperación
- Rechazo de tokens expirados
- Token de un solo uso
- Hash bcrypt después del reset
- Eliminación de los datos de recuperación
- Invalidación de sesiones anteriores mediante `authVersion`

---

## 💰 Dominio comercial verificado

La suite comprueba garantías críticas como:

- Serialización monetaria
- Conservación de dos decimales
- Exclusión de productos inactivos
- Snapshots comerciales
- Conservación del precio histórico
- Cálculos mediante `Decimal`
- Decremento de stock
- Rollback ante stock insuficiente
- Rechazo de productos inactivos
- Protección frente a overselling concurrente

La prueba de concurrencia ejecuta dos checkouts que compiten por una única unidad y comprueba que solo uno puede completarse correctamente.

---

## 🔔 Emails y reposición verificados

Los tests comprueban:

- Transición de agotado a disponible
- Ausencia de notificaciones innecesarias
- Procesamiento de alertas pendientes
- Cambio a `NOTIFIED`
- Permanencia en `PENDING` si falla el proveedor
- Continuación del procesamiento ante fallos
- Integración HTTP con Resend mediante mocks
- Manejo de errores del proveedor
- Configuración de email
- Generación de enlaces
- Email de bienvenida
- Email de recuperación
- Email de reposición
- Escape de contenido HTML dinámico

---

## 📈 Resultado actual

```text
Test Suites: 14 passed, 14 total
Tests:       79 passed, 79 total
Snapshots:   0 total
```

---

# 🔐 Decisiones de seguridad relevantes

El backend adopta varias decisiones explícitas para reducir riesgos comunes.

### JWT fuera de JavaScript

El token se almacena en una cookie HTTP-Only en lugar de `localStorage`.

### Contraseñas mediante bcrypt

Las contraseñas nunca se almacenan en texto plano.

### Tokens de recuperación no almacenados en claro

Solo se persiste el hash SHA-256.

### Recuperación anti-enumeración

`forgot-password` no revela si una dirección pertenece a una cuenta.

### Tokens temporales y de un solo uso

Los tokens expiran a los 15 minutos y son consumidos durante el cambio de contraseña.

### Invalidación de sesiones

Cambiar la contraseña incrementa `authVersion`, invalidando JWT anteriores.

### Rate limiting

Los endpoints de autenticación disponen de límites específicos frente a abuso.

### Autorización en backend

Las operaciones administrativas no dependen únicamente de la protección visual del frontend: el backend comprueba el rol `ADMIN`.

### Stock y concurrencia

El checkout utiliza transacciones y actualizaciones condicionales para proteger la integridad del inventario.

### Datos monetarios

Los importes utilizan `Decimal` en lugar de coma flotante.

### Uploads

Las imágenes se gestionan mediante Cloudinary y Multer en lugar de almacenarse como archivos arbitrarios dentro del servidor.

---

# ✅ Estado actual

Actualmente están implementadas y verificadas:

- ✅ Registro
- ✅ Login mediante cookie HTTP-Only
- ✅ Persistencia de sesión
- ✅ Logout
- ✅ Perfil autenticado
- ✅ Roles `USER` / `ADMIN`
- ✅ Invalidación de sesiones tras reset
- ✅ Política fuerte de contraseñas
- ✅ Forgot password
- ✅ Reset password
- ✅ Token de recuperación seguro
- ✅ Expiración y uso único del token
- ✅ Rate limiting de autenticación
- ✅ Email de bienvenida
- ✅ Email de recuperación
- ✅ CORS con credenciales
- ✅ CRUD administrativo de productos
- ✅ Desactivación y restauración de productos
- ✅ Múltiples imágenes
- ✅ Cloudinary
- ✅ Búsqueda y filtros administrativos
- ✅ Catálogo público con búsqueda y filtros
- ✅ Filtros de precio y disponibilidad
- ✅ Ordenación del catálogo
- ✅ Paginación
- ✅ Carrito persistente
- ✅ Integridad del carrito
- ✅ Checkout transaccional
- ✅ Control atómico de stock
- ✅ Protección frente a overselling
- ✅ Creación de pedidos
- ✅ Snapshots comerciales
- ✅ Importes mediante `Decimal(10,2)`
- ✅ Wishlist persistente
- ✅ Reviews
- ✅ Alertas de reposición
- ✅ Emails de reposición
- ✅ Manejo centralizado de errores
- ✅ PostgreSQL
- ✅ Prisma Migrate
- ✅ MongoDB Atlas
- ✅ Jest
- ✅ Supertest
- ✅ 14 suites / 79 tests
- ✅ Swagger / OpenAPI
- ✅ Despliegue backend en Render

---

# 🗺️ Próximas mejoras

Las principales evoluciones previstas son:

### Prioridad alta

- Integración real de pagos mediante Stripe
- Confirmación de pagos mediante webhooks
- API de historial de pedidos
- Historial de pedidos del usuario
- Gestión administrativa de pedidos

### Evolución posterior

- Devoluciones y reembolsos
- Dashboard administrativo ampliado
- Gestión de clientes
- Analítica administrativa
- SKU y slug comerciales
- Soporte al cliente
- Preguntas frecuentes
- Mejoras adicionales del perfil

---

## 👩‍💻 Autora

**Jessica Mateo**

Proyecto desarrollado de forma individual como aplicación full-stack de comercio electrónico, con especial atención a arquitectura modular, autenticación segura, persistencia híbrida PostgreSQL/MongoDB, integridad transaccional, seguridad del dominio comercial y testing automatizado.