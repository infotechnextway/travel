# Phase 7: Guide Module

## Overview

Complete guide management system including registration, skill certification, availability calendar, assignment workflow (auto-assign and manual accept), earnings tracking, and customer rating aggregation.

## Architecture

```
Route -> Controller -> Service -> Repository -> Model
```

## Features Delivered

### 1. Guide Registration

- `POST /api/v1/guides/register`
- Fields: bio (50-2000 chars), languages (1-10), skills (1-20 from enum), experienceYears, maxGroupSize, preferredDestinations, emergencyContact
- Creates guide with `verificationStatus: PENDING`
- Prevents duplicate guide profiles per user
- Skills enum: trekking, mountaineering, rock_climbing, rafting, kayaking, scuba_diving, snorkeling, paragliding, skiing, snowboarding, wildlife_safari, bird_watching, photography, cycling, motorcycling, camping, yoga, ayurveda, cooking, history, archaeology, culture, spiritual, adventure, nature, first_aid, rescue

### 2. Profile Management

- `GET /api/v1/guides/me` — Full guide profile
- `PATCH /api/v1/guides/me` — Update profile fields
- Protected by `GUIDE_VIEW_ASSIGNMENTS` permission

### 3. Skill Certification Upload

- `POST /api/v1/guides/me/certifications`
- Fields: name, issuedBy, issuedAt, expiresAt, documentUrl
- Max 20 certifications per guide
- `DELETE /api/v1/guides/me/certifications/:id` — Remove unverified certifications
- Certifications tracked with `isVerified` flag (admin review)

### 4. Availability Calendar

- `POST /api/v1/guides/me/availability`
- Update up to 365 days at once
- Fields: date, isAvailable, listingIds (optional)
- Replaces existing entries for same dates (atomic update)
- `GET /api/v1/guides/me/availability?startDate=&endDate=` — View availability range

### 5. Assignment Workflow

#### Create Assignment (Vendor/Admin)
- `POST /api/v1/guides/assignments` (via vendor service or admin)
- Modes:
  - **Auto-assign**: System finds best matching guide by rating, experience, availability, group size
  - **Manual assign**: Specific guideId provided
- Assignment status: `pending` (manual) or `auto_assigned` (auto)
- 2-hour SLA for guide response (enforced at application level)

#### Guide Response
- `POST /api/v1/guides/me/assignments/:id/respond`
- Guide accepts or rejects with optional reason
- Status transitions: `pending` -> `accepted` / `rejected`
- Updates booking with guideId on acceptance

#### View Assignments
- `GET /api/v1/guides/me/assignments?status=&page=&limit=`
- Paginated list of all assignments for the guide

### 6. Earnings Tracking

- `GET /api/v1/guides/me/earnings?startDate=&endDate=`
  - totalEarnings, totalTrips, avgEarningsPerTrip
  - byMonth breakdown
  - recentTrips (last 10) with listing title, date, earnings, travelers, rating
- `GET /api/v1/guides/me/earnings/summary`
  - totalEarnings, totalTrips, avgRating
  - thisMonth, lastMonth, ytd (year-to-date)
  - pendingPayout (from confirmed bookings)

### 7. Customer Rating Aggregation

- `GET /api/v1/guides/me/ratings`
  - overallRating (rounded to 1 decimal)
  - totalReviews
  - byDimension: cleanliness, value, communication, location, accuracy, service, amenities
  - distribution: count per star rating (1-5)
  - recentReviews (last 5)

### 8. Admin Guide Management

#### Search & Filtering
- `GET /api/v1/guides/admin` — Admin guide search
- Filters: skills, languages, minRating, maxGroupSize, isAvailable, verificationStatus, destination, search, date range
- Pagination, sorting (rating, tripCount, experienceYears, createdAt, totalEarnings), ordering

#### Verification Queue
- `GET /api/v1/guides/admin/verification-queue` — Pending submissions

#### Guide Operations
- `GET /api/v1/guides/admin/:id` — Guide details
- `PATCH /api/v1/guides/admin/:id/review` — Approve/reject with notes
- `POST /api/v1/guides/admin/:id/suspend` — Deactivate guide
- `POST /api/v1/guides/admin/:id/activate` — Reactivate guide
- `POST /api/v1/guides/admin/bulk-action` — Batch activate/deactivate/verify/suspend (max 100)

#### Statistics
- `GET /api/v1/guides/admin/stats` — Platform-wide guide stats
  - totalGuides, byVerificationStatus, bySkills, avgRating, totalTrips, totalEarnings, newThisMonth

### 9. Public Guide Discovery

- `GET /api/v1/guides/public/available` — Find available guides (no auth)
- Filters: skills, languages, minRating, maxGroupSize, destination, date
- Sorted by rating desc, then experience desc

## Security & Permissions

| Endpoint | Required Permission |
|----------|---------------------|
| Register / Profile | GUIDE_VIEW_ASSIGNMENTS |
| Certifications | GUIDE_VIEW_ASSIGNMENTS |
| Availability | GUIDE_UPDATE_AVAILABILITY |
| Assignments | GUIDE_VIEW_ASSIGNMENTS |
| Earnings | GUIDE_VIEW_ASSIGNMENTS |
| Ratings | GUIDE_VIEW_ASSIGNMENTS |
| Admin Search | MANAGE_GUIDES |
| Admin Review | MANAGE_GUIDES |
| Admin Bulk | MANAGE_GUIDES |

## Models

### Guide Model (from Phase 3)
- Fields: userId, bio, languages, skills, certifications, experienceYears, availability, rating, tripCount, totalEarnings, maxGroupSize, preferredDestinations, emergencyContact, verificationStatus, isActive, location
- Indexes: userId (unique), vendorId, location (2dsphere), skills, languages, rating, verificationStatus+isActive, availability.date+isAvailable

## Next Phase

Phase 8: Destinations Module — Hierarchical destination data, curated content, interactive map integration, weather data.
