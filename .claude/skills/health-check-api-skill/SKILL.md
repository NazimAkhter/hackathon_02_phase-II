---
name: health-check-api-skill
description: Ensure backend health and API availability, providing uptime status and monitoring without altering core functionality.
---

# Health Check & API Availability Setup

## Instructions

1. **Health Check Endpoint**
   - Implement a simple endpoint (e.g., `/health` or `/status`)
   - Return essential information like uptime, database connectivity, and API version
   - Use lightweight responses for fast checks
   - Keep endpoint publicly accessible for monitoring tools

2. **Uptime & Responsiveness Monitoring**
   - Track response times for critical API endpoints
   - Integrate with monitoring services (Pingdom, UptimeRobot, Grafana)
   - Log failures or timeouts for analysis
   - Ensure minimal overhead to avoid impacting production performance

3. **CI/CD Integration**
   - Expose health endpoint for automated pipeline checks
   - Fail builds or deployments if health check fails
   - Ensure health checks run before traffic routing in load balancers

4. **Alerting & Logging**
   - Log failures with timestamp and relevant metadata
   - Send alerts via email, Slack, or other channels on downtime
   - Include error context for faster troubleshooting
   - Maintain historical logs for performance review

5. **Accessibility & Reliability**
   - Endpoint should be fast, stable, and lightweight
   - Do not expose sensitive system details
   - Return machine-readable JSON responses for automated tools
   - Maintain endpoint availability without changing core business logic

---

## Best Practices

- Keep health check endpoint simple and performant
- Include database and external service checks where relevant
- Provide clear HTTP status codes (200 OK, 503 Service Unavailable)
- Monitor continuously using automated tools
- Log all health failures for audit and debugging
- Test endpoint in staging before production
- Avoid heavy computations or long-running processes in health checks
- Ensure endpoint is accessible but secure from misuse

---

## Example Health Check Endpoint (Node.js + Express)

```ts
import express from "express"
import { db } from "./db"

const app = express()

app.get("/health", async (req, res) => {
  try {
    await db.$queryRaw`SELECT 1` // simple DB connectivity check
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      database: "connected",
      version: "1.0.0"
    })
  } catch (err) {
    console.error("Health check failed:", err)
    res.status(503).json({
      status: "error",
      uptime: process.uptime(),
      database: "unreachable"
    })
  }
})

app.listen(3000, () => console.log("Server running on port 3000"))
