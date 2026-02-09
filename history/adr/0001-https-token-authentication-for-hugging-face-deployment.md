# ADR-0001: HTTPS Token Authentication for Hugging Face Deployment

> **Scope**: This ADR documents the integrated authentication and deployment strategy for GitHub Actions to Hugging Face Spaces, clustering three related decisions: authentication method, login approach, and deployment mechanism.

- **Status:** Accepted
- **Date:** 2026-02-10
- **Feature:** 001-hf-deployment-fix
- **Context:** The GitHub Actions workflow needs to securely deploy backend code to Hugging Face Spaces without manual intervention. The deployment must authenticate programmatically, sync files reliably, and maintain git history while preventing token exposure in logs or URLs.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: ✅ Long-term security and CI/CD architecture
     2) Alternatives: ✅ Multiple viable options (SSH, token-in-URL, API upload)
     3) Scope: ✅ Cross-cutting (affects authentication, deployment, security)
-->

## Decision

We will use an integrated HTTPS token authentication approach consisting of three components:

1. **Authentication Method**: HTTPS with Hugging Face API token (not SSH keys)
   - Store `HF_TOKEN` in GitHub repository secrets (encrypted at rest)
   - Use HTTPS protocol for all git operations with Hugging Face

2. **Login Approach**: `huggingface-cli login` command (not token-in-URL)
   - Authenticate once using `huggingface-cli login --token $HF_TOKEN`
   - Credentials stored in git credential helper (ephemeral, session-scoped)
   - Subsequent git operations automatically use stored credentials

3. **Deployment Strategy**: Direct git push with rsync file sync
   - Clone Hugging Face Space repository via HTTPS
   - Sync backend files using rsync (preserves structure, handles deletions)
   - Commit changes with descriptive metadata
   - Push to Space using standard `git push origin main` (credentials auto-injected)

## Consequences

### Positive

- **Security**: Token never exposed in git URLs, process lists, or command history
- **Simplicity**: No SSH key generation, storage, or agent setup required
- **CI/CD Integration**: GitHub Actions secrets integrate seamlessly with HTTPS authentication
- **Token Rotation**: Easy to rotate tokens by updating GitHub secret (no workflow changes)
- **Universal Compatibility**: HTTPS works across all GitHub Actions runners without firewall issues
- **Git History**: Maintains full commit history and metadata in Space repository
- **Auto-Rebuild**: Direct git push triggers automatic Space rebuild
- **Credential Masking**: huggingface-cli automatically masks tokens in logs
- **Scoped Permissions**: Tokens can be scoped to specific repositories (read/write granularity)

### Negative

- **Dependency on CLI**: Requires huggingface_hub Python package installation in workflow
- **Token Management**: Requires manual token creation and GitHub secret configuration
- **Session Scope**: Credential helper is ephemeral (cleared after workflow completes)
- **Network Dependency**: Requires stable internet connection for HTTPS operations
- **Token Expiration**: Tokens can expire and require manual renewal
- **Single Point of Failure**: If Hugging Face API is down, deployment fails

## Alternatives Considered

### Alternative 1: SSH Key Authentication
- **Approach**: Generate SSH key pair, store private key in GitHub secrets, configure SSH agent
- **Pros**: More secure for long-lived credentials, industry standard for git operations
- **Cons**: Complex setup (key generation, agent configuration), harder token rotation, potential firewall issues, SSH not needed for CI/CD
- **Rejected Because**: Adds unnecessary complexity; HTTPS token authentication is simpler and sufficient for CI/CD use case

### Alternative 2: Token Embedded in Git URL
- **Approach**: Use `git push https://oauth:$TOKEN@huggingface.co/spaces/USER/SPACE main`
- **Pros**: Single command, no CLI installation required
- **Cons**: Token visible in process list (`ps aux`), logs, and git remote output; security risk of token exposure
- **Rejected Because**: Critical security vulnerability - tokens can leak in verbose logs and command history

### Alternative 3: rsync over SSH
- **Approach**: Use rsync with SSH to sync files directly to Space
- **Pros**: Efficient incremental sync, only changed files transferred
- **Cons**: Requires SSH setup, doesn't trigger Space rebuild, no git history, no version control
- **Rejected Because**: Loses git benefits (history, versioning, automatic rebuild triggers)

### Alternative 4: Hugging Face Hub API Upload
- **Approach**: Use Hugging Face Hub Python API to upload files programmatically
- **Pros**: Programmatic control, no git operations needed
- **Cons**: Requires custom script, doesn't preserve git history, slower for multiple files, more complex error handling
- **Rejected Because**: Over-engineered for simple deployment; loses git history and rebuild automation

## References

- Feature Spec: [specs/001-hf-deployment-fix/spec.md](../../specs/001-hf-deployment-fix/spec.md)
- Implementation Plan: [specs/001-hf-deployment-fix/plan.md](../../specs/001-hf-deployment-fix/plan.md)
- Research Document: [specs/001-hf-deployment-fix/research.md](../../specs/001-hf-deployment-fix/research.md)
- Related ADRs: None (first ADR for this project)
- Implementation: [.github/workflows/deploy-backend.yml](../../.github/workflows/deploy-backend.yml)
- Hugging Face Docs: https://huggingface.co/docs/hub/spaces-github-actions
- GitHub Actions Security: https://docs.github.com/en/actions/security-guides/encrypted-secrets
