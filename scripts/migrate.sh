#!/bin/bash
set -e

echo "Running database migrations..."
cd services/api
npx tsx src/seeds/migrate.ts
cd ../..
echo "Migration complete"
