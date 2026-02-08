---
name: github-vercel-integration-skill
description: Enable automatic deployments by linking a GitHub repository to a Vercel project, ensuring accessibility and stable frontend deployment.
---

# GitHub–Vercel Project Integration

## Instructions

1. **Connect GitHub Repository**
   - Navigate to the Vercel dashboard and select **"Import Project"**
   - Choose **GitHub** as the repository source
   - Authenticate with GitHub and grant repository access
   - Select the repository containing your frontend project

2. **Configure Automatic Deployments**
   - Enable **Automatic Deployments** on push or pull request merges
   - Specify **preview** branches for testing and **production** branches for live deployment
   - Set environment variables for each branch if needed
   - Use Vercel’s MCP or built-in GitHub integration for deployment triggers

3. **Build Status & Monitoring**
   - Vercel reports build and deployment status directly in GitHub commits and pull requests
   - Review logs in the Vercel dashboard for build errors or warnings
   - Ensure deployments complete successfully before merging to production
   - Monitor preview deployments for testing accessibility and functionality

4. **Branch-Based Deployment Rules**
   - Define rules for preview and production environments based on branch names
   - Protect production branch to prevent accidental deployments
   - Optionally, use GitHub Actions or workflows to enforce checks before deployment
   - Validate that deployment rules do not alter core frontend functionality

5. **Accessibility & Reliability**
   - Verify preview URLs are accessible for testing
   - Ensure production deployments are stable and responsive
   - Confirm environment variables and secrets are applied correctly
   - Maintain frontend behavior consistency across deployments

---

## Best Practices

- Keep GitHub repository clean and organized
- Use descriptive commit messages for traceable deployments
- Validate environment variables before deploying
- Protect production branch with pull request approvals
- Monitor Vercel logs and build status regularly
- Separate preview and production environments clearly
- Test accessibility and responsiveness post-deployment
- Document integration steps for team members

---

## Example Workflow

```bash
# Connect GitHub repository to Vercel
# Done via Vercel dashboard: Import Project → GitHub → Select Repository

# Push changes to GitHub to trigger deployment
git add .
git commit -m "Update landing page layout and animations"
git push origin main

# Vercel automatically builds and deploys
# Check GitHub commit status for deployment result
