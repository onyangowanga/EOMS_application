# EOMS Frontend - React + TypeScript + Vite

Web frontend for the Events Operations Management System.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Material-UI** - UI component library
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching & caching
- **Axios** - HTTP client
- **React Hook Form** - Form management

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- EOMS Backend running on http://localhost:8000

### Installation

```bash
# Install dependencies
npm install
```

### Running the App

#### Option 1: Local Development (without Docker)

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will run on http://localhost:5173

#### Option 2: Docker Development

```bash
# From project root directory
docker-compose up frontend

# Or start all services
docker-compose up
```

The app will run on http://localhost:5173

#### Option 3: Docker Production

```bash
# From project root directory
docker-compose -f docker-compose.prod.yml up --build

# Or with environment file
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Production build served via Nginx on http://localhost:80

## Project Structure

```
src/
├── components/      # Reusable UI components
│   ├── Layout.tsx
│   └── ProtectedRoute.tsx
├── contexts/        # React contexts
│   └── AuthContext.tsx
├── pages/           # Page components
│   ├── LoginPage.tsx
│   ├── VerifyOTPPage.tsx
│   ├── DashboardPage.tsx
│   └── CommitteesPage.tsx
├── services/        # API services
│   ├── api.ts
│   ├── auth.service.ts
│   ├── committee.service.ts
│   ├── task.service.ts
│   ├── finance.service.ts
│   ├── provider.service.ts
│   └── report.service.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## Features Implemented

### ✅ Core Setup
- Vite project setup with TypeScript
- Material-UI theme configuration
- React Router setup
- API service layer with Axios
- Authentication context

### ✅ Authentication
- Login page with phone number
- OTP verification page
- JWT token management
- Auto token refresh
- Protected routes

### ✅ Layout & Navigation
- Responsive sidebar navigation
- Top app bar with user menu
- Mobile-friendly drawer

### ✅ Dashboard
- Statistics cards
- Recent committees list
- Recent tasks list

### ✅ Committees
- List all committees
- Create new committee
- View details
- Filter by status

### 🚧 Coming Soon
- Tasks management pages
- Finance tracking pages
- Service providers pages
- Reports & analytics pages
- User profile management

## Environment Variables

Edit `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
```

## Authentication Flow

1. User enters phone number on login page
2. Backend sends OTP (6-digit code)
3. User enters OTP on verification page
4. Backend returns JWT tokens (access + refresh)
5. Tokens stored in localStorage
6. Access token used for all API requests
7. Auto refresh when access token expires

## Troubleshooting

### CORS Errors
- Ensure backend has CORS enabled for `http://localhost:5173`
- Check `.env` has correct API URL

### Authentication Issues
- Clear localStorage and login again
- Check backend is running on port 8000
- Verify OTP code is valid (6 digits)

## Docker Deployment

### Multi-Stage Dockerfile

The frontend uses a multi-stage Dockerfile:

1. **Development stage**: Node.js with Vite dev server and hot reload
2. **Build stage**: Compiles TypeScript and bundles assets
3. **Production stage**: Nginx serving static files with API proxy

### Docker Commands

```bash
# Development mode
docker-compose up frontend

# Production build
docker-compose -f docker-compose.prod.yml build frontend

# Production run
docker-compose -f docker-compose.prod.yml up -d frontend
```

### Nginx Configuration

Production deployment includes:
- Gzip compression
- Static asset caching (1 year)
- Security headers
- API proxy to backend
- React Router support (SPA)
- Health check endpoint at `/health`

### Environment Variables in Docker

- Development: Uses `VITE_API_URL` from docker-compose.yml
- Production: API requests proxied through Nginx (same domain)

## Development Workflow

1. Start backend: `docker-compose up db redis backend`
2. Start frontend: `npm run dev` or `docker-compose up frontend`
3. Access app: http://localhost:5173
4. Make changes - hot reload enabled
5. Test with backend running
