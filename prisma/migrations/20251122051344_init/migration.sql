-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('IMPORTED', 'SKIPPED', 'INCLUDED');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('SHOPIFY', 'XERO', 'MANUAL');

-- CreateTable
CREATE TABLE "Coffee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roastLossPercentage" DOUBLE PRECISION NOT NULL,
    "costPerKg" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coffee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blend" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlendComponent" (
    "id" TEXT NOT NULL,
    "blendId" TEXT NOT NULL,
    "coffeeId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BlendComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "source" "OrderSource" NOT NULL,
    "sourceOrderId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'IMPORTED',
    "roastSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sizeG" INTEGER NOT NULL,
    "grindType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "mappedCoffeeId" TEXT,
    "mappedBlendId" TEXT,
    "mappedIsBlend" BOOLEAN NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantMapping" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coffeeId" TEXT,
    "blendId" TEXT,
    "isBlend" BOOLEAN NOT NULL,

    CONSTRAINT "VariantMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoastSession" (
    "id" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoastSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnHandStock" (
    "id" TEXT NOT NULL,
    "roastSessionId" TEXT NOT NULL,
    "coffeeId" TEXT,
    "blendId" TEXT,
    "onHandRoastedG" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OnHandStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoastResult" (
    "id" TEXT NOT NULL,
    "roastSessionId" TEXT NOT NULL,
    "coffeeId" TEXT NOT NULL,
    "requiredRoastedG" DOUBLE PRECISION NOT NULL,
    "requiredGreenG" DOUBLE PRECISION NOT NULL,
    "dropsRequired" INTEGER NOT NULL,
    "totalGreen" DOUBLE PRECISION NOT NULL,
    "totalRoastedOutput" DOUBLE PRECISION NOT NULL,
    "surplusRoastedG" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RoastResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VariantMapping_variantId_key" ON "VariantMapping"("variantId");

-- AddForeignKey
ALTER TABLE "BlendComponent" ADD CONSTRAINT "BlendComponent_blendId_fkey" FOREIGN KEY ("blendId") REFERENCES "Blend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlendComponent" ADD CONSTRAINT "BlendComponent_coffeeId_fkey" FOREIGN KEY ("coffeeId") REFERENCES "Coffee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_roastSessionId_fkey" FOREIGN KEY ("roastSessionId") REFERENCES "RoastSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_mappedCoffeeId_fkey" FOREIGN KEY ("mappedCoffeeId") REFERENCES "Coffee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_mappedBlendId_fkey" FOREIGN KEY ("mappedBlendId") REFERENCES "Blend"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantMapping" ADD CONSTRAINT "VariantMapping_coffeeId_fkey" FOREIGN KEY ("coffeeId") REFERENCES "Coffee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantMapping" ADD CONSTRAINT "VariantMapping_blendId_fkey" FOREIGN KEY ("blendId") REFERENCES "Blend"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnHandStock" ADD CONSTRAINT "OnHandStock_roastSessionId_fkey" FOREIGN KEY ("roastSessionId") REFERENCES "RoastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnHandStock" ADD CONSTRAINT "OnHandStock_coffeeId_fkey" FOREIGN KEY ("coffeeId") REFERENCES "Coffee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnHandStock" ADD CONSTRAINT "OnHandStock_blendId_fkey" FOREIGN KEY ("blendId") REFERENCES "Blend"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoastResult" ADD CONSTRAINT "RoastResult_roastSessionId_fkey" FOREIGN KEY ("roastSessionId") REFERENCES "RoastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoastResult" ADD CONSTRAINT "RoastResult_coffeeId_fkey" FOREIGN KEY ("coffeeId") REFERENCES "Coffee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
