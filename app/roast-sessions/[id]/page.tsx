'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface OrderItem {
  id: string;
  productName: string;
  sizeG: number;
  grindType: string;
  quantity: number;
  mappedIsBlend: boolean;
  mappedCoffeeId?: string;
  mappedBlendId?: string;
}

interface Order {
  id: string;
  customerName: string;
  status: 'IMPORTED' | 'SKIPPED' | 'INCLUDED';
  items: OrderItem[];
}

interface RoastResult {
  coffeeId: string;
  coffeeName: string;
  roastLossPercentage: number;
  requiredRoastedG: number;
  requiredGreenG: number;
  dropsRequired: number;
  totalGreen: number;
  totalRoastedOutput: number;
  surplusRoastedG: number;
}

interface OnHandRow {
  coffeeId?: string;
  blendId?: string;
  onHandRoastedG: number;
}

interface SessionResponse {
  id: string;
  sessionDate: string;
  onHandStock: OnHandRow[];
  roastResults: RoastResult[];
  orders: Order[];
}

interface Coffee {
  id: string;
  name: string;
}

interface Blend {
  id: string;
  name: string;
}

export default function RoastSessionPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [blends, setBlends] = useState<Blend[]>([]);
  const [roastResults, setRoastResults] = useState<RoastResult[]>([]);
  const [onHand, setOnHand] = useState<OnHandRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/roast-sessions/${params.id}`);
      const data = await res.json();
      setSession(data);
      setRoastResults(data.roastResults || []);
      setOnHand(
        data.onHandStock?.length
          ? data.onHandStock
          : [{ coffeeId: undefined, blendId: undefined, onHandRoastedG: 0 }]
      );
    } catch (err) {
      console.error(err);
      setError('Unable to load session');
    }
  }, [params.id]);

  useEffect(() => {
    loadSession();
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setCoffees(data.coffees || []);
        setBlends(data.blends || []);
      })
      .catch(() => undefined);
  }, [loadSession]);

  const saveOnHand = async () => {
    setLoading(true);
    try {
      await fetch(`/api/roast-sessions/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onHand })
      });
      await loadSession();
    } catch (err) {
      console.error(err);
      setError('Failed to save on-hand stock');
    } finally {
      setLoading(false);
    }
  };

  const toggleSkip = async (orderId: string, skipped: boolean) => {
    setLoading(true);
    await fetch(`/api/roast-sessions/${params.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skipOrders: [{ orderId, skipped }] })
    });
    await loadSession();
    setLoading(false);
  };

  const calculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/roast-sessions/${params.id}/calculate`, { method: 'POST' });
      const data = await res.json();
      setRoastResults(data.results || []);
      setOnHand([
        ...Object.entries(data.onHand?.coffees || {}).map(([coffeeId, qty]) => ({
          coffeeId,
          onHandRoastedG: Number(qty)
        })),
        ...Object.entries(data.onHand?.blends || {}).map(([blendId, qty]) => ({
          blendId,
          onHandRoastedG: Number(qty)
        }))
      ]);
    } catch (err) {
      console.error(err);
      setError('Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const coffeeName = (id?: string) => coffees.find((c) => c.id === id)?.name || 'Coffee';
  const blendName = (id?: string) => blends.find((b) => b.id === id)?.name || 'Blend';

  const totals = useMemo(() => {
    const totalGreen = roastResults.reduce((acc, r) => acc + r.totalGreen, 0);
    const totalRoasted = roastResults.reduce((acc, r) => acc + r.totalRoastedOutput, 0);
    return { totalGreen, totalRoasted };
  }, [roastResults]);

  if (!session) {
    return <div className="panel">Loading session...</div>;
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="pill">Roast Session</div>
          <h2 style={{ marginTop: 8 }}>{session.sessionDate.slice(0, 10)}</h2>
        </div>
        <div className="stack-row">
          <button className="btn secondary" onClick={() => window.open(`/api/reports/roasting/${session.id}`)}>
            Roasting PDF
          </button>
          <button className="btn secondary" onClick={() => window.open(`/api/reports/bagging/${session.id}`)}>
            Bagging PDF
          </button>
          <button className="btn" onClick={calculate} disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate schedule'}
          </button>
        </div>
      </div>

      {error && <div className="panel" style={{ borderColor: 'var(--danger)' }}>{error}</div>}

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3>Orders</h3>
          <Link href="/orders" className="btn secondary" style={{ padding: '8px 12px' }}>
            Import & manage
          </Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Items</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {session.orders?.map((order) => (
              <tr key={order.id}>
                <td>{order.customerName}</td>
                <td>
                  {order.items
                    .map((i) => `${i.productName} x${i.quantity} (${i.sizeG}g ${i.grindType})`)
                    .join(' · ')}
                </td>
                <td>
                  <span className="pill">{order.status}</span>
                </td>
                <td>
                  <button
                    className="btn secondary"
                    onClick={() => toggleSkip(order.id, order.status !== 'SKIPPED')}
                    style={{ padding: '8px 12px' }}
                  >
                    {order.status === 'SKIPPED' ? 'Unskip' : 'Skip'}
                  </button>
                </td>
              </tr>
            ))}
            {!session.orders?.length && (
              <tr>
                <td colSpan={4} className="muted">
                  No orders attached. Import via Shopify to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>On-hand roasted stock</h3>
          <button className="btn secondary" onClick={saveOnHand} disabled={loading}>
            Save
          </button>
        </div>
        <div className="grid" style={{ gap: 8 }}>
          {onHand.map((row, idx) => (
            <div
              key={idx}
              style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--panel-2)', padding: 10, borderRadius: 12 }}
            >
              <select
                value={row.coffeeId ? `coffee:${row.coffeeId}` : row.blendId ? `blend:${row.blendId}` : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const next = [...onHand];
                  if (value.startsWith('coffee:')) {
                    next[idx] = { ...next[idx], coffeeId: value.replace('coffee:', ''), blendId: undefined };
                  } else if (value.startsWith('blend:')) {
                    next[idx] = { ...next[idx], blendId: value.replace('blend:', ''), coffeeId: undefined };
                  }
                  setOnHand(next);
                }}
              >
                <option value="">Select coffee/blend</option>
                <optgroup label="Coffees">
                  {coffees.map((c) => (
                    <option key={c.id} value={`coffee:${c.id}`}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Blends">
                  {blends.map((b) => (
                    <option key={b.id} value={`blend:${b.id}`}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <input
                type="number"
                value={row.onHandRoastedG}
                onChange={(e) => {
                  const next = [...onHand];
                  next[idx] = { ...next[idx], onHandRoastedG: Number(e.target.value) };
                  setOnHand(next);
                }}
                placeholder="Grams"
              />
            </div>
          ))}
          <button
            className="btn secondary"
            onClick={() => setOnHand([...onHand, { onHandRoastedG: 0 }])}
            style={{ padding: '8px 12px', width: 'fit-content' }}
          >
            + Add on-hand line
          </button>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Roast schedule</h3>
          <div className="pill">
            Total: {(totals.totalGreen / 1000).toFixed(1)} kg green · {(totals.totalRoasted / 1000).toFixed(1)} kg roasted
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Coffee</th>
              <th>Roasted need</th>
              <th>Green</th>
              <th>Drops</th>
              <th>Output</th>
              <th>Surplus → on-hand</th>
            </tr>
          </thead>
          <tbody>
            {roastResults.map((row) => (
              <tr key={row.coffeeId}>
                <td>{row.coffeeName}</td>
                <td>{(row.requiredRoastedG / 1000).toFixed(2)} kg</td>
                <td>{(row.requiredGreenG / 1000).toFixed(2)} kg</td>
                <td>{row.dropsRequired} x 5kg</td>
                <td>{(row.totalRoastedOutput / 1000).toFixed(2)} kg</td>
                <td>{(row.surplusRoastedG / 1000).toFixed(2)} kg</td>
              </tr>
            ))}
            {!roastResults.length && (
              <tr>
                <td colSpan={6} className="muted">
                  No calculations yet. Add on-hand, ensure orders are included, then run Calculate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
