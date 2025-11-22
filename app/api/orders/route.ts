import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  const orders = await prisma.order.findMany({
    where: sessionId ? { roastSessionId: sessionId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });
  return NextResponse.json(orders);
}
