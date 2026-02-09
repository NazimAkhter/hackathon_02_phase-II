---
name: env-variable-management-skill
description: Securely store and manage configuration values across environments while ensuring accessibility and stable functionality.
---

# Environment Variable Management

## Instructions

1. **Define Required Variables**
   - Identify all configuration values and secrets required by your application (API keys, endpoints, analytics IDs, feature flags)
   - Use clear, descriptive names for each variable (e.g., `API_URL`, `NEXT_PUBLIC_ANALYTICS_ID`)
   - Separate variables for different environments: development, preview, and production

2. **Store Secrets in Hosting Platform**
   - Use hosting platform settings (Vercel, Netlify, Heroku, or Hugging Face Spaces) to securely store environment variables
   - Avoid committing secrets in `.env` files to the repository
   - Leverage platform features for secret rotation or encrypted storage

3. **Separate Variables per Environment**
   - Assign environment-specific values to development, preview, and production
   - Ensure that preview deployments use staging or test endpoints
   - Production deployments should use live services and keys
   - Avoid exposing production secrets in non-production environments

4. **Prevent Sensitive Data from Repository**
   - Add `.env*` files to `.gitignore` to prevent accidental commits
   - Use runtime environment variables instead of hardcoding secrets
   - Validate that sensitive data is never included in frontend bundles or logs
   - Review pull requests to ensure secrets are not leaked

5. **Accessibility & Reliability**
   - Verify the application functions correctly using environment variables in all environments
   - Test accessibility and responsive UI behavior in preview and production builds
   - Maintain core functionality while updating configuration values
   - Ensure consistent behavior across development, preview, and production deployments

---

## Best Practices

- Use descriptive and consistent variable names  
- Separate environment variables for dev, preview, and production  
- Store sensitive data securely in hosting platform settings  
- Never commit secrets to the repository  
- Validate variable usage during builds and runtime  
- Document environment variable usage for team reference  
- Test accessibility and functionality after configuration changes  
- Keep builds reproducible and stable across environments  

---

## Example Setup in Vercel

```bash
# Local development (do NOT commit)
# .env.local
NEXT_PUBLIC_API_URL=https://api-dev.example.com
NEXT_PUBLIC_ANALYTICS_ID=UA-XXXXXX
