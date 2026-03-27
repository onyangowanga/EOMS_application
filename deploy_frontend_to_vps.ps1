# ============================================================================
# EOMS Frontend Deployment Script to VPS
# ============================================================================
# Description: Deploys React frontend to VPS at 156.232.88.156
# Usage: .\deploy_frontend_to_vps.ps1
# ============================================================================

param(
    [string]$VpsIp = "156.232.88.156",
    [string]$VpsUser = "root",  # Change to your VPS username
    [string]$AppDir = "/var/www/eoms",
    [string]$BackendUrl = "http://156.232.88.156:8001",
    [switch]$SkipBuild,
    [switch]$Force
)

# Configuration
$ErrorActionPreference = "Stop"
$AppName = "eoms"
$FrontendPort = 3001  # Different from COMS to avoid conflicts
$SshKey = "$env:USERPROFILE\.ssh\id_rsa"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  EOMS Frontend Deployment to VPS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Function to check prerequisites
function Test-Prerequisites {
    Write-Host "[1/7] Checking prerequisites..." -ForegroundColor Yellow
    
    # Check if Node.js is installed
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) {
        Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
    
    # Check SSH connection
    try {
        $result = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${VpsUser}@${VpsIp} 'echo OK'
        if ($result -eq "OK") {
            Write-Host "✓ SSH connection successful" -ForegroundColor Green
        }
    } catch {
        Write-Host "✗ SSH connection failed" -ForegroundColor Red
        exit 1
    }
}

# Function to build frontend locally
function Build-Frontend {
    if ($SkipBuild) {
        Write-Host "[2/7] Skipping local build (using existing dist/)..." -ForegroundColor Yellow
        
        if (-not (Test-Path "./frontend/dist")) {
            Write-Host "✗ ./frontend/dist not found. Build is required." -ForegroundColor Red
            exit 1
        }
        
        return
    }
    
    Write-Host "[2/7] Building frontend for production..." -ForegroundColor Yellow
    
    Push-Location ./frontend
    
    try {
        # Create production .env
        $envContent = @"
VITE_API_URL=${BackendUrl}
VITE_APP_NAME=EOMS
VITE_APP_VERSION=1.0.0
"@
        $envContent | Out-File -FilePath .env.production -Encoding utf8
        
        Write-Host "Installing dependencies..." -ForegroundColor Cyan
        npm install
        
        Write-Host "Building for production..." -ForegroundColor Cyan
        npm run build
        
        if (-not (Test-Path "./dist")) {
            Write-Host "✗ Build failed - dist directory not created" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✓ Frontend built successfully" -ForegroundColor Green
        
    } finally {
        Pop-Location
    }
}

# Function to create directories on VPS
function Initialize-VpsFrontendDirs {
    Write-Host "[3/7] Creating frontend directories on VPS..." -ForegroundColor Yellow
    
    $commands = @(
        "mkdir -p ${AppDir}/frontend",
        "mkdir -p /etc/nginx/sites-available",
        "mkdir -p /etc/nginx/sites-enabled"
    )
    
    foreach ($cmd in $commands) {
        ssh ${VpsUser}@${VpsIp} $cmd
    }
    
    Write-Host "✓ Directories created" -ForegroundColor Green
}

# Function to sync frontend build
function Sync-FrontendBuild {
    Write-Host "[4/7] Syncing frontend build to VPS..." -ForegroundColor Yellow
    
    # Check if rsync is available
    $rsyncAvailable = Get-Command rsync -ErrorAction SilentlyContinue
    
    if ($rsyncAvailable) {
        Write-Host "Using rsync for efficient file transfer..." -ForegroundColor Cyan
        
        rsync -avz --delete `
            ./frontend/dist/ ${VpsUser}@${VpsIp}:${AppDir}/frontend/
    } else {
        Write-Host "rsync not found, using scp..." -ForegroundColor Yellow
        
        # Create temporary archive
        $tempArchive = "$env:TEMP\eoms_frontend_$(Get-Date -Format 'yyyyMMdd_HHmmss').tar.gz"
        
        tar -czf $tempArchive -C ./frontend/dist .
        
        # Copy to VPS
        scp $tempArchive ${VpsUser}@${VpsIp}:${AppDir}/frontend.tar.gz
        
        # Extract on VPS
        ssh ${VpsUser}@${VpsIp} "cd ${AppDir}/frontend && tar -xzf ../frontend.tar.gz && rm ../frontend.tar.gz"
        
        # Clean up
        Remove-Item $tempArchive
    }
    
    Write-Host "✓ Frontend files synced" -ForegroundColor Green
}

# Function to setup Nginx configuration
function Setup-Nginx {
    Write-Host "[5/7] Setting up Nginx configuration..." -ForegroundColor Yellow
    
    $nginxConfig = @"
# EOMS Frontend Configuration
server {
    listen ${FrontendPort};
    server_name ${VpsIp};
    
    root ${AppDir}/frontend;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing - serve index.html for all routes
    location / {
        try_files `$uri `$uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# Optional: Redirect from port 80 to EOMS
# Uncomment if you want EOMS to be the default app
# server {
#     listen 80;
#     server_name ${VpsIp};
#     return 301 http://${VpsIp}:${FrontendPort}`$request_uri;
# }
"@
    
    # Write nginx config to VPS
    $nginxConfig | ssh ${VpsUser}@${VpsIp} "cat > /etc/nginx/sites-available/eoms"
    
    # Enable site
    ssh ${VpsUser}@${VpsIp} "ln -sf /etc/nginx/sites-available/eoms /etc/nginx/sites-enabled/eoms"
    
    Write-Host "✓ Nginx configuration created" -ForegroundColor Green
}

# Function to test and reload Nginx
function Reload-Nginx {
    Write-Host "[6/7] Testing and reloading Nginx..." -ForegroundColor Yellow
    
    # Test nginx config
    $testResult = ssh ${VpsUser}@${VpsIp} "nginx -t 2>&1"
    
    if ($testResult -match "successful") {
        Write-Host "✓ Nginx configuration is valid" -ForegroundColor Green
        
        # Reload nginx
        ssh ${VpsUser}@${VpsIp} "systemctl reload nginx"
        Write-Host "✓ Nginx reloaded" -ForegroundColor Green
    } else {
        Write-Host "⚠ Nginx configuration test failed:" -ForegroundColor Yellow
        Write-Host $testResult -ForegroundColor Red
        Write-Host ""
        Write-Host "Attempting to install Nginx..." -ForegroundColor Yellow
        ssh ${VpsUser}@${VpsIp} "apt-get update && apt-get install -y nginx"
        ssh ${VpsUser}@${VpsIp} "systemctl start nginx && systemctl enable nginx"
        
        # Retry
        ssh ${VpsUser}@${VpsIp} "nginx -t && systemctl reload nginx"
    }
}

# Function to verify deployment
function Test-Deployment {
    Write-Host "[7/7] Verifying deployment..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 2
    
    try {
        $response = Invoke-WebRequest -Uri "http://${VpsIp}:${FrontendPort}" -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Frontend is accessible" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠ Could not verify frontend accessibility" -ForegroundColor Yellow
        Write-Host "  Please check manually: http://${VpsIp}:${FrontendPort}" -ForegroundColor Yellow
    }
}

# Main deployment flow
try {
    Write-Host ""
    Write-Host "Deployment Configuration:" -ForegroundColor Cyan
    Write-Host "  VPS IP: $VpsIp" -ForegroundColor White
    Write-Host "  VPS User: $VpsUser" -ForegroundColor White
    Write-Host "  App Directory: $AppDir" -ForegroundColor White
    Write-Host "  Frontend Port: $FrontendPort" -ForegroundColor White
    Write-Host "  Backend URL: $BackendUrl" -ForegroundColor White
    Write-Host ""
    
    if (-not $Force) {
        $confirm = Read-Host "Continue with deployment? (yes/no)"
        if ($confirm -ne "yes") {
            Write-Host "Deployment cancelled" -ForegroundColor Yellow
            exit 0
        }
    }
    
    # Execute deployment steps
    Test-Prerequisites
    Build-Frontend
    Initialize-VpsFrontendDirs
    Sync-FrontendBuild
    Setup-Nginx
    Reload-Nginx
    Test-Deployment
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  ✓ Frontend Deployment Successful!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend URL: http://${VpsIp}:${FrontendPort}" -ForegroundColor Cyan
    Write-Host "Backend API: ${BackendUrl}" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your apps on VPS:" -ForegroundColor Yellow
    Write-Host "  COMS: http://${VpsIp}:80 (existing)" -ForegroundColor White
    Write-Host "  EOMS: http://${VpsIp}:${FrontendPort} (new)" -ForegroundColor White
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
