# Reign City Security Team - Voting System

## System Overview

A complete internal voting system with:
- 4 positions to vote for
- 25 registered voters
- 12 eligible candidates
- Anonymous voting with device locking
- Admin-controlled result release
- Conflict resolution for multi-position winners

## Setup & Installation

Choose your setup method:

### Option 1: Quick Setup (Windows)
```bash
setup.bat
```

### Option 2: Quick Setup (Mac/Linux)
```bash
chmod +x setup.sh
./setup.sh
```

### Option 3: Manual Setup
See detailed instructions in:
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

## Running the Application

### 1. Create Admin User (First Time Only)
```bash
cd backend
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
python manage.py createsuperuser
```

### 2. Start Backend Server
```bash
cd backend
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
python manage.py runserver
```

### 3. Start Frontend Server (New Terminal)
```bash
cd frontend
npm run dev
```

## Access Points

- **Voting Interface**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin/dashboard
- **Django Admin**: http://localhost:8000/admin
- **API**: http://localhost:8000/api

## Usage Guide

### For Voters
1. Go to http://localhost:3000
2. Click "Start Voting"
3. Enter your full name
4. Select one candidate per position
5. Review and submit
6. Wait for admin to release results

### For Administrators
1. Login at http://localhost:8000/admin
2. Go to http://localhost:3000/admin/dashboard
3. Monitor voting progress
4. Close voting when ready
5. Release results (runs conflict resolution)

## Voter Names

All 25 registered voters can enter any of these names:

**Eligible Candidates (Can also vote):**
Konzolo, Fortunate, Teddy, Mumbi, Phinehas, Mercy, Terrence, Trevor, Ricardo, Anitah, Wesley, Clinton

**Voters Only:**
Dad Ndichu, Nancy, Love, Hope, Brandon, Enock, Judah, Denno, Vishal, Aswani, Allan, Chris, Panai

## Positions

1. **Team Lead** - Overall leader and operations manager
2. **Program Coordinator** - Events and programs organizer
3. **Secretary** - Documentation and discussions
4. **Treasurer** - Financial oversight and budgeting

## Tech Stack

- **Backend**: Django 5.0 + Django REST Framework + SQLite
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Styling**: Glassmorphism with Black, Gold, and Emerald theme

## Key Features

### Security
- Device fingerprint locking
- Name-based verification (matches any name in full name)
- CSRF protection
- Transaction-based vote submission
- Database constraints

### Conflict Resolution
- Automatic handling when candidates win multiple positions
- Prioritizes positions with highest vote margins
- Recalculates affected positions
- No manual intervention needed

### UI/UX
- Professional glassmorphism design
- Smooth animations
- Mobile responsive
- Real-time progress tracking
- Confirmation modals

## Project Structure

```
RCC voter/
├── backend/              # Django REST Framework
│   ├── api/             # Main app with models, views, serializers
│   ├── voting_system/   # Django project settings
│   ├── manage.py
│   └── requirements.txt
├── frontend/            # Next.js application
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── lib/        # API and utilities
│   │   ├── types/      # TypeScript types
│   │   └── styles/     # Global styles
│   ├── public/         # Static assets
│   └── package.json
├── hero.png            # Landing page image
├── rcc_placeholder.png # Default candidate image
└── README.md
```

## Troubleshooting

### Backend Issues
```bash
# Reset database
cd backend
rm db.sqlite3
python manage.py migrate
python manage.py init_db
```

### Frontend Issues
```bash
# Clear cache and reinstall
cd frontend
rm -rf .next node_modules
npm install
```

### Port Conflicts
```bash
# Backend (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Frontend
npm run dev -- -p 3001
```

## Development

- Backend runs on port 8000
- Frontend runs on port 3000
- CORS configured for local development
- Hot reload enabled on both servers

## Production Deployment

See deployment guides in:
- [Backend README](backend/README.md#production-deployment)
- [Frontend README](frontend/README.md#deployment)

## Support

For issues or questions, contact the development team.

---

**Reign City Security Team - Internal Elections 2026**
