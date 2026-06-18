# Deployment Notes (Render)

## 1) Backend service (`ecommerce-2509-server`)
Set these environment variables:

- `NODE_ENV=production`
- `PORT=5000`
- `MONGO_URI=<your MongoDB connection string>`
- `JWT_SECRET=<long random secret>`
- `JWT_EXPIRES_IN=7d`
- `TRUST_PROXY=1`
- `CORS_ORIGINS=https://freshbay.onrender.com,https://freshbay-admin.onrender.com`
- Optional instead of `CORS_ORIGINS`: `FRONTEND_URL` and `ADMIN_FRONTEND_URL`

Build/start:

- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/api/health`

## 2) Frontend static site (`freshbay`)
Set:

- `VITE_API_URL=https://ecommerce-2509-server.onrender.com/api`

Build/publish:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`

## 3) Admin static site (`freshbay-admin`)
Set:

- `VITE_ADMIN_API_URL=https://ecommerce-2509-server.onrender.com/api`

Build/publish:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`

Use `render.yaml` in the repo root for a blueprint-based setup.

## SPA routing (fixes "Not Found" on refresh)
Both static sites need a catch-all rewrite so deep links / refreshes (e.g.
`/product/:id`) serve `index.html` instead of returning 404. This is declared in
`render.yaml` (`routes: /* -> /index.html`). If a static site was created
manually (not from the Blueprint), add it in the dashboard:
**Settings -> Redirects/Rewrites -> Add Rule** with Source `/*`, Destination
`/index.html`, Action `Rewrite`.
