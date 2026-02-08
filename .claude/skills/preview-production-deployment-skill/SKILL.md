---
name: preview-production-deployment-skill
description: Configure separate environments for preview and production deployments in Vercel, ensuring accessibility and stable releases without affecting core functionality.
---

# Preview and Production Deployment Setup

## Instructions

1. **Enable Preview Deployments**
   - Configure Vercel to automatically deploy pull requests to preview environments
   - Use preview URLs for testing UI, functionality, and accessibility
   - Apply environment variables specific to the preview environment
   - Validate that preview builds reflect changes correctly without affecting production

2. **Configure Production Deployment**
   - Set the main branch (e.g., `main` or `master`) for production deployments
   - Apply production-specific environment variables securely
   - Ensure automatic deployment triggers on commits to the production branch
   - Monitor deployment logs for errors or warnings

3. **Environment Variable Management**
   - Separate environment variables for preview and production to prevent leakage
   - Keep secrets out of version control; use Vercel's environment variable settings
   - Validate that correct variables are applied in each deployment
   - Test functionality dependent on environment-specific variables

4. **Preview Validation Before Release**
   - Test preview deployments for accessibility, responsiveness, and performance
   - Verify that UI and API integration work as expected
   - Ensure no breaking changes exist before merging to production
   - Use preview feedback to improve quality before production release

5. **Accessibility & Reliability**
   - Maintain consistent frontend accessibility across environments
   - Confirm that deployments do not alter core functionality
   - Keep preview and production environments isolated and reproducible
   - Ensure monitoring and health checks are applied to production

---

## Best Practices

- Keep preview and production builds isolated
- Test all features in preview before merging to production
- Use descriptive branch names for clarity (`feature/*`, `main`, `develop`)
- Monitor deployment logs for both environments
- Apply environment variables consistently and securely
- Automate deployments for reproducibility
- Validate accessibility, responsiveness, and functionality in preview
- Document environment setup and deployment rules for team use

---

## Example Workflow

```bash
# Push changes to a feature branch for preview
git checkout -b feature/add-login
git add .
git commit -m "Add login page UI"
git push origin feature/add-login

# Vercel automatically creates a preview deployment
# Test the preview URL for functionality and accessibility

# Merge feature branch into main for production
git checkout main
git merge feature/add-login
git push origin main

# Production deployment triggered automatically
# Monitor production URL and logs
