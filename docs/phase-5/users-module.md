# Phase 5: Users Module — Admin Management, KYC Workflow, Search & Family

## Overview

Complete user management system including customer profile enhancements (family/group travelers, document storage), admin user management with search/filtering, KYC verification workflow, and bulk operations.

## Architecture

```
Route -> Controller -> Service -> Repository -> Model
```

## Features Delivered

### 1. Customer Profile Enhancements

#### Family / Group Travelers
- **Add Family Member**: `POST /api/v1/users/me/family` — Up to 10 members per account
- **Update Family Member**: `PATCH /api/v1/users/me/family/:id`
- **Remove Family Member**: `DELETE /api/v1/users/me/family/:id`
- Fields: firstName, lastName, relationship (spouse/child/parent/sibling/friend/other), dateOfBirth, gender, passportNumber, aadhaarNumber, dietaryRestrictions, specialNeeds
- Stored as embedded subdocuments with `createdAt` timestamp

#### Document Storage (Encrypted)
- **Upload KYC Document**: `POST /api/v1/users/me/documents` — Type: aadhaar, pan, passport, driving_license, gstin
- **Remove KYC Document**: `DELETE /api/v1/users/me/documents/:id` — Cannot remove verified documents
- Maximum 5 documents per user
- Documents tracked with status: PENDING, VERIFIED, REJECTED
- Review metadata: reviewedBy, reviewedAt, rejectionReason

#### Address Management
- **Add Address**: `POST /api/v1/users/me/addresses` — With geolocation coordinates
- **Remove Address**: `DELETE /api/v1/users/me/addresses/:id`
- Default address logic: setting new default clears previous defaults

### 2. KYC Verification Workflow

#### Status Machine
```
PENDING (user uploads docs) -> UNDER_REVIEW (optional) -> VERIFIED or REJECTED
```

#### Admin KYC Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/admin/kyc-queue` | List users with pending KYC (paginated) |
| POST | `/api/v1/users/admin/:id/kyc-review` | Review and approve/reject KYC |

#### Review Process
- Admin reviews uploaded documents
- Can approve all or specific documents by ID
- Rejection requires reason (stored in kycNotes and document rejectionReason)
- Timestamps: kycSubmittedAt (user), kycReviewedAt (admin), kycReviewedBy (admin ID)
- Prevents re-review of already processed KYC

### 3. Admin User Management

#### Search & Filtering
| Method | Endpoint | Filters |
|--------|----------|---------|
| GET | `/api/v1/users/admin` | role, isActive, isVerified, kycStatus, search (name/email/phone), dateFrom/dateTo, hasKycPending |

#### Pagination & Sorting
- `page`, `limit` (max 100), `sort` (createdAt, updatedAt, lastLoginAt, profile.firstName), `order` (asc/desc)
- Returns: users array + meta (page, limit, total, totalPages)

#### User Details
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/admin/:id` | Full user profile with KYC docs, addresses, family |
| PATCH | `/api/v1/users/admin/:id` | Update role, status, KYC, notes |
| POST | `/api/v1/users/admin/:id/suspend` | Deactivate account with reason |
| POST | `/api/v1/users/admin/:id/activate` | Reactivate account |

#### Bulk Operations
| Method | Endpoint | Actions |
|--------|----------|---------|
| POST | `/api/v1/users/admin/bulk-action` | activate, deactivate, verify_kyc, reject_kyc (max 100 users) |

#### User Statistics
| Method | Endpoint | Metrics |
|--------|----------|---------|
| GET | `/api/v1/users/admin/stats` | totalUsers, byRole, byKycStatus, activeUsers, verifiedUsers, newToday, newThisWeek, newThisMonth |

### 4. Security & Permissions

All admin endpoints require:
- `authenticate` middleware (valid JWT)
- `authorize(Permission.MANAGE_USERS)` middleware

#### Admin Restrictions
- Cannot modify super_admin accounts
- Cannot suspend super_admin accounts
- Role changes logged in adminNotes
- All admin actions attributed to adminId (reviewedBy, kycReviewedBy)

### 5. Model Updates

#### User Model Enhancements
- `familyMembers`: Array of IFamilyMember subdocuments (max 10)
- `kycDocuments`: Enhanced with rejectionReason, reviewedBy, reviewedAt
- `kycSubmittedAt`, `kycReviewedAt`, `kycReviewedBy`, `kycNotes`
- `adminNotes`: Internal admin remarks
- Virtual `age`: Computed from dateOfBirth
- Additional indexes: `kycStatus + createdAt`, `isVerified + createdAt`, text search on name/email/phone, `lastLoginAt`

#### UserRepository Enhancements
- `searchUsers()`: Complex filter builder with regex search, date range, KYC pending flag
- `getKycQueue()`: Dedicated query for KYC review queue
- `getUserStats()`: Aggregation pipeline for dashboard metrics
- `findByIdWithFamily()`: Select family members explicitly

## API Endpoints Summary

### Customer Endpoints (`/api/v1/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | Any | Get profile |
| PATCH | `/me` | Any | Update profile |
| POST | `/me/addresses` | Any | Add address |
| DELETE | `/me/addresses/:id` | Any | Remove address |
| POST | `/me/family` | Any | Add family member |
| PATCH | `/me/family/:id` | Any | Update family member |
| DELETE | `/me/family/:id` | Any | Remove family member |
| POST | `/me/documents` | Any | Upload KYC document |
| DELETE | `/me/documents/:id` | Any | Remove KYC document |
| POST | `/me/avatar` | Any | Upload avatar |

### Admin Endpoints (`/api/v1/users/admin`)
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/` | MANAGE_USERS | List users with filters |
| GET | `/stats` | MANAGE_USERS | User statistics |
| GET | `/kyc-queue` | MANAGE_USERS | KYC review queue |
| GET | `/:id` | MANAGE_USERS | User details |
| PATCH | `/:id` | MANAGE_USERS | Update user |
| POST | `/:id/suspend` | MANAGE_USERS | Suspend user |
| POST | `/:id/activate` | MANAGE_USERS | Activate user |
| POST | `/:id/kyc-review` | MANAGE_USERS | Review KYC |
| POST | `/bulk-action` | MANAGE_USERS | Bulk operations |

## Validation

- `UserSearchDto`: Joi schema for admin search query parameters
- `AdminUpdateUserDto`: Joi schema for admin user updates
- `KycReviewDto`: Joi schema for KYC review (status required, rejectionReason for rejections)
- `BulkActionDto`: Joi schema for bulk actions (max 100 userIds)
- `AddFamilyMemberDto` / `UpdateFamilyMemberDto`: Joi schemas for family member CRUD

## Next Phase

Phase 6: Vendor Module — Vendor onboarding, listings management, calendar, payouts, analytics.
