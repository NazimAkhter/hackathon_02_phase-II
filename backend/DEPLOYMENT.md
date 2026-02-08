# Backend Deployment Guide - Hugging Face Spaces

This guide covers deploying the FastAPI backend to Hugging Face Spaces using GitHub Actions.

---

## 🎯 Prerequisites

### 1. Hugging Face Account Setup
- Create account at [huggingface.co](https://huggingface.co)
- Create a new Space:
  - Go to https://huggingface.co/new-space
  - Choose **Docker** as SDK
  - Choose a Space name (e.g., `todo-api-backend`)
  - Make it **Public** or **Private** as needed

### 2. Hugging Face Access Token
- Go to Settings → Access Tokens: https://huggingface.co/settings/tokens
- Create a new token with **Write** access
- Copy the token (you'll need it for GitHub Secrets)

### 3. Neon Database (Already Configured)
Your database is already set up at Neon PostgreSQL.
Connection string is in your `.env` file.

---

## 🔐 Configure GitHub Secrets

Go to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

Add these three secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `HF_TOKEN` | Your Hugging Face access token | `hf_xxxxxxxxxxxxx` |
| `HF_USERNAME` | Your Hugging Face username | `yourusername` |
| `HF_SPACE_NAME` | Your Space name | `todo-api-backend` |

**How to add:**
```
1. Click "New repository secret"
2. Name: HF_TOKEN
3. Secret: paste your token
4. Click "Add secret"
5. Repeat for HF_USERNAME and HF_SPACE_NAME
```

---

## ⚙️ Configure Environment Variables in Hugging Face

After creating your Space, go to:
**Your Space → Settings → Variables and secrets**

Add these environment variables:

### Required Variables

| Variable Name | Value | Example |
|---------------|-------|---------|
| `BETTER_AUTH_SECRET` | Copy from frontend/.env.local | `YMUQqkzlCJ0cCGRWx5lWKB081cETI/yqIwuixAMY9qbRGR+vXlXsgTy4Sx5oj7H41BynG1pI6NzzgjdFWhqpDQ==` |
| `DATABASE_URL` | Your Neon PostgreSQL URL | `postgresql://neondb_owner:npg_xxx@ep-xxx.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `ENVIRONMENT` | production | `production` |
| `FRONTEND_URL` | Your Vercel frontend URL | `https://your-app.vercel.app` |

### How to add in Hugging Face:

```
1. Go to your Space settings
2. Click "Variables and secrets"
3. Under "Space variables":
   - Name: BETTER_AUTH_SECRET
   - Value: paste the secret from frontend/.env.local
   - Click "Save"
4. Repeat for all variables above
```

⚠️ **CRITICAL:** `BETTER_AUTH_SECRET` **MUST** match between frontend and backend!

---

## 🚀 Deployment Process

### Automatic Deployment (Recommended)

The GitHub Actions workflow automatically deploys when you push to `main` branch:

```bash
git add .
git commit -m "Deploy backend to Hugging Face"
git push origin main
```

**What happens:**
1. GitHub Actions triggers on push to `main`
2. Validates backend files exist
3. Clones your Hugging Face Space
4. Copies backend files (Dockerfile, src/, requirements.txt)
5. Commits and pushes to Hugging Face
6. Hugging Face builds Docker image
7. Your API goes live! 🎉

### Manual Deployment

You can also trigger deployment manually:

1. Go to GitHub → Actions tab
2. Click "Deploy Backend to Hugging Face"
3. Click "Run workflow" → "Run workflow"

---

## 🔍 Verify Deployment

### 1. Check GitHub Actions
- Go to **Actions** tab in your GitHub repo
- Click on the latest workflow run
- Verify all steps show green checkmarks ✅
- Check logs for any errors

### 2. Check Hugging Face Space
- Go to your Space: `https://huggingface.co/spaces/{username}/{space-name}`
- Wait for build to complete (first build takes ~5 minutes)
- Look for "Running" status with green dot 🟢

### 3. Test API Endpoints

Once deployed, your API will be available at:
```
https://{username}-{space-name}.hf.space
```

**Test health check:**
```bash
curl https://your-username-todo-api-backend.hf.space/
```

**Expected response:**
```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.0.0",
  "cors_origins": ["https://your-app.vercel.app"],
  "message": "Task Management API is running"
}
```

**View API docs:**
```
https://your-username-todo-api-backend.hf.space/docs
```

---

## 🐛 Troubleshooting

### Build Fails on Hugging Face

**Check Space logs:**
1. Go to your Space
2. Click "Logs" tab
3. Look for error messages

**Common issues:**
- Missing environment variables → Add in Space settings
- Database connection error → Verify DATABASE_URL
- Port mismatch → Dockerfile should expose 7860

### GitHub Actions Fails

**Check workflow logs:**
1. Go to Actions tab
2. Click failed workflow
3. Expand failed step

**Common issues:**
- Missing GitHub Secrets → Add HF_TOKEN, HF_USERNAME, HF_SPACE_NAME
- Space doesn't exist → Create Space on Hugging Face first
- Invalid token → Regenerate HF token with write access

### CORS Errors from Frontend

**Issue:** Frontend can't connect to backend

**Fix:**
1. Update `FRONTEND_URL` in Hugging Face Space settings
2. Use your actual Vercel URL: `https://your-app.vercel.app`
3. Restart Space: Settings → Factory reboot

### Database Connection Issues

**Verify Neon database:**
```bash
# Test connection from local machine
psql "postgresql://neondb_owner:npg_xxx@ep-xxx.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Check Neon console:**
- Go to https://console.neon.tech
- Verify database is active
- Check connection string is correct

---

## 📊 Monitoring

### Health Check
Set up monitoring with:
- [UptimeRobot](https://uptimerobot.com) - Free monitoring
- Ping your health endpoint every 5 minutes
- Get alerts if API goes down

### View Logs
- Hugging Face Space → Logs tab
- Shows real-time application logs
- Filter by error/warning levels

---

## 🔄 Update Deployment

To update your deployed backend:

```bash
# Make changes to backend code
git add backend/
git commit -m "Update backend: add new feature"
git push origin main

# GitHub Actions automatically deploys to Hugging Face
# Wait ~5 minutes for rebuild
```

---

## 📈 Next Steps

1. ✅ Deploy backend to Hugging Face
2. ⏭️ Deploy frontend to Vercel (separate guide)
3. ⏭️ Update frontend NEXT_PUBLIC_API_URL to HF Space URL
4. ⏭️ Test full authentication flow
5. ⏭️ Set up custom domain (optional)

---

## 🆘 Need Help?

- **Hugging Face Docs:** https://huggingface.co/docs/hub/spaces
- **GitHub Actions Docs:** https://docs.github.com/actions
- **FastAPI Deployment:** https://fastapi.tiangolo.com/deployment/

---

## ✅ Deployment Checklist

Before pushing to main:

- [ ] Created Hugging Face Space (Docker SDK)
- [ ] Generated HF access token (Write permissions)
- [ ] Added GitHub Secrets (HF_TOKEN, HF_USERNAME, HF_SPACE_NAME)
- [ ] Added HF Space environment variables (BETTER_AUTH_SECRET, DATABASE_URL, etc.)
- [ ] Verified backend/Dockerfile exists
- [ ] Verified backend/requirements.txt exists
- [ ] Verified backend/src/ directory exists
- [ ] BETTER_AUTH_SECRET matches frontend
- [ ] DATABASE_URL is correct Neon connection string
- [ ] FRONTEND_URL will be updated after Vercel deployment

Ready to deploy! 🚀
