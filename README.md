# EOMS - Events Operations Management System

EOMS is a web platform for managing event operations, committees, fundraising, approvals, and finance workflows from one dashboard.

## Core Modules

- Event dashboard (operations + finance progress)
- Committee and member management
- Subcommittees and task tracking
- Budget items, requisitions, and treasury payments
- Cluster mobilisation and contribution tracking
- Approval center (role-based)
- Reports and exports
- OTP-based authentication

## Tech Stack

### Backend
- Django 5
- Django REST Framework
- PostgreSQL
- Redis
- Celery + Celery Beat
- Gunicorn

### Frontend
- React 19 + TypeScript
- Vite
- Material UI
- React Router
- TanStack Query

### Infrastructure
- Docker + Docker Compose
- Nginx (reverse proxy in production)

## Project Structure

```text
eoms/
|- backend/                   # Django API
|  |- apps/                   # Domain apps (users, events, finance, tasks, etc.)
|  |- eoms_api/               # Django settings, urls, wsgi/asgi, celery
|  |- Dockerfile
|  |- Dockerfile.prod
|  |- requirements.txt
|- frontend/                  # React app
|  |- src/
|  |- Dockerfile
|  |- Dockerfile.prod
|  |- nginx.conf
|  |- nginx.prod.conf
|- nginx/
|  |- conf.d/default.conf     # Production reverse proxy config
|- db/
|  |- .env.example            # Postgres env template
|- docker-compose.yml         # Local development
|- docker-compose.prod.yml    # Production
|- deploy_local_to_vps.ps1    # Local-to-VPS deployment (no GitHub CI/CD)
```

## Local Development (Docker)

### Prerequisites
- Docker Desktop (or Docker Engine + Compose)
- Git

### Start services

```bash
docker compose up -d --build
```

### Run backend setup

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py collectstatic --noinput
```

### Create admin user

This project uses a custom phone-based user model.

```bash
docker compose exec backend python manage.py createsuperuser
```

You will be prompted for:
- phone
- full_name
- password

### Access URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

## Production (Docker Compose)

### 1. Prepare env files

```bash
cp backend/.env.example backend/.env
cp db/.env.example db/.env
```

Update secure values in both files.

### 2. Start production stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Run post-start commands

```bash
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
```

### 4. Create superuser

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## Deploy to VPS Without GitHub CI/CD

Deploy directly from your local workspace to server via SSH:

```powershell
./deploy_local_to_vps.ps1 -ServerIp 194.37.81.174 -Force
```

What this script does:
- packages local source code
- uploads to server
- preserves existing backend/.env and db/.env on server
- runs docker compose deploy
- runs migrate + collectstatic (unless skipped)

Optional flags:
- `-SkipBuild`
- `-SkipMigrate`

## Useful Commands

### Logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

### Restart one service

```bash
docker compose restart backend
```

### Rebuild one service

```bash
docker compose build backend
docker compose up -d backend
```

### Run arbitrary Django command

```bash
docker compose exec backend python manage.py <command>
```

## API Areas

- Auth: `/api/auth/...`
- Users: `/api/users/...`
- Committees: `/api/committees/...`
- Tasks: `/api/tasks/...`
- Finance: `/api/finance/...`
- Providers: `/api/providers/...`
- Reports: `/api/reports/...`

## Environment Variables

See templates:
- backend/.env.example
- db/.env.example

Most important values:
- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `REDIS_URL`
- `EMAIL_*`

## Notes

- Admin and API static assets are served correctly in production through the shared static volume and Nginx.
- The app uses role-based visibility, so module access depends on user role.

## Support

If you need deployment or runtime help, capture:
- `docker compose ps`
- relevant container logs
- recent command output

Then share those details for faster troubleshooting.
