import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { roastEngine, buildOnHandLookup, OrderLine } from '@/lib/roastEngine';
import { OrderStatus } from '@prisma/client';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await prisma.roastSession.findUnique({
    where: { id: params.id },
    include: { onHandStock: true }
  });
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const [orders, coffees, blends] = await Promise.all([
    prisma.order.findMany({
      where: { roastSessionId: params.id, status: OrderStatus.INCLUDED },
      include: { items: true }
    }),
    prisma.coffee.findMany(),
    prisma.blend.findMany({
      include: { components: { include: { coffee: true } } }
    })
  ]);

  const orderLines: OrderLine[] = orders.flatMap((order) =>
    order.items.map((item) => ({
      mappedCoffeeId: item.mappedCoffeeId || undefined,
      mappedBlendId: item.mappedBlendId || undefined,
      mappedIsBlend: item.mappedIsBlend,
      sizeG: item.sizeG,
      quantity: item.quantity
    }))
  );

  const { results, onHandAfter } = roastEngine({
    coffees,
    blends,
    orders: orderLines,
    onHand: buildOnHandLookup(session.onHandStock)
  });

  await prisma.$transaction([
    prisma.roastResult.deleteMany({ where: { roastSessionId: params.id } }),
    prisma.roastResult.createMany({
      data: results.map((row) => ({
        roastSessionId: params.id,
        coffeeId: row.coffeeId,
        requiredRoastedG: row.requiredRoastedG,
        requiredGreenG: row.requiredGreenG,
        dropsRequired: row.dropsRequired,
        totalGreen: row.totalGreen,
        totalRoastedOutput: row.totalRoastedOutput,
        surplusRoastedG: row.surplusRoastedG
      }))
    }),
    prisma.onHandStock.deleteMany({ where: { roastSessionId: params.id } }),
    prisma.onHandStock.createMany({
      data: [
        ...Object.entries(onHandAfter.coffees).map(([coffeeId, qty]) => ({
          roastSessionId: params.id,
          coffeeId,
          onHandRoastedG: qty
        })),
        ...Object.entries(onHandAfter.blends).map(([blendId, qty]) => ({
          roastSessionId: params.id,
          blendId,
          onHandRoastedG: qty
        }))
      ]
    })
  ]);

  return NextResponse.json({ results, onHand: onHandAfter });
}
