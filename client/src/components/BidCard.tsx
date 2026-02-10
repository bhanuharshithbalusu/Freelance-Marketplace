/**
 * BidCard Component
 * Displays a bid in a card format
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from './ui/Button';

interface Bid {
  _id: string;
  amount: number;
  proposal: string;
  status: string;
  project?: {
    _id: string;
    title: string;
    status?: string;
  };
  projectId?: {
    _id: string;
    title: string;
    status?: string;
  };
  freelancer?: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface BidCardProps {
  bid: Bid;
  onView?: (projectId: string) => void;
  onEdit?: () => void;
  onWithdraw?: () => void;
  onAccept?: (bidId: string) => void;
  onReject?: (bidId: string) => void;
  showActions?: boolean;
}

export default function BidCard({
  bid,
  onView,
  onEdit,
  onWithdraw,
  onAccept,
  onReject,
  showActions = false
}: BidCardProps) {
  const router = useRouter();

  // Get project from either 'project' or 'projectId' field
  const project = bid.project || bid.projectId;

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    accepted: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800'
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

  const handleViewProject = () => {
    if (!project) return;
    if (onView) {
      onView(project._id);
    } else {
      router.push(`/projects/${project._id}`);
    }
  };

  if (!project) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {project.title}
          </h3>
          {bid.freelancer && (
            <p className="text-sm text-gray-600">
              by {bid.freelancer.username}
            </p>
          )}
        </div>
        <span className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold ${statusColors[bid.status] || 'bg-gray-100 text-gray-800'}`}>
          {bid.status}
        </span>
      </div>

      {/* Bid Amount */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-2xl font-bold text-gray-900">
          ${bid.amount.toLocaleString()}
        </span>
      </div>

      {/* Proposal */}
      <div className="mb-4">
        <p className="text-gray-700 line-clamp-3">
          {bid.proposal}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatDate(bid.createdAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleViewProject}
            className="text-sm py-1 px-3"
          >
            View Project
          </Button>

          {showActions && bid.status.toLowerCase() === 'pending' && (
            <>
              {onEdit && (
                <Button
                  variant="primary"
                  onClick={() => onEdit()}
                  className="text-sm py-1 px-3"
                >
                  Edit
                </Button>
              )}
              {onWithdraw && (
                <Button
                  variant="danger"
                  onClick={() => onWithdraw()}
                  className="text-sm py-1 px-3"
                >
                  Withdraw
                </Button>
              )}
              {onAccept && (
                <Button
                  variant="success"
                  onClick={() => onAccept(bid._id)}
                  className="text-sm py-1 px-3"
                >
                  Accept
                </Button>
              )}
              {onReject && (
                <Button
                  variant="danger"
                  onClick={() => onReject(bid._id)}
                  className="text-sm py-1 px-3"
                >
                  Reject
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
