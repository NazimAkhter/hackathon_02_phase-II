# Quickstart Guide: Hugging Face Space Deployment

**Feature**: 001-hf-deployment-fix
**Date**: 2026-02-10
**Purpose**: Step-by-step guide for setting up and troubleshooting the GitHub Actions deployment workflow

## Prerequisites

Before setting up the deployment workflow, ensure you have:

- ✅ GitHub repository with backend code
- ✅ Hugging Face account with active Space
- ✅ Write access to both GitHub repository and Hugging Face Space
- ✅ Backend code in a dedicated directory (e.g., `backend/`)

## Setup Instructions

### Step 1: Create Hugging Face API Token

1. Navigate to https://huggingface.co/settings/tokens
2. Click "New token"
3. Configure token:
   - **Name**: `github-actions-deployment`
   - **Type**: Write
   - **Scope**: Select your target Space repository
4. Click "Generate token"
5. **IMPORTANT**: Copy the token immediately (it won't be shown again)

**Token Format**: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (starts with `hf_`)

### Step 2: Add Token to GitHub Secrets

1. Navigate to your GitHub repository
2. Go to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Configure secret:
   - **Name**: `HF_TOKEN`
   - **Value**: Paste the token from Step 1
5. Click "Add secret"

**Verification**: Secret should appear in the list as `HF_TOKEN` (value hidden)

### Step 3: Verify Backend Directory Structure

Ensure your repository has the following structure:

```
your-repo/
├── backend/              # Backend code directory
│   ├── src/
│   ├── requirements.txt
│   └── README.md
├── .github/
│   └── workflows/
│       └── deploy-backend.yml  # Deployment workflow (to be created)
└── README.md
```

**Note**: If your backend is in a different directory, you'll need to update the `BACKEND_DIR` variable in the workflow.

### Step 4: Create or Update Workflow File

The workflow file has been implemented at `.github/workflows/deploy-backend.yml` with the following configuration:

**Key Configuration Variables**:
```yaml
env:
  HF_SPACE_REPO: NazimBotExpert/todo-app
  BACKEND_DIR: backend
  PYTHON_VERSION: '3.11'
```

**Workflow Features**:
- ✅ Automatic trigger on push to main branch (when backend/** files change)
- ✅ Manual trigger via workflow_dispatch
- ✅ Token validation before authentication
- ✅ CLI installation with verification
- ✅ Authentication with huggingface-cli login (secure credential storage)
- ✅ Shallow clone optimization (--depth 1) for faster cloning
- ✅ Pip package caching for faster CLI installation
- ✅ Clear error messages for all failure modes
- ✅ Deployment summary with quick links

**Security Features**:
- Token never exposed in git URLs (uses credential helper)
- Token format validation (must start with 'hf_')
- Clear error messages without exposing sensitive data
- Fail-fast behavior on any error

**Replace**:
- `HF_SPACE_REPO`: Update to your Hugging Face Space (format: USERNAME/SPACE-NAME)
- `BACKEND_DIR`: Update if your backend is in a different directory
- `PYTHON_VERSION`: Update if you need a different Python version

### Step 5: Test Deployment

1. Commit and push the workflow file to `main` branch:
   ```bash
   git add .github/workflows/deploy-backend.yml
   git commit -m "Add Hugging Face deployment workflow"
   git push origin main
   ```

2. Make a test change to backend code:
   ```bash
   echo "# Test deployment" >> backend/README.md
   git add backend/README.md
   git commit -m "Test deployment workflow"
   git push origin main
   ```

3. Monitor workflow execution:
   - Go to GitHub repository → Actions tab
   - Click on the latest workflow run
   - Watch each step execute in real-time

**Expected Result**: Workflow completes successfully in 2-5 minutes, Space shows updated backend code.

---

## Verification Checklist

After setup, verify each component:

### GitHub Actions
- [ ] Workflow file exists at `.github/workflows/deploy-backend.yml`
- [ ] Workflow appears in Actions tab
- [ ] Workflow triggers on push to main branch
- [ ] `HF_TOKEN` secret is configured

### Hugging Face
- [ ] Space exists and is accessible
- [ ] Token has write permissions to Space
- [ ] Space URL matches workflow configuration
- [ ] Space is not archived or locked

### Deployment
- [ ] Workflow completes without errors
- [ ] All steps show green checkmarks
- [ ] Space repository shows new commit
- [ ] Space rebuilds automatically after push

---

## Troubleshooting Guide

### Issue 1: "huggingface-cli: command not found"

**Symptom**: CLI installation step fails with command not found error

**Cause**: `huggingface_hub` package not installed correctly

**Solution**:
The workflow now includes automatic verification after installation:
```yaml
- name: Verify CLI Installation
  run: |
    echo "🔍 Verifying CLI installation..."
    huggingface-cli --version
    echo "✅ CLI verification passed"
```

If this step fails, check:
1. Python version is 3.8+ (workflow uses 3.11)
2. Pip is working correctly
3. Network connectivity to PyPI

**Status**: ✅ FIXED - Verification step added to workflow

---

### Issue 2: "Invalid token" or "Unauthorized"

**Symptom**: Authentication step fails with 401 error

**Cause**: Token is invalid, expired, or lacks permissions

**Solution**:
The workflow now includes token validation before authentication:
```yaml
- name: Validate HF_TOKEN
  run: |
    if [ -z "$HF_TOKEN" ]; then
      echo "❌ ERROR: HF_TOKEN secret is not configured"
      exit 1
    fi
    if [[ ! "$HF_TOKEN" =~ ^hf_ ]]; then
      echo "❌ ERROR: Invalid token format (must start with 'hf_')"
      exit 1
    fi
```

If authentication still fails after validation:
1. Verify token hasn't expired (check Hugging Face settings)
2. Verify token has write access to target Space
3. Regenerate token if necessary
4. Update `HF_TOKEN` secret in GitHub

**Status**: ✅ FIXED - Token validation step added to workflow

---

### Issue 3: "Repository not found" (404)

**Symptom**: Clone step fails with 404 error

**Cause**: Space URL is incorrect or Space doesn't exist

**Solution**:
1. Verify Space exists at https://huggingface.co/spaces/USER/SPACE
2. Check Space URL in workflow matches exactly
3. Ensure Space is not private (or token has access)
4. Verify username and space name spelling

**Correct URL Format**:
```
https://huggingface.co/spaces/USERNAME/SPACENAME
```

**Common Mistakes**:
- ❌ `https://huggingface.co/USERNAME/SPACENAME` (missing `/spaces/`)
- ❌ `https://huggingface.co/spaces/USERNAME/SPACENAME/` (trailing slash)
- ❌ `git@huggingface.co:spaces/USERNAME/SPACENAME.git` (SSH format, use HTTPS)

---

### Issue 4: "Permission denied" on push

**Symptom**: Push step fails with 403 error

**Cause**: Token lacks write permissions to Space

**Solution**:
1. Go to Hugging Face token settings
2. Verify token type is "Write" (not "Read")
3. Check token scope includes target Space
4. Regenerate token with correct permissions
5. Update `HF_TOKEN` secret in GitHub

**Token Permissions Check**:
- ✅ Type: Write
- ✅ Scope: Specific Space or All Spaces
- ❌ Type: Read (insufficient)

---

### Issue 5: "No changes to commit"

**Symptom**: Commit step shows "No changes to commit" but changes expected

**Cause**: Backend files already synced or rsync didn't detect changes

**Solution**:
1. Verify backend directory path is correct
2. Check rsync command includes correct source/destination
3. Ensure `.git` directory is excluded from sync
4. Verify file permissions allow reading

**Debug Commands**:
```bash
# Check what rsync would sync (dry-run)
rsync -avn --delete --exclude='.git' backend/ hf-space/

# Check git status after rsync
cd hf-space && git status
```

**Note**: "No changes to commit" is not an error if backend hasn't changed since last deployment.

---

### Issue 6: "Push rejected - non-fast-forward"

**Symptom**: Push fails with non-fast-forward error

**Cause**: Space repository has commits not in local clone

**Solution**:
1. This shouldn't happen with fresh clone each run
2. If it does, someone pushed to Space manually
3. Workflow should pull before push (add `git pull` step)

**Workflow Fix**:
```yaml
- name: Pull latest changes
  run: |
    cd hf-space
    git pull origin main

- name: Push to Space
  run: |
    cd hf-space
    git push origin main
```

---

### Issue 7: Workflow takes longer than 5 minutes

**Symptom**: Workflow exceeds performance target

**Cause**: Large backend directory or slow network

**Solution**:
The workflow now includes performance optimizations:

1. **Pip package caching**:
```yaml
- name: Cache pip packages
  uses: actions/cache@v3
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-huggingface-hub
```

2. **Shallow clone**:
```yaml
- name: Clone Space Repository
  run: |
    git clone --depth 1 https://huggingface.co/spaces/${{ env.HF_SPACE_REPO }} hf-space
```

These optimizations reduce workflow execution time by:
- Caching pip packages: ~20-30 seconds saved on subsequent runs
- Shallow clone: ~10-20 seconds saved (only fetches latest commit)

**Expected Performance**:
- First run: 2-3 minutes
- Subsequent runs (with cache): 1.5-2 minutes

**Status**: ✅ FIXED - Performance optimizations added to workflow

---

### Issue 8: Space doesn't rebuild after push

**Symptom**: Push succeeds but Space shows old code

**Cause**: Space rebuild not triggered or failed

**Solution**:
1. Check Space build logs on Hugging Face
2. Verify Space is not paused or archived
3. Check Space settings for auto-rebuild configuration
4. Manually trigger rebuild if needed

**Manual Rebuild**:
1. Go to Space on Hugging Face
2. Click "Settings" tab
3. Click "Restart Space" button

---

## Common Workflow Patterns

### Pattern 1: Deploy on Tag Push (Release)

Trigger deployment only on version tags:

```yaml
on:
  push:
    tags:
      - 'v*.*.*'  # Matches v1.0.0, v2.1.3, etc.
```

### Pattern 2: Deploy to Multiple Environments

Deploy to staging and production Spaces:

```yaml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    env:
      HF_SPACE_REPO: https://huggingface.co/spaces/USER/SPACE-staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    env:
      HF_SPACE_REPO: https://huggingface.co/spaces/USER/SPACE-production
```

### Pattern 3: Manual Approval for Production

Require manual approval before production deployment:

```yaml
jobs:
  deploy:
    environment:
      name: production
      url: https://huggingface.co/spaces/USER/SPACE
    # GitHub will pause here for approval
```

---

## Monitoring and Maintenance

### Daily Checks
- [ ] Review workflow run history (Actions tab)
- [ ] Check for failed deployments
- [ ] Verify Space is running and accessible

### Weekly Checks
- [ ] Review deployment frequency and patterns
- [ ] Check workflow execution times (should be under 5 minutes)
- [ ] Verify no authentication errors

### Monthly Checks
- [ ] Rotate Hugging Face API token (security best practice)
- [ ] Update workflow dependencies (actions versions)
- [ ] Review and clean up old workflow runs

### Token Rotation Procedure
1. Generate new token on Hugging Face
2. Update `HF_TOKEN` secret in GitHub
3. Test deployment with new token
4. Revoke old token on Hugging Face

---

## Emergency Procedures

### Rollback Deployment

If a bad deployment reaches production:

1. **Quick Rollback** (via Hugging Face UI):
   - Go to Space repository on Hugging Face
   - Click "Files and versions" tab
   - Find previous working commit
   - Click "Revert to this commit"
   - Space rebuilds automatically

2. **Git Rollback** (via command line):
   ```bash
   # Clone Space repository
   git clone https://huggingface.co/spaces/USER/SPACE
   cd SPACE

   # Find last working commit
   git log --oneline

   # Revert to that commit
   git revert <commit-hash>
   git push origin main
   ```

### Disable Automatic Deployment

If workflow is causing issues:

1. Go to GitHub repository → Actions tab
2. Click on workflow name
3. Click "..." menu → "Disable workflow"
4. Fix issues in workflow file
5. Re-enable workflow when ready

### Emergency Contact

- **GitHub Actions Issues**: https://github.com/actions/runner/issues
- **Hugging Face Support**: https://huggingface.co/support
- **Token Issues**: Regenerate at https://huggingface.co/settings/tokens

---

## Best Practices

### Security
- ✅ Never commit `HF_TOKEN` to repository
- ✅ Use GitHub secrets for all sensitive data
- ✅ Rotate tokens every 90 days
- ✅ Use write-only tokens (not admin tokens)
- ✅ Review workflow logs for exposed secrets

### Performance
- ✅ Cache pip packages to speed up installation
- ✅ Use shallow clone for Space repository
- ✅ Trigger only on backend changes (not all pushes)
- ✅ Monitor workflow execution times

### Reliability
- ✅ Test workflow on feature branch before merging
- ✅ Add verification steps after each critical operation
- ✅ Use fail-fast behavior (stop on first error)
- ✅ Keep workflow simple (avoid complex logic)

### Maintainability
- ✅ Document workflow configuration in README
- ✅ Use descriptive step names
- ✅ Add comments for complex commands
- ✅ Version control workflow file
- ✅ Review and update dependencies regularly

---

## Additional Resources

- **Hugging Face Spaces Documentation**: https://huggingface.co/docs/hub/spaces
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **huggingface_hub CLI Reference**: https://huggingface.co/docs/huggingface_hub/guides/cli
- **Git Credential Helpers**: https://git-scm.com/docs/gitcredentials
- **rsync Manual**: https://linux.die.net/man/1/rsync

---

## Support

If you encounter issues not covered in this guide:

1. Check GitHub Actions workflow logs for detailed error messages
2. Review Hugging Face Space build logs
3. Search GitHub Actions and Hugging Face documentation
4. Open an issue in the repository with:
   - Workflow run URL
   - Error message
   - Steps to reproduce
   - Expected vs actual behavior
