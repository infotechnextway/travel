# Phase 6: Vendor Module

## Overview

Complete vendor management system including tiered onboarding workflow, multi-property/multi-tour management, dynamic pricing, inventory calendar, payout ledger, GST invoice generation, and comprehensive analytics.

## Architecture

```
Route -> Controller -> Service -> Repository -> Model
```

## Features Delivered

### 1. Vendor Onboarding Workflow

#### Tiered Onboarding Process
```
DRAFT -> Basic Info -> KYC Submitted -> Banking -> Under Review -> VERIFIED (Go Live)
```

#### Step 1: Basic Information
- `POST /api/v1/vendors/onboarding/basic`
- Fields: businessName, businessType, description, contactEmail, contactPhone, website, address, coordinates
- Creates vendor record with `verificationStatus: DRAFT`
- Prevents duplicate vendor profiles per user

#### Step 2: KYC Submission
- `POST /api/v1/vendors/onboarding/kyc`
- Fields: gstin (optional), pan (required), registrationNumber, documents array
- GSTIN uniqueness check across all vendors
- Supports multiple document types: gst_certificate, pan_card, business_registration, bank_statement, id_proof
- Status transitions to `SUBMITTED`

#### Step 3: Banking Details
- `POST /api/v1/vendors/onboarding/banking`
- Fields: bankDetails (accountHolderName, accountNumber, ifscCode, bankName, branchName, accountType), payoutSchedule
- IFSC code validation (regex: `^[A-Z]{4}0[A-Z0-9]{6}$`)
- Status transitions to `UNDER_REVIEW` if KYC was submitted

#### Step 4: Admin Review
- Admin reviews via `PATCH /api/v1/vendors/admin/:id/review`
- Can approve (VERIFIED + isActive), reject (REJECTED + isActive=false), or set under_review
- Commission rate configurable per vendor
- Review attribution: reviewedBy, reviewedAt

#### Onboarding Status Check
- `GET /api/v1/vendors/onboarding/status`
- Returns: status, stepsCompleted[], stepsPending[], canGoLive
- Steps tracked: basic_info, kyc, banking

### 2. Vendor Profile Management

#### Profile Updates
- `GET /api/v1/vendors/me` — Full vendor profile
- `PATCH /api/v1/vendors/me` — Update business info, logo, coverImage, socialLinks, address, coordinates
- Protected by `VENDOR_CREATE_LISTING` permission

#### Public Profile
- `GET /api/v1/vendors/public/:id` — Public-facing vendor profile (no auth)

### 3. Listings Management

#### Vendor Listings
- `GET /api/v1/vendors/me/listings` — All vendor listings with optional status filter
- `GET /api/v1/vendors/me/listings/stats` — Listing performance metrics
  - totalListings, byType, byStatus, publishedListings, draftListings
  - totalViews, totalWishlists

### 4. Calendar & Inventory Management

#### Update Calendar
- `PATCH /api/v1/vendors/me/listings/:id/calendar`
- Update availableDates array with date, slots, priceOverride, isBlackout
- Vendor ownership validation (listing must belong to vendor)

#### Blackout Dates
- `POST /api/v1/vendors/me/listings/:id/blackout`
- Bulk add blackout dates (slots=0, isBlackout=true)
- Useful for maintenance, holidays, seasonal closures

#### Dynamic Pricing
- `PATCH /api/v1/vendors/me/listings/:id/pricing`
- Update: basePrice, pricePerPerson, childPrice, infantPrice, taxRate, serviceFee, groupSlabs, isNegotiable
- Vendor ownership validation

### 5. Payout Management

#### Payout Model
- Fields: vendorId, bookingIds, periodStart/End, grossAmount, platformCommission, gstOnCommission, tdsAmount, netPayout
- Status: pending, processing, completed, failed, cancelled
- Invoice tracking: invoiceNumber, invoiceUrl, gstInvoiceNumber, gstInvoiceUrl
- Bank reference tracking: transactionId, bankReference

#### Payout Endpoints
- `GET /api/v1/vendors/me/payouts` — List payouts with status filter and pagination
- `GET /api/v1/vendors/me/payouts/:id` — Payout details
- `GET /api/v1/vendors/me/payouts/summary` — Financial summary
  - totalPayouts, totalEarned, totalPending, totalCommission
  - thisMonth, lastMonth, ytd (year-to-date)

### 6. Analytics & Dashboard

#### Vendor Analytics
- `GET /api/v1/vendors/me/analytics?startDate=&endDate=`
- Revenue: gross, net, commission, refunds
- Bookings: total, confirmed, completed, cancelled, conversionRate
- Listings: total, avgRating, totalReviews, topPerforming (top 5 by revenue)
- Customers: totalUnique, repeatCustomers, avgGroupSize
- Response metrics: avgResponseTimeMinutes, responseRate

#### Vendor Dashboard
- `GET /api/v1/vendors/me/dashboard`
- Consolidated view: vendor profile + stats + recent bookings + recent reviews
- Stats: totalListings, activeBookings, totalRevenue, pendingPayout, rating, responseRate
- Recent bookings: last 10
- Recent reviews: last 5

### 7. Admin Vendor Management

#### Search & Filtering
- `GET /api/v1/vendors/admin` — Admin vendor search
- Filters: verificationStatus, isActive, businessType, city, state, search (businessName/address/gstin), minRating, date range
- Pagination, sorting, ordering

#### Vendor Review Queue
- `GET /api/v1/vendors/admin/kyc-queue` — Pending KYC submissions (submitted/under_review)

#### Vendor Operations
- `GET /api/v1/vendors/admin/:id` — Vendor details
- `PATCH /api/v1/vendors/admin/:id/review` — Approve/reject with commission rate
- `PATCH /api/v1/vendors/admin/:id/commission` — Update commission rate
- `POST /api/v1/vendors/admin/:id/suspend` — Deactivate vendor
- `POST /api/v1/vendors/admin/:id/activate` — Reactivate vendor
- `POST /api/v1/vendors/admin/bulk-action` — Batch activate/deactivate/verify/suspend (max 100)

#### Statistics
- `GET /api/v1/vendors/admin/stats` — Platform-wide vendor stats
  - totalVendors, byStatus, byBusinessType, activeVendors, verifiedVendors, pendingVendors, totalRevenue, avgRating, newThisMonth

## Security & Permissions

| Endpoint | Required Permission |
|----------|---------------------|
| Onboarding | VENDOR_CREATE_LISTING |
| Profile | VENDOR_CREATE_LISTING |
| Listings | VENDOR_CREATE_LISTING |
| Calendar/Pricing | VENDOR_CREATE_LISTING |
| Payouts | VENDOR_CREATE_LISTING |
| Analytics | VENDOR_VIEW_ANALYTICS |
| Dashboard | VENDOR_CREATE_LISTING |
| Admin Search | MANAGE_VENDORS |
| Admin Review | MANAGE_VENDORS |
| Admin Commission | MANAGE_VENDORS |
| Admin Bulk | MANAGE_VENDORS |

## Models

### Payout Model
- MongoDB collection with TTL on processed payouts (optional)
- Unique invoiceNumber and gstInvoiceNumber (sparse)
- Indexes: vendorId+status, vendorId+period, status+createdAt

### Vendor Model (Updated)
- Added: onboardingNotes, adminNotes, reviewedBy, reviewedAt
- Text index on businessName + description for search
- All previous indexes maintained

## Next Phase

Phase 7: Guide Module — Guide registration, availability calendar, assignment workflow, earnings tracking.
