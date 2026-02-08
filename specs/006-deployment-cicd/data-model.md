# Data Model: Deployment & CI/CD

**Feature**: 006-deployment-cicd
**Date**: 2026-02-09

## Overview

This deployment feature does not introduce new data entities or database schema changes. It configures infrastructure for deploying existing application components (frontend, backend, database).

## Existing Data Model (No Changes)

The application uses the existing data model established in previous features:

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(50),
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
```

## Configuration Entities (Non-Database)

While not stored in the database, deployment introduces these conceptual entities:

### Deployment Platform
**Purpose**: Represents hosting service configuration

**Attributes**:
- Platform name (Vercel, Hugging Face Spaces)
- Project/Space name
- Repository connection (GitHub URL, branch)
- Build configuration (command, output directory, framework)
- Environment variables (secure storage on platform)
- Deployment URLs (production, preview)

**Relationships**:
- Connected to GitHub repository
- Uses environment variables
- Generates deployment URLs

### Environment Variable
**Purpose**: Represents configuration values for different environments

**Attributes**:
- Variable name (BETTER_AUTH_SECRET, DATABASE_URL, etc.)
- Variable value (stored on platform, never in repository)
- Environment context (development, preview, production)
- Platform scope (frontend, backend, both)

**Relationships**:
- Belongs to deployment platform
- Referenced by application code
- Shared across frontend and backend (BETTER_AUTH_SECRET)

### Deployment Environment
**Purpose**: Represents deployment context

**Attributes**:
- Environment name (development, preview, production)
- Frontend URL
- Backend URL
- Database instance
- Configuration set

**Relationships**:
- Has multiple environment variables
- Connected to specific deployment platforms
- Maps to Git branches (main, PR branches)

## No Migration Required

Since this feature only configures deployment infrastructure and does not modify the database schema, no Alembic migrations are needed.

The existing database schema remains unchanged:
- Users table: No modifications
- Tasks table: No modifications
- Indexes: No modifications
- Constraints: No modifications

## Environment-Specific Considerations

### Development Environment
- Uses local PostgreSQL or development Neon instance
- Environment variables in .env.local (not committed)
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Preview Environment (Vercel PRs)
- Frontend deployed to unique Vercel preview URL
- Backend uses production Hugging Face Space
- Database uses production Neon instance
- Environment variables from Vercel project settings

### Production Environment
- Frontend: https://[your-app].vercel.app
- Backend: https://[your-space].hf.space
- Database: Production Neon PostgreSQL instance
- Environment variables from platform settings

## Data Flow (No Changes)

Deployment does not change data flow patterns:

1. User authenticates → JWT token issued
2. Frontend stores token → Includes in API requests
3. Backend validates token → Queries database
4. Database returns user's tasks → Backend filters by user_id
5. Backend responds → Frontend displays data

The only difference is that these components run on production infrastructure instead of local development servers.

## Summary

**Data Model Changes**: None

**Schema Migrations**: None required

**Existing Entities**: Users, Tasks (unchanged)

**Configuration Entities**: Deployment Platform, Environment Variable, Deployment Environment (infrastructure only, not stored in database)

**Next Phase**: Create deployment configuration contracts and quickstart guide
