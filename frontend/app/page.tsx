"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <main className="flex flex-col items-center justify-center px-6 py-12 text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Todo App
          </h1>
          <p className="text-xl text-gray-600">
            Organize your tasks efficiently with our simple and powerful todo application
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link
            href="/signin"
            className="flex-1 flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mx-auto mb-4">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create Tasks</h3>
            <p className="text-sm text-gray-600">Quickly add and organize your tasks</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mx-auto mb-4">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Track Progress</h3>
            <p className="text-sm text-gray-600">Mark tasks as complete and stay organized</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mx-auto mb-4">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Secure & Private</h3>
            <p className="text-sm text-gray-600">Your tasks are safe and only visible to you</p>
          </div>
        </div>
      </main>
    </div>
  );
}
