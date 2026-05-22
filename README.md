# TechKart — The Future of Tech Shopping

A complete production-ready fullstack tech e-commerce platform with an AI shopping agent.

**Stack:** React 18 + Vite + Zustand + Framer Motion + Tailwind · Node 20 + Express (ESM) · PostgreSQL + Prisma · JWT + Google OAuth · MCP Server (`@modelcontextprotocol/sdk`)

---

## Project Structure

```
techkart/
├── backend/      Express API + Prisma + JWT auth + product sync
├── frontend/     React SPA with glass/water UI, Zustand, Recharts
├── mcp-server/   AI agent over the backend (stdio MCP)
└── README.md
```

---

## Quick Start

### 1. Prerequisites

- Node 20+
- A running PostgreSQL 14+ instance (local install, Docker, or hosted)

### 2. Database

Start a local Postgres (Docker example):

```bash
docker run --name techkart-pg -e POSTGRES_USER=techkart -e POSTGRES_PASSWORD=techkart \
  -e POSTGRES_DB=techkart -p 5432:5432 -d postgres:16
```

### 3. Backend

```bash
cd backend
cp .env.example .env       # then edit JWT_SECRET, DATABASE_URL, etc.
npm install
npx prisma generate
npx prisma db push         # creates tables (use migrate dev for migrations)
npm run db:seed            # populates products + 90 days of price history
npm run dev                # http://localhost:5000
```

`GET /api/health` → `{ "status": "ok", "platform": "TechKart" }`

### 4. Frontend

```bash
cd frontend
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                # http://localhost:5173
```

### 5. MCP Server (optional — for AI-driven ordering via Claude / Cursor / Claude Code)

```bash
cd mcp-server
cp .env.example .env       # BACKEND_URL=http://localhost:5000
npm install
npm start                  # speaks stdio
```

Register it in your MCP client (e.g. Claude Desktop, Claude Code) by pointing the
`command` at `node /absolute/path/to/techkart/mcp-server/src/server.js`.

---

## Features

| Layer | What's there |
| --- | --- |
| Auth | JWT access (15m) + refresh-cookie rotation, Google OAuth (Passport) |
| Products | Search, filters, sort, pagination, categories, 90-day price history, compare |
| Cart | Per-user persistent cart, stock validation, qty controls |
| Orders | COD/UPI/Card flow, address validation, agent-placed flag, cancellation |
| AI Agent | MCP tools: `search_products`, `get_price_history`, `compare_products`, `view_cart`, `add_to_cart`, `place_order` (confirmation-gated), `get_order_status` |
| UI | Glass/water aesthetic, Framer Motion reveals, Recharts price area, ripple buttons |

---

## API Surface

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
GET    /api/auth/google
GET    /api/auth/google/callback

GET    /api/products          ?q&category&minPrice&maxPrice&minRating&sort&page&limit
GET    /api/products/categories
POST   /api/products/compare  { ids: string[] }
GET    /api/products/:id
GET    /api/products/:id/price-history?days=90

GET    /api/cart
POST   /api/cart              { productId, quantity }
PATCH  /api/cart/:id          { quantity }
DELETE /api/cart/:id
DELETE /api/cart/clear

GET    /api/orders
POST   /api/orders            { shippingAddr, paymentMethod, notes }
GET    /api/orders/:id
PATCH  /api/orders/:id/cancel

GET    /api/users/profile
PATCH  /api/users/profile     { name, avatar }
```

---

## Environment Reference

**Backend `.env`** — see `backend/.env.example`:
```
DATABASE_URL=postgresql://techkart:techkart@localhost:5432/techkart
JWT_SECRET=<32+ char random>
GOOGLE_CLIENT_ID=...           # optional — omit to disable Google login
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
PORT=5000
```

**Frontend `.env`** — see `frontend/.env.example`:
```
VITE_API_URL=http://localhost:5000/api
```

**MCP `.env`** — see `mcp-server/.env.example`:
```
BACKEND_URL=http://localhost:5000
```

---

## Notes

- Set `SYNC_ON_BOOT=false` in the backend `.env` to skip the FakeStoreAPI sync on startup; the seeded local catalog will still load.
- The seeded products include realistic specs, ratings, and 90 days of synthetic price history per product so the price chart is meaningful out of the box.
- Google OAuth routes are only mounted if both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set — so the app boots cleanly without them.
