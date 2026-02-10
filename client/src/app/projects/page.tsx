/**
 * Projects Listing Page
 * Shared page for browsing all open projects
 * Accessible to both CLIENTs and FREELANCERs
 * 
 * Features:
 * - Real-time project updates via Socket.IO
 * - Filtering by status, budget, skills
 * - Search functionality
 * - Responsive grid layout
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import socketService from '@/services/socket';
import { useAuth } from '@/context/AuthContext';

export default function ProjectsPage() {
  const router = useRouter();
  const { user, isClient } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    status: string;
    search: string;
    minBudget: string;
    maxBudget: string;
    skills: string;
  }>({
    status: 'OPEN',
    search: '',
    minBudget: '',
    maxBudget: '',
    skills: ''
  });

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.minBudget) params.minBudget = filters.minBudget;
      if (filters.maxBudget) params.maxBudget = filters.maxBudget;
      if (filters.skills) params.skills = filters.skills;

      console.log('🔍 Fetching projects with params:', params);
      const response = await api.projects.getAll(params);
      console.log('📥 Projects API response:', response.data);
      
      // Extract projects from the correct nested structure
      // Backend returns: { success, message, timestamp, data: { projects: [...], pagination: {...} } }
      const projectsData = response.data.data?.projects || response.data.projects || [];
      
      // Ensure it's an array
      const projectsArray = Array.isArray(projectsData) ? projectsData : [];
      console.log('✅ Setting projects:', projectsArray.length, 'projects');
      
      setProjects(projectsArray);
    } catch (error) {
      console.error('❌ Failed to fetch projects:', error);
      setProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Subscribe to real-time updates
  useEffect(() => {
    const handleProjectCreated = (data: any) => {
      console.log('📡 New project created:', data.data);
      setProjects(prev => [data.data, ...prev]);
    };

    const handleProjectUpdated = (data: any) => {
      console.log('📡 Project updated:', data.data);
      setProjects(prev => 
        prev.map(p => p._id === data.data._id ? data.data : p)
      );
    };

    const handleProjectAssigned = (data: any) => {
      console.log('📡 Project assigned:', data.data);
      setProjects(prev => 
        prev.map(p => p._id === data.data._id ? data.data : p)
      );
    };

    const handleProjectClosed = (data: any) => {
      console.log('📡 Project closed:', data.data);
      setProjects(prev => 
        prev.map(p => p._id === data.data._id ? data.data : p)
      );
    };

    const handleBidSubmitted = (data: any) => {
      console.log('📡 New bid submitted:', data.data);
      setProjects(prev =>
        prev.map(p => {
          if (p._id === data.data.projectId) {
            return {
              ...p,
              totalBids: (p.totalBids || 0) + 1,
              lowestBid: data.data.amount < (p.lowestBid || Infinity) 
                ? data.data.amount 
                : p.lowestBid
            };
          }
          return p;
        })
      );
    };

    socketService.on('PROJECT_CREATED', handleProjectCreated);
    socketService.on('PROJECT_UPDATED', handleProjectUpdated);
    socketService.on('PROJECT_ASSIGNED', handleProjectAssigned);
    socketService.on('PROJECT_CLOSED', handleProjectClosed);
    socketService.on('BID_SUBMITTED', handleBidSubmitted);

    return () => {
      socketService.off('PROJECT_CREATED', handleProjectCreated);
      socketService.off('PROJECT_UPDATED', handleProjectUpdated);
      socketService.off('PROJECT_ASSIGNED', handleProjectAssigned);
      socketService.off('PROJECT_CLOSED', handleProjectClosed);
      socketService.off('BID_SUBMITTED', handleBidSubmitted);
    };
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBudget = (min: number, max: number) => {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(isClient() ? '/dashboard/client' : '/dashboard/freelancer')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-lg border border-gray-300 flex items-center gap-2 transition-all shadow-sm hover:shadow"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Browse Projects</h1>
            </div>
            {isClient() && (
              <button
                onClick={() => router.push('/dashboard/client/create-project')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm hover:shadow transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Post Project</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                name="search"
                placeholder="Search projects..."
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Budget Range */}
            <div>
              <input
                type="number"
                name="minBudget"
                placeholder="Min Budget"
                value={filters.minBudget}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <input
                type="number"
                name="maxBudget"
                placeholder="Max Budget"
                value={filters.maxBudget}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        ) : !Array.isArray(projects) || projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(projects) && projects.map((project) => (
              <div
                key={project._id}
                onClick={() => router.push(`/projects/${project._id}`)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    {project.totalBids > 0 && (
                      <span className="text-sm text-gray-500">
                        {project.totalBids} {project.totalBids === 1 ? 'bid' : 'bids'}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Budget */}
                  <div className="flex items-center text-sm text-gray-700 mb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{formatBudget(project.budget.min, project.budget.max)}</span>
                  </div>

                  {/* Lowest Bid */}
                  {project.lowestBid && (
                    <div className="flex items-center text-sm text-green-600 mb-2">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>Lowest bid: ${project.lowestBid.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Skills */}
                  {project.requiredSkills && project.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.requiredSkills.slice(0, 3).map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {project.requiredSkills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                          +{project.requiredSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Deadline */}
                  <div className="flex items-center text-xs text-gray-500 mt-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Deadline: {formatDate(project.biddingEndsAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
