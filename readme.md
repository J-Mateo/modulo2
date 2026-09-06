# 🛒 E-Commerce REST API — Backend Modular

Backend REST API para una plataforma de comercio electrónico desarrollado con Node.js y Express.

La aplicación utiliza PostgreSQL mediante Prisma para la información relacional y transaccional, y MongoDB Atlas mediante Mongoose para funcionalidades documentales como listas de deseos y reseñas de productos.

La autenticación está basada en JWT almacenado exclusivamente en cookies HTTP-Only.

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

- Autenticación mediante JWT almacenado en cookies HTTP-Only
- Registro, login, persistencia de sesión y logout
- Middleware de autenticación mediante cookies
- Autorización basada en roles
- Configuración CORS con credenciales
- Gestión de usuarios y perfiles
- CRUD administrativo de productos
- Desactivación lógica de productos mediante `isActive`
- Múltiples imágenes por producto
- Carga de imágenes mediante Cloudinary
- Búsqueda, filtrado y paginación de productos
- Carrito de compra persistente
- Un único carrito activo por usuario
- Checkout transaccional
- Control atómico de stock durante checkout
- Protección frente a overselling concurrente
- Creación de pedidos con snapshots comerciales
- Importes monetarios almacenados mediante `Decimal(10,2)`
- Wishlist persistente mediante MongoDB Atlas
- Sistema de reseñas de productos
- Alertas de reposición persistentes
- Notificaciones de reposición por email mediante Resend
- Manejo centralizado de errores HTTP
- Serialización centralizada de datos de respuesta
- Migraciones de PostgreSQL mediante Prisma Migrate
- Documentación OpenAPI / Swagger
- Tests automatizados con Jest y Supertest
- Despliegue mediante Render

---

## 🏗️ Arquitectura

La aplicación utiliza dos sistemas de persistencia con responsabilidades diferenciadas.

### PostgreSQL + Prisma

Se utiliza para la información relacional y transaccional:

- Usuarios
- Roles
- Productos
- Carritos
- Elementos del carrito
- Pedidos
- Elementos de pedido
- Alertas de reposición

Las operaciones críticas de checkout se ejecutan mediante transacciones de Prisma sobre PostgreSQL.

El dominio comercial mantiene la integridad de los pedidos independientemente de los cambios posteriores realizados sobre los productos. Cada `OrderItem` conserva un snapshot de la información relevante en el momento de la compra:

- Nombre del producto
- Imagen del producto
- Precio de compra
- Cantidad

El identificador del producto en un elemento de pedido puede quedar desvinculado si el producto deja de existir, sin perder el histórico comercial del pedido.

Los pedidos disponen actualmente de los estados:

```text
PENDING
PAID
CANCELLED
REFUNDED
```

El checkout actual genera pedidos `PAID` para mantener la semántica existente mientras no existe una pasarela de pago externa. La integración futura con Stripe permitirá crear pedidos pendientes y confirmar el pago mediante webhooks.

### MongoDB Atlas + Mongoose

Se utiliza para información documental:

- Wishlists
- Reviews

### Cloudinary

Se utiliza para el almacenamiento y distribución de imágenes de productos.

### Resend

Se utiliza para el envío de emails transaccionales asociados a las alertas de reposición.

```text
                         Cliente HTTP
                              │
                              ▼
                         Express API
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        PostgreSQL + Prisma          MongoDB + Mongoose
        ───────────────────          ──────────────────
        • Usuarios                   • Wishlists
        • Roles                      • Reviews
        • Productos
        • Carritos
        • CartItems
        • Pedidos
        • OrderItems
        • RestockAlerts
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
| Prisma 7 | ORM y migraciones de PostgreSQL |
| PostgreSQL Adapter | Adaptador de Prisma para PostgreSQL |
| MongoDB Atlas | Base de datos documental |
| Mongoose | ODM para MongoDB |
| JWT | Autenticación |
| Cookie Parser | Lectura de cookies |
| CORS | Control de orígenes y credenciales |
| Helmet | Cabeceras de seguridad HTTP |
| Express Rate Limit | Limitación de peticiones |
| bcrypt | Hash de contraseñas |
| Cloudinary | Gestión de imágenes |
| Resend | Envío de emails transaccionales |
| Multer | Procesamiento de archivos |
| Jest | Testing |
| Supertest | Tests de integración HTTP |
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

- **Controllers:** gestionan las peticiones y respuestas HTTP.
- **Services:** contienen la lógica de negocio y acceso a datos.
- **Routes:** definen los endpoints disponibles.
- **Middlewares:** autenticación, autorización, control de caché, errores y otras operaciones intermedias.
- **Models:** esquemas utilizados por MongoDB/Mongoose.
- **Config:** configuración de servicios, bases de datos y entorno.
- **Utils:** utilidades compartidas, errores, serialización y respuestas.
- **Prisma:** esquema relacional y migraciones de PostgreSQL.

---

## ⚙️ Variables de entorno

Crear un archivo `.env` en la raíz del proyecto.

> No incluyas nunca el archivo `.env` ni secretos reales en el repositorio.

Ejemplo:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"

MONGO_URI="mongodb+srv://user:password@cluster.mongodb.net/database"

JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="7d"

FRONTEND_URL="http://localhost:5173"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

RESEND_API_KEY="your_resend_api_key"
EMAIL_FROM="Rilmar Tech <onboarding@resend.dev>"
```

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

### 3. Configurar las variables de entorno

Crear el archivo `.env` con las variables necesarias para PostgreSQL, MongoDB, JWT, frontend, Cloudinary y Resend.

### 4. Generar Prisma Client

```bash
npx prisma generate
```

### 5. Aplicar migraciones

En desarrollo:

```bash
npx prisma migrate dev
```

En producción:

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

El servidor utiliza el puerto definido mediante `PORT`.

---

## 🗃️ Prisma y migraciones

El esquema de PostgreSQL se encuentra versionado mediante Prisma Migrate.

```text
prisma/
├── migrations/
│   ├── 0_init/
│   │   └── migration.sql
│   ├── 20260825072752_add_user_name/
│   │   └── migration.sql
│   ├── 20260825073233_make_user_name_required/
│   │   └── migration.sql
│   └── 20260903111751_harden_commerce_domain/
│       └── migration.sql
└── schema.prisma
```

La migración de endurecimiento del dominio comercial incorpora, entre otras garantías:

- Importes monetarios mediante `Decimal(10,2)`
- Estado de los pedidos
- Estado de activación de productos
- Snapshots comerciales en `OrderItem`
- Relación opcional entre `OrderItem` y `Product`
- Restricciones de integridad del carrito
- Índices para consultas frecuentes
- Unicidad de producto dentro de un carrito
- Un único carrito `ACTIVE` por usuario

Para comprobar el estado de las migraciones:

```bash
npx prisma migrate status
```

---

## 💰 Tratamiento de importes monetarios

Los importes monetarios no utilizan números de coma flotante.

Los precios de productos, totales de pedidos y precios históricos se almacenan en PostgreSQL mediante:

```text
Decimal(10,2)
```

Los cálculos de checkout utilizan `Prisma.Decimal` para evitar errores derivados de la aritmética binaria de JavaScript.

En las respuestas HTTP los valores monetarios se serializan como strings con dos decimales.

Ejemplo:

```json
{
  "price": "26.00"
}
```

Esto preserva la precisión y el formato monetario a través del contrato de la API.

---

## 🔐 Autenticación

La API utiliza JWT almacenado en una cookie HTTP-Only.

El token de autenticación:

- No se almacena en `localStorage`.
- No se devuelve en el cuerpo JSON.
- No necesita ser enviado mediante `Authorization: Bearer`.
- Es leído por el backend directamente desde la cookie.
- Es validado mediante middleware en las rutas protegidas.

El frontend debe realizar las peticiones autenticadas incluyendo credenciales.

Por ejemplo, con Axios:

```js
axios.create({
  withCredentials: true,
});
```

---

## 📝 Registro

```http
POST /api/auth/register
```

Ejemplo de body:

```json
{
  "name": "Test User",
  "email": "user@example.com",
  "password": "Password123!"
}
```

Una respuesta correcta devuelve los datos públicos del usuario y establece la cookie de autenticación.

Ejemplo:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Test User",
      "email": "user@example.com",
      "role": "USER",
      "createdAt": "2026-08-25T10:00:00.000Z"
    }
  }
}
```

La respuesta nunca expone:

- `passwordHash`
- JWT de autenticación

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

Al iniciar sesión correctamente:

1. El backend verifica las credenciales.
2. Se genera un JWT.
3. El JWT se almacena en la cookie `access_token`.
4. La cookie se configura como HTTP-Only.
5. El token no se devuelve en el JSON.
6. Se devuelven únicamente los datos públicos del usuario.

---

## 🚪 Logout

```http
POST /api/auth/logout
```

El endpoint elimina la cookie de autenticación y finaliza la sesión del usuario.

---

## 👤 Perfil del usuario

```http
GET /api/users/profile
```

Requiere una cookie de autenticación válida.

No es necesario enviar:

```http
Authorization: Bearer <token>
```

El middleware de autenticación obtiene automáticamente `access_token` desde las cookies de la petición.

Este endpoint permite además al frontend recuperar la sesión después de recargar la aplicación.

---

## 🍪 Cookies y CORS

El backend permite el envío de credenciales mediante CORS.

La comunicación frontend/backend utiliza cookies, por lo que el cliente debe enviar las peticiones con credenciales habilitadas.

El backend configura CORS utilizando el origen definido mediante:

```env
FRONTEND_URL=http://localhost:5173
```

En producción esta variable debe contener el dominio real del frontend.

---

## 📦 Productos

El catálogo público solo expone productos activos.

### Obtener productos

```http
GET /api/products
```

El catálogo admite parámetros de consulta para búsqueda, filtrado y paginación.

Ejemplo:

```http
GET /api/products?page=1&limit=12&category=Audio&search=grabadora
```

Parámetros disponibles:

| Parámetro | Descripción |
| --- | --- |
| `page` | Página solicitada |
| `limit` | Número máximo de productos por página |
| `category` | Filtrado por categoría |
| `search` | Búsqueda de productos |

Ejemplo de respuesta:

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

### Obtener producto por ID

```http
GET /api/products/:id
```

Los productos inactivos no se exponen mediante el endpoint público.

### Crear producto

```http
POST /api/products
```

Ruta protegida para usuarios con rol `ADMIN`.

### Actualizar producto

```http
PUT /api/products/:id
```

Ruta protegida para usuarios con rol `ADMIN`.

### Desactivar producto

```http
DELETE /api/products/:id
```

Ruta protegida para usuarios con rol `ADMIN`.

La eliminación administrativa utiliza desactivación lógica mediante `isActive = false`.

Esto permite retirar un producto del catálogo público sin eliminar físicamente información que pueda estar relacionada con carritos, pedidos o históricos comerciales.

---

## 🔔 Alertas de reposición

Los usuarios autenticados pueden solicitar una notificación cuando un producto agotado vuelva a estar disponible.

Las alertas se almacenan en PostgreSQL mediante Prisma y pueden encontrarse en los siguientes estados:

```text
PENDING
NOTIFIED
CANCELLED
```

### Consultar alerta

```http
GET /api/products/:id/restock-alert
```

Requiere autenticación.

### Activar alerta

```http
POST /api/products/:id/restock-alert
```

La suscripción solo puede activarse para productos activos sin stock.

Si ya existe una alerta para el mismo usuario y producto, la operación reutiliza el registro existente y lo devuelve al estado `PENDING`.

### Cancelar alerta

```http
DELETE /api/products/:id/restock-alert
```

La cancelación establece la alerta como `CANCELLED`.

### Notificación de reposición

Cuando un administrador actualiza un producto y el stock pasa de agotado a disponible:

```text
0 → stock positivo
```

el backend busca las alertas `PENDING` asociadas al producto y envía un email transaccional mediante Resend.

Una notificación enviada correctamente cambia la alerta a `NOTIFIED` y registra `notifiedAt`.

Si el proveedor de email falla, la actualización del stock no se revierte y la alerta permanece `PENDING`.

Los incrementos de stock de un producto que ya estaba disponible no generan nuevas notificaciones.

```text
0 → 5  envía notificación
5 → 8  no envía una nueva notificación
```

El contenido dinámico incluido en el HTML del email se escapa antes del envío.

---

## 🖼️ Imágenes de productos

Los productos admiten múltiples imágenes mediante el campo:

```text
images: String[]
```

Las imágenes pueden almacenarse y servirse mediante Cloudinary.

---

## ❤️ Wishlist

La lista de deseos se almacena en MongoDB Atlas y está asociada al usuario autenticado.

### Obtener wishlist

```http
GET /api/wishlist
```

Requiere autenticación.

Ejemplo de respuesta:

```json
{
  "success": true,
  "data": {
    "productIds": ["2", "8", "11"]
  }
}
```

La API no expone detalles internos del documento MongoDB como:

- `_id`
- `userId`
- `createdAt`
- `updatedAt`

### Añadir o eliminar producto

```http
POST /api/wishlist/:productId
```

El endpoint funciona como un toggle:

- Si el producto no está guardado, se añade.
- Si ya está guardado, se elimina.

La wishlist persiste entre sesiones porque se almacena en MongoDB y no en el almacenamiento local del navegador.

---

## 🛒 Carrito y checkout

La API incluye un carrito persistente asociado al usuario autenticado.

Las rutas protegidas utilizan la identidad obtenida desde la cookie de autenticación.

El carrito se almacena en PostgreSQL mediante Prisma.

La base de datos garantiza que un usuario no pueda disponer simultáneamente de más de un carrito con estado `ACTIVE`.

Cada producto solo puede aparecer una vez dentro del mismo carrito. Las nuevas unidades se gestionan mediante la cantidad del elemento correspondiente.

### Checkout transaccional

El checkout se ejecuta dentro de una transacción de Prisma.

Durante la operación:

1. Se obtiene el carrito activo.
2. Se comprueba que contiene productos.
3. Se valida la disponibilidad de cada producto.
4. El stock se decrementa mediante operaciones condicionales atómicas.
5. Se calcula el total utilizando `Prisma.Decimal`.
6. Se crea el pedido.
7. Se almacenan snapshots comerciales de cada producto.
8. El carrito pasa a estado `CHECKED_OUT`.

Si cualquier parte de la operación falla, la transacción se revierte y no se persiste un checkout parcial.

La actualización condicional de stock evita que dos checkouts concurrentes puedan vender la misma última unidad.

---

## 📋 Pedidos

Los pedidos se almacenan en PostgreSQL.

Cada pedido conserva:

- Usuario propietario
- Total monetario
- Estado
- Fecha de creación
- Fecha de actualización
- Elementos comprados

Cada elemento conserva el precio aplicado en el momento de la compra mediante `priceAtPurchase`, además del nombre e imagen del producto.

Esto permite que el histórico del pedido siga siendo consistente aunque posteriormente cambien el nombre, el precio o la imagen del producto.

La API completa de consulta y gestión del historial de pedidos continúa pendiente de desarrollo.

---

## ⭐ Reviews

Las reseñas de productos se almacenan en MongoDB Atlas mediante Mongoose.

Esta separación permite mantener en PostgreSQL los datos relacionales y transaccionales y utilizar MongoDB para información documental asociada a productos.

---

## ⚠️ Manejo de errores

La aplicación utiliza un sistema centralizado de errores mediante:

- `AppError`
- `ErrorSelector`
- Middleware global `errorHandler`

Las respuestas de error siguen una estructura consistente.

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

Los detalles internos de errores inesperados no deben exponerse al cliente en producción.

---

## 🧪 Testing

El proyecto incluye pruebas automatizadas con **Jest** y **Supertest**.

Los tests se ejecutan secuencialmente mediante `--runInBand`.

### Ejecutar todos los tests

```bash
npm test
```

### Tests de integración

- Auth
- Users
- Products
- Cart
- Commerce Domain
- Wishlist
- Health Check

### Tests unitarios

- Password hashing
- Reviews Service
- Wishlist Service
- Products Service
- Restock Alerts Service
- Email Service

### Autenticación verificada

Los tests comprueban, entre otros aspectos:

- Registro de usuarios
- Login
- Credenciales incorrectas
- Cookie `access_token`
- Atributo `HttpOnly`
- Ausencia del JWT en el JSON
- Ausencia de `passwordHash`
- Acceso autenticado mediante cookies
- Rechazo de peticiones no autenticadas

### Dominio comercial verificado

La suite comprueba garantías críticas del ecommerce:

- Serialización monetaria con dos decimales
- Conservación de ceros decimales
- Exclusión de productos inactivos del catálogo público
- Creación de snapshots comerciales durante checkout
- Conservación del precio histórico de compra
- Cálculo exacto mediante `Decimal`
- Decremento de stock
- Rollback ante stock insuficiente
- Rechazo de productos inactivos en carrito
- Protección frente a overselling concurrente

La prueba de concurrencia ejecuta dos checkouts que compiten por una única unidad y verifica que solo uno puede completarse.

### Wishlist verificada

Los tests comprueban:

- Acceso protegido
- Recuperación de la wishlist
- Persistencia mediante usuario autenticado
- Añadir productos
- Eliminar productos mediante toggle
- Ausencia de información interna de MongoDB en la respuesta

### Alertas de reposición verificadas

Los tests comprueban:

- Detección de la transición de stock agotado a disponible
- Ausencia de notificaciones cuando el producto ya tenía stock
- Ausencia de notificaciones para productos inactivos
- Procesamiento de alertas pendientes
- Cambio a `NOTIFIED` después de un envío correcto
- Permanencia en `PENDING` cuando el envío falla
- Continuación del procesamiento cuando falla una notificación
- Integración HTTP con Resend mediante mocks
- Manejo de errores del proveedor
- Validación de configuración de email
- Generación del enlace al producto
- Escape del contenido HTML dinámico

### Resultado actual

```text
Test Suites: 13 passed, 13 total
Tests:       60 passed, 60 total
Snapshots:   0 total
```

---

## ✅ Estado actual

Actualmente están verificadas las siguientes funcionalidades:

- ✅ Registro de usuarios
- ✅ Login mediante cookies HTTP-Only
- ✅ Persistencia de sesión
- ✅ Logout
- ✅ Perfil de usuario autenticado
- ✅ Middleware de autenticación
- ✅ Autorización mediante roles
- ✅ CORS con credenciales
- ✅ Eliminación de dependencia de tokens en `localStorage`
- ✅ CRUD administrativo de productos
- ✅ Desactivación lógica de productos
- ✅ Múltiples imágenes por producto
- ✅ Integración con Cloudinary
- ✅ Búsqueda y filtrado de productos
- ✅ Paginación de catálogo
- ✅ Carrito persistente
- ✅ Restricciones de integridad del carrito
- ✅ Checkout transaccional
- ✅ Control atómico de stock
- ✅ Protección contra overselling concurrente
- ✅ Creación de pedidos durante checkout
- ✅ Snapshots comerciales de pedidos
- ✅ Importes monetarios mediante `Decimal(10,2)`
- ✅ Wishlist persistente
- ✅ Reviews
- ✅ Alertas de reposición persistentes
- ✅ Emails transaccionales de reposición mediante Resend
- ✅ Notificación automática al pasar de stock agotado a disponible
- ✅ Gestión de fallos de email sin revertir la actualización de stock
- ✅ Manejo centralizado de errores
- ✅ Prisma Migrate
- ✅ PostgreSQL
- ✅ MongoDB Atlas
- ✅ Tests de integración
- ✅ Tests unitarios
- ✅ Documentación Swagger/OpenAPI

---

## 🗺️ Próximas mejoras

Entre las siguientes funcionalidades previstas se encuentran:

- Integración de pagos mediante Stripe
- Confirmación de pagos mediante webhooks
- API completa de pedidos
- Historial de pedidos del usuario
- Gestión administrativa de estados de pedidos
- Gestión de devoluciones y reembolsos
- Restauración administrativa de productos desactivados
- Mejora del aislamiento de la suite de tests mediante datos y entorno específicos de testing
- Datos reproducibles de desarrollo mediante seed
- Identificadores comerciales de producto como SKU y slug
- Soporte al cliente
- Preguntas frecuentes
- Mejoras adicionales del perfil de usuario

---

## 👩‍💻 Autora

**Jessica Mateo**

Proyecto desarrollado de forma individual como práctica de desarrollo backend con Node.js, Express, PostgreSQL, MongoDB, Prisma, Mongoose, JWT, Cloudinary, Resend, Jest y Supertest.