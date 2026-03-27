# ============================================================================
# EOMS VPS Deployment Guide
# ============================================================================

## 📋 Overview

This guide helps you deploy the EOMS application to your VPS at **156.232.88.156** alongside your existing COMS application.

**Port Configuration:**
- COMS (existing): Port 80
- EOMS Frontend: Port 3001
- EOMS Backend: Port 8001

---

## 🔧 Prerequisites

### 1. Local Machine Requirements

- **PowerShell** (Windows 10/11 built-in)
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **SSH Client** (built-in on Windows 10+)
- **Git** (for version control)
- **Optional: rsync** for faster deployments
  ```powershell
  winget install rsync
  ```

### 2. VPS Requirements

Your VPS should have:
- **Ubuntu 20.04+** or similar Linux distribution
- **Docker** and **Docker Compose** installed
- **Nginx** for serving frontend
- **SSH access** configured
- **Minimum 2GB RAM** and 20GB disk space

---

## 🚀 Initial Setup (One-Time)

### Step 1: Generate SSH Key (if you don't have one)

```powershell
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy public key to VPS
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@156.232.88.156 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Test connection
ssh root@156.232.88.156 "echo 'Connection successful!'"
```

### Step 2: Install Docker on VPS

```bash
# SSH into your VPS
ssh root@156.232.88.156

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Install Nginx on VPS

```bash
# Still on VPS
apt update
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Check status
systemctl status nginx
```

### Step 4: Configure Firewall

```bash
# Allow necessary ports
ufw allow 80/tcp      # COMS (existing)
ufw allow 3001/tcp    # EOMS Frontend
ufw allow 8001/tcp    # EOMS Backend API
ufw allow 22/tcp      # SSH
ufw enable
```

---

## 📦 Deployment Process

### Option A: Deploy Both (Backend + Frontend)

```powershell
# From your local EOMS directory
cd "C:\programing\Realtime projects\EOMS\eoms"

# 1. Deploy backend first
.\deploy_backend_to_vps.ps1

# Wait for backend to be ready (about 30 seconds)
Start-Sleep -Seconds 30

# 2. Deploy frontend
.\deploy_frontend_to_vps.ps1

# 3. Verify deployment
Start-Process "http://156.232.88.156:3001"
```

### Option B: Deploy Individually

**Backend Only:**
```powershell
.\deploy_backend_to_vps.ps1
```

**Frontend Only:**
```powershell
.\deploy_frontend_to_vps.ps1
```

**With custom parameters:**
```powershell
# Deploy to different user
.\deploy_backend_to_vps.ps1 -VpsUser myuser

# Skip local build (use existing dist/)
.\deploy_frontend_to_vps.ps1 -SkipBuild

# Force deployment without confirmation
.\deploy_backend_to_vps.ps1 -Force
```

---

## 🔐 Post-Deployment Configuration

### 1. Update Production Environment Variables

```bash
# SSH into VPS
ssh root@156.232.88.156

# Edit .env file
nano /var/www/eoms/backend/.env
```

**Update these critical values:**
```bash
SECRET_KEY=<generate using: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'>
POSTGRES_PASSWORD=<strong_password_here>
DATABASE_URL=postgresql://eoms_user:<strong_password_here>@db:5432/eoms_production
```

**Restart backend after changes:**
```bash
cd /var/www/eoms
docker-compose restart backend
```

### 2. Create Django Superuser

```bash
# SSH into VPS
ssh root@156.232.88.156

# Create superuser
cd /var/www/eoms
docker-compose exec backend python manage.py createsuperuser
```

Follow prompts to create admin account.

### 3. Test OTP Sending (SMS)

If using Africa's Talking for SMS OTP:

```bash
# Update SMS credentials in .env
nano /var/www/eoms/backend/.env

# Add:
# AFRICAS_TALKING_USERNAME=your_username
# AFRICAS_TALKING_API_KEY=your_api_key

# Restart backend
docker-compose restart backend
```

---

## 🌐 Nginx Reverse Proxy (Optional - Recommended)

To serve both apps on port 80 with different paths:

```bash
# SSH into VPS
ssh root@156.232.88.156

# Create master nginx config
cat > /etc/nginx/sites-available/apps <<'EOF'
server {
    listen 80 default_server;
    server_name 156.232.88.156;
    
    # COMS - existing app at root
    location / {
        proxy_pass http://localhost:YOUR_COMS_PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # EOMS Frontend at /eoms
    location /eoms {
        alias /var/www/eoms/frontend;
        try_files $uri $uri/ /eoms/index.html;
    }
    
    # EOMS API at /eoms-api
    location /eoms-api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable config
ln -sf /etc/nginx/sites-available/apps /etc/nginx/sites-enabled/apps
rm /etc/nginx/sites-enabled/default

# Test and reload
nginx -t
systemctl reload nginx
```

**Access:**
- COMS: http://156.232.88.156/
- EOMS: http://156.232.88.156/eoms
- EOMS API: http://156.232.88.156/eoms-api

---

## 🔄 Re-Deployment (Updates)

When you make code changes:

```powershell
# 1. Commit changes locally
git add .
git commit -m "Your changes"

# 2. Deploy backend changes
.\deploy_backend_to_vps.ps1

# 3. Deploy frontend changes
.\deploy_frontend_to_vps.ps1 -SkipBuild  # Builds locally first
```

---

## 🛠️ Troubleshooting

### Backend not accessible

```bash
# Check backend logs
ssh root@156.232.88.156
cd /var/www/eoms
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Frontend shows blank page

```bash
# Check if files were copied
ssh root@156.232.88.156
ls -la /var/www/eoms/frontend/

# Check nginx logs
tail -f /var/log/nginx/error.log

# Rebuild frontend with correct API URL
# On local machine:
.\deploy_frontend_to_vps.ps1 -BackendUrl "http://156.232.88.156:8001"
```

### Database connection errors

```bash
# Check if database container is running
ssh root@156.232.88.156
cd /var/www/eoms
docker-compose ps

# View database logs
docker-compose logs db

# Recreate database if needed
docker-compose down db
docker-compose up -d db
docker-compose exec backend python manage.py migrate
```

### Cannot SSH to VPS

```powershell
# Test basic connectivity
Test-Connection -ComputerName 156.232.88.156 -Count 4

# Verify SSH service on VPS (ask VPS provider)
# Use password authentication temporarily
ssh -o PreferredAuthentications=password root@156.232.88.156
```

---

## 📊 Monitoring

### Check all containers

```bash
ssh root@156.232.88.156
cd /var/www/eoms
docker-compose ps
```

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f db
```

### Check disk space

```bash
df -h
docker system df
```

### Monitor resource usage

```bash
docker stats
```

---

## 🔒 Security Recommendations

1. **Change default passwords** in `.env.production`
2. **Enable firewall** (ufw) with only necessary ports
3. **Use HTTPS** (Let's Encrypt SSL) for production
4. **Regular backups** of database:
   ```bash
   docker-compose exec db pg_dump -U eoms_user eoms_production > backup_$(date +%Y%m%d).sql
   ```
5. **Keep Docker images updated**:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify network connectivity
3. Ensure ports are open in firewall
4. Check Docker disk space
5. Review Nginx configuration

---

## 📚 Quick Reference

**Deployment Scripts:**
- `deploy_backend_to_vps.ps1` - Deploy Django backend
- `deploy_frontend_to_vps.ps1` - Deploy React frontend

**VPS Directories:**
- `/var/www/eoms/` - Main application directory
- `/var/www/eoms/backend/` - Django backend code
- `/var/www/eoms/frontend/` - React build files
- `/var/www/eoms/logs/` - Application logs

**URLs:**
- Frontend: http://156.232.88.156:3001
- Backend API: http://156.232.88.156:8001
- Admin Panel: http://156.232.88.156:8001/admin

**Common Commands:**
```bash
# Restart services
cd /var/www/eoms && docker-compose restart

# View logs
cd /var/www/eoms && docker-compose logs -f backend

# Run migrations
cd /var/www/eoms && docker-compose exec backend python manage.py migrate

# Create superuser
cd /var/www/eoms && docker-compose exec backend python manage.py createsuperuser
```
