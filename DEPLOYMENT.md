# 🚀 Deployment Guide - RCC Voting System

This guide walks you through deploying the **Reign City Security Team Voting System** to production using **Railway (Backend)** and **Vercel (Frontend)**.

---

## 📋 Prerequisites

- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Git repository with your code

---

## 🔧 Part 1: Deploy Backend to Railway

### Step 1: Push Code to GitHub

```bash
cd backend
git init
git add .
git commit -m "Initial commit - RCC Voting System Backend"
git remote add origin https://github.com/YOUR_USERNAME/rcc-voting-backend.git
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your backend repository
5. Railway will auto-detect Django and start building

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically:
   - Create a PostgreSQL database
   - Set the `DATABASE_URL` environment variable
   - Link it to your Django app

### Step 4: Configure Environment Variables

In your Railway project settings, add these variables:

```env
SECRET_KEY=your-super-secret-key-here-use-a-strong-random-string
DEBUG=False
ALLOWED_HOSTS=your-app-name.railway.app
CORS_ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
```

**To generate a secure SECRET_KEY:**
```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 5: Deploy & Initialize Database

Railway will automatically:
- Run migrations (`python manage.py migrate`)
- Initialize database with voters and candidates (`python manage.py init_db`)
- Start the server with Gunicorn

**Check deployment logs** to ensure everything runs successfully.

### Step 6: Get Your Railway URL

After deployment, Railway provides a URL like:
```
https://your-app-name.up.railway.app
```

**Save this URL** - you'll need it for the frontend!

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Push Frontend to GitHub

```bash
cd frontend
git init
git add .
git commit -m "Initial commit - RCC Voting System Frontend"
git remote add origin https://github.com/YOUR_USERNAME/rcc-voting-frontend.git
git push -u origin main
```

### Step 2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your frontend repository
4. Vercel will auto-detect Next.js

### Step 3: Configure Environment Variables

**BEFORE deploying**, add this environment variable:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-railway-domain.railway.app/api` |

*(Use the Railway URL from Part 1, Step 6)*

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your app
3. You'll get a URL like: `https://your-app-name.vercel.app`

### Step 5: Update Backend CORS

Go back to **Railway** and update the `CORS_ALLOWED_ORIGINS` variable with your Vercel URL:

```env
CORS_ALLOWED_ORIGINS=https://your-app-name.vercel.app
```

**Redeploy the backend** for changes to take effect.

---

## ✅ Part 3: Testing Your Deployment

### Test Backend API

Visit these URLs in your browser:

```
https://your-railway-domain.railway.app/api/positions/
https://your-railway-domain.railway.app/api/candidates/
https://your-railway-domain.railway.app/api/system-state/
```

You should see JSON data.

### Test Frontend

1. Visit `https://your-app-name.vercel.app`
2. Click **"Proceed to Verification"**
3. Enter a voter name (e.g., "Konzolo")
4. Cast votes
5. Test admin login at `/admin/login`
   - Username: `admin`
   - Password: `admin`

---

## 🔐 Part 4: Post-Deployment Configuration

### Update Admin Credentials (Recommended)

The admin credentials are currently hardcoded. To change them:

1. Edit `frontend/src/pages/admin/login.tsx`
2. Update the hardcoded check:
   ```typescript
   if (username === 'your-new-username' && password === 'your-new-password')
   ```
3. Commit and push changes
4. Vercel will auto-deploy

### Monitor Your Apps

- **Railway Dashboard**: Monitor backend logs, database, and resource usage
- **Vercel Dashboard**: Monitor frontend deployments and analytics

---

## 🛠️ Troubleshooting

### Backend Issues

**Problem**: Migrations not running
- **Solution**: Check Railway logs, manually run:
  ```bash
  railway run python manage.py migrate
  railway run python manage.py init_db
  ```

**Problem**: CORS errors
- **Solution**: Verify `CORS_ALLOWED_ORIGINS` includes your Vercel URL

**Problem**: Database connection errors
- **Solution**: Ensure PostgreSQL is linked to your app in Railway

### Frontend Issues

**Problem**: API calls failing
- **Solution**: Check `NEXT_PUBLIC_API_URL` is set correctly in Vercel

**Problem**: 404 errors
- **Solution**: Ensure Next.js build succeeded, check Vercel logs

**Problem**: Images not loading
- **Solution**: Verify images are in `frontend/public/` directory

---

## 📊 Database Management

### Access Railway PostgreSQL

1. In Railway, click on your PostgreSQL service
2. Click **"Data"** tab to view tables
3. Or use **"Connect"** to get connection details for GUI tools

### Reset/Reinitialize Database

```bash
# Connect via Railway CLI
railway login
railway link
railway run python manage.py flush --no-input
railway run python manage.py migrate
railway run python manage.py init_db
```

---

## 🔄 Continuous Deployment

Both Railway and Vercel support automatic deployments:

- **Push to `main` branch** → Auto-deploys to production
- **Push to other branches** → Create preview deployments

### Example Workflow

```bash
# Make changes locally
git add .
git commit -m "Update candidate list"
git push origin main

# Railway and Vercel automatically deploy!
```

---

## 💰 Cost Estimate

### Free Tier Limits

| Service | Free Tier | Limits |
|---------|-----------|--------|
| **Railway** | $5 credit/month | ~500 hours, PostgreSQL included |
| **Vercel** | Free | 100GB bandwidth, unlimited deployments |

### When to Upgrade

- **Railway**: Upgrade when you exceed $5/month (~$20/month for Pro)
- **Vercel**: Upgrade for custom domains, team features (~$20/month per user)

**For a small internal election (25 voters)**, the free tiers are sufficient!

---

## 🎯 Quick Reference

### Important URLs (Update with your actual URLs)

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend (Vercel) | `https://your-app.vercel.app` | Main voting interface |
| Backend (Railway) | `https://your-app.railway.app` | Django API |
| Admin Panel | `https://your-app.vercel.app/admin/login` | Admin dashboard |
| API Docs | `https://your-app.railway.app/api/` | API endpoints |

### Environment Variables Reference

**Backend (Railway)**:
```env
SECRET_KEY=<random-secret-key>
DEBUG=False
ALLOWED_HOSTS=<railway-domain>
CORS_ALLOWED_ORIGINS=<vercel-url>
DATABASE_URL=<auto-set-by-railway>
```

**Frontend (Vercel)**:
```env
NEXT_PUBLIC_API_URL=https://<railway-domain>/api
```

---

## 📞 Support

If you encounter issues:

1. Check Railway logs for backend errors
2. Check Vercel logs for frontend errors
3. Verify environment variables are set correctly
4. Ensure CORS settings allow your frontend domain

---

## 🎉 You're Done!

Your voting system is now live and accessible worldwide! 🚀

**Next Steps**:
- Share the voting URL with your team
- Test the complete voting flow
- Monitor the admin dashboard during voting
- Close voting and release results when ready

Good luck with your election! 🗳️
