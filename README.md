# 🗳️ Reign City Security Team Voting System (Serverless)

A modern, secure, and fast serverless voting platform built with **Next.js (React + TypeScript)**, **Tailwind CSS**, and **Supabase (PostgreSQL)**.

---

## ⚡ Tech Stack & Architecture

- **Frontend & Fullstack API**: Next.js 14 with TypeScript & Tailwind CSS
- **Database & Storage**: [Supabase](https://supabase.com) (PostgreSQL + Storage)
- **Deployment Platform**: [Vercel](https://vercel.com) (Zero-config Serverless)
- **Security & Integrity**: Device fingerprinting, atomic PostgreSQL voting transactions, single-vote enforcement, and victory margin conflict resolution.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase Database
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open [`supabase/schema.sql`](supabase/schema.sql), paste its contents, and click **Run**.
   - This sets up all tables, relations, the atomic voting function, and seeds the 4 positions, 26 voters, and 13 candidates.

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` (or update `.env.local`):
```bash
cp .env.example .env.local
```

Fill in your project credentials from **Supabase Dashboard -> Project Settings -> API**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

NEXT_PUBLIC_API_URL=/api
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Application Flow

### Voter Flow
1. **Landing Page (`/`)**: Displays election status and countdown/action buttons.
2. **Verification (`/verify`)**: Validates the voter's identity against the registered voter list and checks device fingerprinting to prevent multi-device voting.
3. **Ballot (`/ballot`)**: Interactive voting interface for all 4 positions (Team Lead, Program Coordinator, Secretary, Treasurer).
4. **Thank You (`/thank-you`)**: Confirms receipt of the vote and guides the voter to wait for results.
5. **Results (`/results`)**: Shows official winners and vote tallies once released by the administrator.

### Admin Portal (`/admin`)
- **Login (`/admin/login`)**: Default admin credentials: `admin` / `admin`.
- **Dashboard (`/admin`)**: Real-time voter turnout percentage and vote tallies.
- **Control Panel (`/admin/control`)**:
  - Close Voting
  - Release Results (Executes conflict-resolution algorithm to prevent one candidate winning multiple positions)
  - Restart Voting (Resets election state and voters)
- **Voters Management (`/admin/voters`)**: Add/remove voters from the roster.
- **Votes Overview (`/admin/votes`)**: Breakdown of votes by candidate and position.

---

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for quick instructions on deploying to **Vercel** with Supabase.
