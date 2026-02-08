---
name: auth-skill
description: Implement secure authentication systems including signup, signin, password hashing, JWT tokens, and Better Auth integration.
---

# Auth Skill – Secure Authentication System

## Instructions

1. **User Registration (Signup)**
   - Collect email/username and password
   - Validate input (format, length, strength)
   - Hash password before storing
   - Save user in database
   - Return success response or JWT token

2. **User Login (Signin)**
   - Verify user existence
   - Compare hashed password
   - Generate JWT access token
   - Optionally generate refresh token
   - Return authentication response

3. **Password Hashing**
   - Use industry standard algorithms (bcrypt, argon2)
   - Never store plain text passwords
   - Add salt automatically
   - Set secure cost factor

4. **JWT Token Handling**
   - Create short-lived access tokens
   - Store user id and role in payload
   - Sign tokens with secret key
   - Verify token on protected routes
   - Handle token expiration

5. **Better Auth Integration**
   - Configure Better Auth provider
   - Use built-in signup/signin flows
   - Connect with your database adapter
   - Enable email/password and OAuth if needed
   - Customize session and token strategies

---

## Best Practices

- Always hash passwords with **bcrypt or argon2**
- Use HTTPS in production
- Keep JWT secrets in environment variables
- Set token expiry (e.g., 15m for access, 7d for refresh)
- Implement rate limiting on auth routes
- Never expose sensitive error messages
- Use HTTP-only cookies for tokens when possible
- Validate and sanitize all inputs
- Log authentication events securely

---

## Example Structure (Node.js / Express Style)

```ts
// signup
app.post("/signup", async (req, res) => {
  const { email, password } = req.body
  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: { email, password: hashedPassword }
  })

  res.json({ message: "User created successfully" })
})
