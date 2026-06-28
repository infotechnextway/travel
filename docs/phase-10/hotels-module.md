# Phase 10: Hotels Module — Property Creation, Room Types, Amenities, Pricing, Availability

## Overview

This phase implements the complete hotel/property management system for the India Travel Marketplace. It covers hotel creation with multiple room types, amenity management, dynamic pricing per room, availability calendar, check-in/check-out configuration, and admin moderation.

## Architecture

```
Route -> Controller -> Service -> Model (Listing polymorphic)
```

Hotels are stored in the polymorphic `Listing` collection with `listingType: 'hotel'`.

## Components

### HotelService (`src/modules/hotels/hotel.service.ts`)

| Method | Responsibility |
|--------|-------------|
| `create(vendorId, dto)` | Create hotel with room types, slug generation, destination validation |
| `getById(id)` | Retrieve hotel by ID with populated vendor, guides, destination |
| `getBySlug(slug)` | Public hotel lookup by slug, increments view count |
| `update(vendorId, hotelId, dto)` | Update hotel with room type management, slug regeneration |
| `delete(vendorId, hotelId)` | Soft delete (archive) hotel |
| `search(filters)` | Advanced search with 15+ filter parameters |
| `updateRoomAvailability(vendorId, hotelId, roomTypeId, availability)` | Per-room-type calendar with slots and price overrides |
| `calculatePrice(hotelId, dto)` | Dynamic price calculation per night with extra bed pricing |
| `getVendorHotels(vendorId, filters)` | Vendor's own hotel listings |
| `getSimilarHotels(hotelId, limit)` | Recommendation engine based on destination, type, star rating |
| `submitForReview(vendorId, hotelId)` | Submit draft hotel for admin review |

## Property Types

| Type | Description |
|------|-------------|
| `resort` | Luxury resort with full amenities |
| `hotel` | Standard hotel |
| `homestay` | Local family-hosted accommodation |
| `hostel` | Budget shared accommodation |
| `villa` | Private villa rental |
| `camp` | Tented camp/glamping |
| `boutique_hotel` | Small stylish hotel |
| `heritage_property` | Historic/heritage building |
| `guesthouse` | Small family-run guesthouse |
| `farmhouse` | Rural farm accommodation |
| `treehouse` | Elevated tree accommodation |
| `houseboat` | Floating accommodation |
| `cottage` | Small countryside dwelling |

## Room Types

### Room Structure

```json
{
  "roomTypes": [
    {
      "name": "Deluxe Lake View Room",
      "description": "Spacious room with panoramic lake views and private balcony",
      "maxOccupancy": 3,
      "bedConfiguration": "1 King + 1 Extra Bed",
      "sizeSqFt": 450,
      "amenities": ["Lake View", "Balcony", "AC", "WiFi", "Mini Bar", "Room Service"],
      "images": ["https://cdn.example.com/room1.jpg"],
      "basePrice": 8500,
      "extraBedPrice": 2000,
      "totalRooms": 12
    }
  ]
}
```

### Room Validation Rules
- Name: 2-100 characters
- Max occupancy: 1-20 guests
- Bed configuration: max 100 characters
- Size: minimum 50 sq ft (optional)
- Amenities: max 30 per room type
- Images: max 10 per room type
- Base price: minimum 0
- Extra bed price: minimum 0 (optional)
- Total rooms: 1-1000 per type
- Minimum 1 room type per hotel
- Maximum 20 room types per hotel

## Amenities Matrix

### Standard Amenities (300+ supported)

**Basic:** WiFi, AC, TV, Room Service, Housekeeping, Laundry, Parking
**Comfort:** Mini Bar, Safe, Wardrobe, Desk, Sofa, Balcony, Terrace
**Bathroom:** Hot Water, Shower, Bathtub, Hair Dryer, toiletries, Towels
**Food:** Breakfast Included, Restaurant, Bar, Cafe, Kitchen, Microwave
**Wellness:** Swimming Pool, Spa, Gym, Yoga, Meditation, Sauna, Jacuzzi
**Activities:** Game Room, Library, Garden, Playground, BBQ, Bonfire
**Business:** Conference Room, Business Center, Printer, Fax
**Accessibility:** Wheelchair Access, Elevator, Ramp, Accessible Bathroom
**Safety:** 24/7 Security, CCTV, Fire Safety, First Aid, Doctor on Call
**Transport:** Airport Transfer, Car Rental, Bike Rental, Shuttle Service
**Technology:** Smart TV, Streaming, Bluetooth Speaker, USB Charging, Work Desk
**Environment:** Solar Power, Rainwater Harvesting, Organic Garden, Recycling

## Dynamic Pricing

### Per-Night Calculation

```json
{
  "roomType": "Deluxe Lake View Room",
  "nights": 3,
  "basePrice": 25500,
  "extraBedPrice": 6000,
  "datePriceOverride": 1500,
  "taxAmount": 3180,
  "serviceFee": 500,
  "totalAmount": 36680,
  "finalAmount": 36680,
  "currency": "INR",
  "breakdown": [
    { "date": "2024-07-15", "price": 9000, "extraBedPrice": 2000 },
    { "date": "2024-07-16", "price": 8500, "extraBedPrice": 2000 },
    { "date": "2024-07-17", "price": 8000, "extraBedPrice": 2000 }
  ]
}
```

### Price Calculation Logic

1. **Base Price**: Room type `basePrice` per night
2. **Date Override**: Check if date has `priceOverride` in availability calendar
3. **Extra Beds**: `extraBeds` × `extraBedPrice` per night
4. **Tax**: Sum of base + extra beds × `taxRate` (default 12% for hotels)
5. **Service Fee**: Fixed fee from pricing config
6. **Total**: Sum of all components

### Availability Calendar (Per Room Type)

```json
{
  "roomTypeId": "room_001",
  "availability": [
    {
      "date": "2024-07-15T00:00:00Z",
      "availableRooms": 8,
      "priceOverride": 9000,
      "isBlackout": false
    },
    {
      "date": "2024-07-16T00:00:00Z",
      "availableRooms": 0,
      "isBlackout": true
    }
  ]
}
```

## Check-In/Check-Out Configuration

- **Check-in Time**: HH:MM format (e.g., "14:00")
- **Check-out Time**: HH:MM format (e.g., "11:00")
- **Minimum Stay**: Enforced at booking level (1 night default)
- **Booking Cutoff**: Hours before check-in for booking (default 24h)

## Star Rating System

- 1-5 star rating (optional)
- Used for filtering and sorting
- Displayed on hotel cards and detail pages
- Independent of review rating (customer-generated)

## Vendor Workflow

```
[Create Hotel] -> Status: DRAFT
    ↓
[Add Room Types] -> Multiple room configurations with pricing
    ↓
[Set Amenities] -> 300+ standardized amenities
    ↓
[Set Pricing] -> Base price, tax rate, service fee
    ↓
[Set Availability] -> Per-room-type calendar with price overrides
    ↓
[Submit for Review] -> Status: PENDING_REVIEW
    ↓
[Admin Approval] -> Status: PUBLISHED
    ↓
[Live on Platform] -> Searchable, bookable
```

## Search & Filtering

### Public Search (`GET /api/v1/hotels/search`)

| Parameter | Type | Description |
|-----------|------|-------------|
| `destinationId` / `destinationSlug` | string | Filter by destination |
| `propertyType` | string | Resort, hotel, homestay, etc. |
| `starRating` | integer (1-5) | Star rating filter |
| `minPrice` / `maxPrice` | number | Price range per night |
| `amenities` | string[] | Required amenities (ALL must match) |
| `languages` | string[] | Languages offered |
| `tags` | string[] | Activity tags |
| `isInstantBook` | boolean | Instant booking only |
| `isVerified` | boolean | Verified hotels only |
| `checkIn` / `checkOut` | ISO date | Date range for availability |
| `guests` | integer (1-100) | Number of guests |
| `search` | string | Text search (title, description, room names) |
| `sort` | string | `createdAt`, `price`, `rating`, `starRating`, `bookingCount`, `reviewCount` |

## Similar Hotels Algorithm

`GET /api/v1/hotels/:id/similar?limit=5`

Matches hotels based on:
1. Same destination (highest priority)
2. Same property type (medium priority)
3. Same star rating (medium priority)
4. Shared tags (low priority)

## Hotel Statistics (Admin)

`GET /api/v1/admin/hotels/stats`

```json
{
  "totalHotels": 800,
  "status": {
    "published": 650,
    "draft": 100,
    "pendingReview": 40,
    "suspended": 10
  },
  "averagePrice": 5200.75,
  "averageStarRating": 3.8,
  "byPropertyType": {
    "resort": 120,
    "hotel": 300,
    "homestay": 150,
    "hostel": 80,
    "villa": 100,
    "camp": 50
  },
  "topDestinations": [
    { "_id": "dest_001", "count": 85 },
    { "_id": "dest_003", "count": 72 }
  ]
}
```

## Security Measures

| Feature | Implementation |
|---------|---------------|
| Vendor Verification | Only verified vendors can create hotels |
| Room Type Validation | Max 20 room types, max 1000 rooms per type |
| Occupancy Check | Adults cannot exceed room maxOccupancy |
| Minimum Stay | 1 night minimum enforced |
| Time Format | HH:MM regex for check-in/check-out |
| Soft Delete | Hotels archived, not deleted |
| Star Rating | 1-5 integer validation |

## Models

### Listing Model (Phase 3)
- No schema changes; all hotel-specific fields already defined in polymorphic listing
- `listingType: 'hotel'` discriminator
- Hotel-specific fields: `propertyType`, `starRating`, `checkInTime`, `checkOutTime`, `roomTypes`

## Next Phase

Phase 11: Adventure Activities Module (Activity creation, difficulty rating, safety briefing, equipment management, weather dependency).
