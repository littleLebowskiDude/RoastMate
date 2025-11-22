'use client';

import { useEffect, useState } from 'react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  sizeG: number;
  grindType: string;
}

interface Order {
  id: string;
  customerName: string;
  status: string;
  source: string;
  roastSessionId?: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
  };

  useEffect(() => {
    load();
  }, []);

  const importShopify = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/orders/import/shopify');
      const data = await res.json();
      setMessage(`Imported ${data.imported} new orders`);
      await load();
    } catch (err) {
      console.error(err);
      setMessage('Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="pill">Orders</div>
          <h2 style={{ marginTop: 8 }}>Unified order list</h2>
        </div>
        <button className="btn" onClick={importShopify} disabled={loading}>
          {loading ? 'Importing...' : 'Import Shopify orders'}
        </button>
      </div>

      {message && <div className="panel">{message}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Items</th>
              <th>Source</th>
              <th>Status</th>
              <th>Session</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.customerName}</td>
                <td>{order.items.map((i) => `${i.productName} x${i.quantity}`).join(' · ')}</td>
                <td>{order.source}</td>
                <td>{order.status}</td>
                <td>{order.roastSessionId ? order.roastSessionId.slice(0, 6) : 'Unassigned'}</td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={5} className="muted">
                  No orders yet. Import from Shopify to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
