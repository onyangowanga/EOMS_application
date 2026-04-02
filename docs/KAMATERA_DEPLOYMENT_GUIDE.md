# EOMS — Kamatera Production Deployment Guide

## Overview

This guide walks you through deploying the EOMS app on a **Kamatera** cloud server from scratch.

**What gets deployed:**
| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL 16 | `eoms_db` | internal only |
| Redis 7 | `eoms_redis` | internal only |
| Django/Gunicorn | `eoms_backend` | internal only |
| Celery worker | `eoms_celery` | — |
| Celery beat | `eoms_celery_beat` | — |
| React/Nginx | `eoms_frontend` | **80** (public) |

The frontend Nginx container handles all public traffic on port 80: serving the React SPA for UI routes and reverse-proxying `/api/` to the backend container. No system-level Nginx is needed.

---

## Step 1 — Create a Kamatera Server

1. Log in to [console.kamatera.com](https://console.kamatera.com)
2. Click **Create New Server**
3. Choose these specs (minimum):
   - **OS:** Ubuntu 22.04 LTS (64-bit)
   - **CPU:** 2 vCores
   - **RAM:** 4 GB
   - **Disk:** 40 GB SSD
   - **Network:** 1 public IP
4. Set a root password or, better, **add your SSH public key** during creation
5. Note the server's **public IP address** after creation

> **Tip:** Kamatera's "B" series (burstable) is cost-effective for moderate traffic.

---

## Step 2 — Configure SSH Key (Local Machine)

If you don't have an SSH key yet:

```powershell
# Generate key (run once)
ssh-keygen -t ed25519 -C "eoms-kamatera"

# Copy public key to the server
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@YOUR_SERVER_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# Test connection
ssh root@YOUR_SERVER_IP "echo connected"
```

---

## Step 3 — Run the Deployment Script

From your local machine (in the project root):

```powershell
# First-time full deployment (provisions Docker, clones repo, builds containers)
.\deploy_to_kamatera.ps1 -ServerIp "YOUR_SERVER_IP"
```

The script will stop at **Step 4** if there is no `.env` file on the server. That is expected — see Step 4 below.

---

## Step 4 — Create the Production .env File

SSH into the server and create the environment file:

```bash
ssh root@YOUR_SERVER_IP
cd /opt/eoms

cp .env.production.example .env
nano .env
```

Fill in every `<CHANGE_THIS>` value:

| Variable | What to put |
|----------|-------------|
| `SECRET_KEY` | Run `python3 -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DB_PASSWORD` | A strong random password (min 24 chars) |
| `ALLOWED_HOSTS` | `YOUR_SERVER_IP` and/or your domain |
| `CORS_ALLOWED_ORIGINS` | `http://YOUR_SERVER_IP` (add `https://yourdomain.com` when SSL is set up) |
| `CSRF_TRUSTED_ORIGINS` | Same as CORS_ALLOWED_ORIGINS |
| `EMAIL_HOST_USER` | Your Gmail address |
| `EMAIL_HOST_PASSWORD` | Gmail App Password (not your real password) |
| `AFRICAS_TALKING_*` | Your Africa's Talking credentials |

**Gmail App Password:**
1. Google Account → Security → 2-Step Verification → App passwords
2. Create one named "EOMS"
3. Paste the 16-char code as `EMAIL_HOST_PASSWORD`

Save and exit nano: `Ctrl+O` → `Enter` → `Ctrl+X`

---

## Step 5 — Complete the Deployment

Back on your local machine, re-run the script (skip server provisioning since it's done):

```powershell
.\deploy_to_kamatera.ps1 -ServerIp "YOUR_SERVER_IP" -SkipProvision
```

This will:
1. Pull the latest code from GitHub
2. Build all Docker images
3. Start all 6 containers
4. Apply database migrations
5. Collect static files
6. Print health check results

---

## Step 6 — Create a Superuser

SSH into the server and create the admin account:

```bash
ssh root@YOUR_SERVER_IP
cd /opt/eoms
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

---

## Step 7 — Verify the Deployment

Open a browser and check:

| URL | Expected |
|-----|----------|
| `http://YOUR_SERVER_IP/` | EOMS login page |
| `http://YOUR_SERVER_IP/api/` | DRF browsable API |
| `http://YOUR_SERVER_IP/api/admin/` | Django admin login |

---

## Step 8 — (Optional) Add a Domain + HTTPS

If you have a domain name pointing to your server:

### 8a. Point DNS

Add an **A record** in your DNS provider:
```
@   A   YOUR_SERVER_IP
www A   YOUR_SERVER_IP
```

### 8b. Install Certbot on the server

```bash
ssh root@YOUR_SERVER_IP

apt install -y certbot python3-certbot-nginx

# Stop the frontend container temporarily (frees port 80)
cd /opt/eoms
docker compose -f docker-compose.prod.yml stop frontend

# Obtain certificate
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Note the cert paths, they'll be like:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### 8c. Create HTTPS nginx.conf

Create `frontend/nginx.https.conf` by copying `frontend/nginx.conf` and adding an SSL server block. Then update `docker-compose.prod.yml` to mount the cert directory and expose port 443.

A minimal HTTPS addition to `nginx.conf`:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ... keep all existing location blocks from nginx.conf
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

### 8d. Update .env for HTTPS

```bash
nano /opt/eoms/.env
```

Update these lines:
```
ALLOWED_HOSTS=YOUR_SERVER_IP,yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Then rebuild:
```bash
cd /opt/eoms
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Re-deploying Updates

Whenever you push new code to GitHub, run from your local machine:

```powershell
.\deploy_to_kamatera.ps1 -ServerIp "YOUR_SERVER_IP" -SkipProvision -Update
```

This pulls the latest code, rebuilds changed images, applies new migrations, and restarts containers with zero-downtime rolling restarts.

---

## Useful Commands (on the server)

```bash
cd /opt/eoms

# View all container statuses
docker compose -f docker-compose.prod.yml ps

# Follow all logs
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Follow backend logs only
docker compose -f docker-compose.prod.yml logs -f backend

# Restart a single service (e.g., after .env change)
docker compose -f docker-compose.prod.yml restart backend

# Run a Django management command
docker compose -f docker-compose.prod.yml exec backend python manage.py <command>

# Open a Django shell
docker compose -f docker-compose.prod.yml exec backend python manage.py shell

# Backup the database
docker compose -f docker-compose.prod.yml exec db pg_dump -U eoms eoms > backup_$(date +%Y%m%d).sql

# Stop everything
docker compose -f docker-compose.prod.yml down

# Full restart (keeps data volumes)
docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d
```

---

## Firewall Reference

Ports opened by the deployment script:

| Port | Purpose |
|------|---------|
| 22 | SSH |
| 80 | HTTP (EOMS — frontend + API proxy) |
| 443 | HTTPS (when SSL configured) |

All other ports are closed. The backend (8000), database (5432), and Redis (6379) are only accessible between containers on the internal Docker network.

---

## Troubleshooting

### Containers restart-looping
```bash
docker compose -f docker-compose.prod.yml logs backend --tail=50
```
Common causes: missing/wrong `.env` variable, database not ready yet (wait a few seconds and retry).

### 502 Bad Gateway from nginx
The backend container isn't ready yet. Check:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend
```

### Database migration errors
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py showmigrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Can't receive OTP emails
Verify Gmail App Password is correct and 2-Step Verification is enabled on the Gmail account. Test with:
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py shell -c "
from django.core.mail import send_mail
send_mail('Test', 'Hello', None, ['your@email.com'])
print('sent')
"
```
