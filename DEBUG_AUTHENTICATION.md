# 🔍 Authentication Debugging Guide

## Problem
Signup/signin succeeds but session is not detected, causing authentication to fail.

---

## Step 1: Run Browser Diagnostic

Open the application in your browser and run this diagnostic script:

### 1. Open Browser Console
1. Visit: https://hackathon-02-phase-ii-lac.vercel.app
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to "Console" tab

### 2. Paste and Run This Script

```javascript
// Authentication Diagnostic Script
console.log("=== AUTHENTICATION DIAGNOSTIC ===\n");

// Check environment variables
console.log("1. Environment Variables:");
console.log("   NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL || "NOT SET");
console.log("");

// Check if we can reach the backend
console.log("2. Testing Backend Connection:");
fetch('https://nazimbotexpert-todo-app.hf.space/')
  .then(r => r.json())
  .then(data => {
    console.log("   ✅ Backend reachable");
    console.log("   CORS origins:", data.cors_origins);
  })
  .catch(e => console.log("   ❌ Backend unreachable:", e.message));

// Test signin flow
console.log("\n3. Testing Signin Flow:");
async function testSignin() {
  try {
    // Step 1: Signin
    console.log("   Step 1: Calling signin endpoint...");
    const signinResponse = await fetch('https://nazimbotexpert-todo-app.hf.space/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'TestPass123' }),
      credentials: 'include'
    });

    console.log("   Signin status:", signinResponse.status);

    // Check Set-Cookie header (won't be visible due to HttpOnly)
    console.log("   Set-Cookie header:", signinResponse.headers.get('Set-Cookie') || "Not accessible (HttpOnly)");

    const signinData = await signinResponse.json();
    console.log("   Signin response:", signinData);

    // Step 2: Wait a moment
    console.log("\n   Step 2: Waiting 1 second...");
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Check session
    console.log("\n   Step 3: Checking session...");
    const sessionResponse = await fetch('https://nazimbotexpert-todo-app.hf.space/api/auth/session', {
      method: 'GET',
      credentials: 'include'
    });

    console.log("   Session status:", sessionResponse.status);

    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log("   ✅ Session found:", sessionData);
    } else {
      const errorData = await sessionResponse.json();
      console.log("   ❌ Session not found:", errorData);
    }

    // Step 4: Check cookies
    console.log("\n   Step 4: Checking cookies:");
    console.log("   document.cookie:", document.cookie || "(empty - HttpOnly cookies not visible)");

  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
}

// Run the test after a short delay
setTimeout(testSignin, 2000);

console.log("\n=== Diagnostic will run in 2 seconds ===");
```

### 3. Analyze the Output

Look for these key indicators:

**✅ Good Signs:**
- Backend reachable
- Signin status: 200
- Session status: 200
- Session found with user data

**❌ Problem Signs:**
- Signin status: 401/500 (authentication failed)
- Session status: 401 (cookie not sent or invalid)
- CORS errors in console
- "No session cookie found" error

---

## Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Try signing in
3. Look for these requests:

### Request 1: POST /api/auth/signin
- **Status:** Should be 200
- **Response Headers:** Look for `Set-Cookie: better-auth.session.token=...`
- **Response Body:** Should contain user data and token

### Request 2: GET /api/auth/session
- **Status:** Should be 200 (if cookie was set)
- **Request Headers:** Look for `Cookie: better-auth.session.token=...`
- **Response Body:** Should contain user data

---

## Common Issues and Solutions

### Issue 1: Session endpoint returns 401 "No session cookie found"

**Cause:** Browser is not sending the cookie back to the backend

**Solution:** This is a cross-origin cookie issue. The cookie is set by HF Spaces but Vercel can't send it back.

**Fix:** We need to use a different approach - store the token in the response body and use it for subsequent requests.

### Issue 2: CORS error in console

**Cause:** Backend CORS not configured correctly

**Solution:** Check backend logs and ensure Vercel URL is in allowed origins

### Issue 3: Signin succeeds but session check times out

**Cause:** Session endpoint is slow or failing

**Solution:** Increase timeout or fix session endpoint

---

## Step 3: Share Results

After running the diagnostic, share:
1. The console output from the diagnostic script
2. Any errors shown in red in the console
3. The Network tab screenshots for signin and session requests

This will help me identify the exact issue and provide a targeted fix.

---

## Quick Test (Alternative)

If you can't run the script, try this:

1. Open: https://hackathon-02-phase-ii-lac.vercel.app
2. Open DevTools (F12) → Network tab
3. Try signing in
4. Look at the signin request:
   - Does it return 200?
   - Does the Response Headers show `Set-Cookie`?
5. Look at the session request:
   - Does it return 200 or 401?
   - If 401, what's the error message?

Share these details and I'll provide the fix.
