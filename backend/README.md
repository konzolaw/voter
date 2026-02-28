# Backend - Django REST Framework

## Setup Instructions

### 1. Create Virtual Environment

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

Create a `.env` file in the backend directory:

```
SECRET_KEY=your-secret-key-here-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### 5. Run Migrations

```bash
python manage.py migrate
```

### 6. Initialize Database

This command creates all 4 positions, 25 voters, and 12 eligible candidates:

```bash
python manage.py init_db
```

### 7. Create Admin User

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

### 8. Run Development Server

```bash
python manage.py runserver
```

The API will be available at: `http://localhost:8000`

## Django Admin

Access the admin panel at: `http://localhost:8000/admin/`

From here you can:
- View all voters and their voting status
- See vote records
- Monitor system state
- View candidates and positions

## API Documentation

### Public Endpoints

**GET /api/positions/**
```json
[
  {
    "id": 1,
    "name": "team_lead",
    "display_name": "Team Lead",
    "description": "Overall leader of the Reign City Security Team..."
  }
]
```

**GET /api/candidates/**
```json
[
  {
    "id": 1,
    "full_name": "Konzolo",
    "image": null,
    "eligible": true,
    "positions": [...]
  }
]
```

**POST /api/verify-voter/**
```json
{
  "full_name": "John Doe",
  "device_hash": "abc123..."
}
```

**POST /api/submit-votes/**
```json
{
  "full_name": "John Doe",
  "device_hash": "abc123...",
  "votes": [
    {"position_id": 1, "candidate_id": 3},
    {"position_id": 2, "candidate_id": 5},
    {"position_id": 3, "candidate_id": 2},
    {"position_id": 4, "candidate_id": 7}
  ]
}
```

### Admin Endpoints (Requires Authentication)

**POST /api/close-voting/**
```json
{
  "success": true,
  "message": "Voting has been closed"
}
```

**POST /api/release-results/**
```json
{
  "success": true,
  "message": "Results have been released"
}
```

**GET /api/stats/**
```json
{
  "total_voters": 25,
  "voted_count": 20,
  "pending_count": 5,
  "turnout_percentage": 80.0,
  "position_breakdown": [...]
}
```

## Database Schema

### Position
- name (choices: team_lead, program_coordinator, secretary, treasurer)
- description
- created_at

### Voter
- full_name
- first_name (unique)
- allowed (boolean)
- has_voted (boolean)
- device_hash (nullable)
- voted_at (nullable datetime)

### Candidate
- full_name
- image (optional)
- eligible (boolean)
- positions (ManyToMany)

### Vote
- voter (ForeignKey)
- position (ForeignKey)
- candidate (ForeignKey)
- timestamp
- **Constraint**: unique_together (voter, position)

### SystemState (Singleton)
- voting_open (boolean)
- results_released (boolean)
- voting_closed_at (nullable datetime)
- results_released_at (nullable datetime)

### FinalResult
- position (ForeignKey)
- winner (ForeignKey)
- vote_count (integer)
- resolved_at (datetime)

## Management Commands

### Initialize Database
```bash
python manage.py init_db
```

Creates:
- 4 positions with descriptions
- 25 voters (all allowed to vote)
- 12 eligible candidates (eligible for all positions)

### Other Useful Commands

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Access Python shell
python manage.py shell
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Kill process on port 8000 (Mac/Linux)
lsof -ti:8000 | xargs kill -9
```

### Reset Database
```bash
rm db.sqlite3
python manage.py migrate
python manage.py init_db
```

### CORS Issues
Make sure `CORS_ALLOWED_ORIGINS` in `.env` includes your frontend URL.
