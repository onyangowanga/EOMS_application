param(
    [Parameter(Mandatory = $true)]
    [string]$ServerIp,
    [string]$ServerUser = "root",
    [string]$AppDir = "/opt/eoms",
    [switch]$SkipBuild,
    [switch]$SkipMigrate,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$SshTarget = "${ServerUser}@${ServerIp}"
$SshArgs = @("-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=30")
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$TimeStamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LocalTar = Join-Path $env:TEMP "eoms_release_${TimeStamp}.tar.gz"
$RemoteTar = "/tmp/eoms_release_${TimeStamp}.tar.gz"

function Run-Remote {
    param([string]$Script, [string]$Label = "")
    if ($Label) { Write-Host "  -> $Label" -ForegroundColor DarkCyan }

    # PowerShell re-adds \r\n when piping strings to external processes on Windows.
    # Base64-encode the script and decode on the server to avoid all CRLF issues.
    $scriptLf = ($Script -replace "`r", "")
    $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($scriptLf))
    & ssh @SshArgs $SshTarget "echo '$b64' | base64 -d | bash"

    if ($LASTEXITCODE -ne 0) {
        throw "Remote step failed: $Label"
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  EOMS Local-to-VPS Deployment" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Server : $SshTarget" -ForegroundColor Gray
Write-Host "  AppDir : $AppDir" -ForegroundColor Gray
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "Proceed with local deployment to $SshTarget ? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
}

try {
    Write-Host "[1/6] Testing SSH..." -ForegroundColor Yellow
    # -n redirects SSH stdin from /dev/null, preventing it from hanging on the Out-String pipe
    $ok = (& ssh "-n" @SshArgs $SshTarget "echo OK" | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or -not $ok.Contains("OK")) { throw "SSH test failed" }
    Write-Host "  SSH OK" -ForegroundColor Green

    Write-Host "[2/6] Packaging local workspace..." -ForegroundColor Yellow
    Push-Location $Root
    try {
        if (Test-Path $LocalTar) { Remove-Item $LocalTar -Force }

        $tarArgs = @(
            "-czf", $LocalTar,
            "--exclude=.git",
            "--exclude=.github",
            "--exclude=node_modules",
            "--exclude=frontend/node_modules",
            "--exclude=backend/__pycache__",
            "--exclude=**/__pycache__",
            "--exclude=**/*.pyc",
            "--exclude=**/*.pyo",
            "--exclude=backend/.env",
            "--exclude=db/.env",
            "--exclude=.env",
            "--exclude=*.tar.gz",
            "--exclude=*.zip",
            "--exclude=.vscode",
            "--exclude=.idea",
            "."
        )

        & tar @tarArgs
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $LocalTar)) {
            throw "Failed to create release archive"
        }
    }
    finally {
        Pop-Location
    }
    Write-Host "  Archive ready: $LocalTar" -ForegroundColor Green

    Write-Host "[3/6] Uploading release archive..." -ForegroundColor Yellow
    & scp @SshArgs $LocalTar "${SshTarget}:${RemoteTar}"
    if ($LASTEXITCODE -ne 0) { throw "SCP upload failed" }
    Write-Host "  Upload OK" -ForegroundColor Green

    Write-Host "[4/6] Syncing files on VPS..." -ForegroundColor Yellow
    $syncScript = @'
set -e
APP_DIR="{0}"
REMOTE_TAR="{1}"
BACKEND_ENV_BAK="/tmp/eoms_backend.env.bak"
DB_ENV_BAK="/tmp/eoms_db.env.bak"

mkdir -p "$APP_DIR"

if [ -f "$APP_DIR/backend/.env" ]; then
  cp "$APP_DIR/backend/.env" "$BACKEND_ENV_BAK"
fi
if [ -f "$APP_DIR/db/.env" ]; then
  cp "$APP_DIR/db/.env" "$DB_ENV_BAK"
fi

find "$APP_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {{}} +

tar -xzf "$REMOTE_TAR" -C "$APP_DIR"
rm -f "$REMOTE_TAR"

mkdir -p "$APP_DIR/backend" "$APP_DIR/db"

if [ -f "$BACKEND_ENV_BAK" ]; then
  mv "$BACKEND_ENV_BAK" "$APP_DIR/backend/.env"
elif [ -f "$APP_DIR/backend/.env.example" ]; then
  cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
fi

if [ -f "$DB_ENV_BAK" ]; then
  mv "$DB_ENV_BAK" "$APP_DIR/db/.env"
elif [ -f "$APP_DIR/db/.env.example" ]; then
  cp "$APP_DIR/db/.env.example" "$APP_DIR/db/.env"
fi

echo "Sync complete"
'@ -f $AppDir, $RemoteTar
    Run-Remote $syncScript "Extracting archive and restoring env files"
    Write-Host "  Sync OK" -ForegroundColor Green

    Write-Host "[5/6] Building and starting containers..." -ForegroundColor Yellow
    $skipBuildFlag = if ($SkipBuild.IsPresent) { "true" } else { "false" }
    $deployScript = @'
set -e
cd "{0}"

if [ "{1}" = "false" ]; then
  docker compose -f docker-compose.prod.yml build backend celery celery-beat frontend
fi

docker compose -f docker-compose.prod.yml up -d
'@ -f $AppDir, $skipBuildFlag
    Run-Remote $deployScript "Docker compose deploy"
    Write-Host "  Containers up" -ForegroundColor Green

    Write-Host "[6/6] Running post-deploy tasks..." -ForegroundColor Yellow
    if (-not $SkipMigrate) {
        $postScript = @'
set -e
cd "{0}"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
docker compose -f docker-compose.prod.yml ps
'@ -f $AppDir
        Run-Remote $postScript "Migrate + collectstatic + health"
    }
    else {
        $healthScript = @'
set -e
cd "{0}"
docker compose -f docker-compose.prod.yml ps
'@ -f $AppDir
        Run-Remote $healthScript "Container status"
    }

    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "  Local deployment completed" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "  App   : http://${ServerIp}/" -ForegroundColor Cyan
    Write-Host "  API   : http://${ServerIp}/api/" -ForegroundColor Cyan
    Write-Host "  Admin : http://${ServerIp}/admin/" -ForegroundColor Cyan
}
catch {
    Write-Host "" 
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    if (Test-Path $LocalTar) {
        Remove-Item $LocalTar -Force -ErrorAction SilentlyContinue
    }
}
