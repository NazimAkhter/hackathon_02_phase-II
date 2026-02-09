---
name: multi-environment-setup-skill
description: Maintain separate configurations for development, preview, and production environments while ensuring accessibility and stable functionality.
---

# Multi-Environment Setup (Dev, Preview, Production)

## Instructions

1. **Configure Development Environment**
   - Use local environment variables and test services
   - Enable debug mode and verbose logging for easier development
   - Separate development secrets from production
   - Validate accessibility and UI behavior locally

2. **Configure Preview Environment**
   - Deploy pull requests or feature branches to preview environments
   - Use staging API endpoints and test databases
   - Assign environment variables specific to preview builds
   - Allow QA and stakeholders to verify functionality and accessibility before production

3. **Configure Production Environment**
   - Use stable, secure settings and live services
   - Assign production-specific environment variables (API keys, database URLs, JWT secrets)
   - Disable debug features and verbose logging
   - Enforce HTTPS, secure headers, and performance optimizations

4. **Assign Correct Environment Variables**
   - Maintain separate environment variables for each stage (dev, preview, production)
   - Ensure sensitive data is not exposed in non-production environments
   - Use hosting platform features (Vercel, Hugging Face Spaces, Heroku, etc.) to manage variables securely

5. **Enable Preview Deployments for Testing**
   - Automatically generate preview builds for pull requests
   - Share preview URLs with team and stakeholders for validation
   - Test functionality, performance, and accessibility before merging to main branch

6. **Accessibility & Reliability**
   - Confirm that environment-specific configurations do not break UI or accessibility
   - Validate responsive behavior and smooth functionality across all stages
   - Ensure stable and predictable behavior in production

---

## Best Practices

- Keep development, preview, and production configurations isolated  
- Use descriptive and consistent environment variable names  
- Never commit secrets or sensitive data to the repository  
- Enable preview deployments for testing and validation  
- Test accessibility and performance in each environment  
- Document environment-specific variables and configuration for the team  
- Enforce security measures in production without affecting functionality  
- Validate builds and deployments before merging to production  

---

## Example Environment Variable Setup

```bash
# Local development
# .env.local
NEXT_PUBLIC_API_URL=https://api-dev.example.com
NEXT_PUBLIC_ANALYTICS_ID=UA-DEV

# Preview environment (managed in hosting platform)
NEXT_PUBLIC_API_URL=https://api-preview.example.com
NEXT_PUBLIC_ANALYTICS_ID=UA-PREVIEW

# Production environment (managed in hosting platform)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ANALYTICS_ID=UA-PROD
DATABASE_URL=postgres://user:password@db.example.com:5432/prod_db
JWT_SECRET=supersecretkey
