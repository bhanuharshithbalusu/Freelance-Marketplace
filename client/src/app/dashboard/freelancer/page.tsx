/**
 * Freelancer Dashboard Page
 * Only accessible to users with FREELANCER role
 * 
 * Features:
 * - Browse open projects
 * - Submit bids on projects
 * - View active bids
 * - Update/withdraw bids
 * - Real-time bid updates
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/constants/roles';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import socketService from '@/services/socket';

export default function FreelancerDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's bids
  const fetchMyBids = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching freelancer bids...');
      const response = await api.bids.getMyBids();
      console.log('📥 My bids API response:', response.data);
      
      // Extract bids from the correct nested structure
      // Backend returns: { success, message, timestamp, data: { bids: [...], pagination: {...} } }
      const bidsData = response.data.data?.bids || response.data.bids || [];
      
      // Ensure it's an array
      const bidsArray = Array.isArray(bidsData) ? bidsData : [];
      console.log('✅ Setting bids:', bidsArray.length, 'bids');
      
      setBids(bidsArray);
    } catch (error) {
      console.error('❌ Failed to fetch bids:', error);
      setBids([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBids();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const handleBidSubmitted = (data: any) => {
      if (data.data.freelancerId === user?._id) {
        setBids(prev => [data.data, ...prev]);
      }
    };

    const handleBidUpdated = (data: any) => {
      if (data.data.freelancerId === user?._id) {
        setBids(prev =>
          prev.map(b => b._id === data.data._id ? data.data : b)
        );
      }
    };

    const handleBidWithdrawn = (data: any) => {
      setBids(prev => prev.filter(b => b._id !== data.data._id));
    };

    const handleProjectAssigned = (data: any) => {
      // Update bid status when project is assigned
      setBids(prev =>
        prev.map(b => {
          if (b.projectId === data.data._id) {
            return {
              ...b,
              status: b.freelancerId === data.data.assignedFreelancer 
                ? 'ACCEPTED' 
                : 'REJECTED'
            };
          }
          return b;
        })
      );
    };

    socketService.on('BID_SUBMITTED', handleBidSubmitted);
    socketService.on('BID_UPDATED', handleBidUpdated);
    socketService.on('BID_WITHDRAWN', handleBidWithdrawn);
    socketService.on('PROJECT_ASSIGNED', handleProjectAssigned);

    return () => {
      socketService.off('BID_SUBMITTED', handleBidSubmitted);
      socketService.off('BID_UPDATED', handleBidUpdated);
      socketService.off('BID_WITHDRAWN', handleBidWithdrawn);
      socketService.off('PROJECT_ASSIGNED', handleProjectAssigned);
    };
  }, [user]);

  const handleWithdrawBid = async (bidId: string) => {
    if (!confirm('Are you sure you want to withdraw this bid?')) return;

    try {
      await api.bids.withdraw(bidId);
      fetchMyBids();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to withdraw bid');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate stats
  const bidsArray = Array.isArray(bids) ? bids : [];
  const stats = {
    activeBids: bidsArray.filter(b => b.status === 'PENDING').length,
    accepted: bidsArray.filter(b => b.status === 'ACCEPTED').length,
    rejected: bidsArray.filter(b => b.status === 'REJECTED').length,
    totalBids: bidsArray.length
  };

  return (
    <ProtectedRoute requiredRole={USER_ROLES.FREELANCER}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Freelancer Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/freelancer/analytics')}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </button>
                <button
                  onClick={() => router.push('/projects')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Browse Projects
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Active Bids</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.activeBids}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Projects Won</h3>
              <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Rejected</h3>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Bids</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBids}</p>
            </div>
          </div>

          {/* Bids List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">My Bids</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              ) : bidsArray.length === 0 ? (
                <div className="text-center py-12">
                  <svg 
                    className="mx-auto h-12 w-12 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bids yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Start bidding on projects to build your portfolio.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/projects')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Browse Projects
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {bidsArray.map((bid) => (
                    <div
                      key={bid._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {bid.projectId?.title || 'Project'}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.status)}`}>
                              {bid.status}
                            </span>
                          </div>
                          
                          {bid.projectId?.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {bid.projectId.description}
                            </p>
                          )}

                          <div className="flex items-center gap-6 text-sm">
                            <span className="font-bold text-green-600">
                              Your Bid: ${bid.amount.toLocaleString()}
                            </span>
                            {bid.projectId?.lowestBid && (
                              <span className="text-gray-500">
                                Lowest Bid: ${bid.projectId.lowestBid.toLocaleString()}
                              </span>
                            )}
                            {bid.projectId?.totalBids && (
                              <span className="text-gray-500">
                                {bid.projectId.totalBids} total bids
                              </span>
                            )}
                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            Submitted: {formatDate(bid.createdAt)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {bid.projectId?._id && (
                            <button
                              onClick={() => router.push(`/projects/${bid.projectId._id}`)}
                              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              View Project
                            </button>
                          )}
                          {bid.status === 'PENDING' && (
                            <button
                              onClick={() => handleWithdrawBid(bid._id)}
                              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              Withdraw
                            </button>
                          )}
                          {bid.status === 'ACCEPTED' && (
                            <span className="px-4 py-2 text-sm text-green-600 bg-green-50 rounded-lg">
                              🎉 Congratulations!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
