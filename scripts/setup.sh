#!/bin/bash
set -e

echo "Setting up India Travel Marketplace..."

# Root dependencies
npm install

# Build shared packages
npm run build --workspace=@india-travel/shared-types

# API setup
cd services/api
npm install
cd ../..

# Web setup
cd apps/web
npm install
cd ../..

# Admin setup
cd apps/admin
npm install
cd ../..

# Vendor dashboard setup
cd apps/vendor-dashboard
npm install
cd ../..

# Flutter setup
if command -v flutter &> /dev/null; then
    cd apps/mobile
    flutter pub get
    cd ../..
    echo "Flutter dependencies installed"
else
    echo "Flutter not found. Skipping mobile setup."
fi

echo "Setup complete!"
echo "Run 'docker-compose -f infra/docker/docker-compose.yml up' to start infrastructure"
