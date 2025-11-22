import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Ensure this API route is always run on-demand (not at build time).
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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
