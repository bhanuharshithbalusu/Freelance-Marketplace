/**
 * ProjectCard Component
 * Displays a project in a card format
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  _id: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
  };
  requiredSkills: string[];
  status: string;
  biddingEndsAt: string;
  client?: {
    username: string;
  };
  bidCount?: number;
}

interface ProjectCardProps {
  project: Project;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ProjectCard({ project, onView, onDelete }: ProjectCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onView) {
      onView(project._id);
    } else {
      router.push(`/projects/${project._id}`);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(project._id);
    }
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-800',
    open: 'bg-green-100 text-green-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-blue-100 text-blue-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isDeadlineSoon = () => {
    const deadline = new Date(project.biddingEndsAt);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft > 0;
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6 cursor-pointer border border-gray-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-bold text-gray-900 flex-1 line-clamp-2">
          {project.title}
        </h3>
        <div className="flex items-center gap-2 ml-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
            {project.status}
          </span>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 p-1"
              title="Delete project"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4 line-clamp-2">
        {project.description}
      </p>

      {/* Budget */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center text-gray-700">
          <svg className="h-5 w-5 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">
            ${project.budget.min.toLocaleString()} - ${project.budget.max.toLocaleString()}
          </span>
        </div>

        {project.bidCount !== undefined && (
          <div className="flex items-center text-gray-600">
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{project.bidCount} bid{project.bidCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {project.requiredSkills.slice(0, 5).map((skill: string, index: number) => (
          <span
            key={index}
            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
          >
            {skill}
          </span>
        ))}
        {project.requiredSkills.length > 5 && (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            +{project.requiredSkills.length - 5} more
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {project.client && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{project.client.username}</span>
          </div>
        )}

        <div className={`flex items-center text-sm ${isDeadlineSoon() ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Deadline: {formatDate(project.biddingEndsAt)}</span>
        </div>
      </div>
    </div>
  );
}
