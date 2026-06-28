# India Travel Marketplace — Monorepo

A Turborepo monorepo for a multi-vendor India travel booking platform (tours, activities, hotels, transport) with a Node/Express/TypeScript + MongoDB API, Next.js web/admin/vendor apps, and a Flutter mobile app.

> **Before you deploy, read [`BUILD_REPORT.md`](./BUILD_REPORT.md).** The API currently has outstanding TypeScript errors inherited from the separately-generated source phases and must be brought to a clean `tsc` build first. This repo is a consolidated, correctly-wired foundation — not a finished production build.

## Layout
```
services/api            Express + TypeScript + Mongoose API (24 modules)
apps/web                Next.js storefront        (scaffold — needs building)
apps/admin              Next.js admin console      (scaffold)
apps/vendor-dashboard   Next.js vendor console     (scaffold)
apps/mobile             Flutter app (real: screens, services, models, providers)
packages/shared-types   Shared TS types/enums/constants
infra/docker            Dockerfiles + docker-compose
infra/nginx             Reverse-proxy config
```

## API modules mounted in `app.ts`
auth, users, vendors, guides, destinations, listings, bookings, payments,
coupons, rewards, referrals, reviews, notifications, support — under `/api/v1/*`.

## Local setup
```bash
npm install                                   # root workspaces
cp services/api/.env.example services/api/.env
cd services/api && npm run typecheck          # <-- remaining work lives here
npm run seed && npm run dev
```

## Docker
`infra/docker/docker-compose.yml` defines: api, web, admin, vendor, mongo, redis, nginx.
```bash
cd infra/docker && docker compose up --build
```
(The API Dockerfile runs `tsc`, so it builds only after typecheck is green.)

## Mobile (Flutter)
```bash
cd apps/mobile && flutter pub get
# set API base URL in lib/services/api_service.dart
flutter run
```
