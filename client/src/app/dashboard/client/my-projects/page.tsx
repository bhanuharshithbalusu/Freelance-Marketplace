'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProjectCard from '@/components/ProjectCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import api from '@/services/api';
import socketService from '@/services/socket';
import { UserRole } from '@/constants/roles';

interface Project {
  _id: string;
  title: string;
  description: string;
  status: string;
  budget: {
    min: number;
    max: number;
  };
  requiredSkills: string[];
  biddingEndsAt: string;
  createdAt: string;
  bids?: any[];
  client?: {
    username: string;
  };
}

const MyProjectsPage: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchProjects();
    
    const handleProjectUpdate = (updatedProject: Project) => {
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project._id === updatedProject._id
            ? { ...project, ...updatedProject }
            : project
        )
      );
    };

    socketService.on('projectUpdated', handleProjectUpdate);

    return () => {
      socketService.off('projectUpdated', handleProjectUpdate);
    };
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.projects.getMyProjects();
      // Backend returns: { success, message, timestamp, data: { projects: [...], pagination: {...} } }
      const projectsData = response.data.data?.projects || response.data.data || [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await api.projects.delete(projectId);
      setProjects(prevProjects => prevProjects.filter(p => p._id !== projectId));
    } catch (err: any) {
      console.error('Error deleting project:', err);
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  const getStatusCounts = () => {
    return {
      all: projects.length,
      open: projects.filter(p => p.status === 'open').length,
      in_progress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <ProtectedRoute requiredRole={UserRole.CLIENT}>
        <LoadingSpinner fullScreen size="lg" />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={UserRole.CLIENT}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
              <Button
                variant="primary"
                onClick={() => router.push('/projects/create')}
              >
                + Create New Project
              </Button>
            </div>
            <p className="text-gray-600">
              Manage and track all your posted projects
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

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
              onClick={() => setFilter('open')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                filter === 'open'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Open ({statusCounts.open})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                filter === 'in_progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress ({statusCounts.in_progress})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({statusCounts.completed})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                filter === 'cancelled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled ({statusCounts.cancelled})
            </button>
          </div>

          {filteredProjects.length === 0 ? (
            <EmptyState
              title={filter === 'all' ? 'No projects yet' : `No ${filter.replace('_', ' ')} projects`}
              description={
                filter === 'all'
                  ? 'Get started by creating your first project'
                  : `You don't have any ${filter.replace('_', ' ')} projects`
              }
              action={{
                label: filter === 'all' ? 'Create Project' : 'View All Projects',
                onClick: () => {
                  if (filter === 'all') {
                    router.push('/projects/create');
                  } else {
                    setFilter('all');
                  }
                }
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onView={handleViewProject}
                  onDelete={handleDeleteProject}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MyProjectsPage;
