'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SigninForm from '@/components/auth/SigninForm';
import Link from 'next/link';
import { getReturnUrl, getSafeReturnUrl } from '@/lib/auth/utils';
import { ErrorMessage } from '@/components/shared/ErrorMessage';

export default function SigninPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for authentication error messages from middleware
  useEffect(() => {
    const error = searchParams.get('error');

    if (error) {
      switch (error) {
        case 'session_expired':
          setErrorMessage('Your session has expired. Please sign in again.');
          break;
        case 'unauthorized':
          setErrorMessage('Please sign in to access this page.');
          break;
        case 'invalid_session':
          setErrorMessage('Authentication error. Please sign in again.');
          break;
        default:
          // Handle legacy 'message' parameter for backward compatibility
          const message = searchParams.get('message');
          if (message === 'session_expired') {
            setErrorMessage('Your session has expired. Please sign in again.');
          }
      }
    }
  }, [searchParams]);

  const handleSigninSuccess = (user: { id: string; email: string }) => {
    // Get and validate returnUrl from query params
    const returnUrl = getReturnUrl(searchParams);
    const safeReturnUrl = getSafeReturnUrl(returnUrl);

    // Redirect to returnUrl or dashboard
    router.push(safeReturnUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 md:space-y-8">
        <div>
          <h2 className="mt-4 md:mt-6 text-center text-2xl md:text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              create a new account
            </Link>
          </p>
        </div>

        {errorMessage && (
          <ErrorMessage
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SigninForm onSuccess={handleSigninSuccess} />
        </div>
      </div>
    </div>
  );
}
