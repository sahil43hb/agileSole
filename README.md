# Agile Sole

Family footwear storefront from Gujranwala. One Next.js app (storefront + admin + `/api/v1`) on Vercel. Milestone 1 is cash on delivery only.

## Local

```bash
npm install
cp .env.example .env.local
npm run dev
```

- Store: http://localhost:3000/en
- Admin: http://localhost:3000/admin (`agilesole@gmail.com` / `Admin123` unless you change seed env; staff `Staff123`)
- Memory Mongo: keep `USE_MEMORY_MONGO=true` when Atlas is not set

```bash
npm run seed          # reload demo catalog into Mongo
npm run backup        # JSON dump when MONGODB_URI points at Atlas/local Mongo
npm run test:e2e      # Playwright: browse → COD → confirm → track
```

## Staging on Vercel

1. Create one Next.js project from this repo (no second server).
2. Set `MONGODB_URI`, `SESSION_SECRET` (32+ chars), `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL` to the Preview URL.
3. Do **not** set `USE_MEMORY_MONGO` on Vercel.
4. Deploy Preview. Run `npm run seed` against Atlas once (or import products in admin).
5. Confirm `/en`, `/ur`, `/admin`, `/sitemap.xml`, `/api/v1/feeds/google`.

Production uses the same project, Production env, and a real domain on `NEXT_PUBLIC_SITE_URL`.
