# Vercel CI/CD Setup Guide

**Frontend Auto-Deployment**: Automatically deploy frontend to Vercel on every push

---

## 🔧 Required Setup (3 Secrets Needed)

You need to add **3 secrets** to GitHub for Vercel deployment:

1. `VERCEL_TOKEN` - Vercel API token
2. `VERCEL_ORG_ID` - Your Vercel organization/team ID
3. `VERCEL_PROJECT_ID` - Your Vercel project ID

---

## Step 1: Get Vercel Access Token

### Create Token

1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Configure:
   - **Token Name**: `github-actions-deploy`
   - **Scope**: Full Account (or select specific projects)
   - **Expiration**: No Expiration (or set as needed)
4. Click **"Create Token"**
5. **Copy the token** (starts with `vercel_...`)
   - ⚠️ Save it securely - you won't see it again!

---

## Step 2: Get Vercel Organization ID

### Option A: From Vercel Dashboard

1. Go to: https://vercel.com/account
2. Look for **"Your ID"** or **"Team ID"** in settings
3. Copy the ID (starts with `team_...` or similar)

### Option B: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project (run from frontend directory)
cd frontend
vercel link

# Get Organization ID
vercel project ls
# Look for "orgId" in the output
```

### Option C: From .vercel Directory

If you've already deployed manually:

```bash
cd frontend/.vercel
cat project.json
# Look for "orgId" field
```

---

## Step 3: Get Vercel Project ID

### Option A: From .vercel Directory

If you've deployed manually before:

```bash
cd frontend/.vercel
cat project.json
# Look for "projectId" field
```

### Option B: Using Vercel CLI

```bash
cd frontend
vercel link
# This creates .vercel/project.json with projectId
cat .vercel/project.json
```

### Option C: From Vercel Dashboard

1. Go to your project: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings**
4. Project ID is shown in the URL or settings page

---

## Step 4: Add Secrets to GitHub

1. Go to: https://github.com/NazimAkhter/hackathon_02_phase-II/settings/secrets/actions

2. Click **"New repository secret"** for each:

### Secret 1: VERCEL_TOKEN
- **Name**: `VERCEL_TOKEN`
- **Value**: [your Vercel token from Step 1]
- Click **"Add secret"**

### Secret 2: VERCEL_ORG_ID
- **Name**: `VERCEL_ORG_ID`
- **Value**: [your org ID from Step 2]
- Click **"Add secret"**

### Secret 3: VERCEL_PROJECT_ID
- **Name**: `VERCEL_PROJECT_ID`
- **Value**: [your project ID from Step 3]
- Click **"Add secret"**

---

## Step 5: Verify Secrets

After adding all secrets, you should see:

```
✓ HF_TOKEN
✓ VERCEL_TOKEN
✓ VERCEL_ORG_ID
✓ VERCEL_PROJECT_ID
```

---

## 🚀 How It Works

### Automatic Triggers

**Production Deployment** (to your main Vercel project):
- Push to `main` branch with frontend changes
- Push to `006-deployment-cicd` branch with frontend changes
- Manual trigger via GitHub Actions

**Preview Deployment** (temporary preview URL):
- Pull request to `main` branch with frontend changes
- Automatic comment on PR with preview URL

### Deployment Process

1. **Checkout Code**: Gets latest frontend code
2. **Setup Node.js**: Installs Node.js 20
3. **Install Vercel CLI**: Installs latest Vercel CLI
4. **Pull Vercel Config**: Gets project configuration
5. **Build Project**: Builds Next.js production bundle
6. **Deploy to Vercel**:
   - Production: Deploys to main domain
   - Preview: Creates temporary preview URL
7. **Verify Deployment**: Checks if site is accessible
8. **Generate Summary**: Provides deployment report

---

## 📊 What You Get

### Production Deployments

When you push to main or 006-deployment-cicd:
- ✅ Automatic build and deployment
- ✅ Deployed to your production Vercel URL
- ✅ Zero downtime deployment
- ✅ Automatic rollback on failure
- ✅ Deployment verification

### Preview Deployments

When you create a pull request:
- ✅ Automatic preview deployment
- ✅ Unique preview URL for testing
- ✅ Comment on PR with preview link
- ✅ Test changes before merging
- ✅ No impact on production

---

## 🧪 Testing the Workflow

### Test 1: Manual Production Deployment

1. Go to: https://github.com/NazimAkhter/hackathon_02_phase-II/actions
2. Click **"Deploy Frontend to Vercel"**
3. Click **"Run workflow"**
4. Select branch: `006-deployment-cicd`
5. Click **"Run workflow"**
6. Watch deployment (3-5 minutes)

### Test 2: Automatic Production Deployment

```bash
cd /e/GIAIC/Quarter-04/hackathon_02/hackathon_02_phase-II

# Make a small change
echo "# CI/CD test" >> frontend/README.md

git add frontend/README.md
git commit -m "test: Trigger frontend CI/CD"
git push origin 006-deployment-cicd
```

Watch workflow trigger automatically!

### Test 3: Preview Deployment (Optional)

```bash
# Create a feature branch
git checkout -b feature/test-preview

# Make a change
echo "# Preview test" >> frontend/README.md

git add frontend/README.md
git commit -m "feat: Test preview deployment"
git push origin feature/test-preview

# Create PR on GitHub
# Workflow creates preview deployment and comments on PR
```

---

## 🔍 Monitoring Deployments

### GitHub Actions

- **All Runs**: https://github.com/NazimAkhter/hackathon_02_phase-II/actions
- **Workflow**: Click "Deploy Frontend to Vercel"
- **Logs**: Click any run to see detailed logs

### Vercel Dashboard

- **Dashboard**: https://vercel.com/dashboard
- **Deployments**: View all deployments
- **Logs**: Real-time build and runtime logs
- **Analytics**: Performance metrics

---

## 🐛 Troubleshooting

### Workflow Fails: "Invalid token"

**Cause**: VERCEL_TOKEN is missing or invalid

**Fix**:
1. Verify token exists in GitHub Secrets
2. Check token hasn't expired
3. Generate new token if needed

### Workflow Fails: "Project not found"

**Cause**: VERCEL_PROJECT_ID or VERCEL_ORG_ID incorrect

**Fix**:
1. Run `vercel link` in frontend directory
2. Check `.vercel/project.json` for correct IDs
3. Update GitHub Secrets with correct values

### Build Fails

**Cause**: Frontend code errors or missing dependencies

**Fix**:
1. Test build locally: `cd frontend && npm run build`
2. Fix any errors
3. Ensure all dependencies in package.json
4. Push fixes and retry

### Deployment Succeeds but Site Doesn't Update

**Cause**: Vercel caching or DNS propagation

**Fix**:
1. Wait 1-2 minutes for propagation
2. Hard refresh browser (Ctrl+Shift+R)
3. Check Vercel dashboard for deployment status

---

## 📝 Quick Reference

### Required Secrets

```
VERCEL_TOKEN       = vercel_xxxxxxxxxxxxxxxxxxxxx
VERCEL_ORG_ID      = team_xxxxxxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID  = prj_xxxxxxxxxxxxxxxxxxxxx
```

### Get IDs Quickly

```bash
cd frontend
vercel link
cat .vercel/project.json
```

Output:
```json
{
  "orgId": "team_xxxxx",
  "projectId": "prj_xxxxx"
}
```

### Test Deployment

```bash
# Manual trigger
https://github.com/NazimAkhter/hackathon_02_phase-II/actions

# Automatic trigger
git add frontend/
git commit -m "Update frontend"
git push origin 006-deployment-cicd
```

---

## ✅ Setup Checklist

Before first deployment:

- [ ] Vercel token created
- [ ] Token added to GitHub as `VERCEL_TOKEN`
- [ ] Organization ID added as `VERCEL_ORG_ID`
- [ ] Project ID added as `VERCEL_PROJECT_ID`
- [ ] Workflow file committed and pushed
- [ ] Vercel project exists and is linked

After setup:

- [ ] Test manual workflow trigger
- [ ] Test automatic trigger (push frontend change)
- [ ] Verify deployment in Vercel dashboard
- [ ] Test frontend site works
- [ ] Monitor first few deployments

---

## 🎯 Next Steps

1. **Get Vercel IDs** (5 minutes):
   ```bash
   cd frontend
   vercel link
   cat .vercel/project.json
   ```

2. **Add Secrets to GitHub** (2 minutes):
   - Go to repository settings
   - Add all 3 secrets

3. **Test Deployment** (5 minutes):
   - Run workflow manually
   - Verify deployment succeeds

4. **Celebrate** 🎉:
   - Complete CI/CD for entire stack!
   - Zero manual deployments needed!

---

**Status**: ⏳ Workflow created - Add secrets to activate!
