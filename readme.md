# 🛒 E-Commerce REST API — Backend Modular

Backend REST API para una plataforma de comercio electrónico desarrollado con Node.js y Express. La aplicación utiliza PostgreSQL para la gestión de usuarios, productos y pedidos, y MongoDB para funcionalidades como listas de deseos y reseñas de productos.

---

## 🚀 Demo y Documentación

### API en producción

https://backend-modulo2-api.onrender.com

### Swagger UI

https://backend-modulo2-api.onrender.com/api-docs

---

## 📸 Capturas del proyecto

### Swagger UI

![Swagger](docs/swagger-production.png)

### Despliegue en Render

![Render](docs/render-deploy.png)

### Reviews almacenadas en MongoDB Atlas

![MongoDB Reviews](docs/mongodb-reviews.png)

### Checkout y generación de pedidos

![Checkout](docs/checkout-order.png)

---

## 📊 Características principales

* Autenticación y autorización mediante JWT
* Gestión de usuarios y perfiles
* CRUD completo de productos
* Carga de imágenes con Cloudinary
* Carrito de compra persistente
* Checkout transaccional con control de stock
* Gestión de pedidos y órdenes
* Wishlist almacenada en MongoDB Atlas
* Sistema de reseñas de productos
* Documentación OpenAPI / Swagger
* Despliegue en Render

---

## 🏗️ Arquitectura

La aplicación utiliza dos sistemas de persistencia:

- PostgreSQL mediante Prisma para la información transaccional (usuarios, productos, carritos y pedidos).
- MongoDB Atlas mediante Mongoose para funcionalidades documentales como wishlists y reviews.

Las imágenes de productos se almacenan en Cloudinary.

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

     • Usuarios                  • Wishlists
     • Roles                     • Reviews
     • Productos
     • Carritos
     • Pedidos
     • OrderItems

            │
            ▼

       Cloudinary CDN
       ──────────────

       • Imágenes de productos
```

### Stack Tecnológico

| Tecnología      | Uso                      |
| --------------- | ------------------------ |
| Node.js         | Runtime                  |
| Express         | Framework HTTP           |
| PostgreSQL      | Base de datos relacional |
| Prisma ORM      | Acceso a PostgreSQL      |
| MongoDB Atlas   | Base de datos documental |
| Mongoose        | ODM para MongoDB         |
| JWT             | Autenticación            |
| Cloudinary      | Gestión de imágenes      |
| Swagger/OpenAPI | Documentación            |
| Render          | Despliegue               |

---

## 📁 Estructura del Proyecto

```text
src/
├── controllers/
├── services/
├── routes/
├── middlewares/
├── models/
├── db/
├── utils/
├── app.js
└── server.js
```

### Capas

* **Controllers:** gestión de peticiones HTTP.
* **Services:** lógica de negocio.
* **Routes:** definición de endpoints.
* **Middlewares:** autenticación, validaciones y errores.
* **Models:** esquemas MongoDB.
* **DB:** configuración Prisma y MongoDB.
* **Utils:** utilidades y clases auxiliares.

---

## ⚙️ Variables de Entorno

Crear un archivo `.env`:

```env
PORT=3000

DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/database"

JWT_SECRET="your_jwt_secret"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

---

## 🛠️ Instalación

### Clonar repositorio

```bash
git clone https://github.com/J-Mateo/modulo2.git
cd modulo2
```

### Instalar dependencias

```bash
npm install
```

### Generar cliente Prisma

```bash
npx prisma generate
```

### Ejecutar migraciones

```bash
npx prisma migrate deploy
```

### Iniciar servidor

```bash
npm run dev
```

---

## 🧪 Testing

El proyecto incluye pruebas automatizadas desarrolladas con **Jest** y **Supertest** para validar tanto la lógica de negocio como el comportamiento de los endpoints principales.

### Ejecutar tests

```bash
npm test
```

### Tests de integración

* Auth
* Users
* Products
* Cart
* Wishlist
* Health Check

### Tests unitarios

* Auth Service
* Reviews Service
* Wishlist Service

### Resultado actual

```text
Test Suites: 9 passed, 9 total
Tests: 24 passed, 24 total
```
---
## 🔐 Autenticación

### Registro

```http
POST /api/auth/register
```

### Login

```http
POST /api/auth/login
```

### Perfil del usuario

```http
GET /api/users/profile
```

Requiere:

```http
Authorization: Bearer <token>
```

---

## 📦 Productos

### Obtener todos los productos

```http
GET /api/products
```

### Obtener producto por ID

```http
GET /api/products/:id
```

### Crear producto (Admin)

```http
POST /api/products
```

### Actualizar producto (Admin)

```http
PUT /api/products/:id
```

### Eliminar producto (Admin)

```http
DELETE /api/products/:id
```

---

## 🛒 Carrito y Checkout

### Obtener carrito activo

```http
GET /api/cart
```

### Añadir producto

```http
POST /api/cart/items
```

### Eliminar producto del carrito

```http
DELETE /api/cart/items/:itemId
```

### Checkout

```http
POST /api/cart/checkout
```

Durante el checkout:

* Se valida stock disponible.
* Se genera una orden de compra.
* Se crean los registros OrderItem.
* Se descuenta el stock correspondiente.
* El carrito pasa a estado `CHECKED_OUT`.

---

## 🍃 Wishlist (MongoDB)

### Obtener wishlist

```http
GET /api/wishlist
```

### Añadir o eliminar producto

```http
POST /api/wishlist/:productId
```

---

## ⭐ Reviews (MongoDB)

### Obtener reviews de un producto

```http
GET /api/products/:productId/reviews
```

### Crear review

```http
POST /api/products/:productId/reviews
```

Ejemplo:

```json
{
  "rating": 5,
  "comment": "Excelente producto"
}
```

---

## ✅ Funcionalidades verificadas

* Gestión de usuarios con JWT
* Control de acceso mediante roles
* CRUD de productos
* Subida de imágenes a Cloudinary
* Carrito persistente
* Checkout transaccional
* Generación de pedidos
* Control automático de stock
* Wishlist en MongoDB Atlas
* Reviews en MongoDB Atlas
* Documentación Swagger en producción
* API desplegada en Render

---

## 👨‍💻 Autor

**Jessica Mateo**

Desarrolladora Full Stack.

Proyecto desarrollado de forma individual como práctica de desarrollo backend utilizando Node.js, Express, PostgreSQL, MongoDB, Prisma, Mongoose, JWT y Cloudinary.
