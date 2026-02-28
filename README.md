# Reign City Security Team Voting System

A secure internal voting web application for team elections with anonymous voting, device locking, and conflict resolution.

## Architecture

- **Backend**: Django REST Framework with SQLite
- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Features**:
  - Anonymous voting with name verification
  - Device fingerprint locking
  - Admin-controlled voting and result release
  - Conflict resolution for multi-position candidates
  - Real-time statistics
  - Professional glassmorphism UI

## Project Structure

```
RCC voter/
├── backend/          # Django REST Framework API
├── frontend/         # Next.js frontend
├── hero.png         # Landing page hero image
└── rcc_placeholder.png  # Default candidate image
```

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Initialize database with voters and candidates:
```bash
python manage.py init_db
```

7. Create a superuser for admin access:
```bash
python manage.py createsuperuser
```

8. Run the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Voting Positions

1. **Team Lead** - Overall leader, answerable to patron
2. **Program Coordinator** - Organizes events and programs
3. **Secretary** - Documentation and discussions
4. **Treasurer** - Financial oversight and budgeting

## Voters (25 Total)

All 25 members can vote:
- Konzolo, Fortunate, Teddy, Mumbi, Phinehas, Mercy, Terrence, Trevor, Ricardo, Anitah, Wesley, Clinton (Eligible to contest)
- Dad Ndichu, Nancy, Love, Hope, Brandon, Enock, Judah, Denno, Vishal, Aswani, Allan, Chris, Panai (Can vote only)

## Admin Access

1. Login to Django admin: `http://localhost:8000/admin/`
2. Access admin dashboard: `http://localhost:3000/admin/dashboard`

### Admin Actions

- **Close Voting**: Stops accepting new votes
- **Release Results**: Runs conflict resolution and publishes results
- View real-time statistics and vote breakdown

## Voting Flow

1. **Landing Page** → Start Voting
2. **Verify Identity** → Enter full name
3. **Cast Ballot** → Select candidates for all 4 positions
4. **Confirmation** → Review and submit
5. **Thank You** → Wait for results
6. **Results** → View winners (after admin release)

## Key Features

### Device Locking
- Browser fingerprint prevents device switching
- One device per voter throughout the process

### Conflict Resolution
- No candidate can win multiple positions
- Algorithm prioritizes positions with highest vote margins
- Automatic recalculation for affected positions

### Security
- CSRF protection
- Transaction-based vote submission
- Database constraints prevent duplicates
- Name-based verification (any name match)

## API Endpoints

### Public
- `GET /api/positions/` - List all positions
- `GET /api/candidates/` - List eligible candidates
- `POST /api/verify-voter/` - Verify voter eligibility
- `POST /api/submit-votes/` - Submit all votes
- `GET /api/system-state/` - Get voting status
- `GET /api/results/` - Get final results

### Admin (Authentication Required)
- `POST /api/close-voting/` - Close voting
- `POST /api/release-results/` - Release results
- `GET /api/stats/` - Get voting statistics

## UI Theme

- **Colors**: Black, Gold (#D4AF37), Emerald Green (#10B981)
- **Effects**: Glassmorphism with backdrop blur
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design

## Development

### Backend
```bash
cd backend
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm run dev
```

### Database Reset
```bash
cd backend
rm db.sqlite3
python manage.py migrate
python manage.py init_db
python manage.py createsuperuser
```

## Production Deployment

### Backend (Railway/Render)
1. Set environment variables
2. Run migrations
3. Initialize database
4. Collect static files: `python manage.py collectstatic`

### Frontend (Vercel/Netlify)
1. Set `NEXT_PUBLIC_API_URL` to production API URL
2. Build: `npm run build`
3. Deploy

## License

Internal use only - Reign City Security Team
