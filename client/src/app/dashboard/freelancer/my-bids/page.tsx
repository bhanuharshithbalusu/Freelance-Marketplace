'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import BidCard from '@/components/BidCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import api from '@/services/api';
import socketService from '@/services/socket';
import { UserRole } from '@/constants/roles';

interface Bid {
  _id: string;
  projectId: {
    _id: string;
    title: string;
    status: string;
  };
  amount: number;
  proposal: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface EditFormData {
  amount: string;
  proposal: string;
}

const MyBidsPage: React.FC = () => {
  const router = useRouter();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');

  // Edit bid modal state
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    amount: '',
    proposal: ''
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchMyBids();
    
    const handleBidUpdate = (updatedBid: Bid) => {
      setBids(prevBids =>
        prevBids.map(bid =>
          bid._id === updatedBid._id
            ? { ...bid, ...updatedBid }
            : bid
        )
      );
    };

    socketService.on('bidUpdated', handleBidUpdate);

    return () => {
      socketService.off('bidUpdated', handleBidUpdate);
    };
  }, []);

  const fetchMyBids = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.bids.getMyBids();
      // Backend returns: { success, message, timestamp, data: { bids: [...], pagination: {...} } }
      const bidsData = response.data.data?.bids || response.data.data || [];
      setBids(Array.isArray(bidsData) ? bidsData : []);
    } catch (err: any) {
      console.error('Error fetching bids:', err);
      setError(err.response?.data?.message || 'Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (bid: Bid) => {
    setEditingBid(bid);
    setEditFormData({
      amount: bid.amount.toString(),
      proposal: bid.proposal
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};

    const amount = parseFloat(editFormData.amount);
    if (!editFormData.amount || isNaN(amount)) {
      errors.amount = 'Amount is required';
    } else if (amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (amount > 10000000) {
      errors.amount = 'Amount cannot exceed $10,000,000';
    }

    if (!editFormData.proposal.trim()) {
      errors.proposal = 'Proposal is required';
    } else if (editFormData.proposal.length < 50) {
      errors.proposal = 'Proposal must be at least 50 characters';
    } else if (editFormData.proposal.length > 2000) {
      errors.proposal = 'Proposal cannot exceed 2000 characters';
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = async () => {
    if (!validateEditForm() || !editingBid) return;

    setEditLoading(true);
    try {
      await api.bids.update(editingBid._id, {
        amount: parseFloat(editFormData.amount),
        proposal: editFormData.proposal.trim()
      });

      setBids(prevBids =>
        prevBids.map(bid =>
          bid._id === editingBid._id
            ? { ...bid, amount: parseFloat(editFormData.amount), proposal: editFormData.proposal.trim() }
            : bid
        )
      );

      setEditModalOpen(false);
      setEditingBid(null);
    } catch (err: any) {
      console.error('Failed to update bid:', err);
      alert(err.response?.data?.message || 'Failed to update bid. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleWithdraw = async (bidId: string) => {
    if (!confirm('Are you sure you want to withdraw this bid? This action cannot be undone.')) {
      return;
    }

    try {
      await api.bids.withdraw(bidId);
      setBids(prevBids => prevBids.filter(bid => bid._id !== bidId));
    } catch (err: any) {
      console.error('Failed to withdraw bid:', err);
      alert(err.response?.data?.message || 'Failed to withdraw bid. Please try again.');
    }
  };

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    return bid.status.toLowerCase() === filter;
  });

  const getStatusCounts = () => {
    return {
      all: bids.length,
      pending: bids.filter(b => b.status === 'pending').length,
      accepted: bids.filter(b => b.status === 'accepted').length,
      rejected: bids.filter(b => b.status === 'rejected').length,
    };
  };

  const statusCounts = getStatusCounts();
  const winRate = bids.length > 0 ? ((statusCounts.accepted / bids.length) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <ProtectedRoute requiredRole={UserRole.FREELANCER}>
        <LoadingSpinner fullScreen size="lg" />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={UserRole.FREELANCER}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">My Bids</h1>
              <Button
                variant="primary"
                onClick={() => router.push('/projects')}
              >
                Browse Projects
              </Button>
            </div>
            <p className="text-gray-600">
              Track and manage your bid submissions
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Bids</p>
                  <p className="text-3xl font-bold text-gray-900">{statusCounts.all}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{statusCounts.pending}</p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Accepted</p>
                  <p className="text-3xl font-bold text-green-600">{statusCounts.accepted}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Win Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{winRate}%</p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-white rounded-lg shadow-sm p-2 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({statusCounts.pending})
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                filter === 'accepted'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Accepted ({statusCounts.accepted})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                filter === 'rejected'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected ({statusCounts.rejected})
            </button>
          </div>

          {filteredBids.length === 0 ? (
            <EmptyState
              title={filter === 'all' ? 'No bids yet' : `No ${filter} bids`}
              description={
                filter === 'all'
                  ? 'Start bidding on projects to showcase your skills and win work'
                  : `You don't have any ${filter} bids at the moment`
              }
              action={{
                label: filter === 'all' ? 'Browse Projects' : 'View All Bids',
                onClick: () => {
                  if (filter === 'all') {
                    router.push('/projects');
                  } else {
                    setFilter('all');
                  }
                }
              }}
            />
          ) : (
            <div className="space-y-6">
              {filteredBids.map(bid => (
                <BidCard
                  key={bid._id}
                  bid={bid}
                  showActions={bid.status === 'pending'}
                  onEdit={bid.status === 'pending' ? () => handleEditClick(bid) : undefined}
                  onWithdraw={bid.status === 'pending' ? () => handleWithdraw(bid._id) : undefined}
                />
              ))}
            </div>
          )}

          <Modal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            title="Edit Bid"
          >
            <div className="space-y-4">
              <Input
                label="Bid Amount ($)"
                type="number"
                value={editFormData.amount}
                onChange={(value) => setEditFormData({ ...editFormData, amount: value })}
                error={editErrors.amount}
                placeholder="5000"
              />
              
              <TextArea
                label="Proposal"
                value={editFormData.proposal}
                onChange={(value) => setEditFormData({ ...editFormData, proposal: value })}
                error={editErrors.proposal}
                placeholder="Explain why you're the best fit for this project..."
                rows={6}
                maxLength={2000}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setEditModalOpen(false)}
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEditSubmit}
                  loading={editLoading}
                  disabled={editLoading}
                >
                  Update Bid
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MyBidsPage;
