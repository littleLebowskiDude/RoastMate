import PDFDocument from 'pdfkit';
import { NextResponse } from 'next/server';
import { RoastCalculation } from './roastEngine';

export function buildRoastingPdf(sessionDate: string, rows: RoastCalculation[]) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => undefined);

  doc.fontSize(18).text('Roast Mate - Roasting Report', { align: 'left' });
  doc.moveDown();
  doc.fontSize(12).text(`Session: ${sessionDate}`);
  doc.moveDown();

  rows.forEach((row) => {
    doc.fontSize(13).text(row.coffeeName, { underline: true });
    doc.fontSize(11);
    doc.text(`Roasted needed: ${(row.requiredRoastedG / 1000).toFixed(2)} kg`);
    doc.text(`Green required: ${(row.requiredGreenG / 1000).toFixed(2)} kg`);
    doc.text(`Drops: ${row.dropsRequired} x 5kg`);
    doc.text(`Output expected: ${(row.totalRoastedOutput / 1000).toFixed(2)} kg`);
    doc.text(`Surplus to on-hand: ${(row.surplusRoastedG / 1000).toFixed(2)} kg`);
    doc.moveDown(0.7);
  });

  doc.end();
  const buffer = Buffer.concat(chunks);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="roasting-report.pdf"'
    }
  });
}
