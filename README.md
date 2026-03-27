
# EOMS - Events Operations Management System

A comprehensive mobile-first platform for managing funeral and general event operations. Built with Django/DRF backend and ready for React Native or Flutter frontend.

## Features

- 👥 User & Role Management (Admin, Leaders, Members, Finance Officers, Stakeholders)
- 🏛️ Committee Management with member assignments
- ✅ Task Management with assignments and tracking
- 💰 Finance Management (Collections & Expenses)
- 🏢 Service Provider Management
- 📊 Comprehensive Reporting
- 🔐 JWT Authentication with OTP verification
- 🔔 Background tasks with Celery

## Tech Stack

### Backend
- Django 5.0
- Django REST Framework
- PostgreSQL 16
- Redis (Celery broker)
- JWT Authentication

### DevOps
- Docker & Docker Compose
- Gunicorn (Production)
- Nginx (Production)

## Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose installed
- Git

### 1. Clone the repository
```bash
git clone <repository-url>
cd eoms
```

### 2. Start the services
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- Django backend (port 8000)
- Celery worker
- Celery beat

### 3. Run migrations
```bash
docker-compose exec backend python manage.py migrate
```

### 4. Create a superuser
```bash
docker-compose exec backend python manage.py createsuperuser
```

### 5. Access the application
- API: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin/
- API Documentation: http://localhost:8000/api/docs/

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Request OTP
- `POST /api/auth/verify_otp/` - Verify OTP & get JWT tokens
- `GET /api/auth/me/` - Get current user profile
- `PUT /api/auth/update_profile/` - Update profile
- `POST /api/auth/change_password/` - Change password

### Users
- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `GET /api/users/{id}/` - Get user details
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user

### Committees
- `GET /api/committees/` - List committees
- `POST /api/committees/` - Create committee
- `GET /api/committees/{id}/` - Get committee details
- `POST /api/committees/{id}/add_member/` - Add member
- `DELETE /api/committees/{id}/remove_member/` - Remove member
- `GET /api/committees/my_committees/` - Get user's committees

### Tasks
- `GET /api/tasks/` - List tasks
- `POST /api/tasks/` - Create task
- `GET /api/tasks/{id}/` - Get task details
- `PATCH /api/tasks/{id}/update_status/` - Update task status
- `POST /api/tasks/{id}/add_comment/` - Add comment to task
- `GET /api/tasks/my_tasks/` - Get user's assigned tasks

### Finance
- `GET /api/finance/collections/` - List collections
- `POST /api/finance/collections/` - Record collection
- `GET /api/finance/expenses/` - List expenses
- `POST /api/finance/expenses/` - Create expense
- `POST /api/finance/expenses/{id}/approve/` - Approve expense
- `POST /api/finance/expenses/{id}/reject/` - Reject expense
- `POST /api/finance/expenses/{id}/mark_paid/` - Mark as paid
- `GET /api/finance/summary/?committee={id}` - Finance summary

### Service Providers
- `GET /api/providers/` - List providers
- `POST /api/providers/` - Add provider
- `GET /api/providers/{id}/` - Get provider details
- `PATCH /api/providers/{id}/update_status/` - Update status

### Reports
- `GET /api/reports/committee_report/?committee={id}` - Committee report
- `GET /api/reports/event_summary/?committee={id}` - Event summary
- `GET /api/reports/user_activity/?user_id={id}` - User activity
- `GET /api/reports/all_committees/` - All committees report

## Development

### View logs
```bash
docker-compose logs -f backend
```

### Stop services
```bash
docker-compose down
```

### Rebuild after changes
```bash
docker-compose up -d --build
```

### Run Django commands
```bash
docker-compose exec backend python manage.py <command>
```

### Run tests
```bash
docker-compose exec backend pytest
```

## Project Structure

```
eoms/
├── backend/
│   ├── apps/
│   │   ├── users/          # User management & auth
│   │   ├── committees/     # Committee management
│   │   ├── tasks/          # Task management
│   │   ├── finance/        # Collections & expenses
│   │   ├── providers/      # Service providers
│   │   └── reports/        # Reporting
│   ├── eoms_api/
│   │   ├── settings.py     # Django settings
│   │   ├── urls.py         # URL routing
│   │   └── celery.py       # Celery config
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # (To be implemented)
├── docker-compose.yml
└── README.md
```

## Environment Variables

See `backend/.env.example` for all available environment variables.

Key variables:
- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug mode (True/False)
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` - Database config
- `REDIS_URL` - Redis connection URL

## Next Steps

1. ✅ Backend API completed
2. ⏳ Build mobile frontend (React Native or Flutter)
3. ⏳ Implement SMS integration for OTP
4. ⏳ Add email notifications
5. ⏳ Deploy to production VPS

## License

Proprietary - All rights reserved

## Support

For questions or support, contact the development team
- Gunicorn
- SSL via Let's Encrypt

---

## 🗂️ Project Structure
```
backend/
│ manage.py
└── eoms_api/
      settings.py
      urls.py
      apps/
        users/
        committees/
        tasks/
        finance/
        providers/
        reports/
frontend/
│ (Flutter or React Native app)
docs/
│ EOMS_SYSTEM_DOCUMENTATION.md
```

---

## 🔌 API Overview
### Authentication
- **POST /auth/login/** — Request OTP
- **POST /auth/verify/** — Verify OTP → Get JWT

### Users
- **GET /users/**
- **POST /users/**

### Committees
- **GET /committees/**
- **POST /committees/**
- **POST /committees/{id}/members/**

### Tasks
- **GET /tasks/?committee={id}**
- **POST /tasks/**
- **PATCH /tasks/{id}/status/**

### Finance
- **POST /collections/**
- **POST /expenses/**
- **GET /finance/summary/**

---

## 🛡 Security
- JWT authentication
- Role-based access control (RBAC)
- Rate limiting
- Encrypted file storage
- HTTPS enforced
- Audit logs for financial actions

---

## 🧪 Testing
- Unit tests (Django)
- API tests (pytest + DRF)
- UI tests (Flutter or Jest)
- Load tests (Locust)

---

## 🚀 Deployment (Truehost VPS)
1. SSH into server
2. Install Docker & Docker Compose
3. Clone repo
4. Setup `.env` files
5. Configure NGINX reverse proxy
6. Setup SSL with Certbot
7. Start Docker services
8. Run Django migrations

---

## 🌱 Contributing
Pull requests are welcome. For major changes, open an issue to discuss what you’d like to add.

---

## 📄 License
This project is licensed for private and organizational use under the creator's terms.

---

## 📚 Documentation
Complete documentation can be found in:
```
docs/EOMS_SYSTEM_DOCUMENTATION.md
```

