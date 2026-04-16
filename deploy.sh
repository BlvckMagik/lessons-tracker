#!/bin/bash
set -e

echo "🔄 Pulling latest changes..."
git pull origin main

echo "🏗️  Rebuilding and restarting containers..."
docker compose up -d --build

echo "🧹 Removing unused Docker images..."
docker image prune -f

echo "✅ Deploy complete!"
docker compose ps
