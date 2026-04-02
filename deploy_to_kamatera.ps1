# EOMS Deployment Script - Kamatera VPS
# Usage: .\deploy_to_kamatera.ps1 -ServerIp "194.37.81.174"

param(
    [Parameter(Mandatory = $true)]
    [string]$ServerIp,
    [string]$ServerUser = "root",
    [string]$AppDir = "/opt/eoms",
    [string]$GitRepo = "https://github.com/onyangowanga/EOMS_application.git",
    [string]$GitBranch = "main",
    [switch]$SkipProvision
)

$ErrorActionPreference = "Stop"
$SshTarget = "${ServerUser}@${ServerIp}"
$SshArgs = @("-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=30")

# Pipe a bash script via stdin - avoids ALL quoting issues with multi-line scripts
function Invoke-Remote {
    param([string]$Script, [string]$Label = "")
    if ($Label) { Write-Host "  -> $Label" -ForegroundColor DarkCyan }
    $Script | & ssh @SshArgs $SshTarget "bash -s"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  FAILED (exit $LASTEXITCODE)" -ForegroundColor Red
        throw "Remote step failed"
    }
}

function Invoke-RemoteCmd {
    param([string]$Cmd)
    $result = & ssh @SshArgs $SshTarget $Cmd
    return $result
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  EOMS Kamatera Deployment" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Server : $SshTarget" -ForegroundColor Gray
Write-Host "  AppDir : $AppDir" -ForegroundColor Gray
Write-Host "  Branch : $GitBranch" -ForegroundColor Gray
Write-Host ""

# [1] Test SSH
Write-Host "[1/7] Testing SSH connection..." -ForegroundColor Yellow
$ok = Invoke-RemoteCmd "echo OK"
if ($ok -ne "OK") {
    Write-Host "  SSH failed - check your key auth" -ForegroundColor Red
    exit 1
}
Write-Host "  SSH OK" -ForegroundColor Green

# [2] Provision (Docker + firewall)
if (-not $SkipProvision) {
    Write-Host "[2/7] Provisioning server..." -ForegroundColor Yellow
    $provision = @'
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ufw
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
if ! docker compose version >/dev/null 2>&1; then
    mkdir -p /usr/local/lib/docker/cli-plugins
    ARCH=$(uname -s)-$(uname -m)
    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-${ARCH}" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "Provision OK"
'@
    Invoke-Remote $provision "Installing Docker and configuring firewall"
    Write-Host "  Provisioned" -ForegroundColor Green
} else {
    Write-Host "[2/7] Skipping provision" -ForegroundColor DarkGray
}

# [3] Clone or pull repo
Write-Host "[3/7] Deploying code from GitHub..." -ForegroundColor Yellow
$deploy = "set -e`nif [ -d `"$AppDir/.git`" ]; then`n  cd $AppDir`n  git fetch origin`n  git reset --hard origin/$GitBranch`n  git pull origin $GitBranch`nelse`n  mkdir -p $AppDir`n  git clone --branch $GitBranch $GitRepo $AppDir`nfi`necho 'Code OK'"
Invoke-Remote $deploy "Syncing from GitHub"
Write-Host "  Code deployed" -ForegroundColor Green

# [4] Check env files
Write-Host "[4/7] Checking env files..." -ForegroundColor Yellow
$backendEnv = Invoke-RemoteCmd "test -f $AppDir/backend/.env && echo yes || echo no"
$dbEnv = Invoke-RemoteCmd "test -f $AppDir/db/.env && echo yes || echo no"

if ($backendEnv -ne "yes" -or $dbEnv -ne "yes") {
    Write-Host ""
    Write-Host "  MISSING ENV FILES - create them on the server:" -ForegroundColor Red
    Write-Host "    ssh $SshTarget" -ForegroundColor White
    Write-Host "    cd $AppDir" -ForegroundColor White
    Write-Host "    cp backend/.env.example backend/.env" -ForegroundColor White
    Write-Host "    cp db/.env.example db/.env" -ForegroundColor White
    Write-Host "    nano backend/.env   # fill in SECRET_KEY, DB_PASSWORD, ALLOWED_HOSTS, email" -ForegroundColor White
    Write-Host "    nano db/.env        # set POSTGRES_PASSWORD matching DB_PASSWORD above" -ForegroundColor White
    Write-Host ""
    Write-Host "  Then re-run: .\deploy_to_kamatera.ps1 -ServerIp $ServerIp -SkipProvision" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Env files OK" -ForegroundColor Green

# [5] Build and start containers
Write-Host "[5/7] Building and starting containers (first build ~5 min)..." -ForegroundColor Yellow
$build = @'
set -e
cd /opt/eoms
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d --remove-orphans
echo "Build OK"
'@
Invoke-Remote $build "Building Docker images"
Write-Host "  Containers started" -ForegroundColor Green

# [6] Migrate and collectstatic
Write-Host "[6/7] Running migrations..." -ForegroundColor Yellow
$migrate = @'
set -e
cd /opt/eoms
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
echo "Migrate OK"
'@
Invoke-Remote $migrate "Applying database migrations"
Write-Host "  Migrations done" -ForegroundColor Green

# [7] Health check
Write-Host "[7/7] Health check..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$health = @'
cd /opt/eoms
docker compose -f docker-compose.prod.yml ps
curl -sf http://localhost:8000/api/ >/dev/null && echo "Backend: OK" || echo "Backend: not ready yet"
curl -sf http://localhost:80/   >/dev/null && echo "Frontend: OK" || echo "Frontend: not ready yet"
'@
Invoke-Remote $health "Checking services"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  Deployment complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  App   : http://${ServerIp}/" -ForegroundColor Cyan
Write-Host "  API   : http://${ServerIp}/api/" -ForegroundColor Cyan
Write-Host "  Admin : http://${ServerIp}/api/admin/" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Create superuser:" -ForegroundColor Yellow
Write-Host "    ssh $SshTarget" -ForegroundColor White
Write-Host "    cd /opt/eoms" -ForegroundColor White
Write-Host "    docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser" -ForegroundColor White
