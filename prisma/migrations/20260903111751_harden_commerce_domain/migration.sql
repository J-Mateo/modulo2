-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',
  'PAID',
  'CANCELLED',
  'REFUNDED'
);

-- AlterEnum
ALTER TYPE "CartStatus" ADD VALUE 'ABANDONED';


-- =====================================================
-- PRODUCT
-- =====================================================

ALTER TABLE "Product"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Product"
ALTER COLUMN "price"
TYPE DECIMAL(10,2)
USING ROUND("price"::numeric, 2);


-- =====================================================
-- ORDER
-- =====================================================

-- Los pedidos existentes representan compras completadas
-- por el checkout anterior.
ALTER TABLE "Order"
ADD COLUMN "status" "OrderStatus" NOT NULL DEFAULT 'PAID';

-- Añadimos updatedAt nullable para poder rellenar
-- correctamente los pedidos existentes.
ALTER TABLE "Order"
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "Order"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

ALTER TABLE "Order"
ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Order"
ALTER COLUMN "total"
TYPE DECIMAL(10,2)
USING ROUND("total"::numeric, 2);

-- A partir de ahora los pedidos nuevos empiezan
-- en estado PENDING.
ALTER TABLE "Order"
ALTER COLUMN "status" SET DEFAULT 'PENDING';


-- =====================================================
-- ORDER ITEM SNAPSHOT
-- =====================================================

-- productId pasará a ser opcional y la FK utilizará
-- ON DELETE SET NULL.
ALTER TABLE "OrderItem"
DROP CONSTRAINT "OrderItem_productId_fkey";

ALTER TABLE "OrderItem"
ADD COLUMN "productImage" TEXT,
ADD COLUMN "productName" TEXT;

-- Creamos el snapshot comercial de los pedidos existentes.
UPDATE "OrderItem" AS oi
SET
  "productName" = p."name",
  "productImage" = CASE
    WHEN array_length(p."images", 1) >= 1
      THEN p."images"[1]
    ELSE NULL
  END
FROM "Product" AS p
WHERE oi."productId" = p."id";

ALTER TABLE "OrderItem"
ALTER COLUMN "productName" SET NOT NULL;

ALTER TABLE "OrderItem"
ALTER COLUMN "productId" DROP NOT NULL;

ALTER TABLE "OrderItem"
ALTER COLUMN "priceAtPurchase"
TYPE DECIMAL(10,2)
USING ROUND("priceAtPurchase"::numeric, 2);


-- =====================================================
-- RELATION DELETE BEHAVIOUR
-- =====================================================

ALTER TABLE "CartItem"
DROP CONSTRAINT "CartItem_cartId_fkey";

ALTER TABLE "OrderItem"
DROP CONSTRAINT "OrderItem_orderId_fkey";

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_cartId_fkey"
FOREIGN KEY ("cartId")
REFERENCES "Cart"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_orderId_fkey"
FOREIGN KEY ("orderId")
REFERENCES "Order"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_productId_fkey"
FOREIGN KEY ("productId")
REFERENCES "Product"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;


-- =====================================================
-- DOMAIN INVARIANTS
-- =====================================================

-- Previamente comprobamos que no existen duplicados.
CREATE UNIQUE INDEX "CartItem_cartId_productId_key"
ON "CartItem"("cartId", "productId");

-- Cada usuario puede tener solamente un carrito ACTIVE.
CREATE UNIQUE INDEX "Cart_userId_active_unique"
ON "Cart"("userId")
WHERE "status" = 'ACTIVE';


-- =====================================================
-- QUERY INDEXES
-- =====================================================

CREATE INDEX "Cart_userId_status_idx"
ON "Cart"("userId", "status");

CREATE INDEX "Order_userId_createdAt_idx"
ON "Order"("userId", "createdAt");

CREATE INDEX "Order_status_idx"
ON "Order"("status");

CREATE INDEX "OrderItem_orderId_idx"
ON "OrderItem"("orderId");

CREATE INDEX "Product_category_idx"
ON "Product"("category");

CREATE INDEX "Product_createdAt_idx"
ON "Product"("createdAt");

CREATE INDEX "Product_isActive_idx"
ON "Product"("isActive");