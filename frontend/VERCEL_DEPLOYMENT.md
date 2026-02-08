# Vercel Deployment Guide

## Frontend Deployment for Todo App (Phase II)

This guide explains how to deploy the Next.js frontend to Vercel using Git integration.

## Prerequisites

- GitHub repository connected: `https://github.com/NazimAkhter/Hackathon-2.git`
- Vercel account: Nazim Akhter's projects team

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose: `NazimAkhter/Hackathon-2`

### 2. Configure Project Settings

**Framework Preset:** Next.js (auto-detected)

**Root Directory:**
```
All Phases/phase-II/frontend
```

**Build Settings:**
- Build Command: `npm run build` (auto-detected)
- Output Directory: `.next` (auto-detected)
- Install Command: `npm install` (auto-detected)
- Development Command: `npm run dev`

### 3. Environment Variables

Add these environment variables in the Vercel Dashboard under **"Environment Variables"**:

#### Required Variables:

```env
# Authentication Secret (CRITICAL - Generate new one for production)
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-64>

# Node Environment
NODE_ENV=production

# Backend API URL (Update with your deployed backend URL)
NEXT_PUBLIC_API_URL=https://your-backend-api.vercel.app

# Database URL (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### How to Generate BETTER_AUTH_SECRET:

On your local machine, run:
```bash
openssl rand -base64 64
```

Copy the output and paste it as the value for `BETTER_AUTH_SECRET` in Vercel.

### 4. Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-3 minutes)
3. Once deployed, you'll receive a production URL (e.g., `your-app.vercel.app`)

### 5. Automatic Deployments

After initial setup, every push to the `main` branch will automatically trigger a deployment.

**Branch Deployments:**
- `main` branch → Production deployment
- Other branches → Preview deployments

## Configuration Files

- **vercel.json**: Project configuration with security headers
- **.env.example**: Template for environment variables
- **.env.local**: Local development variables (not committed to git)

## Security Headers

The `vercel.json` includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Post-Deployment

### Update Backend API URL

After deploying the backend, update the `NEXT_PUBLIC_API_URL` environment variable:

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Edit `NEXT_PUBLIC_API_URL` with your backend URL
4. Redeploy the application

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project
2. Settings → Domains
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails

1. Check build logs in Vercel Dashboard
2. Verify all environment variables are set correctly
3. Ensure `package.json` dependencies are up to date

### Environment Variables Not Working

1. Make sure variables starting with `NEXT_PUBLIC_` are added
2. Redeploy after adding/updating environment variables
3. Clear build cache: Settings → General → Clear Cache

### Authentication Issues

1. Verify `BETTER_AUTH_SECRET` is set correctly
2. Check `DATABASE_URL` connection string
3. Ensure `NEXT_PUBLIC_API_URL` points to correct backend

## Links

- **GitHub Repo**: https://github.com/NazimAkhter/Hackathon-2
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs

## Notes

- The frontend is configured for **US East (IAD1)** region
- Uses Next.js 16.1.3 with App Router
- Better Auth 1.4.15 for authentication
- Neon PostgreSQL for database

---

**Next Steps:**
1. Complete frontend deployment
2. Deploy backend FastAPI application
3. Update `NEXT_PUBLIC_API_URL` in frontend
4. Test end-to-end authentication flow
