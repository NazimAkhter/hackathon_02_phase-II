# HF Spaces Backend Deployer - Memory

## Key Deployment Patterns

### Hugging Face Spaces Docker Configuration
- **Port**: Must use 7860 (HF Spaces standard)
- **README.md metadata**: Required front-matter for HF Spaces recognition:
  - `sdk: docker`
  - `app_port: 7860`
  - `license: mit` (or appropriate license)
- **Dockerfile**: Must EXPOSE 7860 and bind uvicorn to 0.0.0.0:7860

### Environment Variables Strategy
- All secrets MUST be configured in HF Spaces UI (Settings → Variables and Secrets)
- Mark sensitive values as "Secret" (DATABASE_URL, BETTER_AUTH_SECRET)
- Use .env.example with placeholders only (never commit real secrets)
- BETTER_AUTH_SECRET must match frontend exactly for JWT validation

### CORS Configuration for Production
- Use environment variable FRONTEND_URL for dynamic CORS origins
- For Vercel: Include both production URL and wildcard for preview deployments
  ```python
  allow_origins=[
      settings.FRONTEND_URL,  # Production
      "https://*.vercel.app",  # Preview deployments
  ]
  ```
- Enable credentials: `allow_credentials=True` (required for httpOnly cookies)

### Common Failure Modes

**Build Failures**:
- Missing dependencies in requirements.txt
- Incorrect Python import paths (use `src.main:app` not `main:app`)
- Missing src/ directory in Docker COPY

**Runtime Failures**:
- Database connection: Ensure `sslmode=require` for Neon PostgreSQL
- Port mismatch: Dockerfile EXPOSE and uvicorn --port must both be 7860
- Environment variables not loaded: HF Spaces requires restart after adding variables

**CORS Errors**:
- Frontend URL mismatch: FRONTEND_URL must exactly match Vercel deployment
- Missing wildcard: Vercel preview deployments need `*.vercel.app` pattern
- Credentials not enabled: Must set `allow_credentials=True`

### Git-Based Deployment Workflow
- HF Spaces can link directly to GitHub repository
- Use monorepo path: Specify `backend/` subdirectory in Space settings
- Auto-rebuild: Enable automatic rebuilds on push to main branch
- Build time: First build 5-10 minutes, subsequent builds faster

### Health Check Best Practices
- Implement root endpoint (`/`) returning JSON with status
- Include environment, version, and CORS origins in response
- Helps verify deployment success before testing complex endpoints
- Example:
  ```json
  {
    "status": "ok",
    "environment": "production",
    "version": "1.0.0",
    "cors_origins": ["https://frontend.vercel.app"]
  }
  ```

### Deployment Validation Checklist
- Dockerfile uses correct port (7860)
- requirements.txt includes all dependencies
- README.md has HF Spaces metadata
- .dockerignore excludes .env, __pycache__, venv
- No secrets in Git history
- Health check endpoint implemented
- CORS middleware configured

## Project-Specific Configuration

### Repository Structure
- Monorepo: Backend in `/backend` subdirectory
- Dockerfile location: `/backend/Dockerfile`
- Application entry point: `src.main:app` (note: `src` not at root)

### Dependencies Used
- FastAPI (web framework)
- SQLModel (ORM)
- Uvicorn (ASGI server)
- Pydantic Settings (environment configuration)
- PyJWT (JWT handling)
- Bcrypt (password hashing)
- Psycopg2-binary (PostgreSQL driver)

### Database Configuration
- Provider: Neon Serverless PostgreSQL
- Connection string includes: `sslmode=require&channel_binding=require`
- Environment variable: DATABASE_URL

### Authentication Setup
- Better Auth compatible JWT authentication
- Shared secret between frontend and backend: BETTER_AUTH_SECRET
- JWT tokens stored in httpOnly cookies (requires CORS credentials)

## Rollback Strategy
- Identify problematic commit: `git log --oneline`
- Revert commit: `git revert <hash>`
- Push to main: HF Space auto-rebuilds
- Alternative: Use HF Spaces UI to specify different commit hash

## Optimization Insights
- First deployment takes longer (5-10 min) due to Docker layer caching
- Subsequent deployments faster (~3-5 min)
- Put frequently changing code (src/) after dependencies in Dockerfile
- Use .dockerignore to exclude unnecessary files (reduces build context)

## Security Considerations
- Never commit .env files with real secrets
- Use placeholder values in .env.example
- Verify no secrets in Git history: `git log --all -S "SECRET"`
- All production secrets go in HF Spaces settings UI
- Enable SSL for database connections (Neon requires it)

## Documentation Created
- `/HF_SPACES_DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `/backend/README.md` - HF Spaces metadata + API documentation
- `/backend/validate-deployment.sh` - Pre-deployment validation script

## Lessons Learned
- HF Spaces README.md front-matter is critical for Space recognition
- Port 7860 is non-negotiable for HF Spaces Docker SDK
- Environment variables require Space restart to take effect
- Git-based deployment is more reliable than manual file uploads
- Health check endpoint essential for verifying deployment success
