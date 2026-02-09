---
name: huggingface-spaces-deployment-skill
description: Deploy the FastAPI backend to Hugging Face Spaces securely and reliably, ensuring accessibility and stable production operation.
---

# Hugging Face Spaces Deployment – FastAPI Backend

## Instructions

1. **Configure Spaces Project**
   - Create a new Hugging Face Space and select **"Backend"** or **"Gradio/Streamlit + Backend"** if needed
   - Ensure Python environment matches your FastAPI requirements
   - Set project visibility and access permissions according to needs

2. **Upload Code & Dependencies**
   - Add backend code to the repository linked to the Space
   - Include `requirements.txt` or `pyproject.toml` for dependencies
   - Securely manage sensitive information via environment variables
   - Avoid committing secrets to the repository

3. **Trigger Builds & Deployment**
   - Push changes to the connected Git repository
   - Spaces automatically triggers a build; monitor build logs for errors
   - Fix dependency or configuration issues as indicated in build logs
   - Validate that the build succeeds before testing endpoints

4. **Run & Verify Backend**
   - Ensure FastAPI app is running in the hosted environment
   - Test health check endpoints (`/health`) to verify accessibility
   - Monitor logs for runtime errors
   - Validate functionality without changing core logic

5. **Accessibility & Reliability**
   - Ensure backend endpoints are reachable and responsive
   - Do not expose sensitive variables to the client-side
   - Maintain consistent behavior across deployments
   - Keep monitoring in place for production reliability

---

## Best Practices

- Keep dependencies minimal and versioned
- Use environment variables for secrets
- Monitor build logs and deployment status
- Test endpoints post-deployment to confirm accessibility
- Use Git integration for reproducible deployments
- Separate dev, preview, and production configurations
- Avoid breaking changes in live deployments
- Document deployment steps for team members

---

## Example Structure (FastAPI + Hugging Face Spaces)

```bash
# Clone the Space repository
git clone https://huggingface.co/spaces/username/fastapi-backend
cd fastapi-backend

# Add your FastAPI code and dependencies
pip freeze > requirements.txt
git add .
git commit -m "Initial FastAPI backend deployment"
git push origin main
