# Phase 8: Destinations Module

## Overview

Complete destination management system with hierarchical data (Country → State → City → Locality), curated content, interactive 3D map integration, weather data, and comprehensive search/filtering.

## Architecture

```
Route -> Controller -> Service -> Repository -> Model
```

## Features Delivered

### 1. Hierarchical Destination Data

#### Hierarchy Levels
- **Country**: India (root)
- **State**: 28 states + 8 UTs
- **City**: Major cities, tourist hubs
- **Locality**: Specific areas, neighborhoods, landmarks

#### Hierarchy Validation
- `state` must be under `country`
- `city` must be under `state`
- `locality` must be under `city`
- Enforced at creation time

#### Hierarchy Queries
- `GET /api/v1/destinations/hierarchy?rootId=` — Full tree with graphLookup
- `GET /api/v1/destinations/:id/children?type=` — Direct children
- `GET /api/v1/destinations/:id/breadcrumb` — Breadcrumb path (parent chain)

### 2. Curated Content

#### Content Fields
- **History**: Rich text (up to 10,000 chars)
- **Culture**: Rich text (up to 10,000 chars)
- **Cuisine**: Rich text (up to 5,000 chars)
- **How to Reach**: Transport information (up to 5,000 chars)

#### Content Management
- `PATCH /api/v1/destinations/admin/:id/content` — Update curated content
- Content is stored as embedded subdocument in destination model
- Supports incremental updates (partial content updates)

### 3. Weather Data

#### Weather Fields
- **Summer**: Temperature range + notes
- **Monsoon**: Temperature range + notes
- **Winter**: Temperature range + notes

#### Weather API
- `GET /api/v1/destinations/:id/weather` — Current weather context
  - Returns current season based on month
  - Best time to visit months
  - Full weather data object
  - Safety index
- `PATCH /api/v1/destinations/admin/:id/weather` — Update weather data

### 4. Interactive 3D Map Integration

#### Map Data API
- `GET /api/v1/destinations/map?type=&tags=&isFeatured=` — All map points
  - Returns: _id, name, slug, type, coordinates, tags, isFeatured
  - Includes top 3 experiences per destination (listing title, type, rating, price)

#### State Zoom
- `GET /api/v1/destinations/map/state/:slug` — State-level map data
  - Returns all cities and localities under the state
  - Includes top 3 experiences per destination
  - Supports click-to-zoom interaction

#### Geo Features
- Coordinates stored as GeoJSON Point (2dsphere index)
- Nearby search: `$near` with `$maxDistance` in meters
- Radius-based filtering in search API

### 5. Search & Discovery

#### Search Filters
- `type`: country, state, city, locality
- `parentId`: Filter by parent destination
- `tags`: Array of tags (beach, mountain, heritage, etc.)
- `isFeatured`: Boolean filter
- `search`: Text search across name, description, tags, content
- `coordinates`: Geo-radius search (lat, lng, radiusKm)
- `dateFrom` / `dateTo`: Creation date range

#### Sorting
- name, createdAt, updatedAt, safetyIndex, rating
- Ascending or descending

#### Featured Destinations
- `GET /api/v1/destinations/featured?limit=` — Curated featured list
- Admin-controlled via `isFeatured` flag

#### Nearby Destinations
- `GET /api/v1/destinations/nearby?lat=&lng=&radius=&limit=`
- Uses MongoDB `$near` geospatial query
- Returns closest destinations within radius

### 6. Admin Destination Management

#### CRUD Operations
- `POST /api/v1/destinations/admin` — Create destination (with hierarchy validation)
- `PATCH /api/v1/destinations/admin/:id` — Update destination
- `DELETE /api/v1/destinations/admin/:id` — Delete (with child/listing checks)

#### Safety Checks
- Cannot delete destination with children
- Cannot delete destination with associated listings
- Slug uniqueness enforced

#### Bulk Operations
- `POST /api/v1/destinations/admin/bulk-action`
- Actions: feature, unfeature
- Max 100 destinations per batch

#### Statistics
- `GET /api/v1/destinations/admin/stats`
- totalDestinations, byType, featuredCount, withContent, withCoordinates

### 7. SEO & Metadata

#### SEO Fields
- title: Custom page title (max 100 chars)
- description: Meta description (max 300 chars)
- keywords: Array of keywords (max 20)

#### Auto-Generated SEO
- If not provided, title defaults to "{name} Travel Guide - India Travel Marketplace"
- Description defaults to shortDescription or truncated description

## API Endpoints

### Public (`/api/v1/destinations`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Search/filter destinations |
| GET | `/featured` | Featured destinations |
| GET | `/nearby` | Nearby destinations (geo) |
| GET | `/hierarchy` | Full hierarchy tree |
| GET | `/map` | Map data with experiences |
| GET | `/map/state/:slug` | State-level map data |
| GET | `/slug/:slug` | Get by slug |
| GET | `/:id` | Get by ID |
| GET | `/:id/children` | Get children |
| GET | `/:id/breadcrumb` | Breadcrumb path |
| GET | `/:id/weather` | Weather info |

### Admin (`/api/v1/destinations/admin`)
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/` | MANAGE_CMS | Create destination |
| PATCH | `/:id` | MANAGE_CMS | Update destination |
| DELETE | `/:id` | MANAGE_CMS | Delete destination |
| PATCH | `/:id/content` | MANAGE_CMS | Update content |
| PATCH | `/:id/weather` | MANAGE_CMS | Update weather |
| POST | `/bulk-action` | MANAGE_CMS | Bulk feature/unfeature |
| GET | `/stats` | MANAGE_CMS | Platform stats |

## Models

### Destination Model (from Phase 3)
- Fields: name, slug, type, parentId, description, shortDescription, images, coverImage, tags, coordinates (GeoJSON), bestTimeToVisit, weather, safetyIndex, isFeatured, seo, content
- Indexes: slug (unique), coordinates (2dsphere), type+parentId, isFeatured+type, tags (multi-key), text index on name+description+tags

## Next Phase

Phase 9: Tours & Activities Module — Itinerary builder, inclusions/exclusions, group size, departure dates, difficulty ratings, safety briefings.
