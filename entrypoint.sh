#!/bin/sh
set -e

echo "⏳ Running Prisma schema sync..."
node node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --skip-generate
echo "✅ Database ready"

echo "🚀 Starting Next.js..."
exec node server.js
