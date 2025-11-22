import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

// Prevent static rendering; always execute server-side.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const orders = await prisma.order.findMany({
    where: { roastSessionId: params.id, status: OrderStatus.INCLUDED },
    include: { items: true, roastSession: true }
  });

  if (!orders.length) {
    return NextResponse.json({ error: 'No orders for session' }, { status: 404 });
  }

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const sessionDate = orders[0].roastSession?.sessionDate.toISOString().slice(0, 10) ?? '';
  doc.fontSize(18).text('Bagging Report', { underline: true });
  doc.fontSize(12).text(`Session: ${sessionDate}`);
  doc.moveDown();

  const skuCounts: Record<string, number> = {};
  const coffeeTotals: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items) {
      const sku = `${item.productName} ${item.sizeG}g ${item.grindType}`;
      skuCounts[sku] = (skuCounts[sku] || 0) + item.quantity;
      const roasted = item.sizeG * item.quantity;
      const key = item.mappedBlendId || item.mappedCoffeeId || 'Unknown';
      coffeeTotals[key] = (coffeeTotals[key] || 0) + roasted;
    }
  }

  doc.fontSize(14).text('SKUs', { underline: true });
  Object.entries(skuCounts).forEach(([sku, qty]) => doc.text(`${qty} x ${sku}`));
  doc.moveDown();

  doc.fontSize(14).text('Roasted allocation', { underline: true });
  Object.entries(coffeeTotals).forEach(([coffee, grams]) =>
    doc.text(`${coffee}: ${(grams / 1000).toFixed(2)} kg`)
  );

  doc.end();
  const buffer = Buffer.concat(chunks);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="bagging-report.pdf"'
    }
  });
}
