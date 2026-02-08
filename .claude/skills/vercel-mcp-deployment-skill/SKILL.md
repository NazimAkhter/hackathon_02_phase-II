---
name: vercel-mcp-deployment-skill
description: Deploy frontend applications to Vercel using MCP integration without the CLI, ensuring accessibility and stable production deployment.
---

# Vercel MCP Deployment Workflow – Frontend Application

## Instructions

1. **Connect Project via MCP**
   - Navigate to the Vercel dashboard
   - Select **"Import Project"** and choose **Git repository** as the source
   - Enable **MCP integration** to manage deployments without using the CLI
   - Grant required permissions for repository access

2. **Configure Project Settings**
   - Set the **framework preset** (Next.js, React, or custom)
   - Define **build command** and **output directory** (e.g., `npm run build`, `.next`)
   - Set environment variables for frontend configuration securely
   - Choose deployment branches for **preview** and **production**

3. **Trigger MCP Deployments**
   - Push changes to the connected Git repository
   - MCP automatically triggers a build and deployment workflow
   - Monitor build progress and logs in the Vercel dashboard
   - Validate successful deployment without modifying frontend logic

4. **Monitor Deployment Status**
   - Check **preview URLs** for testing new changes
   - Verify production deployment on the assigned domain
   - Inspect deployment logs for errors or warnings
   - Rollback deployments via MCP if needed

5. **Accessibility & Reliability**
   - Ensure frontend remains accessible during deployment
   - Test responsiveness and visual integrity post-deployment
   - Confirm environment variables and secrets are applied correctly
   - Maintain core functionality and user experience

---

## Best Practices

- Keep build commands and output paths consistent across environments
- Use descriptive branch names for preview and production
- Validate environment variables before triggering deployment
- Monitor logs and fix errors before promoting to production
- Separate dev, preview, and production configurations
- Test accessibility and responsiveness on multiple devices
- Maintain version control for reproducible deployments
- Document MCP deployment steps for team reference

---

## Example Workflow

```bash
# Push frontend changes to Git (connected via MCP)
git add .
git commit -m "Update homepage layout and animations"
git push origin main

# MCP automatically triggers build and deployment in Vercel
# Monitor deployment logs in Vercel Dashboard under the project
