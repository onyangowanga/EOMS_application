
# EOMS — Events Operations Management System

### Comprehensive System Documentation

**User Manual | Developer Manual | Architecture | Tech Stack | API Specification | Database Schema | Security | Testing | DevOps**

---

# 1. Introduction
EOMS (Events Operations Management System) is a mobile‑first, cloud-hosted platform designed to coordinate and manage **funeral operations and general event operations**, allowing committees to collaborate efficiently, manage budgets, track tasks, monitor finances, allocate resources, and ensure transparency.

This documentation serves as:
- **User Manual**
- **Developer Manual**
- **Technical Architecture Blueprint**
- **API Reference (Django REST Framework)**
- **Database Schema Documentation (PostgreSQL)**
- **Deployment Guide (Truehost VPS)**
- **Security & Compliance**
- **Testing Strategy**
- **DevOps Guide**

---

# 2. System Overview
EOMS supports event operations using six core components:
1. **User & Role Management**
2. **Committees & Memberships**
3. **Task Management**
4. **Service Providers Management**
5. **Finance (Collections & Expenses)**
6. **Reports & Transparency**

The app is **mobile-first** to support smartphone users.

---

# 3. Technology Stack

## 3.1 Frontend
- Framework: **Flutter** or **React + React Native**
- Design: **Mobile-first responsive UI**
- API: **REST API calls via Axios/http**

## 3.2 Backend
- Framework: **Django 5.x**
- API Layer: **Django REST Framework**
- Authentication: **JWT (SimpleJWT)**
- Background tasks: **Celery + Redis**
- File Uploads: **Local storage or S3-compatible bucket**

## 3.3 Database
- Type: **PostgreSQL 16+**
- Hosting: **Truehost VPS**
- ORM: **Django ORM**

## 3.4 Development Environment
- Editor: **VS Code + GitHub Copilot Pro**
- Virtualization: **Docker + Docker Compose**

## 3.5 Deployment Infrastructure
- VPS: **Truehost Linux VPS**
- Web Server: **NGINX**
- App Server: **Gunicorn**
- SSL: **Let's Encrypt**

---

# 4. Architecture

## 4.1 Logical Architecture
```
Mobile App → REST API → Django Backend → PostgreSQL Database
                           ↓
                    Celery + Redis
                           ↓
                      File Storage
                           ↓
               SMS/Email Notifications
```

## 4.2 Modules
- Users Module
- Committees Module
- Tasks Module
- Providers Module
- Finance Module
- Reporting Module
- Notifications Module

---

# 5. User Manual

## 5.1 Roles
- **Admin** – Full control
- **Committee Leader** – Manages tasks/members
- **Member** – Executes tasks
- **Finance Officer** – Manages money
- **Stakeholder** – View-only access

## 5.2 Features
### Dashboard
Shows:
- Tasks
- Finance overview
- Providers status

### Committees
- View committees
- Add members
- Assign roles

### Tasks
- Create tasks
- Assign to member
- Set deadlines
- Track progress

### Service Providers
- Add provider
- Save contact details
- Log quotes
- Track payments

### Finance
- Record collections
- Log expenses
- Attach receipts
- Generate summary

### Reports
- Event summary
- Finance summary
- Committee activity report

---

# 6. Developer Manual

## 6.1 Project Structure
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
```

## 6.2 Docker Compose Example
```yaml
db:
  image: postgres:16
redis:
  image: redis:latest
backend:
  build: .
  depends_on:
    - db
    - redis
```

## 6.3 Environment Variables
```
SECRET_KEY=
DB_NAME=eoms
DB_USER=eoms
DB_PASS=
DB_HOST=db
REDIS_URL=redis://redis:6379
```

---

# 7. API Documentation (Extended)

## 7.1 Auth API
**POST /auth/login/** – Request OTP/login

**POST /auth/verify/** – Verify OTP → Return JWT

---

## 7.2 Users API
**GET /users/** – List users

**POST /users/** – Create user

---

## 7.3 Committees API
**GET /committees/** – List committees

**POST /committees/** – Create committee

**POST /committees/{id}/members/** – Add member

---

## 7.4 Tasks API
**GET /tasks/?committee={id}** – List tasks by committee

**POST /tasks/** – Create task

**PATCH /tasks/{id}/status/** – Update task status

---

## 7.5 Providers API
**GET /providers/** – List providers

**POST /providers/** – Create provider

---

## 7.6 Finance API
**POST /collections/** – Log collection

**POST /expenses/** – Log expense

**GET /finance/summary/** – Finance overview

---

# 8. Database Schema (Extended)

## 8.1 Users Table
```
id (PK)
full_name
phone
role
created_at
timestamp
```

## 8.2 Committees Table
```
id
name
description
```

## 8.3 CommitteeMembers Table
```
id
committee_id (FK)
user_id (FK)
is_lead
```

## 8.4 Tasks Table
```
id
title
description
committee_id (FK)
assigned_to (FK)
status
deadline
created_at
```

## 8.5 Providers Table
```
id
name
type
contact_person
phone
status
cost_estimate
```

## 8.6 Collections Table
```
id
payer_name
channel
amount
reference_number
timestamp
```

## 8.7 Expenses Table
```
id
vendor
amount
category
receipt_url
approved_by
timestamp
```

---

# 9. Security Architecture
- JWT authentication
- Role-based access control
- Rate limiting
- Encrypted file storage
- HTTPS enforced
- Server firewall & fail2ban
- Audit logs for financial actions

---

# 10. Testing Strategy
## Types of Tests
- Unit tests (Django tests)
- API tests (pytest + DRF)
- UI tests (Flutter/React tests)
- Load testing (Locust)
- Security testing

---

# 11. Deployment Guide (Truehost VPS)
1. SSH into VPS
2. Install Docker + Docker Compose
3. Clone GitHub repo
4. Configure `.env` files
5. Setup NGINX reverse proxy
6. Configure SSL via Certbot
7. Run containers
8. Apply migrations

---

# 12. DevOps Pipeline
- GitHub Actions for CI/CD
- Auto-build Docker images
- Auto-deploy to VPS

---

# 13. Glossary
- **EOMS:** Events Operations Management System
- **DRF:** Django REST Framework
- **JWT:** JSON Web Token
- **RBAC:** Role-Based Access Control

---

# Document Version
**v1.1 — Complete System Documentation**
