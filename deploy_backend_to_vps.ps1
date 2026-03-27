# ============================================================================
# EOMS Backend Deployment Script to VPS
# ============================================================================
# Description: Deploys Django backend to VPS at 156.232.88.156
# Usage: .\deploy_backend_to_vps.ps1
# ============================================================================

param(
    [string]$VpsIp = "156.232.88.156",
    [string]$VpsUser = "root",  # Change to your VPS username
    [string]$AppDir = "/var/www/eoms",
    [switch]$SkipBuild,
    [switch]$Force
)

# Configuration
$ErrorActionPreference = "Stop"
$AppName = "eoms"
$BackendPort = 8001  # Different from COMS to avoid conflicts
$SshKey = "$env:USERPROFILE\.ssh\id_rsa"  # Path to your SSH private key

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  EOMS Backend Deployment to VPS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Function to check SSH connectivity
function Test-SshConnection {
    Write-Host "[1/8] Testing SSH connection to VPS..." -ForegroundColor Yellow
    
    $testCmd = "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${VpsUser}@${VpsIp} 'echo OK'"
    
    try {
        $result = Invoke-Expression $testCmd
        if ($result -eq "OK") {
            Write-Host "✓ SSH connection successful" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "✗ SSH connection failed: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please ensure:" -ForegroundColor Yellow
        Write-Host "  1. You have SSH access to $VpsIp" -ForegroundColor Yellow
        Write-Host "  2. SSH key is configured at: $SshKey" -ForegroundColor Yellow
        Write-Host "  3. VPS user is correct (current: $VpsUser)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To generate SSH key:" -ForegroundColor Cyan
        Write-Host "  ssh-keygen -t rsa -b 4096 -C 'your_email@example.com'" -ForegroundColor Cyan
        Write-Host "  ssh-copy-id ${VpsUser}@${VpsIp}" -ForegroundColor Cyan
        return $false
    }
}

# Function to create necessary directories on VPS
function Initialize-VpsDirectories {
    Write-Host "[2/8] Creating directories on VPS..." -ForegroundColor Yellow
    
    $commands = @(
        "mkdir -p ${AppDir}/backend",
        "mkdir -p ${AppDir}/logs",
        "mkdir -p ${AppDir}/static",
        "mkdir -p ${AppDir}/media"
    )
    
    foreach ($cmd in $commands) {
        ssh ${VpsUser}@${VpsIp} $cmd
    }
    
    Write-Host "✓ Directories created" -ForegroundColor Green
}

# Function to sync backend files
function Sync-BackendFiles {
    Write-Host "[3/8] Syncing backend files to VPS..." -ForegroundColor Yellow
    
    # Check if rsync is available
    $rsyncAvailable = Get-Command rsync -ErrorAction SilentlyContinue
    
    if ($rsyncAvailable) {
        Write-Host "Using rsync for efficient file transfer..." -ForegroundColor Cyan
        
        # Exclude unnecessary files
        rsync -avz --delete `
            --exclude='__pycache__' `
            --exclude='*.pyc' `
            --exclude='*.pyo' `
            --exclude='.git' `
            --exclude='venv' `
            --exclude='*.env' `
            --exclude='db.sqlite3' `
            --exclude='media/*' `
            --exclude='staticfiles/*' `
            ./backend/ ${VpsUser}@${VpsIp}:${AppDir}/backend/
    } else {
        Write-Host "rsync not found, using scp..." -ForegroundColor Yellow
        Write-Host "Note: Install rsync for faster deployments (winget install rsync)" -ForegroundColor Cyan
        
        # Create temporary archive
        $tempArchive = "$env:TEMP\eoms_backend_$(Get-Date -Format 'yyyyMMdd_HHmmss').tar.gz"
        
        # Use tar to create archive (requires tar in PATH)
        tar -czf $tempArchive `
            --exclude='__pycache__' `
            --exclude='*.pyc' `
            --exclude='.git' `
            --exclude='venv' `
            --exclude='*.env' `
            -C ./backend .
        
        # Copy to VPS
        scp $tempArchive ${VpsUser}@${VpsIp}:${AppDir}/backend.tar.gz
        
        # Extract on VPS
        ssh ${VpsUser}@${VpsIp} "cd ${AppDir}/backend && tar -xzf ../backend.tar.gz && rm ../backend.tar.gz"
        
        # Clean up local archive
        Remove-Item $tempArchive
    }
    
    Write-Host "✓ Backend files synced" -ForegroundColor Green
}

# Function to copy environment file
function Copy-EnvFile {
    Write-Host "[4/8] Setting up environment variables..." -ForegroundColor Yellow
    
    if (Test-Path "./backend/.env.production") {
        scp ./backend/.env.production ${VpsUser}@${VpsIp}:${AppDir}/backend/.env
        Write-Host "✓ Production .env file copied" -ForegroundColor Green
    } else {
        Write-Host "⚠ .env.production not found, creating from template..." -ForegroundColor Yellow
        
        # Create basic production .env on VPS
        $envContent = @"
DEBUG=False
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
ALLOWED_HOSTS=156.232.88.156,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://156.232.88.156:3001,http://156.232.88.156

POSTGRES_DB=eoms_db
POSTGRES_USER=eoms_user
POSTGRES_PASSWORD=change_this_password_in_production
POSTGRES_HOST=db
POSTGRES_PORT=5432

REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0

DATABASE_URL=postgresql://eoms_user:change_this_password_in_production@db:5432/eoms_db
"@
        
        $envContent | ssh ${VpsUser}@${VpsIp} "cat > ${AppDir}/backend/.env"
        
        Write-Host "⚠ IMPORTANT: Edit ${AppDir}/backend/.env on VPS to set secure passwords!" -ForegroundColor Red
    }
}

# Function to copy docker-compose.prod.yml
function Copy-DockerCompose {
    Write-Host "[5/8] Copying Docker Compose configuration..." -ForegroundColor Yellow
    
    if (Test-Path "./docker-compose.prod.yml") {
        scp ./docker-compose.prod.yml ${VpsUser}@${VpsIp}:${AppDir}/docker-compose.yml
    } else {
        Write-Host "⚠ docker-compose.prod.yml not found, will use development config" -ForegroundColor Yellow
        scp ./docker-compose.yml ${VpsUser}@${VpsIp}:${AppDir}/docker-compose.yml
    }
    
    Write-Host "✓ Docker Compose file copied" -ForegroundColor Green
}

# Function to build and start backend
function Deploy-Backend {
    Write-Host "[6/8] Building and starting backend containers..." -ForegroundColor Yellow
    
    $deployCommands = @"
cd ${AppDir}
docker-compose down backend db redis
docker-compose build backend
docker-compose up -d backend db redis
"@
    
    ssh ${VpsUser}@${VpsIp} $deployCommands
    
    Write-Host "✓ Backend containers started" -ForegroundColor Green
}

# Function to run migrations
function Run-Migrations {
    Write-Host "[7/8] Running database migrations..." -ForegroundColor Yellow
    
    ssh ${VpsUser}@${VpsIp} "cd ${AppDir} && docker-compose exec -T backend python manage.py migrate"
    
    Write-Host "✓ Migrations completed" -ForegroundColor Green
}

# Function to collect static files
function Collect-StaticFiles {
    Write-Host "[8/8] Collecting static files..." -ForegroundColor Yellow
    
    ssh ${VpsUser}@${VpsIp} "cd ${AppDir} && docker-compose exec -T backend python manage.py collectstatic --noinput"
    
    Write-Host "✓ Static files collected" -ForegroundColor Green
}

# Main deployment flow
try {
    Write-Host ""
    Write-Host "Deployment Configuration:" -ForegroundColor Cyan
    Write-Host "  VPS IP: $VpsIp" -ForegroundColor White
    Write-Host "  VPS User: $VpsUser" -ForegroundColor White
    Write-Host "  App Directory: $AppDir" -ForegroundColor White
    Write-Host "  Backend Port: $BackendPort" -ForegroundColor White
    Write-Host ""
    
    if (-not $Force) {
        $confirm = Read-Host "Continue with deployment? (yes/no)"
        if ($confirm -ne "yes") {
            Write-Host "Deployment cancelled" -ForegroundColor Yellow
            exit 0
        }
    }
    
    # Execute deployment steps
    if (-not (Test-SshConnection)) {
        exit 1
    }
    
    Initialize-VpsDirectories
    Sync-BackendFiles
    Copy-EnvFile
    Copy-DockerCompose
    Deploy-Backend
    
    Start-Sleep -Seconds 5  # Wait for containers to start
    
    Run-Migrations
    Collect-StaticFiles
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  ✓ Backend Deployment Successful!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend API: http://${VpsIp}:${BackendPort}" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Update .env file on VPS with secure credentials" -ForegroundColor White
    Write-Host "  2. Create superuser: ssh ${VpsUser}@${VpsIp} 'cd ${AppDir} && docker-compose exec backend python manage.py createsuperuser'" -ForegroundColor White
    Write-Host "  3. Deploy frontend using: .\deploy_frontend_to_vps.ps1" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "  ✗ Deployment Failed" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}
