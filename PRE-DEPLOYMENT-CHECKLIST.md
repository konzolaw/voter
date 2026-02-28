# 📋 Pre-Deployment Checklist

Use this checklist before deploying to production.

## ✅ Backend (Railway) Checklist

- [ ] Updated `requirements.txt` with all dependencies
  - [ ] Django 5.0.1
  - [ ] djangorestframework 3.14.0
  - [ ] django-cors-headers 4.3.1
  - [ ] gunicorn 21.2.0
  - [ ] psycopg2-binary 2.9.9
  - [ ] dj-database-url 2.1.0
  - [ ] whitenoise 6.6.0
  - [ ] python-decouple 3.8
  - [ ] Pillow 10.2.0

- [ ] Created `Procfile` with gunicorn command
- [ ] Created `runtime.txt` with Python version
- [ ] Created `railway.json` with build config
- [ ] Updated `settings.py` to support PostgreSQL
- [ ] Added WhiteNoise middleware for static files
- [ ] Created `.env.example` with all required variables
- [ ] Verified `.gitignore` excludes sensitive files

## ✅ Frontend (Vercel) Checklist

- [ ] Created `vercel.json` configuration
- [ ] Created `.env.example` with API URL template
- [ ] API client uses `NEXT_PUBLIC_API_URL` env variable
- [ ] All API calls use relative paths (/api/...)
- [ ] Images are in `public/` directory
- [ ] Updated `next.config.js` for production
- [ ] Verified `.gitignore` excludes build files

## ✅ Environment Variables

### Backend (Set in Railway)
- [ ] `SECRET_KEY` - Strong random key (REQUIRED)
- [ ] `DEBUG` - Set to `False` (REQUIRED)
- [ ] `ALLOWED_HOSTS` - Your Railway domain (REQUIRED)
- [ ] `CORS_ALLOWED_ORIGINS` - Your Vercel URL (REQUIRED)
- [ ] `DATABASE_URL` - Auto-set by Railway PostgreSQL

### Frontend (Set in Vercel)
- [ ] `NEXT_PUBLIC_API_URL` - Your Railway API URL (REQUIRED)

## ✅ Security Checklist

- [ ] Changed default admin credentials (username/password)
- [ ] Generated strong `SECRET_KEY` for Django
- [ ] Set `DEBUG=False` in production
- [ ] Configured CORS to only allow your frontend domain
- [ ] Verified `ALLOWED_HOSTS` only includes your domain
- [ ] Reviewed all hardcoded credentials

## ✅ Database Checklist

- [ ] Migrations are up to date
- [ ] `init_db` command runs successfully
- [ ] All 25 voters are registered
- [ ] All 12 candidates are registered
- [ ] All 4 positions are created
- [ ] Test voting flow works locally

## ✅ Testing Checklist

### Local Testing
- [ ] Backend runs on `http://localhost:8000`
- [ ] Frontend runs on `http://localhost:3000`
- [ ] Can verify voter by name
- [ ] Can submit votes for all 4 positions
- [ ] Admin login works (admin/admin)
- [ ] Admin can view voters list
- [ ] Admin can view vote statistics
- [ ] Admin can close voting
- [ ] Admin can release results
- [ ] Results page shows winners after release

### Post-Deployment Testing
- [ ] Backend API accessible via Railway URL
- [ ] Frontend loads on Vercel URL
- [ ] Voter verification works
- [ ] Vote submission works
- [ ] Admin login works
- [ ] Admin dashboard loads data
- [ ] Close voting function works
- [ ] Release results function works
- [ ] Conflict resolution algorithm executes
- [ ] Final results display correctly

## ✅ Git & Repository Checklist

- [ ] Code committed to Git
- [ ] Pushed to GitHub repository
- [ ] `.env` files NOT committed (in .gitignore)
- [ ] `db.sqlite3` NOT committed (in .gitignore)
- [ ] `node_modules/` NOT committed (in .gitignore)
- [ ] Sensitive data removed from code

## ✅ Documentation Checklist

- [ ] `README.md` is complete
- [ ] `DEPLOYMENT.md` is complete
- [ ] Environment variable examples provided
- [ ] Admin credentials documented
- [ ] Voter list documented
- [ ] Candidate list documented

## ✅ Final Deployment Steps

### Backend Deployment to Railway
1. [ ] Create Railway project from GitHub repo
2. [ ] Add PostgreSQL database service
3. [ ] Set all environment variables
4. [ ] Wait for successful build
5. [ ] Verify migrations ran (`init_db` command)
6. [ ] Test API endpoints
7. [ ] Copy Railway URL for frontend config

### Frontend Deployment to Vercel
1. [ ] Create Vercel project from GitHub repo
2. [ ] Set `NEXT_PUBLIC_API_URL` environment variable
3. [ ] Deploy and wait for build
4. [ ] Test frontend loads
5. [ ] Copy Vercel URL

### Post-Deployment Configuration
1. [ ] Update Railway `CORS_ALLOWED_ORIGINS` with Vercel URL
2. [ ] Redeploy Railway backend
3. [ ] Test complete voter flow
4. [ ] Test admin dashboard
5. [ ] Test all API endpoints
6. [ ] Verify no CORS errors

## ✅ Go-Live Checklist

- [ ] All voters notified of voting URL
- [ ] Voting period start time announced
- [ ] Admin credentials secured
- [ ] Monitoring dashboard access ready
- [ ] Backup plan for technical issues
- [ ] Support contact info shared with voters

## 🎉 Ready to Deploy!

Once all items are checked, you're ready to deploy to production!

**Estimated deployment time:** 30-45 minutes

**Before starting:**
- Have your GitHub account ready
- Have Railway account set up
- Have Vercel account set up
- Set aside uninterrupted time for deployment

**Good luck with your election!** 🗳️
