import { fetchShopifyOrders, type ImportedOrder } from '@/lib/shopify';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ShopifyTestPage() {
  const missingConfig = !process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_ADMIN_TOKEN;

  let orders: ImportedOrder[] = [];
  let error: string | null = null;

  try {
    orders = await fetchShopifyOrders();
  } catch (err) {
    console.error('Shopify fetch failed', err);
    error = err instanceof Error ? err.message : 'Unexpected error';
  }

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="panel">
        <div className="pill">Shopify connection test</div>
        <h2 style={{ marginTop: 8 }}>Unfulfilled orders</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          This page calls Shopify directly and renders the current unfulfilled orders.{' '}
          {missingConfig
            ? 'Environment variables are not set, so demo data is shown.'
            : 'If nothing appears below, check your Shopify credentials and permissions.'}
        </p>

        {missingConfig && (
          <div className="muted" style={{ marginTop: 12 }}>
            <p style={{ marginBottom: 8 }}>To supply your Shopify credentials:</p>
            <ol style={{ marginLeft: 16, marginBottom: 12 }}>
              <li>
                Create a <code>.env.local</code> file in the project root with:
                <div style={{ marginTop: 6, padding: 12, background: '#0f172a', color: 'white', borderRadius: 6 }}>
                  <code>SHOPIFY_STORE_DOMAIN=your-store.myshopify.com</code>
                  <br />
                  <code>SHOPIFY_ADMIN_TOKEN=shpat_...</code>
                </div>
              </li>
              <li style={{ marginTop: 8 }}>
                Use a private app or custom app in Shopify Admin → Apps to generate an Admin API access token with orders read access.
              </li>
              <li style={{ marginTop: 8 }}>Restart the dev server so the new environment variables are picked up.</li>
            </ol>
            <p style={{ marginTop: 4 }}>Once set, reload this page to view your live unfulfilled orders.</p>
          </div>
        )}
      </div>

      {error && (
        <div className="panel" style={{ color: '#b00020' }}>
          <strong>Unable to load orders:</strong> {error}
        </div>
      )}

      {!error && (
        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Items</th>
                <th>Line details</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.sourceOrderId}>
                  <td>{order.customerName || order.sourceOrderId}</td>
                  <td>{order.items.length}</td>
                  <td>
                    {order.items.map((item) => (
                      <div
                        key={`${order.sourceOrderId}-${item.variantId}-${item.productName}`}
                        style={{ marginBottom: 4 }}
                      >
                        <strong>{item.productName}</strong> · {item.quantity} × {item.sizeG}g · {item.grindType}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan={3} className="muted">
                    No unfulfilled orders returned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
