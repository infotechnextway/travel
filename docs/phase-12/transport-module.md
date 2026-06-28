# Phase 12: Transport Module — Fleet Management, Routes, Pricing, Tracking

## Overview

This phase implements the complete transport management system for the India Travel Marketplace. It covers transport creation with fleet management, route configuration, per-km/per-day pricing, operator integration, real-time GPS tracking, and fleet utilization analytics.

## Architecture

```
Route -> Controller -> Service -> Model (Listing polymorphic)
```

Transport listings are stored in the polymorphic `Listing` collection with `listingType: 'transport'`.

## Components

### TransportService (`src/modules/transport/transport.service.ts`)

| Method | Responsibility |
|--------|-------------|
| `create(vendorId, dto)` | Create transport with fleet details, route config, operator details, pricing validation |
| `getById(id)` | Retrieve transport by ID with populated vendor, guides, destination |
| `getBySlug(slug)` | Public transport lookup by slug, increments view count |
| `update(vendorId, transportId, dto)` | Update transport with fleet management, route changes, operator updates |
| `delete(vendorId, transportId)` | Soft delete (archive) transport |
| `search(filters)` | Advanced search with transport type, capacity, route, pricing filters |
| `calculatePrice(transportId, dto)` | Dynamic price calculation with distance-based and daily pricing, fleet selection |
| `updateFleetStatus(vendorId, transportId, fleetIndex, isActive, reason)` | Activate/deactivate specific fleet vehicles |
| `updateLocation(transportId, location)` | Real-time GPS tracking update (stores in metadata, 100-location history) |
| `getLocationHistory(transportId, limit)` | Retrieve location history for tracking |
| `getVendorTransports(vendorId, filters)` | Vendor's own transport listings |
| `getSimilarTransports(transportId, limit)` | Recommendation engine based on route, type, destination |
| `submitForReview(vendorId, transportId)` | Submit draft transport for admin review |
| `getFleetUtilization(vendorId, transportId)` | Fleet analytics: active/inactive vehicles, utilization rate |

## Transport Types

| Type | Description | Typical Capacity | Pricing Model |
|------|-------------|------------------|---------------|
| `cab` | Point-to-point taxi service | 4-6 | Per km + base fare |
| `bus` | Group bus transport | 20-50 | Per person or per day |
| `train` | Rail transport packages | 50-500 | Per person |
| `flight` | Air travel packages | 50-200 | Per person |
| `bike_rental` | Motorcycle/bicycle rental | 1-2 | Per day |
| `car_rental` | Self-drive car rental | 4-7 | Per day + km |
| `van_rental` | Van/minivan rental | 8-15 | Per day + km |
| `luxury_car` | Premium vehicle rental | 4-7 | Per day + km |
| `tempo_traveller` | Tempo traveller rental | 12-20 | Per day + km |
| `boat` | Boat/ship transport | 10-100 | Per person or per trip |
| `ferry` | Ferry service | 50-200 | Per person |
| `helicopter` | Helicopter charter | 4-6 | Per hour |

## Fleet Management

### Fleet Vehicle Structure

```json
{
  "fleetDetails": [
    {
      "vehicleType": "Toyota Innova Crysta",
      "capacity": 7,
      "features": ["AC", "Music System", "GPS", "First Aid Kit", "Charging Points"],
      "pricePerKm": 18,
      "pricePerDay": 3500,
      "images": ["https://cdn.example.com/innova1.jpg"],
      "registrationNumber": "KA01AB1234",
      "insuranceValidUntil": "2025-03-15",
      "lastServiceDate": "2024-06-01",
      "nextServiceDue": "2024-09-01",
      "isActive": true
    }
  ]
}
```

### Fleet Validation Rules
- Minimum 1 vehicle per transport listing
- Maximum 50 vehicles per listing
- Each vehicle must have either `pricePerKm` or `pricePerDay` (or both)
- Capacity: 1-100 passengers
- Features: max 30 per vehicle
- Registration number: max 50 characters (optional)
- Insurance and service dates: ISO date format (optional)

### Fleet Status Management

Vehicles can be activated/deactivated individually:
- `isActive: true` — Vehicle available for booking
- `isActive: false` — Vehicle temporarily unavailable (maintenance, repair, etc.)
- Status changes tracked with reason and timestamp in metadata

## Route Configuration

### Route Structure

```json
{
  "route": {
    "origin": "Bangalore City Center",
    "destination": "Mysore Palace",
    "stops": ["Ramanagara", "Channapatna", "Maddur"],
    "distanceKm": 145,
    "durationHours": 3.5,
    "routeDescription": "Scenic route via Bangalore-Mysore highway. Beautiful countryside views with optional stops at Ramanagara (Sholay hills) and Channapatna (toy town).",
    "waypoints": [
      {
        "name": "Ramanagara Viewpoint",
        "coordinates": [77.31, 12.72],
        "stopDuration": 30
      },
      {
        "name": "Channapatna Toy Factory",
        "coordinates": [77.48, 12.90],
        "stopDuration": 45
      }
    ]
  }
}
```

### Route Features
- **Origin/Destination**: 2-200 characters each
- **Stops**: Max 20 intermediate stops
- **Distance**: Kilometers (optional, auto-calculated via Google Maps API)
- **Duration**: Hours (optional, auto-calculated)
- **Waypoints**: GPS coordinates with stop duration (0-480 minutes)
- **Route Description**: Max 2000 characters for detailed directions

## Operator Integration

### Operator Details

```json
{
  "operatorDetails": {
    "operatorName": "South India Transport Services",
    "operatorContact": "+919876543210",
    "operatorEmail": "contact@southindiatransport.com",
    "licenseNumber": "TN-TRANS-2024-001",
    "licenseValidUntil": "2025-12-31",
    "yearsOfExperience": 15,
    "safetyRating": 4.8
  }
}
```

### Operator Validation
- Name: 2-200 characters, required
- Contact: Valid Indian phone number (+91), required
- Email: Valid email, required
- License: Max 100 characters, optional
- Experience: 0-100 years, optional
- Safety Rating: 1-5 scale, optional

## Pricing Models

### Distance-Based Pricing

Used when `pricePerKm` is set on fleet vehicle:

```json
{
  "pricePerKm": 18,
  "distanceKm": 145,
  "distancePrice": 2610
}
```

### Daily Pricing

Used when `pricePerDay` is set on fleet vehicle:

```json
{
  "pricePerDay": 3500,
  "days": 3,
  "dailyPrice": 10500
}
```

### Combined Pricing

Both distance and daily pricing can be applied:

```json
{
  "basePrice": 500,
  "distancePrice": 2610,
  "dailyPrice": 10500,
  "taxAmount": 1361,
  "serviceFee": 200,
  "totalAmount": 15171
}
```

### Price Calculation Response

```json
{
  "basePrice": 24500,
  "distancePrice": 2610,
  "dailyPrice": 10500,
  "childPrice": 0,
  "infantPrice": 0,
  "taxAmount": 3761,
  "serviceFee": 500,
  "totalAmount": 41871,
  "finalAmount": 41871,
  "currency": "INR",
  "breakdown": {
    "adults": 5,
    "children": 0,
    "infants": 0,
    "adultPrice": 4900,
    "childPricePerPerson": 0,
    "infantPricePerPerson": 0,
    "distanceKm": 145,
    "days": 3,
    "selectedVehicle": "Toyota Innova Crysta"
  }
}
```

## Real-Time Tracking

### Location Update

`POST /api/v1/transport/:id/location`

```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "timestamp": "2024-07-15T10:30:00Z",
  "speed": 45.5,
  "heading": 180
}
```

### Location History

`GET /api/v1/transport/:id/location?limit=100`

Returns last 100 location updates (configurable):

```json
[
  {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "timestamp": "2024-07-15T10:30:00Z",
    "speed": 45.5,
    "heading": 180
  }
]
```

### Tracking Features
- GPS coordinates (latitude, longitude)
- Timestamp (auto-generated if not provided)
- Speed (km/h, optional)
- Heading (degrees, 0-360, optional)
- 100-location rolling history per transport
- Last location always available in `metadata.lastLocation`

## Fleet Utilization Analytics

`GET /api/v1/transport/:id/fleet-utilization`

```json
{
  "totalVehicles": 5,
  "activeVehicles": 4,
  "inactiveVehicles": 1,
  "utilizationRate": 80.00,
  "fleetDetails": [
    {
      "vehicleType": "Toyota Innova Crysta",
      "capacity": 7,
      "isActive": true,
      "bookingCount": 12
    },
    {
      "vehicleType": "Maruti Ertiga",
      "capacity": 6,
      "isActive": false,
      "bookingCount": 8
    }
  ]
}
```

## API Endpoints

### Public Routes (`/api/v1/transport`)

| Method | Endpoint | Validation | Description |
|--------|----------|------------|-------------|
| GET | `/search` | `TransportSearchDto` query | Search transports |
| GET | `/:slug` | — | Get transport by slug |
| GET | `/id/:id` | — | Get transport by ID |
| GET | `/:id/similar` | — | Get similar transports |
| POST | `/:id/calculate-price` | `CalculateTransportPriceDto` | Calculate price |
| GET | `/:id/location` | — | Get location history |

### Vendor Routes (`/api/v1/transport`)

| Method | Endpoint | Auth | Validation | Description |
|--------|----------|------|------------|-------------|
| POST | `/` | Vendor | `CreateTransportDto` | Create transport |
| GET | `/vendor/my-transports` | Vendor | — | List vendor transports |
| PUT | `/:id` | Vendor | `UpdateTransportDto` | Update transport |
| DELETE | `/:id` | Vendor | — | Archive transport |
| PUT | `/:id/fleet-status` | Vendor | `UpdateFleetStatusDto` | Update fleet vehicle status |
| POST | `/:id/location` | Vendor | `TrackLocationDto` | Update GPS location |
| POST | `/:id/submit-review` | Vendor | — | Submit for review |
| GET | `/:id/fleet-utilization` | Vendor | — | Fleet analytics |

### Admin Routes (`/api/v1/admin/transport`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/pending-reviews` | Admin | List pending review transports |
| GET | `/stats` | Admin | Transport statistics |
| POST | `/:id/approve` | Admin | Approve transport |
| POST | `/:id/reject` | Admin | Reject back to draft |
| POST | `/:id/suspend` | Admin | Suspend published transport |

## Search & Filtering

### Public Search (`GET /api/v1/transport/search`)

| Parameter | Type | Description |
|-----------|------|-------------|
| `destinationId` / `destinationSlug` | string | Filter by destination |
| `transportType` | string | Cab, bus, train, flight, bike_rental, etc. |
| `minPrice` / `maxPrice` | number | Price range |
| `minCapacity` / `maxCapacity` | integer | Vehicle capacity |
| `languages` | string[] | Languages offered |
| `tags` | string[] | Activity tags |
| `amenities` | string[] | Required amenities |
| `isInstantBook` | boolean | Instant booking only |
| `isVerified` | boolean | Verified only |
| `origin` | string | Route origin search |
| `destination` | string | Route destination search |
| `dateFrom` / `dateTo` | ISO date | Date range |
| `search` | string | Text search (title, description, route, stops) |
| `sort` | string | `createdAt`, `price`, `rating`, `bookingCount`, `reviewCount` |

## Similar Transports Algorithm

`GET /api/v1/transport/:id/similar?limit=5`

Matches transports based on:
1. Same destination (highest priority)
2. Same transport type (high priority)
3. Same route origin/destination (medium priority)
4. Shared tags (low priority)

## Transport Statistics (Admin)

`GET /api/v1/admin/transport/stats`

```json
{
  "totalTransports": 450,
  "status": {
    "published": 380,
    "draft": 40,
    "pendingReview": 20,
    "suspended": 10
  },
  "averagePrice": 2850.75,
  "byTransportType": {
    "cab": 120,
    "car_rental": 80,
    "bus": 60,
    "bike_rental": 50,
    "tempo_traveller": 40,
    "van_rental": 30,
    "luxury_car": 25,
    "train": 20,
    "flight": 15,
    "boat": 10
  },
  "topDestinations": [
    { "_id": "dest_001", "count": 85 },
    { "_id": "dest_002", "count": 60 }
  ]
}
```

## Security Measures

| Feature | Implementation |
|---------|---------------|
| Fleet Pricing Validation | Each vehicle must have pricePerKm or pricePerDay |
| Capacity Validation | Travelers cannot exceed selected vehicle capacity |
| Vehicle Status | Individual fleet vehicles can be activated/deactivated |
| Location History | Rolling 100-location history, last location always available |
| Operator Validation | Phone, email, license validation |
| Route Waypoints | GPS coordinates with stop duration validation |
| Insurance Tracking | Optional insurance validity dates for compliance |
| Service Tracking | Last service and next service due dates |

## Models

### Listing Model (Phase 3)
- No schema changes; all transport-specific fields already defined in polymorphic listing
- `listingType: 'transport'` discriminator
- Transport-specific fields: `transportType`, `fleetDetails`, `route`, `operatorDetails`

## Next Phase

Phase 13: Booking Engine (Cart, checkout, inventory locking, booking status machine, cancellation, refund workflow, split payments).
