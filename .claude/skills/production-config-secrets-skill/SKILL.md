---
name: production-config-secrets-skill
description: Prepare applications for secure and stable production deployment by managing configuration, secrets, and accessibility without altering core functionality.
---

# Production Configuration and Secrets Handling

## Instructions

1. **Configure Production Build Settings**
   - Use production-specific build commands (e.g., `next build` for Next.js, `uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4` for FastAPI)
   - Disable debug modes and verbose logging
   - Enable performance optimizations (e.g., minification, caching, code splitting)
   - Validate that build artifacts are correct and deployable

2. **Securely Store Authentication Secrets and Sensitive Data**
   - Use hosting platform environment variable settings (Vercel, Heroku, Hugging Face Spaces, AWS, etc.)  
   - Store API keys, database URLs, JWT secrets, and encryption keys securely  
   - Separate secrets for development, preview, and production environments  
   - Ensure secrets are never committed to the repository

3. **Remove Debug and Development Features**
   - Disable debug endpoints, verbose logging, and developer tools in production  
   - Remove temporary test accounts or data  
   - Ensure error messages do not expose sensitive information  
   - Confirm all debug code is excluded from the production bundle

4. **Ensure HTTPS and Secure Communication**
   - Enforce HTTPS for all production endpoints  
   - Enable secure headers (e.g., HSTS, Content-Security-Policy)  
   - Validate TLS certificates are correctly applied  
   - Test that API calls and user data are transmitted securely

5. **Accessibility & Reliability**
   - Confirm that optimizations and security settings do not break UI or functionality  
   - Test frontend accessibility with screen readers and keyboard navigation  
   - Verify that production builds perform reliably under expected traffic  
   - Maintain consistent behavior across all environments

---

## Best Practices

- Use environment-specific configuration for production  
- Never commit secrets or sensitive data to the repository  
- Enforce HTTPS and secure headers for all production endpoints  
- Remove debug features and verbose logs before deployment  
- Test production builds for performance, stability, and accessibility  
- Document all production configuration and secret handling practices  
- Maintain separate environment variables for preview and production  
- Validate that security measures do not interfere with core functionality

---

## Example Production Environment Setup

```bash
# Next.js Production Build
npm run build
npm run start

# FastAPI Production with Uvicorn
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4 --log-level info
