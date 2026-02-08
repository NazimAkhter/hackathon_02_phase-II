---
name: cors-security-configuration-skill
description: Secure backend APIs by configuring CORS, enforcing HTTPS, and validating authentication, while maintaining accessibility and core functionality.
---

# CORS and Security Configuration

## Instructions

1. **Configure CORS**
   - Allow requests only from trusted frontend domains
   - Block all unauthorized origins
   - Use backend frameworks’ CORS middleware or libraries (e.g., FastAPI `CORSMiddleware`, Express `cors` package)
   - Allow only required HTTP methods and headers

2. **Enforce Secure Headers**
   - Apply security headers such as:
     - `Strict-Transport-Security (HSTS)`  
     - `Content-Security-Policy (CSP)`  
     - `X-Frame-Options`  
     - `X-Content-Type-Options`  
   - Ensure headers are applied consistently across all routes

3. **Enable HTTPS**
   - Use HTTPS for all API endpoints in production
   - Redirect HTTP requests to HTTPS
   - Validate SSL/TLS certificates for backend servers

4. **Validate Authentication Tokens**
   - Protect sensitive routes using JWT or session tokens
   - Verify tokens on each request to authorized endpoints
   - Reject requests with invalid, missing, or expired tokens
   - Log unauthorized access attempts for monitoring

5. **Accessibility & Reliability**
   - Ensure CORS and security configurations do not block legitimate users or frontend interactions
   - Maintain consistent API behavior for authenticated requests
   - Test endpoints for accessibility via frontend UI and API clients
   - Ensure error messages do not leak sensitive information

---

## Best Practices

- Restrict CORS to known frontend domains  
- Allow only required HTTP methods and headers  
- Apply secure headers and HTTPS consistently  
- Validate authentication tokens on all protected routes  
- Log unauthorized attempts for monitoring and debugging  
- Test API accessibility and frontend integration after changes  
- Keep configuration environment-specific (dev, preview, production)  

---

## Example Configuration (FastAPI)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "https://www.yourfrontend.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.get("/protected-route")
async def protected_route(token: str):
    # Validate token logic here
    if not validate_token(token):
        return {"error": "Unauthorized"}
    return {"message": "Access granted"}
