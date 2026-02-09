# GitHub Actions Workflow Contract: Deploy Backend to Hugging Face Space

**Feature**: 001-hf-deployment-fix
**Date**: 2026-02-10
**Purpose**: Define the interface contract for the GitHub Actions deployment workflow

## Workflow Specification

### Workflow Name
`Deploy Backend to Hugging Face Space`

### Trigger Events
```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
  workflow_dispatch:  # Manual trigger
```

**Trigger Conditions:**
- Automatic: Push to `main` branch with changes in `backend/` directory
- Manual: Via GitHub Actions UI or API

### Required Secrets

| Secret Name | Type | Description | Validation |
|-------------|------|-------------|------------|
| `HF_TOKEN` | string | Hugging Face API token with write access to target Space | Must not be empty; must have write permissions |

**Setup Instructions:**
1. Generate token at https://huggingface.co/settings/tokens
2. Set token scope to "Write" for target Space
3. Add to GitHub repository secrets at Settings → Secrets → Actions → New repository secret

### Environment Variables

| Variable Name | Type | Default | Description |
|---------------|------|---------|-------------|
| `HF_SPACE_REPO` | string | (required) | Hugging Face Space repository URL (e.g., `https://huggingface.co/spaces/USER/SPACE`) |
| `BACKEND_DIR` | string | `backend` | Path to backend directory in repository |
| `PYTHON_VERSION` | string | `3.11` | Python version for CLI installation |
| `GIT_USER_NAME` | string | `github-actions[bot]` | Git commit author name |
| `GIT_USER_EMAIL` | string | `github-actions[bot]@users.noreply.github.com` | Git commit author email |

### Workflow Steps Contract

#### Step 1: Checkout Repository
**Purpose**: Clone GitHub repository code to runner

**Inputs:**
- Repository URL (automatic from GitHub context)
- Branch name (automatic from trigger event)

**Outputs:**
- Repository files available in runner workspace

**Success Criteria:**
- Exit code 0
- Repository files present in workspace

**Failure Modes:**
- Network timeout
- Invalid repository permissions

---

#### Step 2: Set Up Python
**Purpose**: Install Python environment for huggingface_hub CLI

**Inputs:**
- `PYTHON_VERSION` (default: `3.11`)

**Outputs:**
- Python interpreter available at `/usr/bin/python3`
- pip package manager available

**Success Criteria:**
- Exit code 0
- `python3 --version` returns expected version

**Failure Modes:**
- Unsupported Python version
- Runner out of disk space

---

#### Step 3: Install Hugging Face CLI
**Purpose**: Install huggingface_hub package with CLI tools

**Command:**
```bash
pip install huggingface_hub
```

**Inputs:**
- Python environment (from Step 2)

**Outputs:**
- `huggingface-cli` command available in PATH

**Success Criteria:**
- Exit code 0
- `huggingface-cli --version` returns version number

**Failure Modes:**
- PyPI network timeout
- Incompatible package dependencies
- Insufficient disk space

**Validation:**
```bash
huggingface-cli --version
# Expected output: huggingface-cli, version X.Y.Z
```

---

#### Step 4: Authenticate with Hugging Face
**Purpose**: Login to Hugging Face using API token

**Command:**
```bash
huggingface-cli login --token ${{ secrets.HF_TOKEN }}
```

**Inputs:**
- `HF_TOKEN` secret (from GitHub repository secrets)

**Outputs:**
- Credentials stored in git credential helper
- Authentication token cached for session

**Success Criteria:**
- Exit code 0
- `huggingface-cli whoami` returns username

**Failure Modes:**
- Invalid token (401 Unauthorized)
- Expired token
- Insufficient token permissions
- Network timeout

**Validation:**
```bash
huggingface-cli whoami
# Expected output: username: YOUR_USERNAME
```

**Error Messages:**
- `Invalid token`: Token is malformed or revoked
- `Unauthorized`: Token lacks required permissions
- `Connection timeout`: Network issue reaching Hugging Face API

---

#### Step 5: Clone Hugging Face Space Repository
**Purpose**: Clone target Space repository for file sync

**Command:**
```bash
git clone https://huggingface.co/spaces/USER/SPACE hf-space
```

**Inputs:**
- `HF_SPACE_REPO` environment variable
- Authenticated git credentials (from Step 4)

**Outputs:**
- Space repository cloned to `hf-space/` directory
- Git history preserved

**Success Criteria:**
- Exit code 0
- `hf-space/.git` directory exists
- `git log` shows commit history

**Failure Modes:**
- Repository not found (404)
- Insufficient permissions (403)
- Network timeout
- Disk space exhausted

**Validation:**
```bash
cd hf-space && git log --oneline -1
# Expected output: <commit-hash> <commit-message>
```

---

#### Step 6: Sync Backend Files
**Purpose**: Copy backend files from GitHub repo to Space repo

**Command:**
```bash
rsync -av --delete --exclude='.git' backend/ hf-space/
```

**Inputs:**
- `BACKEND_DIR` environment variable (source)
- `hf-space/` directory (destination)

**Outputs:**
- Backend files copied to Space repository
- Deleted files removed from Space repository
- `.git` directory preserved

**Success Criteria:**
- Exit code 0
- All backend files present in `hf-space/`
- No extra files in `hf-space/` (except `.git`)

**Failure Modes:**
- Source directory not found
- Permission denied on files
- Disk space exhausted
- Symlink resolution errors

**Validation:**
```bash
cd hf-space && git status
# Expected output: modified/added/deleted files listed
```

**rsync Options Explained:**
- `-a`: Archive mode (preserves permissions, timestamps, symlinks)
- `-v`: Verbose output (shows files being copied)
- `--delete`: Remove files in destination not present in source
- `--exclude='.git'`: Don't overwrite Space's git history

---

#### Step 7: Configure Git User
**Purpose**: Set git author for commit

**Command:**
```bash
git config user.name "${{ env.GIT_USER_NAME }}"
git config user.email "${{ env.GIT_USER_EMAIL }}"
```

**Inputs:**
- `GIT_USER_NAME` environment variable
- `GIT_USER_EMAIL` environment variable

**Outputs:**
- Git user configured for repository

**Success Criteria:**
- Exit code 0
- `git config user.name` returns configured name

**Failure Modes:**
- Invalid email format (git validation error)

---

#### Step 8: Commit Changes
**Purpose**: Create git commit with synced files

**Command:**
```bash
cd hf-space
git add .
git commit -m "Deploy backend from GitHub Actions (run ${{ github.run_number }})" || echo "No changes to commit"
```

**Inputs:**
- Synced files (from Step 6)
- Git user configuration (from Step 7)

**Outputs:**
- New commit created (if changes exist)
- Commit hash available

**Success Criteria:**
- Exit code 0 (even if no changes)
- If changes exist: new commit created
- If no changes: "No changes to commit" message

**Failure Modes:**
- Merge conflicts (shouldn't happen with rsync --delete)
- Invalid commit message format

**Validation:**
```bash
git log --oneline -1
# Expected output: <new-commit-hash> Deploy backend from GitHub Actions (run N)
```

**Edge Case Handling:**
- No changes: Command exits 0 with message (not treated as failure)
- Empty commit: Prevented by git (no --allow-empty flag)

---

#### Step 9: Push to Hugging Face Space
**Purpose**: Push committed changes to Space repository

**Command:**
```bash
cd hf-space
git push origin main
```

**Inputs:**
- Committed changes (from Step 8)
- Authenticated git credentials (from Step 4)

**Outputs:**
- Changes pushed to remote Space repository
- Space rebuild triggered automatically

**Success Criteria:**
- Exit code 0
- Remote repository updated
- `git log origin/main` shows new commit

**Failure Modes:**
- Network timeout
- Push rejected (non-fast-forward)
- Repository locked
- Insufficient permissions

**Validation:**
```bash
git log origin/main --oneline -1
# Expected output: <new-commit-hash> Deploy backend from GitHub Actions (run N)
```

**Error Messages:**
- `rejected - non-fast-forward`: Local branch behind remote (shouldn't happen)
- `Connection timeout`: Network issue
- `Permission denied`: Token lacks write access

---

#### Step 10: Report Deployment Status
**Purpose**: Output deployment URL and status

**Command:**
```bash
echo "✅ Deployment successful!"
echo "Space URL: https://huggingface.co/spaces/USER/SPACE"
echo "Commit: $(cd hf-space && git rev-parse HEAD)"
```

**Inputs:**
- `HF_SPACE_REPO` environment variable
- Commit hash (from Step 8)

**Outputs:**
- Deployment URL printed to logs
- Commit hash printed to logs

**Success Criteria:**
- Exit code 0
- URL and commit hash visible in workflow logs

**Failure Modes:**
- None (informational step only)

---

## Workflow Outputs

### Success Output
```
✅ Deployment successful!
Space URL: https://huggingface.co/spaces/USER/SPACE
Commit: a1b2c3d4e5f6...
Duration: 2m 34s
```

### Failure Output
```
❌ Deployment failed at step: [STEP_NAME]
Error: [ERROR_MESSAGE]
Exit code: [EXIT_CODE]
Duration: 1m 12s
```

## Performance Contract

| Metric | Target | Maximum |
|--------|--------|---------|
| Total workflow duration | 2-3 minutes | 5 minutes |
| CLI installation time | 30 seconds | 1 minute |
| Authentication time | 5 seconds | 15 seconds |
| File sync time | 30 seconds | 2 minutes |
| Git push time | 30 seconds | 1 minute |

**Performance Optimizations:**
- Cache pip packages to speed up CLI installation
- Use shallow clone (`--depth 1`) for Space repository
- Use rsync for efficient incremental file sync

## Error Handling Contract

### Fail-Fast Behavior
- Workflow stops on first step failure
- No subsequent steps execute after failure
- Exit code propagated to workflow status

### Error Reporting
- Failed step name visible in GitHub Actions UI
- Error message captured in workflow logs
- Exit code available for debugging

### Retry Strategy
- No automatic retries (manual re-run required)
- Idempotent operations (safe to re-run)

## Security Contract

### Secret Handling
- `HF_TOKEN` never exposed in logs (GitHub Actions masks secrets)
- Token not stored in workflow artifacts or cache
- Credentials cleared after workflow completes

### Network Security
- All communication over HTTPS (encrypted in transit)
- No insecure HTTP connections
- Certificate validation enforced

### Access Control
- Workflow requires `contents: read` permission (GitHub repository)
- Token requires write permission (Hugging Face Space)
- No elevated privileges needed

## Compatibility Contract

### GitHub Actions Runner
- **OS**: ubuntu-latest (Ubuntu 22.04 LTS)
- **Architecture**: x86_64
- **Pre-installed**: git, python3, pip

### Python Environment
- **Version**: 3.11+ (configurable)
- **Package Manager**: pip
- **Virtual Environment**: Not required (runner is ephemeral)

### Git Version
- **Minimum**: 2.30+ (for credential helper support)
- **Pre-installed**: Yes (on ubuntu-latest)

## Testing Contract

### Unit Tests
- Not applicable (infrastructure workflow, not application code)

### Integration Tests
- Manual workflow trigger with test commit
- Verify each step completes successfully
- Check Space repository updated

### Acceptance Tests
- Push to main branch triggers workflow
- Workflow completes in under 5 minutes
- Space shows updated backend code
- No authentication or permission errors

## Maintenance Contract

### Dependency Updates
- `huggingface_hub`: Update when new features needed
- `actions/checkout`: Update to latest stable version
- `actions/setup-python`: Update to latest stable version

### Breaking Changes
- Python version changes: Update `PYTHON_VERSION` variable
- Space URL changes: Update `HF_SPACE_REPO` variable
- Token rotation: Update `HF_TOKEN` secret

### Monitoring
- GitHub Actions workflow status (visible in repository UI)
- Hugging Face Space build logs (visible in Space UI)
- Deployment frequency and success rate (GitHub Actions insights)

## Rollback Contract

### Automatic Rollback
- Not implemented (out of scope)

### Manual Rollback
1. Navigate to Space repository on Hugging Face
2. Revert commit via git history
3. Space rebuilds automatically with previous version

### Rollback Time
- Target: Under 5 minutes (same as deployment)
