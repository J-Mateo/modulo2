-- CreateEnum
CREATE TYPE "RestockAlertStatus" AS ENUM ('PENDING', 'NOTIFIED', 'CANCELLED');

-- CreateTable
CREATE TABLE "RestockAlert" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "status" "RestockAlertStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "RestockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestockAlert_productId_status_idx" ON "RestockAlert"("productId", "status");

-- CreateIndex
CREATE INDEX "RestockAlert_userId_status_idx" ON "RestockAlert"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RestockAlert_userId_productId_key" ON "RestockAlert"("userId", "productId");

-- AddForeignKey
ALTER TABLE "RestockAlert" ADD CONSTRAINT "RestockAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestockAlert" ADD CONSTRAINT "RestockAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
