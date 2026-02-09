# GitHub Actions CI/CD Setup for Hugging Face Spaces

**Backend Auto-Deployment**: Automatically deploy backend to HF Spaces on every push

---

## 🔧 Setup Instructions

### Step 1: Create Hugging Face Access Token

1. Visit: https://huggingface.co/settings/tokens
2. Click **"New token"**
3. Configure:
   - **Name**: `github-actions-deploy`
   - **Type**: **Write** (required for pushing to Space)
   - **Scope**: Leave default (all repositories)
4. Click **"Create token"**
5. **Copy the token** (starts with `hf_...`)
   - ⚠️ Save it securely - you won't see it again!

### Step 2: Add Token to GitHub Secrets

1. Go to your repository: https://github.com/NazimAkhter/hackathon_02_phase-II
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add secret:
   - **Name**: `HF_TOKEN`
   - **Value**: [paste your HF token from Step 1]
5. Click **"Add secret"**

### Step 3: Verify Workflow File

The workflow file is already created at:
```
.github/workflows/deploy-backend.yml
```

### Step 4: Push to GitHub

```bash
cd /e/GIAIC/Quarter-04/hackathon_02/hackathon_02_phase-II

# Add workflow file
git add .github/workflows/deploy-backend.yml

# Commit
git commit -m "ci: Add GitHub Actions workflow for HF Spaces deployment"

# Push (use HTTPS)
git remote set-url origin https://github.com/NazimAkhter/hackathon_02_phase-II.git
git push origin 006-deployment-cicd
```

### Step 5: Test the Workflow

**Option A: Automatic Trigger**
1. Make a change to any file in `backend/`
2. Commit and push to `main` or `006-deployment-cicd` branch
3. Workflow triggers automatically

**Option B: Manual Trigger**
1. Go to: https://github.com/NazimAkhter/hackathon_02_phase-II/actions
2. Select **"Deploy Backend to Hugging Face Spaces"**
3. Click **"Run workflow"**
4. Select branch and click **"Run workflow"**

---

## 🚀 How It Works

### Trigger Conditions

The workflow runs when:
- ✅ Push to `main` branch with changes in `backend/`
- ✅ Push to `006-deployment-cicd` branch with changes in `backend/`
- ✅ Manual trigger via GitHub Actions UI
- ✅ Changes to the workflow file itself

### Deployment Process

1. **Checkout Code**: Gets latest code from GitHub
2. **Setup Python**: Installs Python 3.11
3. **Install HF CLI**: Installs Hugging Face CLI tools
4. **Configure Git**: Sets up git for commits
5. **Deploy to HF Space**:
   - Logs in to Hugging Face with token
   - Clones your Space repository
   - Syncs backend files to Space
   - Commits and pushes changes
6. **Verify Deployment**: Checks if Space is accessible
7. **Summary**: Provides deployment report

### What Gets Deployed

**Included:**
- All files in `backend/` directory
- Python code, requirements.txt, Dockerfile
- Configuration files

**Excluded:**
- `.git` directory
- `__pycache__` directories
- `*.pyc` files
- `.venv` and `venv` directories
- `.env` files (secrets stay on HF Space)

---

## 📊 Monitoring Deployments

### View Workflow Runs

1. Go to: https://github.com/NazimAkhter/hackathon_02_phase-II/actions
2. Click on **"Deploy Backend to Hugging Face Spaces"**
3. View all runs with status (✅ success, ❌ failed, 🟡 in progress)

### View Deployment Logs

**GitHub Actions Logs:**
- Click on any workflow run
- Expand steps to see detailed logs

**Hugging Face Space Logs:**
- Visit: https://huggingface.co/spaces/NazimBotExpert/todo-app
- Click **"Logs"** tab
- View build and runtime logs

### Deployment Summary

After each run, GitHub Actions provides a summary with:
- Space URL
- API documentation link
- Build logs link
- Commit information

---

## 🔐 Security Best Practices

### Token Security

✅ **DO:**
- Store HF token in GitHub Secrets
- Use Write-only tokens (not Admin)
- Rotate tokens periodically
- Revoke tokens if compromised

❌ **DON'T:**
- Commit tokens to repository
- Share tokens publicly
- Use personal tokens for production
- Store tokens in code or logs

### Environment Variables

- Backend environment variables (DATABASE_URL, BETTER_AUTH_SECRET) stay on HF Space
- Workflow only deploys code, not secrets
- Secrets configured once on HF Space, persist across deployments

---

## 🐛 Troubleshooting

### Workflow Fails: "Authentication failed"

**Cause**: Invalid or missing HF_TOKEN

**Solution:**
1. Verify token is added to GitHub Secrets
2. Check token name is exactly `HF_TOKEN`
3. Ensure token has Write permissions
4. Generate new token if expired

### Workflow Fails: "Permission denied"

**Cause**: Token doesn't have access to Space

**Solution:**
1. Verify Space name: `NazimBotExpert/todo-app`
2. Check token has Write access
3. Ensure you own the Space or have collaborator access

### Deployment Succeeds but Space Doesn't Update

**Cause**: No changes detected or build failed

**Solution:**
1. Check workflow logs for "No changes detected"
2. View HF Space build logs for errors
3. Verify Dockerfile and requirements.txt are correct
4. Check Space settings for auto-rebuild enabled

### Space Build Fails

**Cause**: Code errors or missing dependencies

**Solution:**
1. Check HF Space logs for error messages
2. Test backend locally first
3. Verify requirements.txt includes all dependencies
4. Check Dockerfile configuration

---

## 📝 Workflow Configuration

### Customize Branches

Edit `.github/workflows/deploy-backend.yml`:

```yaml
on:
  push:
    branches:
      - main           # Add/remove branches
      - develop
      - production
```

### Customize Paths

Only trigger on specific file changes:

```yaml
on:
  push:
    paths:
      - 'backend/**'           # Backend code
      - 'backend/Dockerfile'   # Dockerfile only
      - 'backend/requirements.txt'  # Dependencies only
```

### Add Notifications

Add Slack/Discord notifications on deployment:

```yaml
- name: Notify on Success
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -d '{"text":"✅ Backend deployed successfully!"}'
```

---

## 🎯 Next Steps

### 1. Complete Setup

- [ ] Create HF token
- [ ] Add token to GitHub Secrets
- [ ] Push workflow file to GitHub
- [ ] Test deployment

### 2. Configure HF Space

Ensure your HF Space has:
- [ ] Environment variables set (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
- [ ] Correct SDK (Docker)
- [ ] Auto-rebuild enabled

### 3. Test End-to-End

- [ ] Make a change to backend code
- [ ] Push to GitHub
- [ ] Verify workflow runs
- [ ] Check HF Space updates
- [ ] Test API endpoints

---

## 📚 Additional Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Hugging Face Spaces**: https://huggingface.co/docs/hub/spaces
- **HF CLI Documentation**: https://huggingface.co/docs/huggingface_hub/guides/cli

---

## ✅ Quick Checklist

Before first deployment:

- [ ] HF token created with Write permissions
- [ ] Token added to GitHub Secrets as `HF_TOKEN`
- [ ] Workflow file committed and pushed
- [ ] HF Space environment variables configured
- [ ] Space set to Docker SDK
- [ ] Auto-rebuild enabled on Space

After setup:

- [ ] Test manual workflow trigger
- [ ] Test automatic trigger (push backend change)
- [ ] Verify deployment in HF Space logs
- [ ] Test API endpoints work
- [ ] Monitor first few deployments

---

**Your HF Space**: https://huggingface.co/spaces/NazimBotExpert/todo-app
**GitHub Actions**: https://github.com/NazimAkhter/hackathon_02_phase-II/actions

**Status**: ✅ Workflow created - Complete setup steps above to activate!
