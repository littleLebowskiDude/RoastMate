import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildRoastingPdf } from '@/lib/pdf';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await prisma.roastSession.findUnique({
    where: { id: params.id },
    include: { roastResults: true }
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const coffeeLookup = await prisma.coffee.findMany();
  const coffeeIndex = Object.fromEntries(coffeeLookup.map((c) => [c.id, c.name]));
  const rows = session.roastResults.map((r) => ({
    ...r,
    coffeeName: coffeeIndex[r.coffeeId] ?? 'Unknown'
  }));

  return buildRoastingPdf(session.sessionDate.toISOString().slice(0, 10), rows);
}
