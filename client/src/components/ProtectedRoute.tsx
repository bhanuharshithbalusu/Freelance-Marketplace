/**
 * Protected Route Component
 * Wraps pages that require authentication
 * 
 * Features:
 * - Authentication check
 * - Role-based access control
 * - Automatic redirects
 * - Loading states
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/constants/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Wait for auth check to complete
    if (loading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to:', redirectTo);
      router.push(redirectTo);
      return;
    }

    // Check role-based access
    if (requiredRole && user?.role !== requiredRole) {
      console.log('❌ Role mismatch. Required:', requiredRole, 'Got:', user?.role);
      
      // Redirect to appropriate dashboard based on user role
      const dashboardPath = user?.role === USER_ROLES.CLIENT 
        ? '/dashboard/client' 
        : '/dashboard/freelancer';
      
      router.push(dashboardPath);
    }
  }, [loading, isAuthenticated, user, requiredRole, redirectTo, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or wrong role
  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
