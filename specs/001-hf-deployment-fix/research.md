# Research: Hugging Face Space Deployment Authentication

**Feature**: 001-hf-deployment-fix
**Date**: 2026-02-10
**Purpose**: Document architectural decisions for GitHub Actions deployment to Hugging Face Spaces

## Overview

This research addresses three critical architectural decisions for automating backend deployment from GitHub Actions to Hugging Face Spaces:

1. Authentication method (HTTPS + token vs SSH)
2. Login approach (huggingface-cli login vs token-in-URL)
3. File sync strategy (rsync vs git subtree vs direct push)

## Decision 1: Authentication Method

### Decision: HTTPS + Token Authentication

**Rationale:**
- GitHub Actions secrets integrate seamlessly with HTTPS token authentication
- No SSH key management required (simpler setup, fewer moving parts)
- Token can be rotated without workflow changes (just update GitHub secret)
- HTTPS works universally across all GitHub Actions runners without firewall issues
- Hugging Face API tokens are designed for programmatic access via HTTPS
- Token permissions can be scoped (read/write to specific repositories)

**Alternatives Considered:**

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| SSH Key Authentication | More secure for long-lived credentials | Requires SSH key generation, storage in secrets, SSH agent setup, potential firewall issues | Adds unnecessary complexity; token rotation is harder; SSH not needed for CI/CD |
| Personal Access Token in URL | Simple one-liner git commands | Token visible in git remote URLs and logs | Security risk - tokens can leak in verbose logs |
| Deploy Keys | Repository-specific, no user account needed | Requires SSH setup, one key per repo | Same SSH complexity issues as SSH keys |

**Implementation Details:**
- Store HF_TOKEN in GitHub repository secrets (encrypted at rest)
- Use `huggingface-cli login --token $HF_TOKEN` for authentication
- Token automatically used for subsequent git operations
- No token exposure in logs (huggingface-cli masks tokens)

**References:**
- Hugging Face Spaces Git documentation: https://huggingface.co/docs/hub/spaces-github-actions
- GitHub Actions secrets best practices: https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

## Decision 2: Login Approach

### Decision: huggingface-cli login (not token-in-URL)

**Rationale:**
- `huggingface-cli login --token $TOKEN` stores credentials securely in git credential helper
- Subsequent git operations automatically use stored credentials (no manual token injection)
- Token never appears in git remote URLs or command output
- Follows Hugging Face's recommended authentication pattern for CI/CD
- Credential helper persists for the entire workflow session
- Cleaner separation: authenticate once, then use standard git commands

**Alternatives Considered:**

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| Token in Git URL | Single command: `git push https://user:$TOKEN@huggingface.co/...` | Token visible in process list, logs, and git remote output | Security risk - token exposure in logs and command history |
| Environment Variable GIT_ASKPASS | Git prompts for credentials via script | Requires custom script, more complex setup | Unnecessary complexity when huggingface-cli handles this |
| Git Credential Store | Manual credential configuration | Requires multiple setup steps, error-prone | huggingface-cli does this automatically |

**Implementation Details:**
```bash
# Step 1: Install huggingface_hub
pip install huggingface_hub

# Step 2: Authenticate (stores credentials in git credential helper)
huggingface-cli login --token $HF_TOKEN

# Step 3: Use standard git commands (credentials auto-injected)
git push https://huggingface.co/spaces/USER/SPACE main
```

**Security Benefits:**
- Token never in command arguments (not visible in `ps aux`)
- Token masked in GitHub Actions logs
- Credential helper scoped to workflow session (ephemeral)
- No persistent credential storage on runner

**References:**
- Hugging Face CLI documentation: https://huggingface.co/docs/huggingface_hub/guides/cli
- Git credential helpers: https://git-scm.com/docs/gitcredentials

---

## Decision 3: File Sync Strategy

### Decision: Direct Git Push (not rsync or git subtree)

**Rationale:**
- Hugging Face Spaces are git repositories - native git operations are the intended workflow
- Direct push maintains full git history and commit metadata
- Simplest approach: clone → copy files → commit → push
- No additional tools required (git is pre-installed on GitHub Actions runners)
- Preserves commit authorship and timestamps
- Enables Space auto-rebuild on push (Hugging Face detects git push events)

**Alternatives Considered:**

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| rsync over SSH | Efficient incremental sync, only changed files | Requires SSH setup, doesn't trigger Space rebuild, no version history | Not git-native; loses commit history; SSH complexity |
| git subtree split | Maintains separate history for backend subdirectory | Complex command syntax, harder to debug, unnecessary for single-directory sync | Over-engineered for simple use case |
| Hugging Face Hub API | Programmatic file upload via Python API | Requires custom script, doesn't preserve git history, slower for multiple files | Loses git benefits; more code to maintain |
| Git submodules | Separate repository for backend | Requires restructuring project, complex submodule management | Architectural change not justified for deployment fix |

**Implementation Details:**
```bash
# Step 1: Clone the Hugging Face Space repository
git clone https://huggingface.co/spaces/USER/SPACE hf-space
cd hf-space

# Step 2: Sync backend files (preserve .git directory)
rsync -av --delete --exclude='.git' ../backend/ ./

# Step 3: Commit changes
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add .
git commit -m "Deploy backend from GitHub Actions" || echo "No changes to commit"

# Step 4: Push to Hugging Face Space
git push origin main
```

**Why rsync for file copy (not cp or mv):**
- `rsync -av --delete` ensures exact mirror (removes deleted files)
- `--exclude='.git'` preserves Space's git history
- Handles symlinks, permissions, and timestamps correctly
- Idempotent (safe to run multiple times)

**Deployment Trigger:**
- Hugging Face Spaces automatically rebuild when git push is detected
- No manual API calls or webhook configuration needed
- Space status visible in Hugging Face UI

**References:**
- Hugging Face Spaces Git workflow: https://huggingface.co/docs/hub/spaces-overview#git-workflow
- GitHub Actions rsync usage: https://github.com/marketplace/actions/rsync-deployments-action

---

## Decision 4: Workflow Execution Phases

### Decision: Sequential Step-by-Step Execution

**Rationale:**
- Each step depends on the previous step's success (fail-fast behavior)
- Clear logging for each phase aids debugging
- GitHub Actions displays step-by-step progress in UI
- Easy to identify which step failed (CLI install, auth, sync, push)
- Follows GitHub Actions best practices for workflow organization

**Workflow Phases:**

1. **Setup** (GitHub Actions built-in)
   - Checkout repository code
   - Set up Python environment

2. **Install CLI**
   - Install huggingface_hub via pip
   - Verify installation with `huggingface-cli --version`

3. **Authenticate**
   - Login using HF_TOKEN secret
   - Verify authentication with `huggingface-cli whoami`

4. **Sync Files**
   - Clone Hugging Face Space repository
   - Rsync backend files to Space directory
   - Configure git user for commit

5. **Commit Changes**
   - Stage all changes
   - Commit with descriptive message
   - Handle "no changes" case gracefully

6. **Push to Space**
   - Push to Hugging Face Space main branch
   - Verify push success

7. **Validate Deployment**
   - Check Space build status (optional)
   - Report deployment URL

**Error Handling:**
- Each step uses `set -e` (exit on error)
- Failed steps stop workflow immediately
- GitHub Actions displays failed step in red
- Logs show exact command that failed

---

## Testing Strategy

### Verification Steps

1. **CLI Installation Test**
   - Command: `huggingface-cli --version`
   - Expected: Version number output (e.g., "0.20.0")
   - Failure: "command not found" or pip install error

2. **Authentication Test**
   - Command: `huggingface-cli whoami`
   - Expected: Username and token info
   - Failure: "Invalid token" or "Not logged in"

3. **Git Status Test**
   - Command: `git status` (after rsync)
   - Expected: Modified/added files listed
   - Failure: "No changes" when changes expected

4. **Push Success Test**
   - Command: `git push origin main`
   - Expected: "Branch 'main' set up to track remote branch"
   - Failure: Authentication error or push rejected

5. **Space Rebuild Test**
   - Check: Hugging Face Space build logs
   - Expected: "Building..." status, then "Running"
   - Failure: Build errors or Space not updating

### Manual Testing Checklist

- [ ] Workflow triggers on push to main branch
- [ ] CLI installation step completes without errors
- [ ] Authentication succeeds with HF_TOKEN
- [ ] Backend files sync to Space repository
- [ ] Git commit creates new commit with changes
- [ ] Git push completes successfully
- [ ] Hugging Face Space rebuilds automatically
- [ ] Space shows updated backend code
- [ ] Workflow completes in under 5 minutes

---

## Security Considerations

### Token Security

- **Storage**: HF_TOKEN stored in GitHub repository secrets (AES-256 encrypted)
- **Access**: Only workflow runs can access secret (not visible in logs)
- **Scope**: Token should have write access only to target Space (not all repositories)
- **Rotation**: Token can be rotated by updating GitHub secret (no workflow changes)
- **Expiration**: Set token expiration in Hugging Face settings (recommended: 90 days)

### Credential Exposure Prevention

- **Masked in Logs**: GitHub Actions automatically masks secret values
- **No URL Embedding**: Token never in git remote URLs
- **Ephemeral Storage**: Credential helper cleared after workflow completes
- **No Artifacts**: Token not stored in workflow artifacts or cache

### Least Privilege

- **Token Permissions**: Write access to single Space (not organization-wide)
- **Workflow Permissions**: `contents: read` (no write to GitHub repo)
- **Runner Isolation**: Each workflow run uses fresh ephemeral runner

---

## Performance Optimization

### Workflow Speed

- **Caching**: Cache pip packages to speed up CLI installation
- **Shallow Clone**: Use `--depth 1` for Space repository clone (faster)
- **Parallel Steps**: None possible (sequential dependencies)
- **Estimated Duration**: 2-3 minutes (well under 5-minute target)

### Network Efficiency

- **Incremental Sync**: rsync only transfers changed files
- **Compression**: Git uses compression for push operations
- **Connection Reuse**: Single authentication for all git operations

---

## Rollback Strategy

### Deployment Failure Handling

- **Automatic Rollback**: Not implemented (out of scope per spec)
- **Manual Rollback**: Revert commit in Space repository via Hugging Face UI
- **Debugging**: GitHub Actions logs show exact failure point
- **Retry**: Re-run workflow after fixing issue

### Future Enhancements (Out of Scope)

- Blue-green deployment with staging Space
- Automated rollback on build failure
- Deployment notifications (Slack, email)
- Multi-environment support (dev, staging, prod)

---

## Summary

**Chosen Architecture:**
- **Authentication**: HTTPS + Token via huggingface-cli login
- **Sync Strategy**: Direct git push with rsync for file copy
- **Workflow**: Sequential 7-phase execution with fail-fast behavior

**Key Benefits:**
- Simple setup (no SSH keys or complex configuration)
- Secure (token never exposed in logs or URLs)
- Reliable (fail-fast with clear error messages)
- Fast (completes in 2-3 minutes)
- Maintainable (standard git workflow, easy to debug)

**Risks Mitigated:**
- Token exposure (masked in logs, not in URLs)
- Authentication failures (explicit login step with verification)
- Partial syncs (rsync --delete ensures exact mirror)
- Silent failures (each step verified before proceeding)

**Next Steps:**
- Proceed to Phase 1: Design workflow contract and data model
- Create quickstart guide for setup and troubleshooting
- Generate tasks for implementation
