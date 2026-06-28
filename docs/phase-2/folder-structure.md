# Phase 2: Folder Structure

## Overview

Complete monorepo structure established using npm workspaces and Turborepo for build orchestration.

## Structure Summary

```
india-travel-marketplace/
├── .github/workflows/          # CI/CD pipelines
├── apps/
│   ├── web/                    # Next.js 14 Customer Website
│   ├── admin/                  # Next.js 14 Admin Dashboard
│   ├── vendor-dashboard/       # Next.js 14 Vendor Portal
│   └── mobile/                 # Flutter App
├── services/
│   └── api/                    # Node.js Express API
├── packages/
│   └── shared-types/           # Common TypeScript definitions
├── infra/
│   ├── docker/                 # Dockerfiles & Compose
│   └── nginx/                  # Reverse proxy configuration
├── docs/                       # Phase-wise documentation
├── assets/                     # Shared static assets
└── scripts/                    # Setup & utility scripts
```

## Build Verification

- All Next.js applications configured with TypeScript, Tailwind CSS, and App Router
- Express API configured with TypeScript, path aliases, and Jest testing framework
- Flutter app configured with GoRouter, BLoC dependencies, and multi-platform support
- Docker multi-stage builds optimized for production deployment
- Nginx reverse proxy configured with rate limiting and upstream routing
- GitHub Actions workflows configured for CI (lint, typecheck, test, build) and CD (staging, production)

## Environment Configuration

- Root `.env.example` with all required variables
- Service-level `.env.example` files for local development
- Docker Compose orchestration for local infrastructure (MongoDB, Redis, Nginx)

## Next Phase

Phase 3: MongoDB Atlas Schemas, Indexes, Relationships, Atlas Search, Geo Indexes, and Validation.
