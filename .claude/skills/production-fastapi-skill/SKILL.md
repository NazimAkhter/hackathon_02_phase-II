---
name: production-fastapi-skill
description: Prepare the FastAPI backend for stable, secure, and production-ready deployment without altering core functionality.
---

# Production FastAPI Configuration

## Instructions

1. **Server & Deployment Setup**
   - Use production-grade servers like **Uvicorn** with Gunicorn (`uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4`)
   - Disable debug mode (`debug=False`) in production
   - Enable logging with structured output and proper log levels (`INFO`, `WARNING`, `ERROR`)
   - Use environment variables for configuration (database URLs, secrets, API keys)

2. **Performance Optimization**
   - Use multiple workers to handle concurrent requests
   - Enable connection pooling for database access
   - Configure timeouts for long-running requests
   - Cache frequently used data where applicable

3. **Security Enhancements**
   - Add secure headers via middleware (`Strict-Transport-Security`, `X-Frame-Options`, `Content-Security-Policy`)
   - Enforce HTTPS and TLS for all traffic
   - Validate and sanitize all incoming requests
   - Avoid exposing sensitive internal information in responses

4. **Database Configuration**
   - Connect to production database with proper credentials
   - Use connection pooling and ORM optimizations
