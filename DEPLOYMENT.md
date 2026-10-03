# 🚀 Production Deployment Guide (Vercel + Supabase)

Deploying the **Reign City Security Team Voting System** takes under 10 minutes and runs 100% serverless on the free tiers of Vercel and Supabase.

---

## Step 1: Create and Initialize Supabase

1. Sign in or sign up at [supabase.com](https://supabase.com).
2. Click **New project**, choose an organization, set a project name (e.g. `rcc-voting`), and choose a region close to your voters.
3. Once the database is ready:
   - Go to the **SQL Editor** in the left sidebar.
   - Click **New query**.
   - Copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and paste it into the editor.
   - Click **Run**.
4. Retrieve your API Keys:
   - Go to **Project Settings** -> **API**.
   - Copy the following:
     - **Project URL**
     - **`anon` public key**
     - **`service_role` secret key**

---

## Step 2: Push Code to GitHub

Make sure all your changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Migrate to serverless Next.js and Supabase"
git push origin main
```

---

## Step 3: Deploy to Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`voter`).
4. Vercel will automatically detect **Next.js**. Keep all default build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
5. In the **Environment Variables** section, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | Supabase Public Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Supabase Service Role Secret Key |
| `NEXT_PUBLIC_API_URL` | `/api` | Relative API path |

6. Click **Deploy**.
7. Vercel will build and deploy your application in ~60 seconds. You will get a live URL (e.g. `https://rcc-voting.vercel.app`).

---

## Step 4: Verification Checklist

After deployment, test the following:
- [ ] Visit the homepage and check that positions and voter counts load.
- [ ] Test verifying a registered voter (e.g. "Konzolo") at `/verify`.
- [ ] Test casting a test ballot and verifying the `/thank-you` screen.
- [ ] Log in to `/admin/login` (admin / admin) and verify real-time voter turnout and statistics.
