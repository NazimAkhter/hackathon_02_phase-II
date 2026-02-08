---
name: backend-skill
description: Build backend systems by generating API routes, handling requests and responses, and connecting to databases.
---

# Backend Skill – Routes, Requests/Responses & Database اتصال

## Instructions

1. **Route Generation**
   - Define RESTful or RPC-based routes
   - Use clear and consistent naming (`/api/users`, `/api/posts/:id`)
   - Separate routes by feature/module
   - Support HTTP methods (GET, POST, PUT, DELETE)

2. **Request Handling**
   - Parse request body, params, and query
   - Validate incoming data
   - Handle authentication & authorization
   - Apply middleware (logging, rate limiting, auth)

3. **Response Handling**
   - Return proper HTTP status codes
   - Send consistent JSON responses
   - Handle errors gracefully
   - Avoid exposing internal server details

4. **Database Connection**
   - Configure database client/ORM
   - Manage connection pooling
   - Use environment variables for DB credentials
   - Handle connection errors safely

5. **CRUD Operations**
   - Create → Insert data into DB
   - Read → Fetch records
   - Update → Modify existing records
   - Delete → Remove or soft-delete records

6. **Middleware Usage**
   - Authentication middleware
   - Error-handling middleware
   - Request logging
   - CORS configuration

---

## Best Practices

- Keep routes thin, move logic to services
- Validate all user inputs
- Use async/await with proper error handling
- Follow REST or consistent API design patterns
- Return meaningful error messages
- Use environment variables for secrets
- Log errors for debugging
- Modularize your backend structure
- Write reusable database queries

---

## Example Structure (Node.js / Express)

```ts
// db.ts
import { PrismaClient } from "@prisma/client"
export const db = new PrismaClient()
