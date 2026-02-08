---
name: env-vars-spaces-skill
description: Manage backend configuration securely using environment variables in Hugging Face Spaces without affecting core functionality.
---

# Environment Variable Setup in Hugging Face Spaces

## Instructions

1. **Define Required Variables**
   - Identify all environment variables needed for your backend (API keys, database URLs, secrets)
   - Use descriptive names and consistent naming conventions (e.g., `DB_URL`, `API_KEY`)
   - Separate variables by environment: development, preview, production

2. **Securely Add Variables in Spaces**
   - Navigate to your Hugging Face Space → **Settings → Secrets**
   - Add environment variables securely without exposing them in code
   - Avoid committing sensitive information to Git repositories
   - Use `.env` files locally only, ensure they are in `.gitignore`

3. **Environment Separation**
   - Maintain separate variables for each deployment stage
   - Use `HF_ENV` or similar to detect environment if needed
   - Test variables in dev or preview before production deployment
   - Ensure production secrets are not shared with dev or preview

4. **Access & Usage**
   - Access environment variables in code via `os.environ` (Python) or `process.env` (Node.js)
   - Avoid hardcoding secrets or configuration values
   - Validate variables on startup to ensure required keys are present
   - Log missing or invalid environment variables for troubleshooting

5. **Accessibility & Reliability**
   - Ensure backend operates correctly with environment variables
   - Do not expose sensitive variables to the client-side
   - Keep variable usage consistent across all services
   - Maintain operational accessibility without changing core logic

---

## Best Practices

- Keep all sensitive values out of version control
- Use descriptive and consistent variable names
- Separate dev, preview, and production configurations
- Validate environment variables on startup
- Limit scope of secrets to only where needed
- Use Spaces' built-in secret management for security
- Document variables for team members without exposing secrets
- Test changes in staging before production deployment

---

## Example Usage (Python + FastAPI)

```python
import os
from fastapi import FastAPI

app = FastAPI()

# Access environment variables
DATABASE_URL = os.environ.get("DB_URL")
API_KEY = os.environ.get("API_KEY")

@app.get("/config")
def show_config():
    return {"database_connected": bool(DATABASE_URL), "api_key_present": bool(API_KEY)}
