/**
 * Create Project Page
 * Allows clients to create new projects
 * CLIENT-only access
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Button from '@/components/ui/Button';
import api from '@/services/api';

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    minBudget: '',
    maxBudget: '',
    skills: '',
    deadline: ''
  });

  // Calculate min date (24 hours from now)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Calculate max date (1 year from now)
  const getMaxDate = () => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toISOString().split('T')[0];
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 2 || formData.title.length > 200) {
      newErrors.title = 'Title must be between 2 and 200 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50 || formData.description.length > 5000) {
      newErrors.description = 'Description must be between 50 and 5000 characters';
    }

    // Budget validation
    const minBudget = parseFloat(formData.minBudget);
    const maxBudget = parseFloat(formData.maxBudget);

    if (!formData.minBudget || isNaN(minBudget)) {
      newErrors.minBudget = 'Minimum budget is required';
    } else if (minBudget < 0 || minBudget > 10000000) {
      newErrors.minBudget = 'Budget must be between $0 and $10,000,000';
    }

    if (!formData.maxBudget || isNaN(maxBudget)) {
      newErrors.maxBudget = 'Maximum budget is required';
    } else if (maxBudget < 0 || maxBudget > 10000000) {
      newErrors.maxBudget = 'Budget must be between $0 and $10,000,000';
    }

    if (minBudget && maxBudget && minBudget > maxBudget) {
      newErrors.maxBudget = 'Maximum budget must be greater than minimum budget';
    }

    // Skills validation
    if (!formData.skills.trim()) {
      newErrors.skills = 'At least one skill is required';
    } else {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      if (skillsArray.length < 1 || skillsArray.length > 20) {
        newErrors.skills = 'Please enter between 1 and 20 skills';
      }
    }

    // Deadline validation
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 1);
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);

      if (deadlineDate < minDate) {
        newErrors.deadline = 'Deadline must be at least 24 hours in the future';
      } else if (deadlineDate > maxDate) {
        newErrors.deadline = 'Deadline cannot be more than 1 year in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    if (!validateForm()) {
      setError('Please fix the errors above');
      return;
    }

    setLoading(true);

    try {
      // Prepare data
      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: {
          min: parseFloat(formData.minBudget),
          max: parseFloat(formData.maxBudget)
        },
        requiredSkills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        biddingEndsAt: new Date(formData.deadline).toISOString()
      };

      console.log('📤 Creating project with data:', projectData);
      const response = await api.projects.create(projectData);
      console.log('✅ Project created:', response.data);
      
      const projectId = response.data.data._id;

      // Redirect to project detail page
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      console.error('❌ Failed to create project:', err);
      console.error('❌ Error response:', err.response?.data);
      
      // Handle validation errors
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        err.response.data.errors.forEach((error: any) => {
          backendErrors[error.field] = error.message;
        });
        setErrors(backendErrors);
        setError('Please fix the validation errors');
      } else {
        setError(err.response?.data?.message || 'Failed to create project. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="CLIENT">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
            <p className="text-gray-600">
              Post your project and receive bids from talented freelancers
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <Input
              label="Project Title"
              value={formData.title}
              onChange={(value) => setFormData({ ...formData, title: value })}
              error={errors.title}
              placeholder="e.g., Build a Modern E-commerce Website"
              required
            />

            {/* Description */}
            <TextArea
              label="Project Description"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              error={errors.description}
              placeholder="Describe your project in detail. Include requirements, deliverables, and any specific preferences..."
              rows={8}
              maxLength={5000}
              required
            />

            {/* Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Minimum Budget ($)"
                type="number"
                value={formData.minBudget}
                onChange={(value) => setFormData({ ...formData, minBudget: value })}
                error={errors.minBudget}
                placeholder="1000"
                min={0}
                max={10000000}
                step={100}
                required
              />

              <Input
                label="Maximum Budget ($)"
                type="number"
                value={formData.maxBudget}
                onChange={(value) => setFormData({ ...formData, maxBudget: value })}
                error={errors.maxBudget}
                placeholder="5000"
                min={0}
                max={10000000}
                step={100}
                required
              />
            </div>

            {/* Skills */}
            <div>
              <Input
                label="Required Skills"
                value={formData.skills}
                onChange={(value) => setFormData({ ...formData, skills: value })}
                error={errors.skills}
                placeholder="React, Node.js, MongoDB, TypeScript (comma-separated)"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter skills separated by commas. Maximum 20 skills.
              </p>
            </div>

            {/* Deadline */}
            <Input
              label="Bidding Deadline"
              type="date"
              value={formData.deadline}
              onChange={(value) => setFormData({ ...formData, deadline: value })}
              error={errors.deadline}
              min={getMinDate()}
              max={getMaxDate()}
              required
            />

            {/* Actions */}
            <div className="flex items-center gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
