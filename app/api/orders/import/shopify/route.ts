import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchShopifyOrders } from '@/lib/shopify';
import { OrderStatus, OrderSource } from '@prisma/client';

// Avoid static rendering attempts during build; always run server-side.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const imports = await fetchShopifyOrders();
  const variantMappings = await prisma.variantMapping.findMany();
  const created = [];

  for (const order of imports) {
    const existing = await prisma.order.findFirst({
      where: { source: OrderSource.SHOPIFY, sourceOrderId: order.sourceOrderId }
    });
    if (existing) continue;

    const newOrder = await prisma.order.create({
      data: {
        source: OrderSource.SHOPIFY,
        sourceOrderId: order.sourceOrderId,
        customerName: order.customerName,
        status: OrderStatus.IMPORTED,
        items: {
          create: order.items.map((item) => {
            const mapping = variantMappings.find((m) => m.variantId === item.variantId);
            return {
              variantId: item.variantId,
              productName: item.productName,
              sizeG: item.sizeG,
              grindType: item.grindType,
              quantity: item.quantity,
              mappedCoffeeId: mapping?.coffeeId,
              mappedBlendId: mapping?.blendId,
              mappedIsBlend: mapping?.isBlend ?? false
            };
          })
        }
      },
      include: { items: true }
    });
    created.push(newOrder);
  }

  return NextResponse.json({ imported: created.length, orders: created });
}
