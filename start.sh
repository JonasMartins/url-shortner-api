#!/bin/sh

# Exit on error
set -e

./wait-for.sh "${DB_HOST}:${DB_PORT}" --timeout=60 -- echo "Database is ready"

echo "🎯 Starting production server..."
exec node dist/src/main