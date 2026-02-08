This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Authentication System

This project uses **Better Auth** with JWT tokens for authentication. Features include:

- Email/password signup and signin
- JWT tokens with 7-day expiration
- httpOnly cookies with Secure and SameSite flags
- Rate limiting (5 attempts per 15 minutes)
- FastAPI backend integration support

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Required: Authentication secret (must be at least 32 characters)
# Generate with: openssl rand -base64 64
BETTER_AUTH_SECRET=your-secret-key-here

# Optional: Environment (development, production, test)
NODE_ENV=development

# Optional: Database URL (required for Spec 2 - database integration)
DATABASE_URL=postgresql://user:password@localhost:5432/todo_app
```

### Generating BETTER_AUTH_SECRET

The `BETTER_AUTH_SECRET` is used to sign JWT tokens and **must be shared between the frontend and backend** for token verification.

Generate a secure secret:

```bash
openssl rand -base64 64
```

**Important**:
- Keep this secret secure and never commit it to version control
- Use the same secret in both frontend (.env.local) and backend (FastAPI .env) for JWT verification to work
- The secret must be at least 32 characters long

## Getting Started

First, install dependencies and set up environment variables:

```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your BETTER_AUTH_SECRET
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Backend Integration

This authentication system is designed to work with a FastAPI backend (Spec 2). The JWT tokens issued by this frontend can be verified by your backend API.

For detailed FastAPI integration instructions, see [docs/backend-integration.md](./docs/backend-integration.md).

### Quick Overview

1. **Share the secret**: Use the same `BETTER_AUTH_SECRET` in both frontend and backend
2. **Extract the cookie**: Backend reads `better-auth.session.token` cookie from requests
3. **Verify the JWT**: Backend validates token signature and extracts user info
4. **Protect routes**: Use JWT payload (userId, email) for authorization

## Authentication Routes

- **Signup**: `POST /api/auth/signup` - Create new account
- **Signin**: `POST /api/auth/signin` - Authenticate existing user

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
