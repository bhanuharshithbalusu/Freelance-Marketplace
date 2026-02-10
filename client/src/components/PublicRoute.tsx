/**
 * Public Route Component
 * Wraps pages that should redirect authenticated users
 * (e.g., login, register pages)
 * 
 * Features:
 * - Redirect authenticated users to their dashboard
 * - Loading states
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/constants/roles';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  console.log('🔒 PublicRoute render:', { 
    loading, 
    isAuthenticated, 
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    // Wait for auth check to complete
    if (loading) {
      console.log('⏳ PublicRoute: Still loading auth...');
      return;
    }

    // Redirect authenticated users to their dashboard
    if (isAuthenticated && user) {
      const dashboardPath = user.role === USER_ROLES.CLIENT 
        ? '/dashboard/client' 
        : '/dashboard/freelancer';
      
      console.log('✅ Already authenticated, redirecting to:', dashboardPath);
      router.push(dashboardPath);
    } else {
      console.log('✅ Not authenticated, showing public page');
    }
  }, [loading, isAuthenticated, user, router]);

  // Show loading state
  if (loading) {
    console.log('⏳ RENDERING LOADING SCREEN');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    console.log('✅ AUTHENTICATED - NOT RENDERING (will redirect)');
    return null;
  }

  // Render public content
  console.log('✅ RENDERING PUBLIC CONTENT (children)');
  return <>{children}</>;
}
