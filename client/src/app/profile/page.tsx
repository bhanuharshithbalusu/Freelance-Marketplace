'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import api from '@/services/api';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  portfolio?: string;
  createdAt: string;
}

interface ProfileFormData {
  name: string;
  bio: string;
  skills: string;
  hourlyRate: string;
  portfolio: string;
}

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    bio: '',
    skills: '',
    hourlyRate: '',
    portfolio: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.auth.getProfile();
      const profileData = response.data.data;
      setProfile(profileData);
      setFormData({
        name: profileData.name || '',
        bio: profileData.bio || '',
        skills: profileData.skills?.join(', ') || '',
        hourlyRate: profileData.hourlyRate?.toString() || '',
        portfolio: profileData.portfolio || ''
      });
    } catch (err: any) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'Name must be between 2 and 100 characters';
    }

    if (formData.bio && formData.bio.length > 1000) {
      newErrors.bio = 'Bio cannot exceed 1000 characters';
    }

    if (user?.role === 'FREELANCER') {
      if (formData.skills) {
        const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
        if (skillsArray.length > 50) {
          newErrors.skills = 'You can add up to 50 skills';
        }
      }

      if (formData.hourlyRate) {
        const rate = parseFloat(formData.hourlyRate);
        if (isNaN(rate) || rate <= 0) {
          newErrors.hourlyRate = 'Hourly rate must be a positive number';
        } else if (rate > 10000) {
          newErrors.hourlyRate = 'Hourly rate cannot exceed $10,000';
        }
      }

      if (formData.portfolio) {
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlPattern.test(formData.portfolio)) {
          newErrors.portfolio = 'Please enter a valid URL';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setSuccessMessage('');

    try {
      const updateData: any = {
        name: formData.name.trim(),
        bio: formData.bio.trim() || undefined
      };

      if (user?.role === 'FREELANCER') {
        updateData.skills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
        updateData.hourlyRate = formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined;
        updateData.portfolio = formData.portfolio.trim() || undefined;
      }

      await api.auth.updateProfile(updateData);
      await refreshUser();
      setSuccessMessage('Profile updated successfully!');
      setEditing(false);
      
      // Refresh profile data
      await fetchProfile();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrors({ general: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current profile data
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        skills: profile.skills?.join(', ') || '',
        hourlyRate: profile.hourlyRate?.toString() || '',
        portfolio: profile.portfolio || ''
      });
    }
    setErrors({});
    setEditing(false);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <LoadingSpinner fullScreen size="lg" />
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Failed to load profile. Please try again.
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your account information and preferences
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-full p-4 shadow-lg">
                  <div className="h-16 w-16 flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <p className="text-blue-100">{profile.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-500 rounded-full text-sm">
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Body */}
            <div className="p-6 space-y-6">
              {/* Account Information (Read-only) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <p className="text-gray-900">{profile.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                    <p className="text-gray-900">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <hr />

              {/* Editable Information */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  {!editing && (
                    <Button
                      variant="secondary"
                      onClick={() => setEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(value) => setFormData({ ...formData, name: value })}
                    error={errors.name}
                    disabled={!editing}
                    placeholder="Enter your full name"
                  />

                  <TextArea
                    label="Bio"
                    value={formData.bio}
                    onChange={(value) => setFormData({ ...formData, bio: value })}
                    error={errors.bio}
                    disabled={!editing}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={1000}
                  />

                  {user?.role === 'FREELANCER' && (
                    <>
                      <Input
                        label="Skills (comma-separated)"
                        value={formData.skills}
                        onChange={(value) => setFormData({ ...formData, skills: value })}
                        error={errors.skills}
                        disabled={!editing}
                        placeholder="JavaScript, React, Node.js, Python"
                      />

                      <Input
                        label="Hourly Rate ($)"
                        type="number"
                        value={formData.hourlyRate}
                        onChange={(value) => setFormData({ ...formData, hourlyRate: value })}
                        error={errors.hourlyRate}
                        disabled={!editing}
                        placeholder="50"
                      />

                      <Input
                        label="Portfolio URL"
                        value={formData.portfolio}
                        onChange={(value) => setFormData({ ...formData, portfolio: value })}
                        error={errors.portfolio}
                        disabled={!editing}
                        placeholder="https://yourportfolio.com"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {editing && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    loading={saving}
                    disabled={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {!editing && user?.role === 'FREELANCER' && profile.skills && profile.skills.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;