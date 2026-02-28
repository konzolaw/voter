# 🚀 Deployment Guide - RCC Voting System (Render + Vercel)

Complete guide to deploy the **Reign City Security Team Voting System** using **Render (Backend)** and **Vercel (Frontend)**.

---

## 📋 Prerequisites

- GitHub account
- Render account (sign up at [render.com](https://render.com))
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Git repository with your code

---

## 🔧 Part 1: Deploy Backend to Render

### Step 1: Push Code to GitHub

```bash
cd backend
git init
git add .
git commit -m "Initial commit - RCC Voting System Backend"
git remote add origin https://github.com/YOUR_USERNAME/rcc-voting-backend.git
git push -u origin main
```

### Step 2: Create Render Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your backend repository

### Step 3: Configure Web Service

**Name**: `rcc-voting-backend` (or your preferred name)

**Region**: Choose closest to your users

**Branch**: `main`

**Runtime**: `Python 3`

**Build Command**:
```bash
./build.sh
```

**Start Command**:
```bash
gunicorn voting_system.wsgi:application
```

**Instance Type**: `Free`

### Step 4: Add PostgreSQL Database

1. In the Render dashboard, click **"New +"** → **"PostgreSQL"**
2. **Name**: `rcc-voting-db`
3. **Database**: `rcc_voting`
4. **User**: `rcc_admin`
5. **Region**: Same as your web service
6. **Plan**: `Free`
7. Click **"Create Database"**

### Step 5: Link Database to Web Service

1. Go back to your web service settings
2. Scroll to **"Environment Variables"**
3. Add `DATABASE_URL`:
   - Click **"Add Environment Variable"**
   - **Key**: `DATABASE_URL`
   - **Value**: Click "Add from Database" → Select `rcc-voting-db` → `Internal Database URL`

### Step 6: Configure Environment Variables

Add these environment variables in your web service:

| Key | Value | Notes |
|-----|-------|-------|
| `SECRET_KEY` | [Generate one](#generate-secret-key) | Django secret key |
| `DEBUG` | `False` | Production mode |
| `ALLOWED_HOSTS` | `your-app-name.onrender.com` | Your Render domain |
| `CORS_ALLOWED_ORIGINS` | `https://your-vercel-domain.vercel.app` | Your frontend URL (add later) |
| `PYTHON_VERSION` | `3.11.0` | Python version |

#### Generate SECRET_KEY

Run this locally:
```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output and use it as your `SECRET_KEY`.

### Step 7: Make build.sh Executable

Before deploying, ensure `build.sh` has execute permissions. Add this to your repository:

```bash
chmod +x build.sh
git add build.sh
git commit -m "Make build script executable"
git push
```

### Step 8: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Install dependencies from `requirements.txt`
   - Run `build.sh` (collectstatic, migrate, init_db)
   - Start Django with Gunicorn

**Wait 5-10 minutes** for the first deployment.

### Step 9: Verify Backend is Running

Your backend will be available at:
```
https://your-app-name.onrender.com
```

Test these URLs:
- `https://your-app-name.onrender.com/api/positions/`
- `https://your-app-name.onrender.com/api/candidates/`
- `https://your-app-name.onrender.com/api/system-state/`

You should see JSON responses.

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

**Key**: `NEXT_PUBLIC_API_URL`  
**Value**: `https://your-render-app-name.onrender.com/api`

*(Use your Render URL from Part 1, Step 9)*

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy (takes 2-3 minutes)
3. You'll get a URL like: `https://your-app-name.vercel.app`

### Step 5: Update Backend CORS

1. Go back to **Render** dashboard
2. Navigate to your web service
3. Go to **"Environment"**
4. Update `CORS_ALLOWED_ORIGINS`:
   ```
   https://your-app-name.vercel.app,http://localhost:3000
   ```
5. Click **"Save Changes"**
6. Render will automatically redeploy

---

## ✅ Part 3: Testing Your Deployment

### Test Backend API

Visit these URLs in your browser:

```
https://your-render-app.onrender.com/api/positions/
https://your-render-app.onrender.com/api/candidates/
https://your-render-app.onrender.com/api/system-state/
```

✅ You should see JSON data.

### Test Frontend

1. Visit `https://your-app-name.vercel.app`
2. Click **"Proceed to Verification"**
3. Enter a voter name (e.g., "Konzolo" or "Mercy")
4. Cast votes for all 4 positions
5. Check thank you page

### Test Admin Dashboard

1. Visit `https://your-app-name.vercel.app/admin/login`
2. **Username**: `admin`
3. **Password**: `admin`
4. Navigate through:
   - Overview (system stats)
   - Voters (list of voters)
   - Votes (vote breakdown)
   - Control (close voting & release results)

---

## 🔐 Part 4: Post-Deployment Security

### Update Admin Credentials (IMPORTANT!)

The default admin credentials are hardcoded. Change them:

1. Edit `frontend/src/pages/admin/login.tsx`
2. Update line with credentials check:
   ```typescript
   if (username === 'your-new-username' && password === 'your-new-password')
   ```
3. Commit and push:
   ```bash
   git add .
   git commit -m "Update admin credentials"
   git push
   ```
4. Vercel will auto-deploy the update

---

## 🛠️ Troubleshooting

### Backend Issues

**Problem**: Build fails on Render

**Solutions**:
- Check that `build.sh` is executable (`chmod +x build.sh`)
- Verify `requirements.txt` has all dependencies
- Check Render logs for specific error

**Problem**: Database connection errors

**Solutions**:
- Verify `DATABASE_URL` is set correctly
- Make sure PostgreSQL database is created
- Check database is in the same region as web service

**Problem**: CORS errors

**Solutions**:
- Verify `CORS_ALLOWED_ORIGINS` includes your Vercel URL
- Make sure there are no typos in the URLs
- Include protocol (`https://`)

**Problem**: Static files not loading

**Solutions**:
- Verify `build.sh` runs `collectstatic`
- Check `STATIC_ROOT` in `settings.py`
- Ensure WhiteNoise is in `MIDDLEWARE`

### Frontend Issues

**Problem**: API calls failing (Network Error)

**Solutions**:
- Check `NEXT_PUBLIC_API_URL` is set in Vercel
- Verify Render backend is running
- Test backend URL directly in browser

**Problem**: Images not displaying

**Solutions**:
- Ensure images are in `frontend/public/` directory
- Check `next.config.js` has correct image configuration
- Verify build succeeded on Vercel

**Problem**: 404 on page refresh

**Solution**: Next.js handles this automatically, but verify Vercel deployment succeeded

---

## 🚨 Important Notes

### Render Free Tier Limitations

- **Web services** spin down after 15 minutes of inactivity
- **First request** after spin-down takes 30-60 seconds (cold start)
- **Solution**: Upgrade to paid plan ($7/month) for always-on service

### Database Backups

Render Free PostgreSQL:
- Automatically backs up daily
- Access backups in database dashboard
- Export data manually for extra safety

### Monitoring

**Render Dashboard**:
- View deployment logs
- Monitor resource usage
- Check database metrics

**Vercel Dashboard**:
- View deployment status
- Monitor analytics
- Check function logs

---

## 📊 Cost Breakdown

| Service | Plan | Cost | Features |
|---------|------|------|----------|
| **Render Web Service** | Free | $0 | 750 hrs/month, auto-sleep |
| **Render PostgreSQL** | Free | $0 | 90-day limit, 1GB storage |
| **Vercel** | Hobby | $0 | 100GB bandwidth, unlimited deployments |

**For production elections**: Consider upgrading Render to Starter ($7/month) for always-on service.

---

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:

- **Push to `main` branch** → Auto-deploys to production
- **Push to other branches** → Creates preview deployments (Vercel only)

### Example Workflow

```bash
# Make changes locally
git add .
git commit -m "Update candidate list"
git push origin main

# Render and Vercel automatically deploy!
```

---

## 📍 Quick Reference

### Your Deployment URLs (Update these!)

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend (Vercel)** | `https://your-app.vercel.app` | Main voting interface |
| **Backend (Render)** | `https://your-app.onrender.com` | Django API |
| **Admin Panel** | `https://your-app.vercel.app/admin/login` | Admin dashboard |
| **PostgreSQL** | Internal Render URL | Database |

### Environment Variables Quick Copy

**Backend (Render)**:
```env
SECRET_KEY=<generate-random-key>
DEBUG=False
ALLOWED_HOSTS=<your-app>.onrender.com
CORS_ALLOWED_ORIGINS=https://<your-app>.vercel.app
PYTHON_VERSION=3.11.0
DATABASE_URL=<auto-provided-by-render>
```

**Frontend (Vercel)**:
```env
NEXT_PUBLIC_API_URL=https://<your-app>.onrender.com/api
```

---

## 🎯 Deployment Checklist

### Before Deploying

- [ ] Code pushed to GitHub (backend and frontend)
- [ ] `build.sh` is executable
- [ ] `.env` files NOT committed to Git
- [ ] Generated strong `SECRET_KEY`
- [ ] Reviewed admin credentials

### Backend (Render)

- [ ] Created Web Service
- [ ] Created PostgreSQL database
- [ ] Linked database to web service
- [ ] Set all environment variables
- [ ] Deployment succeeded
- [ ] API endpoints responding

### Frontend (Vercel)

- [ ] Imported repository
- [ ] Set `NEXT_PUBLIC_API_URL`
- [ ] Deployment succeeded
- [ ] Site loads correctly

### Post-Deployment

- [ ] Updated backend CORS with Vercel URL
- [ ] Tested voter verification
- [ ] Tested vote submission
- [ ] Tested admin login
- [ ] Tested admin functions (close voting, release results)
- [ ] Changed default admin credentials

---

## 🎉 You're Live!

Your voting system is now deployed and ready for your election!

**Next Steps**:
1. Share the voting URL with your team
2. Test the complete flow with a test voter
3. Monitor the admin dashboard
4. Close voting when ready
5. Release results using conflict resolution

**Good luck with your election!** 🗳️

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Django Deployment**: https://docs.djangoproject.com/en/5.0/howto/deployment/
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

**Last Updated**: February 28, 2026  
**Stack**: Django 5.0 + Next.js 14 + PostgreSQL + Render + Vercel
