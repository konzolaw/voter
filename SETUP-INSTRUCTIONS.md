# 🚀 Quick Setup Instructions

## ⚠️ CRITICAL: Configure Vercel Environment Variable

Your frontend **CANNOT** connect to the backend without this!

### Step 1: Add Environment Variable to Vercel

1. Go to https://vercel.com/dashboard
2. Click on your **voter** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter these EXACT values:

   **Variable Name:**
   ```
   NEXT_PUBLIC_API_URL
   ```

   **Variable Value:**
   ```
   https://voter-z29d.onrender.com/api
   ```

6. **Environment:** Check ALL boxes (Production, Preview, Development)
7. Click **Save**

### Step 2: Redeploy Vercel

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait ~1 minute for deployment to complete

---

## 📋 How to Add Dorcas as a Candidate

### Option 1: Use the Restart Voting Button (Recommended)

1. Go to https://voter-rvgn.vercel.app/admin/control
2. Scroll down to the red "DANGER ZONE" section
3. Click **"🔄 Restart Voting"** button
4. Follow the confirmation prompts (type "YES")
5. This will:
   - ✅ Reset the entire database
   - ✅ Add all 26 voters (including Dorcas)
   - ✅ Add all 13 candidates (including Dorcas)
   - ✅ Reopen voting

### Option 2: Manually Add Dorcas via API

Run this command in Render Shell (Render Dashboard → Your Service → Shell):

```bash
python manage.py shell
```

Then paste:

```python
from api.models import Candidate, Position
dorcas = Candidate.objects.create(full_name="Dorcas", eligible=True)
dorcas.positions.set(Position.objects.all())
print("✅ Dorcas added as candidate!")
exit()
```

---

## 🔍 Verify Everything Works

1. **Frontend:** https://voter-rvgn.vercel.app
2. **Backend:** https://voter-z29d.onrender.com/api/system-state/
3. **Admin Panel:** https://voter-rvgn.vercel.app/admin
   - Username: `admin`
   - Password: `admin`

### Check Dorcas is Added:
- Go to https://voter-z29d.onrender.com/api/candidates/
- You should see Dorcas in the list

---

## 🎯 Your Deployment URLs

- **Frontend (Vercel):** https://voter-rvgn.vercel.app
- **Backend (Render):** https://voter-z29d.onrender.com
- **GitHub Repo:** https://github.com/konzolaw/voter

---

## 🛠️ Admin Features

### Voter Management
- **View all voters:** `/admin/voters`
- **Add new voter:** Click "+ Add Voter" button
- **Remove voter:** Click "Remove" (only if they haven't voted)

### Control Panel
- **Open/Close voting:** `/admin/control`
- **Release results:** `/admin/control`
- **Restart voting:** `/admin/control` (red DANGER ZONE)

### View Data
- **Vote breakdown:** `/admin/votes`
- **Live results:** `/results`
- **System stats:** Check control panel dashboard

---

## ❗ Common Issues

### "Voting is closed" but it should be open
→ Use the **Restart Voting** button in admin control panel

### "Failed to load" errors
→ Make sure `NEXT_PUBLIC_API_URL` is set in Vercel and redeployed

### Dorcas not showing up
→ Either use **Restart Voting** or manually add via Render Shell

### Changes not appearing
→ Wait 2-3 minutes for Render auto-deploy after Git push

---

## 📊 Current Database State (After Restart)

- **Positions:** 4 (Team Lead, Program Coordinator, Secretary, Treasurer)
- **Voters:** 26 (Original 25 + Dorcas)
- **Candidates:** 13 (Original 12 + Dorcas)
- **Voting Status:** OPEN (after restart)

---

## 🔐 Security Notes

- Admin credentials are hardcoded (admin/admin) - **change in production!**
- SECRET_KEY is already set in Render environment variables
- CORS is configured for your Vercel domain
- Database is PostgreSQL (managed by Render)

---

Need help? Check the logs:
- **Render logs:** Dashboard → Your Service → Logs
- **Vercel logs:** Dashboard → Your Project → Deployments → Click deployment → View Function Logs
