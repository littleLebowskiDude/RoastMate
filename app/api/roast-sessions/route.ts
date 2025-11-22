import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

// Prevent static rendering; always execute server-side.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const sessions = await prisma.roastSession.findMany({
    orderBy: { sessionDate: 'desc' }
  });
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const sessionDate = body.sessionDate ? new Date(body.sessionDate) : new Date();

  const session = await prisma.roastSession.create({
    data: {
      sessionDate
    }
  });

  await prisma.order.updateMany({
    where: { roastSessionId: null },
    data: { roastSessionId: session.id, status: OrderStatus.INCLUDED }
  });

  return NextResponse.json(session);
}
