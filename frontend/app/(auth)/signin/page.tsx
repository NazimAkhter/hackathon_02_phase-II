import React, { Suspense } from 'react';
import SigninPageContent from './SigninPageContent';

export default function SigninPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <SigninPageContent />
    </Suspense>
  );
}
