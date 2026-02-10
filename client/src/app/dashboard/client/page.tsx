/**
 * Client Dashboard Page
 * Only accessible to users with CLIENT role
 * 
 * Features:
 * - Create new projects
 * - View own projects
 * - Monitor bids on projects
 * - Assign projects to freelancers
 * - Real-time updates
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/constants/roles';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import socketService from '@/services/socket';

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    minBudget: '',
    maxBudget: '',
    skillsRequired: '',
    biddingEndsAt: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch user's projects
  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching client projects...');
      console.log('🔍 Current user:', user);
      const response = await api.projects.getMyProjects();
      console.log('📥 My projects API response:', response.data);
      console.log('📥 Full response:', JSON.stringify(response, null, 2));
      
      // Extract projects from the correct nested structure
      // Backend returns: { success, message, timestamp, data: { projects: [...], pagination: {...} } }
      const projectsData = response.data.data?.projects || response.data.projects || [];
      console.log('📊 Projects data extracted:', projectsData);
      
      // Ensure it's an array
      const projectsArray = Array.isArray(projectsData) ? projectsData : [];
      console.log('✅ Setting projects:', projectsArray.length, 'projects');
      console.log('✅ Projects array:', projectsArray);
      
      setProjects(projectsArray);
    } catch (error: any) {
      console.error('❌ Failed to fetch projects:', error);
      console.error('❌ Error details:', error.response?.data);
      setProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProjects();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const handleProjectCreated = (data: any) => {
      if (data.data.clientId === user?._id) {
        setProjects(prev => [data.data, ...prev]);
      }
    };

    const handleBidSubmitted = (data: any) => {
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

    const handleProjectAssigned = (data: any) => {
      setProjects(prev =>
        prev.map(p => p._id === data.data._id ? data.data : p)
      );
    };

    socketService.on('PROJECT_CREATED', handleProjectCreated);
    socketService.on('BID_SUBMITTED', handleBidSubmitted);
    socketService.on('PROJECT_ASSIGNED', handleProjectAssigned);

    return () => {
      socketService.off('PROJECT_CREATED', handleProjectCreated);
      socketService.off('BID_SUBMITTED', handleBidSubmitted);
      socketService.off('PROJECT_ASSIGNED', handleProjectAssigned);
    };
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      // Validate
      if (!formData.category) {
        setFormError('Please select a project category');
        setFormLoading(false);
        return;
      }

      if (parseFloat(formData.minBudget) >= parseFloat(formData.maxBudget)) {
        setFormError('Maximum budget must be greater than minimum budget');
        setFormLoading(false);
        return;
      }

      const deadline = new Date(formData.biddingEndsAt);
      if (deadline <= new Date()) {
        setFormError('Bidding deadline must be in the future');
        setFormLoading(false);
        return;
      }

      // Create project
      const projectData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: {
          min: parseFloat(formData.minBudget),
          max: parseFloat(formData.maxBudget)
        },
        requiredSkills: formData.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
        biddingEndsAt: deadline.toISOString()
      };

      console.log('📤 Creating project:', projectData);
      const response = await api.projects.create(projectData);
      console.log('✅ Project created:', response.data);

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        minBudget: '',
        maxBudget: '',
        skillsRequired: '',
        biddingEndsAt: ''
      });
      setShowCreateForm(false);
      
      // Refresh projects list
      fetchMyProjects();
    } catch (error: any) {
      console.error('❌ Create project error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((e: any) => e.message)
          .join(', ');
        setFormError(errorMessages);
      } else {
        setFormError(error.response?.data?.message || 'Failed to create project');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to close this project?')) return;

    try {
      await api.projects.close(projectId);
      fetchMyProjects();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to close project');
    }
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

  // Calculate stats
  const projectsArray = Array.isArray(projects) ? projects : [];
  const stats = {
    active: projectsArray.filter(p => p.status === 'OPEN').length,
    assigned: projectsArray.filter(p => p.status === 'ASSIGNED').length,
    totalBids: projectsArray.reduce((sum, p) => sum + (p.totalBids || 0), 0),
    closed: projectsArray.filter(p => p.status === 'CLOSED').length
  };

  return (
    <ProtectedRoute requiredRole={USER_ROLES.CLIENT}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/client/analytics')}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </button>
                <button
                  onClick={() => router.push('/projects')}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Browse All Projects
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Post New Project
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
              <h3 className="text-sm font-medium text-gray-500 mb-2">Open Projects</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Bids</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBids}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.assigned}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Closed</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.closed}</p>
            </div>
          </div>

          {/* Create Project Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {formError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{formError}</p>
                    </div>
                  )}

                  <form onSubmit={handleCreateProject} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Build a responsive website"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        required
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe your project requirements..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Budget ($) *
                        </label>
                        <input
                          type="number"
                          name="minBudget"
                          required
                          min="0"
                          step="0.01"
                          value={formData.minBudget}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Budget ($) *
                        </label>
                        <input
                          type="number"
                          name="maxBudget"
                          required
                          min="0"
                          step="0.01"
                          value={formData.maxBudget}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a category</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Mobile Development">Mobile Development</option>
                        <option value="Design">Design</option>
                        <option value="Writing">Writing</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Data Entry">Data Entry</option>
                        <option value="Video & Animation">Video & Animation</option>
                        <option value="Music & Audio">Music & Audio</option>
                        <option value="Programming">Programming</option>
                        <option value="Business">Business</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Skills Required (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="skillsRequired"
                        value={formData.skillsRequired}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., React, Node.js, MongoDB"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bidding Deadline *
                      </label>
                      <input
                        type="datetime-local"
                        name="biddingEndsAt"
                        required
                        value={formData.biddingEndsAt}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {formLoading ? 'Creating...' : 'Create Project'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Projects List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">My Projects</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              ) : projectsArray.length === 0 ? (
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by posting your first project.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Post Project
                    </button>
                  </div>
                </div>                ) : (
                <div className="space-y-4">
                  {projectsArray.map((project) => (
                    <div
                      key={project._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <span>Budget: ${project.budget.min.toLocaleString()} - ${project.budget.max.toLocaleString()}</span>
                            <span>{project.totalBids || 0} bids</span>
                            {project.lowestBid && <span className="text-green-600">Lowest: ${project.lowestBid.toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/projects/${project._id}`)}
                            className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            View Bids
                          </button>
                          {project.status === 'OPEN' && (
                            <button
                              onClick={() => handleCloseProject(project._id)}
                              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              Close
                            </button>
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
