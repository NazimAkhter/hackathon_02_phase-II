---
name: github-ci-cd-integration-skill
description: Enable GitHub integration for automated CI/CD deployments, ensuring accessibility and stable builds without affecting core functionality.
---

# GitHub Integration for CI/CD

## Instructions

1. **Connect Repository to Deployment Platforms**
   - Link your GitHub repository to your deployment platform (Vercel, Hugging Face Spaces, Netlify, etc.)
   - Grant necessary permissions for automated builds and deployments
   - Ensure correct branch access (e.g., main, develop, feature branches)

2. **Trigger Builds on Push**
   - Configure CI/CD workflow to automatically build and deploy when code is pushed to the main or designated branches
   - Use GitHub Actions or platform-native integration for automated triggers
   - Monitor build logs for errors or warnings
   - Validate that builds complete successfully before production deployment

3. **Enable Preview Deployments**
   - Automatically deploy pull requests to preview environments
   - Assign preview URLs for testing UI, functionality, and accessibility
   - Use preview deployments for QA and stakeholder review
   - Separate preview environment variables from production

4. **Build & Deployment Status Visibility**
   - Ensure GitHub displays build and deployment status for commits and pull requests
   - Use status checks and branch protection rules to prevent merging broken code
   - Monitor workflow success or failure in GitHub Actions or CI/CD platform
   - Maintain clear logs for troubleshooting build or deployment issues

5. **Accessibility & Reliability**
   - Confirm that automated builds and deployments do not break UI or functionality
   - Test preview and production deployments for responsiveness and accessibility
   - Ensure environment variables are applied correctly per environment
   - Maintain stable and predictable deployment behavior

---

## Best Practices

- Keep main and preview deployments isolated
- Use descriptive branch names and commit messages
- Automate builds and deployments via GitHub Actions or platform integration
- Monitor deployment status and logs regularly
- Validate accessibility and functionality on preview builds
- Protect production branches using status checks and review requirements
- Document CI/CD workflow for team reference
- Avoid committing secrets; use environment variables securely

---

## Example GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Build frontend
        run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
