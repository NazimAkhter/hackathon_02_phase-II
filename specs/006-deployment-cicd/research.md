# Phase 0: Research – Deployment & CI/CD

**Feature**: 006-deployment-cicd
**Date**: 2026-02-09
**Purpose**: Research deployment platforms, CI/CD integration patterns, and environment management strategies

## Research Areas

### 1. Vercel MCP Integration

**Decision**: Use Vercel MCP (Model Context Protocol) integration for frontend deployment

**Rationale**:
- MCP provides programmatic deployment control through Claude Code
- Eliminates need for manual Vercel CLI installation and authentication
- Enables automated deployment workflows from agent context
- Provides structured API for deployment configuration and monitoring
- Better integration with Claude Code workflow automation

**Alternatives Considered**:
1. **Vercel CLI**
   - Rejected: Requires manual CLI installation, authentication setup, and command execution
   - Rejected: Less automated, requires script management
   - Rejected: Specification explicitly prohibits CLI usage

2. **Manual Vercel Dashboard Deployment**
   - Rejected: Not automated, requires manual intervention
   - Rejected: No CI/CD integration
   - Rejected: Doesn't meet automatic deployment requirement

3. **GitHub Actions with Vercel CLI**
   - Rejected: Still requires CLI, adds GitHub Actions complexity
   - Rejected: MCP provides cleaner integration path

**Implementation Details**:
- Vercel MCP server provides deployment operations
- Integrates with GitHub repository for automatic triggers
- Supports environment variable configuration
- Enables preview deployments for pull requests
- Provides deployment status monitoring

### 2. Hugging Face Spaces Deployment

**Decision**: Deploy FastAPI backend to Hugging Face Spaces using Docker container

**Rationale**:
- HF Spaces provides free-tier hosting for containerized applications
- Native GitHub integration for automatic deployments
- Supports persistent applications (not just ML models)
- Built-in secrets management for environment variables
- Public URL with HTTPS automatically configured
- Good for small-scale production deployments

**Alternatives Considered**:
1. **Railway**
   - Rejected: Requires credit card even for free tier
   - Rejected: More complex pricing structure

2. **Render**
   - Rejected: Free tier has auto-sleep (cold starts)
   - Rejected: Less straightforward for FastAPI

3. **AWS/GCP/Azure**
   - Rejected: Overkill for current scale
   - Rejected: Complex setup and configuration
   - Rejected: Cost implications

4. **Heroku**
   - Rejected: Free tier discontinued
   - Rejected: Requires paid plan

**Implementation Details**:
- Dockerfile specifies Python 3.11+ base image
- Exposes port 7860 (HF Spaces standard)
- Environment variables configured in Space settings
- Git push to main branch triggers rebuild
- Health check endpoint validates deployment

### 3. GitHub CI/CD Integration Strategy

**Decision**: Use platform-native GitHub integrations (no custom GitHub Actions)

**Rationale**:
- Vercel automatically connects to GitHub repositories
- Hugging Face Spaces natively syncs with GitHub
- Both platforms handle build triggers automatically
- Simpler architecture with fewer moving parts
- No need to manage GitHub Actions workflows
- Platform-native integrations are well-tested and maintained

**Alternatives Considered**:
1. **Custom GitHub Actions**
   - Rejected: Adds unnecessary complexity
   - Rejected: Platforms already provide GitHub integration
   - Rejected: Requires workflow file management

2. **Manual Deployment Triggers**
   - Rejected: Not automated
   - Rejected: Doesn't meet CI/CD requirement

3. **Webhook-based Custom CI/CD**
   - Rejected: Overengineered for current needs
   - Rejected: Platforms provide better solution

**Implementation Details**:
- Connect Vercel project to GitHub repository
- Configure automatic deployments for main branch
- Enable preview deployments for pull requests
- Connect HF Space to GitHub repository
- Configure auto-build on push to main
- No GitHub Actions workflows required

### 4. Environment Variable Management

**Decision**: Store all secrets on deployment platforms, use .env.example templates in repository

**Rationale**:
- Secrets never committed to Git history
- Each platform provides secure secrets management
- Easy to update without code changes
- Different values per environment (dev/preview/prod)
- .env.example provides documentation and structure

**Environment Variables Required**:

**Frontend (Vercel)**:
```
BETTER_AUTH_SECRET=<shared-secret>
NEXT_PUBLIC_API_URL=<backend-url>
DATABASE_URL=<neon-connection-string>
NODE_ENV=production
```

**Backend (Hugging Face Spaces)**:
```
BETTER_AUTH_SECRET=<shared-secret>
DATABASE_URL=<neon-connection-string>
ENVIRONMENT=production
FRONTEND_URL=<vercel-url>
```

**Alternatives Considered**:
1. **Encrypted Secrets in Repository**
   - Rejected: Still exposes encrypted values
   - Rejected: Requires key management
   - Rejected: Platform solutions are simpler

2. **External Secrets Management (Vault, AWS Secrets Manager)**
   - Rejected: Overengineered for current scale
   - Rejected: Adds infrastructure dependency
   - Rejected: Platforms provide adequate solution

3. **Environment Files in Repository**
   - Rejected: Security risk (secrets exposed)
   - Rejected: Violates specification requirement

**Implementation Details**:
- Create .env.example with placeholder values
- Document each variable's purpose
- Configure actual values in platform dashboards
- Use descriptive names (BETTER_AUTH_SECRET, not SECRET_1)
- Keep BETTER_AUTH_SECRET identical across platforms

### 5. Branching Strategy

**Decision**: Main branch for production, pull requests for preview deployments

**Rationale**:
- Simple, standard Git workflow
- Main branch always reflects production state
- Preview deployments validate changes before merge
- Aligns with platform capabilities
- Easy for team collaboration

**Deployment Flow**:
```
Feature branch → Pull Request → Preview Deployment → Review → Merge to main → Production Deployment
```

**Alternatives Considered**:
1. **GitFlow (develop, release, hotfix branches)**
   - Rejected: Overkill for current team size
   - Rejected: Adds unnecessary complexity

2. **Trunk-Based Development (main only)**
   - Rejected: No preview validation before production
   - Rejected: Higher risk of production issues

3. **Environment Branches (dev, staging, production)**
   - Rejected: Platform preview deployments provide staging
   - Rejected: More complex branch management

**Implementation Details**:
- Main branch = production deployment
- Pull requests = preview deployments (frontend only)
- Merge to main triggers both deployments
- Backend deploys on main branch push only
- No manual deployment steps required

### 6. CORS Configuration

**Decision**: Configure backend CORS to allow Vercel production and preview domains

**Rationale**:
- Enables frontend to make API requests to backend
- Prevents cross-origin errors
- Must support both production URL and preview URLs
- FastAPI provides built-in CORS middleware

**CORS Configuration**:
```python
from fastapi.middleware.cors import CORSMiddleware

allowed_origins = [
    "https://your-app.vercel.app",           # Production
    "https://*.vercel.app",                   # Preview deployments
    "http://localhost:3000",                  # Local development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)
```

**Alternatives Considered**:
1. **Allow All Origins (`*`)**
   - Rejected: Security risk
   - Rejected: Exposes API to any domain

2. **Single Origin (production only)**
   - Rejected: Breaks preview deployments
   - Rejected: Can't test PRs before merge

3. **Reverse Proxy**
   - Rejected: Overengineered
   - Rejected: CORS middleware sufficient

**Implementation Details**:
- Update backend config.py with FRONTEND_URL environment variable
- Support wildcard for Vercel preview domains
- Include localhost for local development
- Set allow_credentials=True for authentication cookies
- Verify CORS in preview deployment testing

### 7. Health Check Endpoint Design

**Decision**: Use existing root endpoint `/` as health check, maintain Swagger at `/docs`

**Rationale**:
- Backend already has health check at root `/`
- Returns JSON with status, environment, version, CORS origins
- Standard pattern for health monitoring
- Swagger UI at `/docs` for API exploration
- No additional implementation needed

**Health Check Response**:
```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.0.0",
  "cors_origins": ["https://your-app.vercel.app"],
  "message": "Task Management API is running"
}
```

**Alternatives Considered**:
1. **Dedicated `/health` endpoint**
   - Rejected: Root endpoint already serves this purpose
   - Rejected: Would duplicate functionality

2. **Complex Health Checks (database ping, dependency checks)**
   - Rejected: Overkill for initial deployment
   - Rejected: Can add later if needed

3. **No Health Check**
   - Rejected: Can't validate deployment success
   - Rejected: No monitoring capability

**Implementation Details**:
- Health check at `GET /`
- API documentation at `GET /docs`
- ReDoc alternative at `GET /redoc`
- All endpoints return HTTPS responses
- Response includes environment verification

### 8. Deployment Validation Strategy

**Decision**: Multi-layer validation with manual functional testing

**Validation Layers**:

1. **Build Validation**
   - Frontend builds without errors/warnings
   - Backend Docker image builds successfully
   - Dependencies resolve correctly

2. **Deployment Validation**
   - Vercel deployment URL is accessible
   - HF Space deployment URL is accessible
   - Health check returns 200 OK
   - API documentation loads correctly

3. **Environment Validation**
   - Frontend uses correct backend URL
   - Backend connects to Neon database
   - BETTER_AUTH_SECRET matches across platforms
   - CORS allows frontend domain

4. **Functional Validation**
   - User can sign up from deployed frontend
   - User can sign in and receive JWT token
   - User can create, read, update, delete tasks
   - All API calls succeed without errors
   - No CORS errors in browser console

5. **Security Validation**
   - No secrets in GitHub repository
   - Environment variables only on platforms
   - HTTPS enforced on all endpoints
   - Authentication required for protected routes

**Alternatives Considered**:
1. **Automated E2E Testing**
   - Rejected: Specification excludes automated testing
   - Rejected: Manual testing sufficient for current scope

2. **Load Testing**
   - Rejected: Out of scope for initial deployment
   - Rejected: Can add later if needed

3. **Minimal Validation (health check only)**
   - Rejected: Doesn't validate full user journey
   - Rejected: Can miss integration issues

**Implementation Details**:
- Checklist-based validation process
- Test each layer in order
- Document results for each deployment
- Rollback process if validation fails
- Retest after any configuration changes

## Key Findings Summary

1. **Vercel MCP** is the optimal frontend deployment method (no CLI needed)
2. **Hugging Face Spaces** provides suitable backend hosting with GitHub integration
3. **Platform-native CI/CD** simpler than custom GitHub Actions
4. **Secrets on platforms** (not in repository) meets security requirements
5. **Main + PR workflow** provides production and preview deployments
6. **CORS middleware** enables frontend-backend communication
7. **Existing health check** sufficient for deployment validation
8. **Multi-layer validation** ensures complete functionality

## Next Steps (Phase 1)

1. Create deployment contracts (vercel.json, Dockerfile)
2. Generate deployment guide (quickstart.md)
3. Document data model (not applicable - no new data entities)
4. Update agent context with deployment technologies
