# Roast Mate

Standalone roast-planning web app for Beechworth Coffee Roasters. Stack: Next.js (app router), TypeScript, Prisma, PostgreSQL. Features include Shopify order import, roast engine (5kg drops only), blend recipes, on-hand tracking, roast/bagging PDF exports, and mobile-first UI.

## Quick start

1) Install dependencies
```bash
npm install
```

2) Configure environment
```bash
cp .env.example .env
# set DATABASE_URL (PostgreSQL)
# optional: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN for live imports
```

3) Database setup
```bash
npx prisma migrate dev --name init
npx prisma generate
```

4) Run the app
```bash
npm run dev
```
Visit http://localhost:3000

## Key concepts

- Roast engine: converts included orders → roasted grams → green grams → drops (ceil to 5kg) with surplus rolled into on-hand.
- Blends: drop-based; each component roasted in whole drops then mixed. Surplus remains as on-hand for next session.
- On-hand: editable per roast session for coffees and blends; consumed before new drops.
- Orders: import from Shopify Admin API (`/api/orders/import/shopify`); toggle skip/unskip per session.

## API map

- `GET /api/orders` – list orders (filter by `sessionId` query)
- `GET /api/orders/import/shopify` – pull unfulfilled Shopify orders and store them
- `GET|POST /api/roast-sessions` – list or create session (assigns unassigned orders)
- `GET|POST /api/roast-sessions/{id}` – fetch session, update on-hand, skip orders
- `POST /api/roast-sessions/{id}/calculate` – run roast engine and persist results/on-hand
- `GET /api/reports/roasting/{id}` – PDF roasting report
- `GET /api/reports/bagging/{id}` – PDF bagging/packing report
- `GET|POST /api/settings` – coffees, blends, and variant mappings CRUD

## Frontend routes

- `/` dashboard
- `/orders` import + unified orders
- `/roast-sessions` list/create sessions
- `/roast-sessions/[id]` manage on-hand, skip orders, run calculations, export reports
- `/settings` coffees, blends, variant mappings

## Notes

- Default drop size is fixed at 5kg green.
- No authentication is implemented (single-user admin console).
- Shopify import falls back to demo data when env vars are missing for easier local testing.
