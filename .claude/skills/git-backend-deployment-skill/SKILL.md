---
name: git-backend-deployment-skill
description: Manage backend updates and deployments using Git integration, ensuring version control and accessibility without affecting core functionality.
---

# Git-Based Backend Deployment Workflow

## Instructions

1. **Push Code to Repository**
   - Keep your backend code in a dedicated Git repository
   - Commit changes with clear, descriptive messages
   - Push commits to the connected repository branch (e.g., `main`, `develop`)

2. **Automatic Deployment**
   - Configure the platform (e.g., Hugging Face Spaces, Vercel, or CI/CD pipeline) to deploy on push or branch update
   - Use webhook or built-in Git integration to trigger deployment automatically
   - Monitor logs for successful deployment and errors

3. **Branch Management**
   - Maintain separate branches for preview and production environments
   - Merge feature branches into preview branch for testing
   - Merge preview into production only after validation
   - Apply branch protection rules to prevent accidental direct pushes to production

4. **Version Control & Reproducibility**
   - Ensure all deployed versions correspond to specific Git commits
   - Tag releases for stable versions (`v1.0.0`, `v1.1.0`)
   - Keep deployment history for rollback if needed
   - Use `.gitignore` to prevent sensitive files from being committed

5. **Accessibility & Reliability**
   - Ensure backend remains accessible during deployment
   - Validate that deployments do not break endpoints or services
   - Monitor health check endpoints post-deployment
   - Maintain consistent environment variables across branches

---

## Best Practices

- Commit frequently with descriptive messages
- Use feature branches for development and testing
- Protect production branch with review rules
- Tag stable releases for reproducible deployments
- Monitor deployment logs and health endpoints
- Automate deployment via CI/CD pipelines or Git hooks
- Keep sensitive configuration out of the repository
- Validate deployments on preview before production

---

## Example Git Workflow

```bash
# Create a feature branch
git checkout -b feature/add-health-check

# Make code changes and commit
git add .
git commit -m "Add /health endpoint for backend monitoring"

# Push to preview branch for deployment
git push origin feature/add-health-check

# Merge into preview branch for testing
git checkout preview
git merge feature/add-health-check
git push origin preview

# After testing, merge into production
git checkout main
git merge preview
git push origin main
