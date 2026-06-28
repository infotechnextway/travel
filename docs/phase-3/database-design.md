# Phase 3: Database Design — MongoDB Atlas Schemas, Indexes, Search & Validation

## Overview

This phase establishes the complete MongoDB Atlas data layer for the India Travel Marketplace. All schemas are production-ready with TypeScript interfaces, Mongoose models, compound indexes, geospatial support, Atlas Search configurations, and JSON Schema validation rules.

## Collections Summary

| Collection | Purpose | Key Features |
|------------|---------|--------------|
| `users` | All user accounts (Customer, Vendor, Guide, Admin) | UUID _id, phone regex, KYC subdocs, address geo |
| `vendors` | Business profiles | GSTIN validation, bank details, commission rate, geo |
| `guides` | Guide profiles | Skills, certifications, availability calendar, geo |
| `destinations` | Hierarchical location data | Self-referencing parent, 2dsphere, text search |
| `listings` | Polymorphic catalog (Tours, Hotels, Activities, Transport) | Single collection with type-specific fields, Atlas Search |
| `bookings` | Reservation records | Booking code, traveler subdocs, GST breakdown, status machine |
| `payments` | Transaction ledger | Gateway order IDs, refund requests, webhook payload |
| `wallets` | User wallet balances | Atomic balance, credit/debit tracking |
| `wallettransactions` | Wallet transaction history | Running balance, reference tracking |
| `coupons` | Promo codes | Usage limits, per-user tracking, listing type filters |
| `reviews` | Verified reviews | Multi-dimensional ratings, vendor response, moderation |
| `notifications` | Multi-channel notifications | Delivery tracking, read status |
| `supporttickets` | Support system | SLA deadline, message threads, escalation |
| `cmspages` | Content management | Block-based content, multi-language, SEO |
| `analyticsevents` | Event tracking | 90-day TTL index, session tracking |

## Schema Design Principles

1. **UUID String _id**: All collections use `String` _id (defaulting to `mongoose.Types.ObjectId().toString()`) for cross-service compatibility and future microservice extraction.
2. **Subdocuments for Ownership**: Addresses, travelers, itinerary days, and messages are embedded subdocuments (owned by parent, no independent lifecycle).
3. **References for Relationships**: Users → Vendors, Users → Guides, Listings → Destinations, Bookings → Listings/Vendors/Guides use `ref` with indexed foreign keys.
4. **Geospatial**: `2dsphere` indexes on coordinates for `destinations`, `listings`, `vendors`, `guides`, and `users.addresses`.
5. **Validation**: MongoDB JSON Schema rules enforced at collection level for critical fields (email regex, phone E.164, GSTIN format, PAN format).

## Index Strategy

### Single Indexes
- `users.phone` (unique)
- `users.email` (unique)
- `vendors.gstin` (unique, sparse)
- `listings.slug` (unique)
- `bookings.bookingCode` (unique)
- `payments.gatewayOrderId` (unique)
- `payments.gatewayPaymentId` (unique, sparse)
- `coupons.code` (unique)
- `cmspages.slug` + `language` (compound unique)

### Compound Indexes
- `users`: `{ role: 1, createdAt: -1 }`, `{ kycStatus: 1 }`
- `vendors`: `{ userId: 1 }` (unique), `{ verificationStatus: 1, createdAt: -1 }`, `{ isActive: 1, verificationStatus: 1 }`
- `listings`: `{ vendorId: 1, status: 1 }`, `{ destinationId: 1, listingType: 1, status: 1 }`, `{ rating: -1, reviewCount: -1 }`, `{ bookingCount: -1 }`
- `bookings`: `{ customerId: 1, status: 1, createdAt: -1 }`, `{ vendorId: 1, status: 1, createdAt: -1 }`, `{ listingId: 1, status: 1 }`, `{ travelDates.startDate: 1, status: 1 }`
- `reviews`: `{ listingId: 1, isApproved: 1, createdAt: -1 }`
- `notifications`: `{ userId: 1, isRead: 1, createdAt: -1 }`
- `supporttickets`: `{ status: 1, priority: -1, createdAt: 1 }`, `{ assignedTo: 1, status: 1 }`, `{ slaDeadline: 1, status: 1 }`

### Geospatial Indexes
- `destinations.coordinates`: `2dsphere`
- `listings.coordinates`: `2dsphere`
- `vendors.location`: `2dsphere`
- `guides.location`: `2dsphere`
- `users.addresses.coordinates`: `2dsphere`

### Text Indexes (Basic)
- `destinations`: `{ name: 'text', description: 'text', tags: 'text' }` (weights: name=10, tags=5, description=2)
- `listings`: `{ title: 'text', description: 'text', tags: 'text' }` (weights: title=10, tags=5, description=2)
- `cmspages`: `{ title: 'text', tags: 'text' }`

### TTL Index
- `analyticsevents.timestamp`: `expireAfterSeconds: 7776000` (90 days)

## Atlas Search Configuration

### `listings_search` Index
- **Analyzer**: Standard with diacritic folding
- **Mapped Fields**:
  - `title` (string, boost via weights)
  - `description` (string)
  - `tags` (string)
  - `shortDescription` (string)
  - `listingType` (string + facet)
  - `status` (string)
  - `rating` (number + facet ranges: Below 2, 2-3, 3-4, 4-5)
  - `pricing.basePrice` (number + facet ranges: Under ₹5k, ₹5k-15k, ₹15k-50k, Above ₹50k)
  - `amenities` (string + facet)
  - `destinationId` (string)
  - `coordinates` (geo)
  - `durationDays` (number)
  - `difficulty` (string + facet)
  - `isVerified` (boolean)
- **Autocomplete**: Custom `edgeGram` analyzer (minGram: 2, maxGram: 10) on `title` and `destination.name`

### `destinations_search` Index
- **Mapped Fields**: `name`, `description`, `tags`, `type` (facet), `coordinates` (geo)

## JSON Schema Validation

Applied at collection creation time via `db.createCollection()` or `collMod`:

- **users**: Enforces `email` pattern, `phone` pattern (`^\+91[6-9]\d{9}$`), `role` enum, `kycStatus` enum, `loginAttempts` minimum 0.
- **vendors**: Enforces `userId`, `businessName`, `pan` pattern, `verificationStatus` enum, `commissionRate` range 0-1.
- **bookings**: Enforces `bookingCode`, `customerId`, `listingId`, `vendorId`, `status` enum, `totalAmount`/`finalAmount` minimum 0.
- **listings**: Enforces `vendorId`, `destinationId`, `listingType` enum, `title` maxLength 150, `status` enum, `pricing.basePrice` minimum 0.
- **payments**: Enforces `bookingId`, `userId`, `gateway` enum, `amount` minimum 0, `status` enum.

## Relationships Diagram

```
User (1) ────────> Vendor (1) [userId]
User (1) ────────> Guide (1) [userId]
User (1) ────────> Wallet (1) [userId]
User (1) ────────> Booking (N) [customerId]
User (1) ────────> Review (N) [customerId]
User (1) ────────> Notification (N) [userId]
User (1) ────────> SupportTicket (N) [userId]

Vendor (1) ──────> Listing (N) [vendorId]
Vendor (1) ──────> Booking (N) [vendorId]
Vendor (1) ──────> Review (N) [vendorId]

Guide (1) ───────> Listing (N) [guideIds]
Guide (1) ───────> Booking (N) [guideId]

Destination (1) ─> Listing (N) [destinationId]
Destination (1) ──> Destination (N) [parentId] (self-ref)

Listing (1) ─────> Booking (N) [listingId]
Listing (1) ─────> Review (N) [listingId]

Booking (1) ─────> Payment (N) [bookingId]
Booking (1) ─────> Review (1) [bookingId] (unique)
Booking (1) ─────> SupportTicket (N) [bookingId]

Wallet (1) ──────> WalletTransaction (N) [walletId]
```

## Seed Data

Development seed data includes:
- 5 users (2 customers, 1 vendor, 1 guide, 1 super admin)
- 1 verified vendor (Himalayan Expeditions)
- 1 verified guide (Anita Desai)
- 5 destinations (Goa, Ladakh, Kerala, Rajasthan, Himachal Pradesh)
- 3 listings (Ladakh Bike Expedition, Kerala Houseboat, Goa Scuba Diving)
- 2 coupons (WELCOME500, ADVENTURE20)
- 2 wallets with transaction history
- 2 CMS pages (About Us, Blog post)

Run seed: `npm run seed --workspace=api`

## Backup Strategy

- **Atlas Continuous Backups**: 30-day point-in-time recovery.
- **Snapshot Retention**: Daily snapshots 30 days; monthly snapshots 12 months.
- **Cross-Region**: Mumbai (primary) + Singapore (secondary) replica set.
- **Export**: Weekly `mongodump` to AWS S3 Glacier for compliance archiving.

## Next Phase

Phase 4: Authentication Module (JWT, OTP, Social Login, RBAC, KYC).
