# Phase 9: Tours Module — Creation, Itinerary, Pricing, Availability

## Overview

This phase implements the complete tour management system for the India Travel Marketplace. It covers tour creation with rich itinerary builder, dynamic pricing with group slabs, availability calendar management, vendor workflow (draft → review → published), and admin moderation capabilities.

## Architecture

```
Route -> Controller -> Service -> Model (Listing polymorphic)
```

Tours are stored in the polymorphic `Listing` collection with `listingType: 'tour'`.

## Components

### TourService (`src/modules/tours/tour.service.ts`)

| Method | Responsibility |
|--------|-------------|
| `create(vendorId, dto)` | Create tour with slug generation, destination validation, guide validation, vendor verification check |
| `getById(id)` | Retrieve tour by ID with populated vendor, guides, destination |
| `getBySlug(slug)` | Public tour lookup by slug, increments view count |
| `update(vendorId, tourId, dto)` | Update tour with slug regeneration on title change, status validation |
| `delete(vendorId, tourId)` | Soft delete (archive) tour |
| `search(filters)` | Advanced search with 15+ filter parameters, pagination, sorting |
| `updateAvailability(vendorId, tourId, dates)` | Update calendar slots, blackout dates, price overrides |
| `calculatePrice(tourId, dto)` | Dynamic price calculation with group slabs, child/infant pricing, date overrides |
| `getVendorTours(vendorId, filters)` | Vendor's own tour listings |
| `getSimilarTours(tourId, limit)` | Recommendation engine based on destination, tags, difficulty |
| `submitForReview(vendorId, tourId)` | Submit draft tour for admin review |

### TourController (`src/modules/tours/tour.controller.ts`)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /` | Vendor | Create tour |
| `GET /search` | Public | Search tours |
| `GET /:slug` | Public | Get tour by slug |
| `GET /id/:id` | Public | Get tour by ID |
| `PUT /:id` | Vendor | Update tour |
| `DELETE /:id` | Vendor | Archive tour |
| `PUT /:id/availability` | Vendor | Update availability calendar |
| `POST /:id/calculate-price` | Public | Calculate price for travelers |
| `GET /vendor/my-tours` | Vendor | List vendor's tours |
| `GET /:id/similar` | Public | Get similar tours |
| `POST /:id/submit-review` | Vendor | Submit for admin review |

### TourAdminController (`src/modules/tours/tour-admin.controller.ts`)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /pending-reviews` | Admin | List pending review tours |
| `GET /stats` | Admin | Tour platform statistics |
| `POST /:id/approve` | Admin | Approve and publish tour |
| `POST /:id/reject` | Admin | Reject back to draft |
| `POST /:id/suspend` | Admin | Suspend published tour |

## Itinerary Builder

### Day Structure

```json
{
  "itinerary": [
    {
      "day": 1,
      "title": "Arrival in Leh",
      "description": "Acclimatization day. Rest and explore Leh market. Evening briefing.",
      "activities": ["Leh Palace", "Shanti Stupa"],
      "meals": { "dinner": true },
      "accommodation": "Hotel in Leh",
      "transport": "Airport transfer",
      "images": ["https://cdn.example.com/day1.jpg"]
    }
  ]
}
```

### Validation Rules
- Days must be sequential (1 to N, no duplicates)
- Max 30 days per itinerary
- Each day: title (2-200 chars), description (10-2000 chars)
- Meals: breakfast, lunch, dinner booleans
- Activities: max 20 per day
- Images: max 10 per day

## Dynamic Pricing

### Base Pricing

```json
{
  "pricing": {
    "basePrice": 35000,
    "currency": "INR",
    "pricePerPerson": 35000,
    "childPrice": 25000,
    "infantPrice": 0,
    "groupSlabs": [
      { "minPax": 6, "maxPax": 10, "pricePerPerson": 32000 },
      { "minPax": 11, "maxPax": 15, "pricePerPerson": 30000 },
      { "minPax": 16, "maxPax": 20, "pricePerPerson": 28000 }
    ],
    "taxRate": 0.05,
    "serviceFee": 500,
    "isNegotiable": false
  }
}
```

### Price Calculation Logic

1. **Group Slabs**: Find applicable slab based on total travelers (adults + children)
2. **Date Override**: Check if selected date has a `priceOverride` in availability
3. **Child/Infant Pricing**: Apply discounted rates for children and infants
4. **Tax**: Calculate GST (5% default for tours)
5. **Service Fee**: Add fixed service fee
6. **Total**: Sum of all components

### Price Calculation Response

```json
{
  "basePrice": 350000,
  "groupDiscount": 0,
  "datePriceOverride": 0,
  "childPrice": 50000,
  "infantPrice": 0,
  "taxAmount": 17500,
  "serviceFee": 500,
  "totalAmount": 418000,
  "finalAmount": 418000,
  "currency": "INR",
  "breakdown": {
    "adults": 10,
    "children": 2,
    "infants": 0,
    "adultPrice": 35000,
    "childPricePerPerson": 25000,
    "infantPricePerPerson": 0
  }
}
```

## Availability Calendar

### Calendar Entry

```json
{
  "availableDates": [
    {
      "date": "2024-07-15T00:00:00Z",
      "slots": 12,
      "priceOverride": 38000,
      "isBlackout": false
    },
    {
      "date": "2024-07-16T00:00:00Z",
      "slots": 0,
      "isBlackout": true
    }
  ]
}
```

### Features
- **Slots**: Available seats for that date (0 = fully booked)
- **Price Override**: Date-specific pricing (e.g., peak season surcharge)
- **Blackout**: Completely blocked date (holiday, maintenance, etc.)
- **Booking Cutoff**: Minimum hours before departure for booking (default 24h)

## Vendor Workflow

```
[Create Tour] -> Status: DRAFT
    ↓
[Build Itinerary] -> Add day-wise schedule, inclusions, exclusions
    ↓
[Set Pricing] -> Base price, group slabs, child/infant rates
    ↓
[Set Availability] -> Calendar with slots, blackout dates, price overrides
    ↓
[Submit for Review] -> Status: PENDING_REVIEW
    ↓
[Admin Approval] -> Status: PUBLISHED (isVerified: true)
    ↓
[Live on Platform] -> Searchable, bookable
    ↓
[Archive] -> Status: ARCHIVED (soft delete)
```

## Admin Moderation

### Approval Criteria
- Complete itinerary (minimum 1 day)
- Valid destination
- Pricing configured
- Images uploaded (minimum 1)
- Inclusions specified
- Vendor verified

### Rejection Reasons
- Incomplete itinerary
- Inappropriate content
- Pricing errors
- Missing required fields
- Policy violations

### Suspension Reasons
- Customer complaints
- Safety incidents
- Policy violations
- Fraudulent activity

## Search & Filtering

### Public Search (`GET /api/v1/tours/search`)

| Parameter | Type | Description |
|-----------|------|-------------|
| `destinationId` | string | Filter by destination |
| `destinationSlug` | string | Filter by destination slug |
| `difficulty` | string | `easy`, `moderate`, `hard`, `extreme` |
| `minDuration` / `maxDuration` | integer | Duration in days (1-30) |
| `minPrice` / `maxPrice` | number | Price range |
| `minAge` / `maxAge` | integer | Age restrictions |
| `languages` | string[] | Languages offered |
| `tags` | string[] | Activity tags |
| `amenities` | string[] | Required amenities |
| `isInstantBook` | boolean | Instant booking only |
| `isVerified` | boolean | Verified tours only |
| `dateFrom` / `dateTo` | ISO date | Travel date range |
| `search` | string | Text search (title, description, tags, itinerary) |
| `status` | string | `published`, `draft`, `pending_review` |
| `vendorId` | string | Filter by vendor |
| `sort` | string | `createdAt`, `price`, `rating`, `durationDays`, `bookingCount`, `reviewCount` |
| `order` | `asc`/`desc` | Sort direction |

## Similar Tours Algorithm

`GET /api/v1/tours/:id/similar?limit=5`

Matches tours based on:
1. Same destination (highest priority)
2. Shared tags (medium priority)
3. Same difficulty level (low priority)

Returns up to `limit` published tours, excluding the current tour.

## Tour Statistics (Admin)

`GET /api/v1/admin/tours/stats`

```json
{
  "totalTours": 1500,
  "status": {
    "published": 1200,
    "draft": 200,
    "pendingReview": 80,
    "suspended": 20
  },
  "averagePrice": 18500.50,
  "averageDuration": 4.2,
  "byDifficulty": {
    "easy": 450,
    "moderate": 600,
    "hard": 350,
    "extreme": 100
  },
  "topDestinations": [
    { "_id": "dest_002", "count": 180 },
    { "_id": "dest_001", "count": 150 }
  ]
}
```

## Security Measures

| Feature | Implementation |
|---------|---------------|
| Vendor Verification | Only verified vendors can create tours |
| Slug Uniqueness | Auto-appends timestamp if title slug exists |
| Status Validation | Cannot update archived tours; only drafts → review |
| Guide Validation | All guide IDs verified against Guide collection |
| Price Validation | Group slabs: minPax ≤ maxPax |
| Day Validation | No duplicate day numbers in itinerary |
| Time Format | HH:MM regex validation for start/end times |
| Soft Delete | Tours archived, not deleted (preserves bookings) |

## Models

### Listing Model (Phase 3)
- No schema changes; all tour-specific fields already defined in polymorphic listing
- `listingType: 'tour'` discriminator
- Tour-specific fields: `itinerary`, `durationDays`, `durationHours`, `difficulty`, `minAge`, `maxAge`, `startTime`, `endTime`, `meetingPoint`, `dropOffPoint`

## Next Phase

Phase 10: Hotels Module (Hotel creation, room types, amenities, pricing, availability, property management).
