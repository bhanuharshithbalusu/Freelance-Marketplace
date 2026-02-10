'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import socketService from '@/services/socket';

interface Project {
  _id: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
  };
  requiredSkills: string[];
  status: 'OPEN' | 'ASSIGNED' | 'CLOSED';
  biddingEndsAt: string;
  clientId: {
    _id: string;
    name: string;
    email: string;
  };
  assignedFreelancerId?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Bid {
  _id: string;
  amount: number;
  proposal: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  freelancerId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isClient } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bid submission form
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidProposal, setBidProposal] = useState('');
  const [bidDeliveryTime, setBidDeliveryTime] = useState('');
  const [bidError, setBidError] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  // Accept bid state
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return; // Don't redirect yet, let AuthContext handle it
    }

    fetchProjectDetails();
    fetchProjectBids();

    // Socket.IO real-time listeners
    socketService.on('BID_SUBMITTED', handleBidSubmitted);
    socketService.on('BID_UPDATED', handleBidUpdated);
    socketService.on('BID_WITHDRAWN', handleBidWithdrawn);
    socketService.on('PROJECT_ASSIGNED', handleProjectAssigned);
    socketService.on('PROJECT_CLOSED', handleProjectClosed);

    return () => {
      socketService.off('BID_SUBMITTED', handleBidSubmitted);
      socketService.off('BID_UPDATED', handleBidUpdated);
      socketService.off('BID_WITHDRAWN', handleBidWithdrawn);
      socketService.off('PROJECT_ASSIGNED', handleProjectAssigned);
      socketService.off('PROJECT_CLOSED', handleProjectClosed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const response = await api.projects.getById(projectId);
      // Backend returns: { success, message, timestamp, data: { project: {...} } }
      const projectData = response.data.data.project || response.data.data;
      console.log('Fetched project data:', projectData);
      console.log('Assigned Freelancer:', projectData.assignedFreelancerId);
      setProject(projectData);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
      setLoading(false);
    }
  };

  const fetchProjectBids = async () => {
    try {
      const response = await api.bids.getByProject(projectId);
      // Backend returns: { success, message, timestamp, data: { bids: [...], pagination: {...} } }
      const bidsData = response.data.data?.bids || response.data.data || [];
      // Sort bids by amount (lowest first)
      const sortedBids = Array.isArray(bidsData) ? bidsData.sort((a: Bid, b: Bid) => a.amount - b.amount) : [];
      setBids(sortedBids);
    } catch (err: any) {
      console.error('Failed to fetch bids:', err);
    }
  };

  // Socket.IO event handlers
  const handleBidSubmitted = (data: any) => {
    if (data.data.project === projectId) {
      setBids(prev => {
        const newBids = [...prev, data.data];
        return newBids.sort((a, b) => a.amount - b.amount);
      });
    }
  };

  const handleBidUpdated = (data: any) => {
    if (data.data.project === projectId) {
      setBids(prev => {
        const updated = prev.map(bid =>
          bid._id === data.data._id ? { ...bid, ...data.data } : bid
        );
        return updated.sort((a, b) => a.amount - b.amount);
      });
    }
  };

  const handleBidWithdrawn = (data: any) => {
    if (data.data.project === projectId) {
      setBids(prev => prev.filter(bid => bid._id !== data.data._id));
    }
  };

  const handleProjectAssigned = (data: any) => {
    if (data.data._id === projectId) {
      setProject(data.data);
      // Update bid statuses
      setBids(prev =>
        prev.map(bid => ({
          ...bid,
          status: bid._id === data.data.assignedBid ? 'ACCEPTED' : 'REJECTED'
        }))
      );
    }
  };

  const handleProjectClosed = (data: any) => {
    if (data.data._id === projectId) {
      setProject(data.data);
    }
  };

  // Submit bid
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');

    if (!project) return;

    // Validations
    const amount = parseFloat(bidAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }

    if (amount < project.budget.min || amount > project.budget.max) {
      setBidError(`Bid amount must be between $${project.budget.min} and $${project.budget.max}`);
      return;
    }

    if (project.status !== 'OPEN') {
      setBidError('This project is no longer accepting bids');
      return;
    }

    const deadline = new Date(project.biddingEndsAt);
    if (deadline < new Date()) {
      setBidError('The bidding deadline has passed');
      return;
    }

    // Check if bid is competitive (optional warning)
    const lowestBid = bids.length > 0 ? bids[0].amount : null;
    if (lowestBid && amount > lowestBid) {
      const confirmed = confirm(
        `Your bid ($${amount}) is higher than the current lowest bid ($${lowestBid}). Continue?`
      );
      if (!confirmed) return;
    }

    if (!bidProposal.trim()) {
      setBidError('Please provide a proposal');
      return;
    }

    if (bidProposal.trim().length < 50) {
      setBidError('Proposal must be at least 50 characters');
      return;
    }

    if (bidProposal.trim().length > 2000) {
      setBidError('Proposal cannot exceed 2000 characters');
      return;
    }

    const deliveryDays = parseInt(bidDeliveryTime);
    if (!deliveryDays || deliveryDays < 1 || deliveryDays > 365) {
      setBidError('Delivery time must be between 1 and 365 days');
      return;
    }

    try {
      setSubmittingBid(true);
      await api.bids.create(projectId, {
        amount,
        proposal: bidProposal.trim(),
        deliveryTime: deliveryDays
      });

      // Reset form
      setBidAmount('');
      setBidProposal('');
      setBidDeliveryTime('');
      setShowBidForm(false);
      alert('Bid submitted successfully!');
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Failed to submit bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  // Accept bid (client only)
  const handleAcceptBid = async (bidId: string) => {
    if (!confirm('Are you sure you want to accept this bid? This will reject all other bids and assign the project.')) {
      return;
    }

    try {
      setAcceptingBid(bidId);
      await api.projects.assign(projectId, { bidId });
      alert('Bid accepted! Project has been assigned to the freelancer.');
      
      // Refresh project and bids data
      await fetchProjectDetails();
      await fetchProjectBids();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to accept bid';
      console.error('Accept bid error:', err);
      alert(errorMessage);
    } finally {
      setAcceptingBid(null);
    }
  };

  // Check if user can submit bid
  const canSubmitBid = () => {
    if (!user || !project) return false;
    if (user.role !== 'FREELANCER') return false;
    if (project.status !== 'OPEN') return false;
    if (new Date(project.biddingEndsAt) < new Date()) return false;
    // Check if user already submitted a bid
    const hasExistingBid = bids.some(bid => bid.freelancerId._id === user._id);
    return !hasExistingBid;
  };

  // Check if user can accept bids
  const canAcceptBids = () => {
    if (!user || !project) return false;
    if (user.role !== 'CLIENT') return false;
    if (project.clientId._id !== user._id) return false;
    if (project.status !== 'OPEN') return false;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Project not found'}</p>
          <button
            onClick={() => router.push('/projects')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const isDeadlinePassed = new Date(project.biddingEndsAt) < new Date();
  const lowestBid = bids.length > 0 ? bids[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <span className="mr-2">←</span> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Project Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              {/* Project Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      project.status === 'OPEN'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'ASSIGNED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Posted on {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Budget */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${project.budget.min.toLocaleString()} - ${project.budget.max.toLocaleString()}
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
              </div>

              {/* Skills Required */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bidding Deadline */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bidding Deadline</h3>
                <p className={`text-gray-700 ${isDeadlinePassed ? 'text-red-600 font-semibold' : ''}`}>
                  {new Date(project.biddingEndsAt).toLocaleString()}
                  {isDeadlinePassed && ' (Expired)'}
                </p>
              </div>

              {/* Assigned Freelancer (if any) */}
              {project.assignedFreelancerId && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Assigned To</h3>
                  <p className="text-gray-700">
                    <span className="font-semibold">
                      {typeof project.assignedFreelancerId === 'object' 
                        ? project.assignedFreelancerId.name 
                        : 'Freelancer'}
                    </span>
                    {typeof project.assignedFreelancerId === 'object' && project.assignedFreelancerId.email && (
                      <span className="text-gray-500 ml-2">({project.assignedFreelancerId.email})</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Bid Submission Form (Freelancer only) */}
            {canSubmitBid() && !showBidForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <button
                  onClick={() => setShowBidForm(true)}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Submit a Bid
                </button>
              </div>
            )}

            {showBidForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Your Bid</h3>
                <form onSubmit={handleSubmitBid}>
                  {bidError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {bidError}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                      Bid Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Between $${project.budget.min} - $${project.budget.max}`}
                      required
                    />
                    {lowestBid && (
                      <p className="text-sm text-gray-600 mt-1 break-words">
                        Current lowest bid: ${lowestBid.amount.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                      Proposal
                    </label>
                    <textarea
                      value={bidProposal}
                      onChange={(e) => setBidProposal(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={6}
                      placeholder="Explain why you're the best fit for this project... (minimum 50 characters)"
                      required
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-sm ${bidProposal.length < 50 ? 'text-red-600' : 'text-gray-600'}`}>
                        {bidProposal.length} / 2000 characters {bidProposal.length < 50 && `(${50 - bidProposal.length} more needed)`}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                      Estimated Delivery Time (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={bidDeliveryTime}
                      onChange={(e) => setBidDeliveryTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="How many days to complete? (1-365)"
                      required
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Enter the number of days you need to complete this project
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submittingBid}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                    >
                      {submittingBid ? 'Submitting...' : 'Submit Bid'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBidForm(false);
                        setBidError('');
                        setBidAmount('');
                        setBidProposal('');
                        setBidDeliveryTime('');
                      }}
                      className="min-w-[100px] px-6 py-3 border-2 border-gray-400 rounded-lg hover:bg-gray-100 bg-white text-gray-800 font-semibold shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar - Bids and Client Info */}
          <div className="lg:col-span-1">
            {/* Client Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
              <div>
                <p className="text-gray-700">
                  <span className="font-semibold">{project.clientId.name}</span>
                </p>
                <p className="text-sm text-gray-500">{project.clientId.email}</p>
              </div>
            </div>

            {/* Bids Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bids ({bids.length})
              </h3>

              {bids.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bids yet</p>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid, index) => (
                    <div
                      key={bid._id}
                      className={`border rounded-lg p-4 ${
                        bid.status === 'ACCEPTED'
                          ? 'bg-green-50 border-green-300'
                          : bid.status === 'REJECTED'
                          ? 'bg-gray-50 border-gray-300 opacity-60'
                          : index === 0
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {bid.freelancerId.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(bid.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {index === 0 && bid.status === 'PENDING' && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            Lowest
                          </span>
                        )}
                        {bid.status === 'ACCEPTED' && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                            Accepted
                          </span>
                        )}
                        {bid.status === 'REJECTED' && (
                          <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                            Rejected
                          </span>
                        )}
                      </div>

                      <p className="text-2xl font-bold text-blue-600 mb-2">
                        ${bid.amount.toLocaleString()}
                      </p>

                      <p className="text-sm text-gray-700 mb-3 break-words overflow-wrap-anywhere">{bid.proposal}</p>

                      {canAcceptBids() && bid.status === 'PENDING' && (
                        <button
                          onClick={() => handleAcceptBid(bid._id)}
                          disabled={acceptingBid !== null}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-semibold"
                        >
                          {acceptingBid === bid._id ? 'Accepting...' : 'Accept Bid'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
