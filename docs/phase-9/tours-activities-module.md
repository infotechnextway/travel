# Phase 9: Tours, Activities, Hotels & Transport Module

## Overview

Complete polymorphic listings management system handling all four listing types (Tours, Activities, Hotels, Transport) through a unified model with type-specific validation, business logic, and admin workflows.

## Architecture

```
Route -> Controller -> Service -> Repository -> Model (Polymorphic)
```

## Features Delivered

### 1. Polymorphic Listing Model

Single `Listing` collection with type-specific fields:
- **Common**: title, slug, description, images, videos, coordinates, destination, pricing, inventory, inclusions, exclusions, amenities, tags, languages, cancellation policy, status
- **Tour**: itinerary (day-by-day), durationDays, durationHours, difficulty, minAge, maxAge, start/end times, meeting/drop-off points
- **Activity**: activityCategory, difficulty, durationHours, minAge, maxAge, start/end times, meeting point, safetyBriefing, equipmentProvided/Required, weatherDependency
- **Hotel**: propertyType, starRating, checkIn/Out times, roomTypes (embedded subdocs with pricing, amenities, images)
- **Transport**: transportType, fleetDetails (vehicle types, capacity, features, pricing), route (origin, destination, stops, distance, duration)

### 2. Itinerary Builder (Tours)

- Day-by-day schedule with title, description, activities, meals (breakfast/lunch/dinner), accommodation, transport, images
- Up to 30 days per itinerary
- `PATCH /vendor/:id/itinerary` — Full itinerary replacement
- Validates day numbering (1-indexed, sequential)

### 3. Inclusions & Exclusions Engine

- Array of strings for both inclusions and exclusions
- Max 50 items each, 200 chars per item
- Displayed on listing detail page
- Used for filtering and search

### 4. Group Size Configuration

- **minGroupSize**: Minimum travelers required (1-100)
- **maxGroupSize**: Maximum capacity (1-1000)
- **maxCapacity**: Hard limit for inventory (1-1000)
- Validated against available slots in calendar

### 5. Departure Date Management

- **availableDates**: Array of date entries with slots, priceOverride, isBlackout
- Up to 730 days (2 years) per listing
- **bookingCutoffHours**: Minimum hours before departure for booking
- **Blackout dates**: Mark dates as unavailable (maintenance, holidays)
- `PATCH /vendor/:id/calendar` — Full calendar replacement

### 6. Dynamic Pricing

- **basePrice**: Starting price for the listing
- **pricePerPerson**: Per-person rate
- **childPrice**: Reduced rate for children
- **infantPrice**: Rate for infants (often free)
- **groupSlabs**: Tiered pricing based on group size
  - Example: 1-4 pax: ₹5000/person, 5-10 pax: ₹4500/person, 11+: ₹4000/person
- **priceOverride**: Per-date price override in calendar
- **taxRate**: GST rate (default 5% for tours, 18% for activities)
- **serviceFee**: Platform service fee
- **isNegotiable**: Allow price negotiation for large groups

### 7. Activity-Specific Features

- **Difficulty**: easy, moderate, hard, extreme
- **Safety Briefing**: Mandatory safety instructions (up to 5000 chars)
- **Equipment**: Provided vs Required items
- **Weather Dependency**: Flag for weather-sensitive activities
- **Activity Categories**: water_sports, air_sports, land_sports, snow_sports, adventure, cultural, wellness, culinary, wildlife, photography

### 8. Hotel-Specific Features

- **Property Types**: resort, hotel, homestay, hostel, villa, camp, boutique_hotel, heritage_property
- **Star Rating**: 1-5 stars
- **Room Types**: Embedded subdocuments with name, description, maxOccupancy, bedConfiguration, sizeSqFt, amenities, images, basePrice, extraBedPrice, totalRooms
- **Check-in/Out Times**: Default 14:00/11:00

### 9. Transport-Specific Features

- **Transport Types**: cab, bus, train, flight, bike_rental, car_rental, boat, helicopter
- **Fleet Details**: Vehicle type, capacity, features, pricePerKm, pricePerDay
- **Route**: Origin, destination, stops, distanceKm, durationHours

### 10. Availability Checking

- `POST /:id/availability` — Check real-time availability
- Validates: date exists, not blackout, slots >= travelers, within booking cutoff
- Returns: available (boolean), slots (number), pricePerPerson (with override if applicable)

### 11. Search & Filtering

- **Type Filter**: tour, activity, hotel, transport
- **Price Range**: minPrice, maxPrice
- **Rating**: minRating (0-5)
- **Tags & Amenities**: Multi-select filtering
- **Languages**: Filter by offered languages
- **Difficulty**: easy, moderate, hard, extreme
- **Duration**: durationDays (tours), durationHours (activities)
- **Activity Category**: Specific activity types
- **Property Type**: Hotel categories
- **Transport Type**: Vehicle categories
- **Geo Search**: lat/lng/radius
- **Availability**: availableDate + travelers (checks calendar)
- **Text Search**: title, description, tags, shortDescription
- **Sorting**: rating, price, bookingCount, viewCount, createdAt, name

### 12. Vendor Listing Management

- **Create**: Type-specific endpoints with full validation
- **Update**: Partial updates, auto-regenerates slug on title change, resets to pending_review if published
- **Delete**: Archives listing (sets status to archived), checks for active bookings
- **List**: Vendor's own listings with status/type filters

### 13. Admin Listing Management

- **Review Queue**: `GET /admin/review-queue` — Pending listings
- **Review**: Approve (published) / Reject (rejected) with notes
- **Bulk Actions**: publish, archive, verify, suspend (max 100)
- **Stats**: totalListings, byType, byStatus, verifiedCount, instantBookCount, avgRating, totalViews, totalBookings, newThisMonth

### 14. Featured & Related Listings

- **Featured**: `GET /featured?listingType=&limit=` — Admin-curated featured listings
- **Related**: `GET /:id/related?limit=` — Same type, same destination, sorted by rating

## API Endpoints

### Public (`/api/v1/listings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Search/filter listings |
| GET | `/featured` | Featured listings |
| GET | `/slug/:slug` | Get by slug |
| GET | `/:id` | Get by ID |
| GET | `/:id/related` | Related listings |
| POST | `/:id/availability` | Check availability |

### Vendor (`/api/v1/listings/vendor`)
| Method | Endpoint | Permission | Description |
|--------|----------|----------|-------------|
| POST | `/tours` | VENDOR_CREATE_LISTING | Create tour |
| POST | `/activities` | VENDOR_CREATE_LISTING | Create activity |
| POST | `/hotels` | VENDOR_CREATE_LISTING | Create hotel |
| POST | `/transport` | VENDOR_CREATE_LISTING | Create transport |
| PATCH | `/:id` | VENDOR_CREATE_LISTING | Update listing |
| DELETE | `/:id` | VENDOR_CREATE_LISTING | Archive listing |
| GET | `/me` | VENDOR_CREATE_LISTING | My listings |
| PATCH | `/:id/itinerary` | VENDOR_CREATE_LISTING | Update itinerary |
| PATCH | `/:id/calendar` | VENDOR_CREATE_LISTING | Update calendar |
| PATCH | `/:id/pricing` | VENDOR_CREATE_LISTING | Update pricing |

### Admin (`/api/v1/listings/admin`)
| Method | Endpoint | Permission | Description |
|--------|----------|----------|-------------|
| GET | `/` | MANAGE_LISTINGS | Search all |
| GET | `/stats` | MANAGE_LISTINGS | Platform stats |
| GET | `/review-queue` | MANAGE_LISTINGS | Pending review |
| GET | `/:id` | MANAGE_LISTINGS | Listing details |
| PATCH | `/:id/review` | MANAGE_LISTINGS | Review listing |
| POST | `/bulk-action` | MANAGE_LISTINGS | Bulk ops |

## Validation

### Tour DTO
- Itinerary: 1-30 days, each with title, description, activities, meals, accommodation, transport, images
- Duration: 1-30 days, 1-720 hours
- Difficulty: easy, moderate, hard, extreme
- Age: 0-100 min/max
- Times: HH:MM format

### Activity DTO
- Category: 10 predefined categories
- Duration: 1-24 hours
- Safety briefing: up to 5000 chars
- Equipment: up to 20 items each
- Weather dependency flag

### Hotel DTO
- Property type: 8 predefined types
- Star rating: 1-5
- Room types: 1-20, each with occupancy, bed config, pricing
- Check-in/out: HH:MM format

### Transport DTO
- Transport type: 8 predefined types
- Fleet: 1-50 vehicles, each with capacity, features, pricing
- Route: origin, destination, stops, distance, duration

## Next Phase

Phase 10: Booking Engine — Cart, checkout, inventory locking, booking status machine, cancellations, refunds.
