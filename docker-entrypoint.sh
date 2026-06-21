#!/bin/sh
# On first run, seed the persistent volume from the template DB baked into the
# image at build time (settings + factories, no sample activities). Existing
# volumes are never overwritten, so user data survives restarts/upgrades.
set -e

mkdir -p /data
if [ ! -f /data/app.db ]; then
  echo "First run: seeding /data/app.db from template..."
  cp /app/seed.db /data/app.db
fi

exec "$@"
