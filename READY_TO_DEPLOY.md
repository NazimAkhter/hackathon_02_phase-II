# 🚀 Ready-to-Deploy Guide - Copy & Paste Values

**Generated**: 2026-02-09
**Your BETTER_AUTH_SECRET**: `94+773XiTiRiggbG+yChXv6ofkW/Ih9uwIl25NZwlQL/uD10FTTTEQB/x0XuAUr4cIMguVZlyfKUhAamnbhM3g==`

---

## Step 1: Push Code to GitHub (REQUIRED FIRST)

Your SSH keys aren't configured. Use HTTPS instead:

```bash
cd /e/GIAIC/Quarter-04/hackathon_02/hackathon_02_phase-II
git remote set-url origin https://github.com/NazimAkhter/hackathon_02_phase-II.git
git push origin 006-deployment-cicd
```

**Enter your GitHub credentials when prompted.**

---

## Step 2: Deploy Backend (Hugging Face Spaces)

### 2.1 Create Space

1. Visit: https://huggingface.co/new-space
2. Fill in:
   - **Space name**: `todo-backend-api`
   - **License**: Apache 2.0
   - **SDK**: Docker
   - **Hardware**: CPU basic (free)
   - **Visibility**: Public
3. Click **"Create Space"**

### 2.2 Link GitHub Repository

1. In your new Space, go to **"Settings"** tab
2. Find **"Repository"** section
3. Click **"Link to GitHub"**
4. Select: `NazimAkhter/hackathon_02_phase-II`
5. Branch: `main`
6. **Subdirectory**: `backend/` ⚠️ IMPORTANT
7. Enable **"Auto-rebuild on push"** ✓

### 2.3 Add Environment Variables

Go to **Settings → Variables and secrets**, add these:

**Copy-paste these values:**

```
BETTER_AUTH_SECRET
Value: 94+773XiTiRiggbG+yChXv6ofkW/Ih9uwIl25NZwlQL/uD10FTTTEQB/x0XuAUr4cIMguVZlyfKUhAamnbhM3g==
☑ Mark as Secret
```

```
DATABASE_URL
Value: postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
☑ Mark as Secret
```

```
ENVIRONMENT
Value: production
☐ Public
```

```
PORT
Value: 7860
☐ Public
```

```
FRONTEND_URL
Value: https://placeholder.vercel.app
☐ Public
(You'll update this after Vercel deployment)
```

### 2.4 Wait for Build

- Build takes 5-10 minutes
- Monitor in Space interface
- Once complete, your backend URL will be: `https://huggingface.co/spaces/[your-username]/todo-backend-api`

**Save your backend URL here:**
```
Backend URL: _________________________________
```

---

## Step 3: Deploy Frontend (Vercel)

### 3.1 Import Project

1. Visit: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select: `NazimAkhter/hackathon_02_phase-II`
4. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `frontend/` ⚠️ CRITICAL
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3.2 Add Environment Variables

Click **"Environment Variables"** and add for **Production AND Preview**:

**Copy-paste these values:**

```
BETTER_AUTH_SECRET
Value: 94+773XiTiRiggbG+yChXv6ofkW/Ih9uwIl25NZwlQL/uD10FTTTEQB/x0XuAUr4cIMguVZlyfKUhAamnbhM3g==
```

```
DATABASE_URL
Value: postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

```
NEXT_PUBLIC_API_URL
Value: [YOUR BACKEND URL FROM STEP 2.4]
Example: https://huggingface.co/spaces/nazimakhter/todo-backend-api
```

```
NODE_ENV
Value: production
```

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your frontend URL will be: `https://[project-name].vercel.app`

**Save your frontend URL here:**
```
Frontend URL: _________________________________
```

---

## Step 4: Connect Deployments

### 4.1 Update Backend FRONTEND_URL

1. Go to HF Space → **Settings → Variables**
2. Edit `FRONTEND_URL`
3. Change to: `[YOUR FRONTEND URL FROM STEP 3.3]`
4. Save (Space will auto-rebuild, 2-3 minutes)

### 4.2 Update Frontend NEXT_PUBLIC_API_URL (if needed)

If you used placeholder in Step 3.2:
1. Go to Vercel → **Settings → Environment Variables**
2. Edit `NEXT_PUBLIC_API_URL`
3. Change to: `[YOUR BACKEND URL FROM STEP 2.4]`
4. Redeploy (Vercel → Deployments → Redeploy)

---

## Step 5: Validate Deployment

### Test Backend

Visit: `[YOUR BACKEND URL]`

Expected response:
```json
{
  "status": "ok",
  "environment": "production",
  "database": "connected"
}
```

Visit: `[YOUR BACKEND URL]/docs`
- Should show Swagger UI with all API endpoints

### Test Frontend

Visit: `[YOUR FRONTEND URL]`
- Landing page should load
- No errors in browser console

### Test Complete Journey

1. Visit: `[YOUR FRONTEND URL]/signup`
2. Create account
3. Sign in
4. Create task
5. Edit task
6. Delete task
7. Verify no CORS errors in console

---

## Quick Reference

**Your Credentials:**
```
BETTER_AUTH_SECRET: 94+773XiTiRiggbG+yChXv6ofkW/Ih9uwIl25NZwlQL/uD10FTTTEQB/x0XuAUr4cIMguVZlyfKUhAamnbhM3g==

DATABASE_URL: postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Your URLs:**
```
Backend:  _________________________________
Frontend: _________________________________
API Docs: [Backend URL]/docs
```

---

## Troubleshooting

### Git Push Fails
```bash
# Use HTTPS
git remote set-url origin https://github.com/NazimAkhter/hackathon_02_phase-II.git
git push origin 006-deployment-cicd
```

### Build Fails
- **Vercel**: Check root directory is `frontend/`
- **HF Spaces**: Check subdirectory is `backend/`

### CORS Errors
- Verify FRONTEND_URL in backend matches Vercel URL exactly
- Wait for backend rebuild after updating FRONTEND_URL

---

**Status**: ✅ All values ready - Start with Step 1!
