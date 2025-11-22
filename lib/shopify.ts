import { OrderSource } from '@prisma/client';

interface ShopifyLineItem {
  id: number;
  variant_id: number;
  name: string;
  quantity: number;
  properties?: { name: string; value: string }[];
}

interface ShopifyOrder {
  id: number;
  name: string;
  customer?: { first_name?: string; last_name?: string };
  line_items: ShopifyLineItem[];
  fulfillments: any[];
  cancelled_at: string | null;
  closed_at: string | null;
}

export interface ImportedOrder {
  sourceOrderId: string;
  customerName: string;
  items: {
    variantId: string;
    productName: string;
    sizeG: number;
    grindType: string;
    quantity: number;
  }[];
}

export async function fetchShopifyOrders(): Promise<ImportedOrder[]> {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  if (!storeDomain || !token) {
    return [
      {
        sourceOrderId: 'DEMO-1001',
        customerName: 'Sample Customer',
        items: [
          { variantId: 'demo-espresso', productName: 'Demo Espresso 250g', sizeG: 250, grindType: 'Whole Bean', quantity: 4 },
          { variantId: 'demo-blend', productName: 'Smooth Criminal 1kg', sizeG: 1000, grindType: 'Espresso', quantity: 2 }
        ]
      }
    ];
  }

  const res = await fetch(`https://${storeDomain}/admin/api/2024-01/orders.json?status=any&fulfillment_status=unfulfilled`, {
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`Shopify fetch failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const orders: ShopifyOrder[] = data.orders || [];

  return orders
    .filter((order) => !order.cancelled_at && !order.closed_at)
    .map((order) => {
      const customerName = `${order.customer?.first_name ?? ''} ${order.customer?.last_name ?? ''}`.trim() || order.name;
      return {
        sourceOrderId: order.id.toString(),
        customerName,
        items: order.line_items.map((line) => ({
          variantId: line.variant_id?.toString() ?? line.id.toString(),
          productName: line.name,
          sizeG: parseSize(line.name),
          grindType: parseGrind(line.properties),
          quantity: line.quantity
        }))
      };
    });
}

function parseSize(title: string): number {
  if (title.toLowerCase().includes('1kg')) return 1000;
  return 250;
}

function parseGrind(properties?: { name: string; value: string }[]): string {
  const grind = properties?.find((p) => p.name.toLowerCase().includes('grind'))?.value;
  return grind || 'Whole Bean';
}

export const SHOPIFY_SOURCE = OrderSource.SHOPIFY;
