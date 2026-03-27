# Quick Start Script for EOMS

Write-Host "🚀 Starting EOMS Development Environment..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Build and start containers
Write-Host "`n📦 Building and starting containers..." -ForegroundColor Cyan
docker-compose up -d --build

# Wait for database to be ready
Write-Host "`n⏳ Waiting for database to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Run migrations
Write-Host "`n🔄 Running database migrations..." -ForegroundColor Cyan
docker-compose exec -T backend python manage.py migrate

# Create superuser (optional)
Write-Host "`n👤 Do you want to create a superuser? (y/n)" -ForegroundColor Yellow
$createSuperuser = Read-Host
if ($createSuperuser -eq "y" -or $createSuperuser -eq "Y") {
    docker-compose exec backend python manage.py createsuperuser
}

# Show service status
Write-Host "`n✅ EOMS is running!" -ForegroundColor Green
Write-Host "`nServices:" -ForegroundColor Cyan
Write-Host "  - API: http://localhost:8000/api/" -ForegroundColor White
Write-Host "  - Admin: http://localhost:8000/admin/" -ForegroundColor White
Write-Host "  - API Docs: http://localhost:8000/api/docs/" -ForegroundColor White
Write-Host "  - Database: localhost:5432" -ForegroundColor White
Write-Host "  - Redis: localhost:6379" -ForegroundColor White

Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  - View logs: docker-compose logs -f backend" -ForegroundColor White
Write-Host "  - Stop: docker-compose down" -ForegroundColor White
Write-Host "  - Restart: docker-compose restart backend" -ForegroundColor White

Write-Host "`n🎉 Setup complete! Happy coding!" -ForegroundColor Green
