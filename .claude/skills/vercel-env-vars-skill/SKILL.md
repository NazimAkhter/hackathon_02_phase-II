---
name: vercel-env-vars-skill
description: Securely manage frontend configuration values in Vercel, ensuring accessibility and stable deployments without affecting core functionality.
---

# Environment Variable Configuration for Vercel

## Instructions

1. **Define Required Variables**
   - Identify all environment variables needed for the frontend (API URLs, keys, analytics IDs)
   - Use consistent and descriptive naming conventions (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ANALYTICS_ID`)
   - Separate variables by environment: **preview** and **production**

2. **Add Variables to Vercel Project**
   - Navigate to your Vercel project → **Settings → Environment Variables**
   - Add variables securely without storing secrets in the Git repository
   - Specify the environment for each variable (Preview, Production, Development)
   - Use Vercel's secret management for sensitive values

3. **Separate Environment Variables**
   - Maintain different values for preview and production deployments
   - Ensure preview builds use test or staging API endpoints
   - Production builds should use live endpoints and keys
   - Avoid mixing secrets between environments

4. **Prevent Secrets in Repository**
   - Never commit `.env` files containing sensitive information
   - Add `.env*` files to `.gitignore`
   - Use environment variables exclusively for secret management
   - Validate variables at build or runtime to prevent misconfiguration

5. **Accessibility & Reliability**
   - Ensure frontend works correctly using environment variables
   - Test endpoints and services in preview and production builds
   - Maintain core functionality while changing configuration values
   - Verify that secrets are not exposed to the client-side improperly

---

## Best Practices

- Keep environment variables descriptive and consistent  
- Separate preview, development, and production configurations  
- Do not commit secrets to Git repositories  
- Test all builds after updating environment variables  
- Monitor deployment logs for errors related to missing variables  
- Document variable usage and environment requirements for team members  
- Use Vercel's secret management features for sensitive values  

---

## Example Environment Variable Setup in Vercel

```bash
# Local development (do NOT commit)
# .env.local
NEXT_PUBLIC_API_URL=https://api-dev.example.com
NEXT_PUBLIC_ANALYTICS_ID=UA-XXXXXX
