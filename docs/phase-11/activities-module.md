# Phase 11: Adventure Activities Module — Creation, Difficulty, Safety, Equipment, Weather

## Overview

This phase implements the complete adventure activities management system for the India Travel Marketplace. It covers activity creation with difficulty ratings, safety briefing management, equipment tracking, weather dependency alerts, and category-specific configurations.

## Architecture

```
Route -> Controller -> Service -> Model (Listing polymorphic)
```

Activities are stored in the polymorphic `Listing` collection with `listingType: 'activity'`.

## Components

### ActivityService (`src/modules/activities/activity.service.ts`)

| Method | Responsibility |
|--------|-------------|
| `create(vendorId, dto)` | Create activity with safety briefing, equipment lists, weather dependency flag |
| `getById(id)` | Retrieve activity by ID with populated vendor, guides, destination |
| `getBySlug(slug)` | Public activity lookup by slug, increments view count |
| `update(vendorId, activityId, dto)` | Update activity with safety briefing, equipment, weather config |
| `delete(vendorId, activityId)` | Soft delete (archive) activity |
| `search(filters)` | Advanced search with category, difficulty, duration, weather dependency |
| `updateAvailability(vendorId, activityId, dates)` | Update calendar slots and blackout dates |
| `calculatePrice(activityId, dto)` | Dynamic price calculation with group slabs and date overrides |
| `getVendorActivities(vendorId, filters)` | Vendor's own activity listings |
| `getSimilarActivities(activityId, limit)` | Recommendation engine based on category, difficulty, destination |
| `submitForReview(vendorId, activityId)` | Submit draft activity for admin review |
| `checkWeatherSuitability(activityId, weatherData)` | Category-specific weather suitability analysis |

## Activity Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `water_sports` | Water-based activities | Scuba diving, snorkeling, rafting, kayaking, surfing |
| `air_sports` | Air-based activities | Paragliding, skydiving, hot air ballooning, paramotoring |
| `land_sports` | Land-based activities | Rock climbing, bouldering, zip-lining, ATV rides |
| `snow_sports` | Snow/ice activities | Skiing, snowboarding, ice climbing, snowshoeing |
| `adventure_racing` | Competitive adventure | Triathlons, obstacle courses, endurance races |
| `camping` | Outdoor camping | Glamping, wilderness camping, beach camping |
| `trekking` | Hiking/trekking | Day hikes, multi-day treks, summit climbs |
| `cycling` | Bicycle activities | Mountain biking, road cycling, cycling tours |
| `motor_sports` | Motorized activities | Motorbike tours, jeep safaris, dune bashing |
| `wildlife` | Wildlife experiences | Safari, bird watching, nature walks, animal encounters |
| `cultural` | Cultural activities | Village tours, cooking classes, craft workshops |
| `wellness` | Health/wellness | Yoga retreats, meditation, spa experiences |
| `photography` | Photography tours | Wildlife photography, landscape photography, astrophotography |
| `cooking` | Culinary experiences | Cooking classes, food tours, wine tasting |
| `nightlife` | Evening entertainment | Night tours, pub crawls, cultural shows |
| `team_building` | Corporate activities | Corporate retreats, team challenges, leadership programs |

## Difficulty Rating System

| Level | Description | Physical Demand | Technical Skill | Risk Level |
|-------|-------------|-----------------|-----------------|------------|
| `easy` | Suitable for beginners | Low | None | Minimal |
| `moderate` | Some fitness required | Medium | Basic | Low |
| `hard` | Good fitness required | High | Intermediate | Medium |
| `extreme` | Expert level only | Very High | Advanced | High |

## Safety Briefing System

### Safety Briefing Requirements

- **Mandatory**: Minimum 50 characters, maximum 5000 characters
- **Content**: Must include risks, precautions, emergency procedures, required fitness level
- **Language**: Should be in all languages offered by the activity

### Example Safety Briefing

```json
{
  "safetyBriefing": "This scuba diving experience requires participants to be in good health and comfortable in water. Participants must complete a medical questionnaire before diving. Certified PADI instructors will conduct a 30-minute safety briefing covering equalization techniques, hand signals, and emergency procedures. Maximum depth: 12 meters. Diving is weather-dependent and may be cancelled if visibility is below 5 meters or currents exceed 2 knots. Participants under 18 require parental consent. Pregnant women and individuals with heart/respiratory conditions are not permitted."
}
```

## Equipment Management

### Equipment Provided (by vendor)

```json
{
  "equipmentProvided": [
    "Wetsuit (3mm full suit)",
    "BCD (Buoyancy Control Device)",
    "Regulator with octopus",
    "Mask and snorkel",
    "Fins",
    "Weight belt",
    "Dive computer",
    "Underwater camera (optional)"
  ]
}
```

### Equipment Required (by participant)

```json
{
  "equipmentRequired": [
    "Swimwear",
    "Towel",
    "Sunscreen (reef-safe)",
    "Water bottle",
    "Change of clothes"
  ]
}
```

## Weather Dependency System

### Weather-Dependent Activities

When `weatherDependency: true`, the system:
1. Monitors weather conditions via external API integration
2. Alerts vendor and customers of potential cancellations
3. Provides rescheduling options
4. Processes automatic refunds if cancelled due to weather

### Weather Suitability Check

`POST /api/v1/activities/:id/weather-check`

**Request:**
```json
{
  "temperature": 28,
  "windSpeed": 15,
  "precipitation": 2,
  "visibility": 8000
}
```

**Response:**
```json
{
  "suitable": true,
  "reasons": [
    "Weather conditions are suitable for this activity"
  ]
}
```

### Category-Specific Weather Thresholds

| Category | Wind Speed (km/h) | Precipitation (mm) | Visibility (m) | Temperature (°C) |
|----------|-------------------|---------------------|----------------|------------------|
| Water Sports | > 25 unsafe | > 10 unsafe | > 3000 required | Any |
| Air Sports | > 20 unsafe | > 5 unsafe | > 5000 required | Any |
| Snow Sports | Any | > 5 unsafe | > 2000 required | > 5 unsafe |
| Trekking | > 30 unsafe | > 15 unsafe | > 1000 required | Any |
| Motor Sports | Any | > 10 unsafe | > 1000 required | Any |

## Duration Configuration

- **Duration**: 1-24 hours (integer)
- **Start Time**: HH:MM format (optional)
- **End Time**: HH:MM format (optional, auto-calculated from start + duration)
- **Meeting Point**: Max 500 characters
- **Drop-off Point**: Max 500 characters

## Age Restrictions

- **Minimum Age**: 0-100 years (optional)
- **Maximum Age**: 0-100 years (optional)
- **Validation**: Min age must be ≤ max age if both provided
- **Common Restrictions**:
  - Scuba diving: 12+ years
  - Paragliding: 16+ years
  - Skydiving: 18+ years
  - Wildlife safaris: 5+ years
  - Cooking classes: 8+ years

## API Endpoints

### Public Routes (`/api/v1/activities`)

| Method | Endpoint | Validation | Description |
|--------|----------|------------|-------------|
| GET | `/search` | `ActivitySearchDto` query | Search activities |
| GET | `/:slug` | — | Get activity by slug |
| GET | `/id/:id` | — | Get activity by ID |
| GET | `/:id/similar` | — | Get similar activities |
| POST | `/:id/calculate-price` | `CalculateActivityPriceDto` | Calculate price |
| POST | `/:id/weather-check` | — | Check weather suitability |

### Vendor Routes (`/api/v1/activities`)

| Method | Endpoint | Auth | Validation | Description |
|--------|----------|------|------------|-------------|
| POST | `/` | Vendor | `CreateActivityDto` | Create activity |
| GET | `/vendor/my-activities` | Vendor | — | List vendor activities |
| PUT | `/:id` | Vendor | `UpdateActivityDto` | Update activity |
| DELETE | `/:id` | Vendor | — | Archive activity |
| PUT | `/:id/availability` | Vendor | `UpdateActivityAvailabilityDto` | Update calendar |
| POST | `/:id/submit-review` | Vendor | — | Submit for review |

### Admin Routes (`/api/v1/admin/activities`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/pending-reviews` | Admin | List pending review activities |
| GET | `/stats` | Admin | Activity statistics |
| POST | `/:id/approve` | Admin | Approve activity |
| POST | `/:id/reject` | Admin | Reject back to draft |
| POST | `/:id/suspend` | Admin | Suspend published activity |

## Search & Filtering

### Public Search (`GET /api/v1/activities/search`)

| Parameter | Type | Description |
|-----------|------|-------------|
| `destinationId` / `destinationSlug` | string | Filter by destination |
| `activityCategory` | string | Category filter |
| `difficulty` | string | `easy`, `moderate`, `hard`, `extreme` |
| `minDuration` / `maxDuration` | integer (1-24) | Duration in hours |
| `minPrice` / `maxPrice` | number | Price range |
| `minAge` / `maxAge` | integer | Age restrictions |
| `languages` | string[] | Languages offered |
| `tags` | string[] | Activity tags |
| `amenities` | string[] | Required amenities |
| `isInstantBook` | boolean | Instant booking only |
| `isVerified` | boolean | Verified only |
| `weatherDependency` | boolean | Weather-dependent only |
| `dateFrom` / `dateTo` | ISO date | Date range |
| `search` | string | Text search (title, description, safety briefing, tags) |
| `sort` | string | `createdAt`, `price`, `rating`, `durationHours`, `bookingCount`, `reviewCount` |

## Similar Activities Algorithm

`GET /api/v1/activities/:id/similar?limit=5`

Matches activities based on:
1. Same destination (highest priority)
2. Same activity category (high priority)
3. Same difficulty level (medium priority)
4. Shared tags (low priority)

## Activity Statistics (Admin)

`GET /api/v1/admin/activities/stats`

```json
{
  "totalActivities": 1200,
  "status": {
    "published": 950,
    "draft": 150,
    "pendingReview": 80,
    "suspended": 20
  },
  "averagePrice": 3200.50,
  "averageDuration": 4.5,
  "byCategory": {
    "water_sports": 280,
    "trekking": 220,
    "wildlife": 150,
    "air_sports": 80,
    "cultural": 120,
    "camping": 100,
    "motor_sports": 90,
    "cycling": 60,
    "wellness": 50,
    "photography": 50
  },
  "byDifficulty": {
    "easy": 450,
    "moderate": 500,
    "hard": 200,
    "extreme": 50
  },
  "topDestinations": [
    { "_id": "dest_001", "count": 120 },
    { "_id": "dest_002", "count": 95 }
  ]
}
```

## Security Measures

| Feature | Implementation |
|---------|---------------|
| Safety Briefing | Mandatory 50-5000 characters |
| Equipment Lists | Max 50 items each (provided/required) |
| Weather Dependency | Boolean flag + category-specific thresholds |
| Age Validation | Min/max age with cross-validation |
| Duration | 1-24 hours limit |
| Difficulty | Enum validation (easy/moderate/hard/extreme) |
| Category | Enum validation (16 categories) |
| Time Format | HH:MM regex for start/end times |

## Models

### Listing Model (Phase 3)
- No schema changes; all activity-specific fields already defined in polymorphic listing
- `listingType: 'activity'` discriminator
- Activity-specific fields: `activityCategory`, `difficulty`, `safetyBriefing`, `equipmentProvided`, `equipmentRequired`, `weatherDependency`, `durationHours`

## Next Phase

Phase 12: Transport Module (Transport creation, fleet management, route configuration, pricing per km/day, operator integration, real-time tracking).
