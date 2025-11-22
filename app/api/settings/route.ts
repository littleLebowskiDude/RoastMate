import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET() {
  const [coffees, blends, mappings] = await Promise.all([
    prisma.coffee.findMany({ orderBy: { name: 'asc' } }),
    prisma.blend.findMany({ include: { components: true } }),
    prisma.variantMapping.findMany()
  ]);
  return NextResponse.json({ coffees, blends, mappings });
}

const coffeeSchema = z.object({
  name: z.string(),
  roastLossPercentage: z.number(),
  costPerKg: z.number().optional(),
  active: z.boolean().optional()
});

const blendSchema = z.object({
  name: z.string(),
  components: z.array(
    z.object({
      coffeeId: z.string(),
      percentage: z.number()
    })
  )
});

const mappingSchema = z.object({
  variantId: z.string(),
  title: z.string(),
  isBlend: z.boolean(),
  coffeeId: z.string().optional(),
  blendId: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const { type } = body as { type: 'coffee' | 'blend' | 'mapping'; payload: any };

  if (type === 'coffee') {
    const payload = coffeeSchema.parse(body.payload);
    const coffee = await prisma.coffee.create({ data: payload });
    return NextResponse.json(coffee);
  }

  if (type === 'blend') {
    const payload = blendSchema.parse(body.payload);
    const blend = await prisma.blend.create({
      data: {
        name: payload.name,
        components: {
          create: payload.components
        }
      },
      include: { components: true }
    });
    return NextResponse.json(blend);
  }

  if (type === 'mapping') {
    const payload = mappingSchema.parse(body.payload);
    const mapping = await prisma.variantMapping.upsert({
      where: { variantId: payload.variantId },
      update: payload,
      create: payload
    });
    return NextResponse.json(mapping);
  }

  return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
}
