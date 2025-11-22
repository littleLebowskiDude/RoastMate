import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await prisma.roastSession.findUnique({
    where: { id: params.id },
    include: {
      onHandStock: true,
      roastResults: { include: { coffee: true } },
      orders: {
        include: { items: true }
      }
    }
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const response = {
    ...session,
    roastResults: session.roastResults.map((r) => ({
      ...r,
      coffeeName: r.coffee?.name ?? r.coffeeId
    }))
  };

  return NextResponse.json(response);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { onHand, skipOrders } = body as {
    onHand?: { coffeeId?: string; blendId?: string; onHandRoastedG: number }[];
    skipOrders?: { orderId: string; skipped: boolean }[];
  };

  if (onHand?.length) {
    await prisma.$transaction([
      prisma.onHandStock.deleteMany({ where: { roastSessionId: params.id } }),
      prisma.onHandStock.createMany({
        data: onHand.map((stock) => ({
          roastSessionId: params.id,
          coffeeId: stock.coffeeId,
          blendId: stock.blendId,
          onHandRoastedG: stock.onHandRoastedG
        }))
      })
    ]);
  }

  if (skipOrders?.length) {
    for (const change of skipOrders) {
      await prisma.order.update({
        where: { id: change.orderId },
        data: { status: change.skipped ? OrderStatus.SKIPPED : OrderStatus.INCLUDED }
      });
    }
  }

  return NextResponse.json({ ok: true });
}
