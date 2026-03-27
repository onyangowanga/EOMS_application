# EOMS Docker Deployment Guide

Complete guide for deploying EOMS (Backend + Frontend) with Docker.

## Architecture

```
┌─────────────┐
│   Nginx     │ ← Port 80 (Production)
│  (Frontend) │
└──────┬──────┘
       │ Proxy /api/
       ↓
┌─────────────┐     ┌──────────┐     ┌─────────┐
│   Django    │────→│PostgreSQL│     │  Redis  │
│  (Backend)  │     │   (DB)   │     │ (Cache) │
└──────┬──────┘     └──────────┘     └────┬────┘
       │                                    │
       ↓                                    │
┌─────────────┐                            │
│   Celery    │←───────────────────────────┘
│   Workers   │
└─────────────┘
```

## Quick Start

### Development Mode

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up backend
docker-compose up frontend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down
```

**Services Available:**
- Frontend: http://localhost:5173 (Vite dev server)
- Backend API: http://localhost:8000
- Database: localhost:5432
- Redis: localhost:6379

### Production Mode

```bash
# 1. Create production environment file
cp .env.prod.example .env.prod
# Edit .env.prod with your values

# 2. Build all services
docker-compose -f docker-compose.prod.yml build

# 3. Run database migrations
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate

# 4. Create superuser
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py createsuperuser

# 5. Collect static files
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput

# 6. Start all services
docker-compose -f docker-compose.prod.yml up -d

# 7. View logs
docker-compose -f docker-compose.prod.yml logs -f

# 8. Stop all services
docker-compose -f docker-compose.prod.yml down
```

**Services Available:**
- Frontend + API: http://localhost:80 (Nginx)
- Admin Panel: http://localhost:80/admin/

## Docker Compose Files

### docker-compose.yml (Development)
- Hot reload enabled for frontend and backend
- Source code mounted as volumes
- Debug mode enabled
- Exposed ports for direct access

### docker-compose.prod.yml (Production)
- Optimized builds (multi-stage)
- Gunicorn WSGI server (4 workers)
- Nginx serving frontend + API proxy
- No exposed internal ports
- Health checks enabled
- Restart policies configured

## Service Details

### Frontend Service

**Development:**
```yaml
- Build target: development
- Command: npm run dev --host 0.0.0.0
- Port: 5173
- Hot reload: Yes
- Volume: ./frontend:/app
```

**Production:**
```yaml
- Build target: production
- Server: Nginx 1.25
- Port: 80
- Features: 
  - Gzip compression
  - Asset caching
  - API proxy
  - Security headers
```

### Backend Service

**Development:**
```yaml
- Command: python manage.py runserver 0.0.0.0:8000
- Port: 8000
- Debug: True
- Volume: ./backend:/app
```

**Production:**
```yaml
- Command: gunicorn --workers 4 --bind 0.0.0.0:8000
- Port: 8000 (internal)
- Debug: False
- Workers: 4
```

### Database Service
```yaml
- Image: postgres:16-alpine
- Port: 5432 (dev), internal (prod)
- Volume: postgres_data
- Health check: pg_isready
```

### Redis Service
```yaml
- Image: redis:7-alpine
- Port: 6379 (dev), internal (prod)
- Health check: redis-cli ping
```

### Celery Workers
```yaml
- Worker: Async task processing
- Beat: Scheduled task scheduler
- Depends on: backend, redis, db
```

## Common Commands

### Development

```bash
# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Restart service
docker-compose restart backend

# Execute commands in container
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py makemigrations
docker-compose exec frontend npm install <package>

# View service status
docker-compose ps

# Remove all containers and volumes
docker-compose down -v
```

### Production

```bash
# Update and restart services
docker-compose -f docker-compose.prod.yml up -d --build

# Apply new migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create new superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Backup database
docker-compose -f docker-compose.prod.yml exec db pg_dump -U eoms eoms > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T db psql -U eoms eoms < backup.sql

# View resource usage
docker stats
```

## Environment Variables

### Backend (.env.prod)
```env
SECRET_KEY=<random-50-char-string>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
DB_PASSWORD=<secure-password>
```

### Frontend
```env
VITE_API_URL=/api  # Production (proxied)
VITE_API_URL=http://localhost:8000/api  # Development
```

## Networking

### Development
- Each service is accessible on localhost
- Frontend calls backend directly (CORS enabled)

### Production
- All services in `eoms_network` bridge
- Only Nginx exposed on port 80
- Frontend → Nginx → Backend (internal routing)
- No CORS needed (same origin)

## Volumes

```yaml
postgres_data: Database persistence
media_files: User uploaded files
static_files: Django static assets (CSS, JS, admin)
```

## Health Checks

All production services have health checks:
- **Frontend**: `wget http://localhost:80/health`
- **Database**: `pg_isready -U eoms`
- **Redis**: `redis-cli ping`

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs <service>

# Check if port is in use
netstat -ano | findstr :5173
netstat -ano | findstr :8000

# Remove and rebuild
docker-compose down
docker-compose build --no-cache <service>
docker-compose up
```

### Database connection errors
```bash
# Wait for DB to be healthy
docker-compose ps

# Check DB logs
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up db
```

### Frontend can't connect to backend
```bash
# Development: Check VITE_API_URL in docker-compose.yml
# Production: Check nginx.conf proxy_pass configuration

# Test API directly
curl http://localhost:8000/api/auth/login/
```

### Permission errors
```bash
# Fix file permissions (Linux/Mac)
sudo chown -R $USER:$USER ./backend
sudo chown -R $USER:$USER ./frontend

# Fix in Windows
icacls ./backend /grant Everyone:F /T
icacls ./frontend /grant Everyone:F /T
```

## Production Deployment Checklist

- [ ] Copy `.env.prod.example` to `.env.prod`
- [ ] Set secure `SECRET_KEY` (50+ random characters)
- [ ] Set strong `DB_PASSWORD`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Configure `CORS_ALLOWED_ORIGINS`
- [ ] Build images: `docker-compose -f docker-compose.prod.yml build`
- [ ] Run migrations: `docker-compose -f docker-compose.prod.yml run backend python manage.py migrate`
- [ ] Create superuser
- [ ] Collect static files
- [ ] Test health endpoints
- [ ] Configure SSL/TLS (use nginx reverse proxy or cloud load balancer)
- [ ] Setup database backups
- [ ] Configure monitoring/logging
- [ ] Test complete user workflow

## Scaling

### Horizontal Scaling
```bash
# Scale backend workers
docker-compose -f docker-compose.prod.yml up -d --scale backend=3 --scale celery=2

# Use load balancer (nginx, traefik) in front
```

### Vertical Scaling
- Increase container resources in docker-compose.yml:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Monitoring

```bash
# View resource usage
docker stats

# Export logs
docker-compose logs > logs.txt

# Monitor specific service
docker-compose logs -f --tail=100 backend
```

## Security Best Practices

1. **Never commit `.env.prod` to git** (use `.env.prod.example`)
2. Use strong passwords for database
3. Keep SECRET_KEY truly secret (50+ random chars)
4. Set `DEBUG=False` in production
5. Configure proper `ALLOWED_HOSTS`
6. Use HTTPS in production (SSL/TLS)
7. Regular security updates: `docker-compose pull && docker-compose up -d`
8. Limit container resources
9. Use non-root users in containers (already configured)
10. Regular database backups

## Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Django Deployment](https://docs.djangoproject.com/en/5.0/howto/deployment/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [Nginx Configuration](https://nginx.org/en/docs/)
