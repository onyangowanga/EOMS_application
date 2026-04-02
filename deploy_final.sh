#!/bin/bash
# Setup missing files and run final deployment
APPDIR=/opt/eoms
LOG=/tmp/deploy3.log

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

log "=== Final Deployment (with all missing files) ==="

# Create missing directories
mkdir -p "$APPDIR/nginx/conf.d"
mkdir -p "$APPDIR/db"
log "Directories created"

# Copy db/.env if not there
if [ ! -f "$APPDIR/db/.env" ]; then
    cp /tmp/db.env "$APPDIR/db/.env" 2>/dev/null || cp "$APPDIR/db/.env.example" "$APPDIR/db/.env"
    log "db/.env restored"
fi

# Copy nginx config from temp if it arrived
if [ -f /tmp/nginx_default.conf ]; then
    cp /tmp/nginx_default.conf "$APPDIR/nginx/conf.d/default.conf"
    log "nginx/conf.d/default.conf copied"
fi

log "Files in place. Cleaning up old containers and volumes..."
cd "$APPDIR"
docker compose -f docker-compose.prod.yml down --remove-orphans 2>&1 | tee -a "$LOG" || true
docker volume rm eoms_postgres_data 2>&1 | tee -a "$LOG" || true

log "Starting all containers..."
docker compose -f docker-compose.prod.yml up -d 2>&1 | tee -a "$LOG"

log "Waiting 90s for Postgres to initialise..."
sleep 90

log "Checking status..."
docker compose -f docker-compose.prod.yml ps 2>&1 | tee -a "$LOG"

# Check if backend is running before migrations
if docker compose -f docker-compose.prod.yml ps backend | grep -q "Up"; then
    log "Running migrations..."
    docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput 2>&1 | tee -a "$LOG"
    log "Collecting static files..."
    docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput 2>&1 | tee -a "$LOG"
else
    log "WARNING: backend container not running. Check logs above."
    docker logs eoms-backend --tail 30 2>&1 | tee -a "$LOG" || true
fi

log "=== Final status ==="
docker compose -f docker-compose.prod.yml ps 2>&1 | tee -a "$LOG"
log "=== Done. Site: http://194.37.81.174/ ==="
