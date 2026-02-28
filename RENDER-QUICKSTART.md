# ✅ Render + Vercel Deployment - Quick Start

## 📦 Files Created for Render Deployment

### Backend Files
- ✅ `backend/render.yaml` - Render blueprint configuration
- ✅ `backend/build.sh` - Build script (migrations, collectstatic, init_db)
- ✅ `backend/requirements.txt` - Updated with production dependencies
- ✅ `backend/.env.example` - Updated for Render

### Frontend Files  
- ✅ `frontend/vercel.json` - Vercel deployment config
- ✅ `frontend/.env.example` - Updated for Render backend

### Documentation
- ✅ `RENDER-DEPLOYMENT.md` - Complete deployment guide

---

## 🚀 Quick Deployment Steps

### 1. Backend to Render

1. Push code to GitHub
2. Create Render account at [render.com](https://render.com)
3. Create **New Web Service** from your GitHub repo
4. Add **PostgreSQL database**
5. Set environment variables (see guide)
6. Deploy!

**Build Command**: `./build.sh`  
**Start Command**: `gunicorn voting_system.wsgi:application`

### 2. Frontend to Vercel

1. Push code to GitHub
2. Create Vercel account at [vercel.com](https://vercel.com)
3. Import your GitHub repo
4. Add env variable: `NEXT_PUBLIC_API_URL=https://your-app.onrender.com/api`
5. Deploy!

### 3. Connect Them

1. Get your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Update Render environment variable:
   - `CORS_ALLOWED_ORIGINS=https://your-app.vercel.app`
3. Redeploy backend

---

## 📝 Environment Variables Needed

### Render Backend

```env
SECRET_KEY=<generate-with-django>
DEBUG=False
ALLOWED_HOSTS=your-app-name.onrender.com
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
PYTHON_VERSION=3.11.0
DATABASE_URL=<auto-added-when-you-link-postgresql>
```

**Generate SECRET_KEY**:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Vercel Frontend

```env
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com/api
```

---

## ✅ Local Development Still Works!

Everything works locally as before:

```bash
# Backend
cd backend
venv\Scripts\activate  # Windows
python manage.py runserver

# Frontend
cd frontend
npm run dev
```

**Local URLs**:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- Admin: http://localhost:3000/admin/login

---

## 🔍 Testing Checklist

### After Deploying Backend (Render)

Test these URLs in browser:
- [ ] `https://your-app.onrender.com/api/positions/` - Should show JSON
- [ ] `https://your-app.onrender.com/api/candidates/` - Should show JSON
- [ ] `https://your-app.onrender.com/api/system-state/` - Should show JSON

### After Deploying Frontend (Vercel)

- [ ] Homepage loads
- [ ] Can click "Proceed to Verification"
- [ ] Can enter voter name
- [ ] Can see candidate list
- [ ] Admin login works (admin/admin)

### Full Integration Test

1. [ ] Verify as voter (e.g., "Mercy")
2. [ ] Submit votes for all 4 positions
3. [ ] See thank you page
4. [ ] Login to admin
5. [ ] See vote recorded in admin dashboard
6. [ ] Close voting (admin)
7. [ ] Release results (admin)
8. [ ] View winners on results page

---

## ⚠️ Important Notes

### Render Free Tier

- **Auto-sleep**: Services sleep after 15 min of inactivity
- **Cold start**: First request after sleep takes 30-60 seconds
- **Solution**: Upgrade to $7/month for always-on service

### Security

🔐 **Change admin credentials** after deployment!

Edit `frontend/src/pages/admin/login.tsx`:
```typescript
if (username === 'your-new-username' && password === 'your-new-password')
```

---

## 📖 Full Documentation

Read the complete guide: **[RENDER-DEPLOYMENT.md](./RENDER-DEPLOYMENT.md)**

Includes:
- Step-by-step deployment instructions
- Troubleshooting guide
- Cost breakdown
- Continuous deployment setup

---

## 🎯 Ready to Deploy?

1. ✅ All dependencies installed
2. ✅ Configuration files created
3. ✅ Local testing passed
4. ✅ Documentation complete

**Follow the guide and deploy!** 🚀

---

**Need Help?**
- Check `RENDER-DEPLOYMENT.md` for detailed instructions
- Review Render logs if deployment fails
- Test locally first to verify everything works
