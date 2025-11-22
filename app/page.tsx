import Link from 'next/link';

const statCards = [
  { title: 'Roast Sessions', action: 'Plan & run weekly roasts', href: '/roast-sessions' },
  { title: 'Orders', action: 'Import from Shopify and manage skips', href: '/orders' },
  { title: 'Settings', action: 'Coffees, blends, mappings', href: '/settings' },
  { title: 'Shopify Test', action: 'Verify unfulfilled orders feed', href: '/shopify-test' }
];

export default function HomePage() {
  return (
    <div className="grid" style={{ gap: 18 }}>
      <header className="panel" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div className="pill">Roast Mate</div>
          <h1 style={{ marginTop: 10, fontSize: 32 }}>Weekly roasting without spreadsheets</h1>
          <p className="muted" style={{ maxWidth: 520 }}>
            Automate roast maths, keep blends drop-true, and export reports in a mobile-first
            workflow designed for the roastery floor.
          </p>
          <div className="stack-row" style={{ marginTop: 14 }}>
            <Link className="btn" href="/roast-sessions">
              Start Roast Session
            </Link>
            <Link className="btn secondary" href="/settings">
              Configure Coffees & Blends
            </Link>
          </div>
        </div>
      </header>

      <section className="grid" style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {statCards.map((card) => (
          <Link key={card.title} href={card.href} className="panel" style={{ textDecoration: 'none' }}>
            <div className="pill" style={{ marginBottom: 12 }}>
              {card.title}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{card.action}</div>
            <div className="muted" style={{ marginTop: 8 }}>
              Tap to open
            </div>
          </Link>
        ))}
      </section>

      <section className="panel">
        <h3>Roasting principles</h3>
        <ul>
          <li>Only 5 kg green drops, no partial batches</li>
          <li>On-hand roasted stock is always consumed first</li>
          <li>Blend buckets mix whole drops per component; surplus rolls forward</li>
          <li>Simple toggles to skip orders per session</li>
        </ul>
      </section>
    </div>
  );
}
