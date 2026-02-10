'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GoogleAuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleGoogleAuth = async () => {
      try {
        const token = searchParams.get('token');
        const role = searchParams.get('role');

        if (!token) {
          setStatus('error');
          setTimeout(() => {
            router.push('/login?error=missing_token');
          }, 2000);
          return;
        }

        console.log('✅ Google OAuth token received');

        // Store the token
        localStorage.setItem('accessToken', token);

        // Fetch user data with the token
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        console.log('✅ User data fetched:', userData);

        setStatus('success');

        // Redirect to appropriate dashboard using window.location to trigger natural auth reinitialization
        setTimeout(() => {
          const dashboardPath = role === 'CLIENT'
            ? '/dashboard/client'
            : '/dashboard/freelancer';
          window.location.href = dashboardPath;
        }, 1500);

      } catch (error) {
        console.error('❌ Google auth error:', error);
        setStatus('error');
        setTimeout(() => {
          router.push('/login?error=auth_failed');
        }, 2000);
      }
    };

    handleGoogleAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Completing Google Sign In...
            </h2>
            <p className="text-gray-600">
              Please wait while we set up your account
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Successfully Signed In! ✅
            </h2>
            <p className="text-gray-600">
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Failed ❌
            </h2>
            <p className="text-gray-600">
              Redirecting back to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function GoogleAuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
        </div>
      </div>
    }>
      <GoogleAuthSuccess />
    </Suspense>
  );
}
