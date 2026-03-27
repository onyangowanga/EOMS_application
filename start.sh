#!/bin/bash

# Quick Start Script for EOMS (Linux/Mac)

echo "🚀 Starting EOMS Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"

# Build and start containers
echo ""
echo "📦 Building and starting containers..."
docker-compose up -d --build

# Wait for database to be ready
echo ""
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo ""
echo "🔄 Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# Create superuser (optional)
echo ""
echo "👤 Do you want to create a superuser? (y/n)"
read -r createSuperuser
if [ "$createSuperuser" = "y" ] || [ "$createSuperuser" = "Y" ]; then
    docker-compose exec backend python manage.py createsuperuser
fi

# Show service status
echo ""
echo "✅ EOMS is running!"
echo ""
echo "Services:"
echo "  - API: http://localhost:8000/api/"
echo "  - Admin: http://localhost:8000/admin/"
echo "  - API Docs: http://localhost:8000/api/docs/"
echo "  - Database: localhost:5432"
echo "  - Redis: localhost:6379"

echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f backend"
echo "  - Stop: docker-compose down"
echo "  - Restart: docker-compose restart backend"

echo ""
echo "🎉 Setup complete! Happy coding!"
