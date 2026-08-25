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
- CRUD de productos
- Múltiples imágenes por producto
- Carga de imágenes mediante Cloudinary
- Búsqueda, filtrado y paginación de productos
- Carrito de compra persistente
- Wishlist persistente mediante MongoDB Atlas
- Sistema de reseñas de productos
- Manejo centralizado de errores HTTP
- Migraciones de PostgreSQL mediante Prisma Migrate
- Documentación OpenAPI / Swagger
- Tests automatizados con Jest y Supertest
- Despliegue mediante Render

---

## 🏗️ Arquitectura

La aplicación utiliza dos sistemas de persistencia.

### PostgreSQL + Prisma

Se utiliza para la información relacional de la aplicación:

- Usuarios
- Roles
- Productos
- Carritos
- Elementos del carrito
- Pedidos
- Elementos de pedido

Los modelos de pedidos forman parte del esquema de datos. La API completa de gestión de pedidos se encuentra pendiente de desarrollo.

### MongoDB Atlas + Mongoose

Se utiliza para información documental:

- Wishlists
- Reviews

### Cloudinary

Se utiliza para el almacenamiento y distribución de imágenes de productos.

```text
                         Cliente HTTP
                              │
                              ▼
                         Express API
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
        PostgreSQL + Prisma          MongoDB + Mongoose
        ───────────────────          ──────────────────
        • Usuarios                   • Wishlists
        • Roles                      • Reviews
        • Productos
        • Carritos
        • CartItems
        • Pedidos
        • OrderItems
               │
               ▼
          Cloudinary CDN
          ──────────────
          • Imágenes de productos
```

---

## 🧰 Stack tecnológico

| Tecnología | Uso |
| --- | --- |
| Node.js | Runtime |
| Express | Framework HTTP |
| PostgreSQL | Base de datos relacional |
| Prisma ORM | Acceso y migraciones de PostgreSQL |
| MongoDB Atlas | Base de datos documental |
| Mongoose | ODM para MongoDB |
| JWT | Autenticación |
| Cookie Parser | Lectura de cookies |
| Cloudinary | Gestión de imágenes |
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
- **Utils:** utilidades compartidas, errores y respuestas.
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

Crear el archivo `.env` con las variables necesarias para PostgreSQL, MongoDB, JWT, frontend y Cloudinary.

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

```bash
npm run dev
```

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
│   └── migration_lock.toml
└── schema.prisma
```

Para comprobar el estado de las migraciones:

```bash
npx prisma migrate status
```

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

### Eliminar producto

```http
DELETE /api/products/:id
```

Ruta protegida para usuarios con rol `ADMIN`.

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

## 🛒 Carrito

La API incluye un carrito persistente asociado al usuario.

Las rutas protegidas utilizan la identidad obtenida desde la cookie de autenticación.

El carrito se almacena en PostgreSQL mediante Prisma.

---

## ⭐ Reviews

Las reseñas de productos se almacenan en MongoDB Atlas mediante Mongoose.

Esta separación permite mantener en PostgreSQL los datos relacionales y utilizar MongoDB para información documental asociada a productos.

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

### Ejecutar todos los tests

```bash
npm test
```

### Tests de integración

- Auth
- Users
- Products
- Cart
- Wishlist
- Health Check

### Tests unitarios

- Auth Service
- Reviews Service
- Wishlist Service

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

### Wishlist verificada

Los tests comprueban:

- Acceso protegido
- Recuperación de la wishlist
- Persistencia mediante usuario autenticado
- Añadir productos
- Eliminar productos mediante toggle
- Ausencia de información interna de MongoDB en la respuesta

### Resultado actual

```text
Test Suites: 9 passed, 9 total
Tests:       24 passed, 24 total
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
- ✅ CRUD de productos
- ✅ Múltiples imágenes por producto
- ✅ Integración con Cloudinary
- ✅ Búsqueda y filtrado de productos
- ✅ Paginación de catálogo
- ✅ Carrito persistente
- ✅ Wishlist persistente
- ✅ Reviews
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

- API completa de pedidos
- Historial de pedidos del usuario
- Checkout completo
- Control transaccional de stock durante checkout
- Gestión de devoluciones
- Soporte al cliente
- Preguntas frecuentes
- Mejoras adicionales del perfil de usuario

---

## 👩‍💻 Autora

**Jessica Mateo**

Proyecto desarrollado de forma individual como práctica de desarrollo backend con Node.js, Express, PostgreSQL, MongoDB, Prisma, Mongoose, JWT, Cloudinary, Jest y Supertest.