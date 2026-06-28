# Phase 4: Authentication Module

## Overview

Complete authentication and authorization system for the India Travel Marketplace. Implements JWT-based sessions, OTP login, social authentication (Google/Apple), role-based access control (RBAC), multi-factor authentication (MFA), KYC document management, and comprehensive security measures.

## Architecture

```
Route -> Controller -> Service -> Repository -> Model
```

### Dependency Injection Container
All services are wired in `src/shared/container.ts` for testability and clean architecture.

## Modules

### Auth Module (`src/modules/auth/`)

| Component | Responsibility |
|-----------|--------------|
| `AuthService` | Core auth logic: register, login, refresh, OTP, password reset, MFA |
| `SocialAuthService` | Google & Apple OAuth token verification and account linking |
| `AuthController` | HTTP request/response handling for auth endpoints |
| `AuthRoutes` | Route definitions with validation and rate limiting |
| `RefreshToken` | MongoDB model for refresh token persistence with TTL |
| `OTP` | MongoDB model for SMS OTP storage with expiry and attempt tracking |
| `Passport` | Passport.js strategies for Google & Apple OAuth |

### Users Module (`src/modules/users/`)

| Component | Responsibility |
|-----------|--------------|
| `UserService` | Profile management, addresses, KYC documents, avatar |
| `UserRepository` | Data access layer extending BaseRepository |
| `UserController` | HTTP request/response handling for user endpoints |
| `UserRoutes` | Protected route definitions with validation |

## Authentication Flows

### 1. Email/Password Registration & Login
- **Register**: `POST /api/v1/auth/register` — Validates email uniqueness, phone uniqueness, password strength, hashes password with bcrypt (12 rounds), creates user with PENDING KYC.
- **Login**: `POST /api/v1/auth/login` — Accepts email OR phone, verifies password, checks account status, handles login attempt lockout (5 attempts = 2-hour lock), issues JWT access (15min) + refresh (7day) tokens.
- **Refresh**: `POST /api/v1/auth/refresh` — Validates refresh token from DB, revokes old token, issues new pair.
- **Logout**: `POST /api/v1/auth/logout` — Revokes single refresh token.
- **Logout All**: `POST /api/v1/auth/logout-all` — Revokes all refresh tokens for user.

### 2. OTP Login
- **Send OTP**: `POST /api/v1/auth/otp/send` — Generates 6-digit code, stores in MongoDB with 10-min expiry, 5 requests/hour limit.
- **Verify OTP**: `POST /api/v1/auth/otp/verify` — Validates code (max 3 attempts), auto-registers new users if phone not found.

### 3. Social Authentication
- **Google**: `POST /api/v1/auth/social/google` — Verifies access token with Google API, links to existing account by email, or creates new user with placeholder phone.
- **Apple**: `POST /api/v1/auth/social/apple` — Verifies Apple ID token (JWT decode), links to existing account by email, or creates new user.

### 4. Password Reset
- **Forgot**: `POST /api/v1/auth/forgot-password` — Generates 1-hour JWT reset token, sends email (dev mode logs to console).
- **Reset**: `POST /api/v1/auth/reset-password` — Verifies token, updates password hash.
- **Change**: `POST /api/v1/auth/change-password` — Authenticated endpoint, verifies old password before update.

### 5. Multi-Factor Authentication (MFA)
- **Setup**: `POST /api/v1/auth/mfa/setup` — Generates TOTP secret, returns QR code data URL. Stores secret (not yet enabled).
- **Verify Setup**: `POST /api/v1/auth/mfa/verify` — Validates first TOTP code, enables MFA.
- **MFA Login**: `POST /api/v1/auth/mfa/login` — Validates TOTP after initial password login, issues tokens.

## RBAC (Role-Based Access Control)

### Roles & Permissions

| Role | Permissions |
|------|-------------|
| `customer` | `view_dashboard` |
| `vendor` | `view_dashboard`, `vendor_create_listing`, `vendor_manage_bookings`, `vendor_view_analytics` |
| `guide` | `view_dashboard`, `guide_view_assignments`, `guide_update_availability` |
| `admin` | `view_dashboard`, `manage_users`, `manage_vendors`, `manage_guides`, `manage_listings`, `manage_bookings`, `manage_reviews`, `manage_support`, `manage_cms` |
| `super_admin` | All permissions |

### Middleware
- `authenticate` — Verifies JWT access token from `Authorization: Bearer <token>` header.
- `authorize(...permissions)` — Checks if authenticated user has at least one required permission.
- `optionalAuth` — Attempts authentication but continues regardless (for public endpoints with personalized content).

## Security Measures

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcrypt, 12 rounds |
| JWT Secrets | Separate access/refresh secrets, 15min/7day expiry |
| Login Lockout | 5 failed attempts = 2-hour lock |
| Rate Limiting | General: 100/15min, Auth: 10/15min, OTP: 5/hour, Password Reset: 3/hour |
| Field Encryption | AES-256-GCM for PII (Aadhaar, passport, etc.) |
| CORS | Whitelist with credentials |
| Helmet | Security headers |
| Input Validation | Joi schemas on all endpoints |
| Error Handling | Standardized JSON error responses, no stack traces in production |

## KYC Management

- **Upload**: `POST /api/v1/users/me/documents` — Accepts document type (aadhaar, pan, passport, driving_license, gstin) and URL.
- **Status**: Automatically sets `kycStatus` to `PENDING` on new upload.
- **Verification**: Admin review endpoint (Phase 11) will update status to `VERIFIED` or `REJECTED`.

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/register` | No | General | Register with email/phone/password |
| POST | `/login` | No | Auth | Login with email/phone + password |
| POST | `/refresh` | No | General | Rotate access token |
| POST | `/logout` | Yes | — | Revoke refresh token |
| POST | `/logout-all` | Yes | — | Revoke all refresh tokens |
| POST | `/otp/send` | No | OTP | Send SMS OTP |
| POST | `/otp/verify` | No | General | Verify OTP and login |
| POST | `/social/google` | No | General | Google OAuth login |
| POST | `/social/apple` | No | General | Apple OAuth login |
| POST | `/forgot-password` | No | Password Reset | Request password reset |
| POST | `/reset-password` | No | General | Reset password with token |
| POST | `/change-password` | Yes | — | Change password (authenticated) |
| POST | `/mfa/setup` | Yes | — | Generate MFA secret & QR code |
| POST | `/mfa/verify` | Yes | — | Verify MFA and enable |

### Users (`/api/v1/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | Yes | Get current user profile |
| PATCH | `/me` | Yes | Update profile |
| POST | `/me/addresses` | Yes | Add address |
| DELETE | `/me/addresses/:id` | Yes | Remove address |
| POST | `/me/documents` | Yes | Upload KYC document |
| POST | `/me/avatar` | Yes | Upload avatar URL |

## Models Updated

### User Model
- Added `socialAccounts` field (google/apple subdocuments) with sparse unique indexes.
- Added `twoFactorSecret` (select: false) and `twoFactorEnabled`.
- Pre-save hook hashes password with bcrypt (12 rounds).
- Instance methods: `comparePassword`, `incrementLoginAttempts`.

### Refresh Token Model
- Fields: `userId`, `token` (unique), `expiresAt`, `isRevoked`, `createdByIp`, `userAgent`.
- TTL index on `expiresAt` for automatic cleanup.
- Compound index on `userId` + `isRevoked`.

### OTP Model
- Fields: `phone`, `code`, `expiresAt`, `attempts`, `isUsed`.
- TTL index on `expiresAt` for automatic cleanup.
- Max 3 attempts per OTP before invalidation.

## Next Phase

Phase 5: Users Module (Admin user management, KYC verification workflow, user search and filtering).
