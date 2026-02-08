'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthErrorDisplay from './AuthErrorDisplay';

interface SigninFormProps {
  onSuccess?: (user: { id: string; email: string }) => void;
}

export default function SigninForm({ onSuccess }: SigninFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);

    try {
      // Use AuthProvider's login function which handles auth state and routing
      await login(email, password);

      // Success - clear form
      setEmail('');
      setPassword('');

      // Note: AuthProvider's login function already handles routing to /dashboard
      // The onSuccess callback is optional and may not be needed
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signin failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AuthErrorDisplay error={error} onDismiss={() => setError(null)} />

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 h-[44px] border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 h-[44px] border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 min-h-[44px] border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  );
}
