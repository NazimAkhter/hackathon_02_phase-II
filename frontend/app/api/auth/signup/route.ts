import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password, name } = body;

    // Forward request to FastAPI backend
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await backendResponse.json();

    // If backend returns error, forward it to frontend
    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Signup failed' },
        { status: backendResponse.status }
      );
    }

    // Extract token from backend response
    const token = data.token;

    if (!token) {
      console.error('[AUTH] No token in backend response');
      return NextResponse.json(
        { error: 'Authentication failed - no token received' },
        { status: 500 }
      );
    }

    // Create response with user data
    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        user: data.user,
      },
      { status: 201 }
    );

    // Set cookie on the frontend domain (localhost:3000)
    response.cookies.set('better-auth.session.token', token, {
      httpOnly: false, // Allow client-side reading for session checks
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('[AUTH] Cookie set successfully for user:', data.user.email);

    return response;
  } catch (error) {
    console.error('[AUTH] Signup error:', error);

    return NextResponse.json(
      { error: 'An error occurred during signup. Please try again.' },
      { status: 500 }
    );
  }
}
