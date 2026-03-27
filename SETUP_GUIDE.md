# EOMS Quick Setup Guide

## ✅ Services Running Successfully!

All Docker containers are up and running:
- ✅ PostgreSQL Database (port 5432)
- ✅ Redis (port 6379)  
- ✅ Django Backend API (port 8000)
- ✅ Celery Worker
- ✅ Celery Beat Scheduler

All database migrations have been applied successfully!

---

## Next Steps

### 1. Create a Superuser

Run this command to create an admin account:

```powershell
docker-compose exec backend python manage.py createsuperuser
```

When prompted:
- **Phone number**: Enter your phone (e.g., `+254700000000`)
- **Full name**: Enter your name (e.g., `Admin User`)
- **Password**: Create a secure password
- **Password (again)**: Confirm password

### 2. Access the Application

#### Admin Panel
- URL: http://localhost:8000/admin/
- Login with the phone number and password you just created

#### API Documentation (Swagger)
- URL: http://localhost:8000/api/docs/
- Interactive API documentation with all endpoints

#### API Endpoints
- Base URL: http://localhost:8000/api/

**Authentication:**
- POST `/api/auth/login/` - Request OTP
- POST `/api/auth/verify_otp/` - Verify OTP & get JWT
- GET `/api/auth/me/` - Get current user

**Other APIs:**
- `/api/users/` - User management
- `/api/committees/` - Committees
- `/api/tasks/` - Task management
- `/api/finance/` - Collections & Expenses
- `/api/providers/` - Service providers
- `/api/reports/` - Reports & analytics

---

## Testing the API

### Option 1: Using Swagger UI
1. Go to http://localhost:8000/api/docs/
2. Try out endpoints interactively

### Option 2: Using curl (PowerShell)

```powershell
# Test API health
Invoke-WebRequest -Uri "http://localhost:8000/api/users/" -UseBasicParsing

# Request OTP (for testing)
$body = @{phone = "+254700000000"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login/" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

---

## Useful Docker Commands

```powershell
# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build

# Run Django commands
docker-compose exec backend python manage.py <command>

# Access Django shell
docker-compose exec backend python manage.py shell
```

---

## Database Info

- **Database**: `eoms`
- **User**: `eoms`  
- **Password**: `eoms_password`
- **Host**: `localhost:5432`

You can connect using pgAdmin, DBeaver, or any PostgreSQL client.

---

## What's Implemented

✅ **Complete Backend API** with:
- User authentication (JWT + OTP)
- Role-based access control (Admin, Leader, Member, Finance Officer, Stakeholder)
- Committee management
- Task management with comments
- Finance tracking (Collections & Expenses)
- Service provider management
- Comprehensive reporting system
- Background tasks with Celery
- API documentation

✅ **Docker Setup** for local development

⏳ **Frontend** - Ready for React Native/Flutter implementation

---

## Next Development Steps

1. Build mobile frontend (React Native or Flutter)
2. Integrate SMS service for real OTP sending
3. Add email notifications
4. Implement file upload for receipts
5. Add more comprehensive tests
6. Deploy to production VPS

---

## Troubleshooting

**If containers won't start:**
```powershell
docker-compose down
docker-compose up -d
```

**If migrations fail:**
```powershell
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

**If ports are in use:**
Check if other services are using ports 5432, 6379, or 8000 and stop them.

---

Happy coding! 🚀
