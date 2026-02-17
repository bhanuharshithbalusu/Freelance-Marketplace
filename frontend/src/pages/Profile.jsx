import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import {
    HiOutlineUser, HiOutlineMail, HiOutlineLocationMarker,
    HiOutlineBriefcase, HiOutlineStar, HiOutlineCurrencyDollar,
    HiOutlinePlusCircle, HiOutlineTrash, HiOutlineCode,
} from 'react-icons/hi';

const Profile = () => {
    const { id } = useParams();
    const { user: authUser, updateUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        bio: '',
        skills: '',
        hourlyRate: '',
        location: '',
    });
    const [portfolio, setPortfolio] = useState([]);
    const [newPortfolio, setNewPortfolio] = useState({ title: '', description: '', url: '' });

    const isOwnProfile = !id || id === authUser?._id;

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            let data;
            if (isOwnProfile) {
                const res = await API.get('/auth/me');
                data = res.data.user;
            } else {
                const res = await API.get(`/users/${id}`);
                data = res.data.user;
            }
            setProfileUser(data);
            setForm({
                name: data.name || '',
                bio: data.bio || '',
                skills: data.skills?.join(', ') || '',
                hourlyRate: data.hourlyRate || '',
                location: data.location || '',
            });
            setPortfolio(data.portfolio || []);
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                bio: form.bio,
                skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
                hourlyRate: Number(form.hourlyRate),
                location: form.location,
                portfolio,
            };

            const { data } = await API.put('/users/profile', payload);
            setProfileUser(data.user);
            updateUser(data.user);
            setEditing(false);
            toast.success('Profile updated!');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const addPortfolioItem = () => {
        if (!newPortfolio.title) return;
        setPortfolio([...portfolio, { ...newPortfolio }]);
        setNewPortfolio({ title: '', description: '', url: '' });
    };

    const removePortfolioItem = (index) => {
        setPortfolio(portfolio.filter((_, i) => i !== index));
    };

    if (loading) return <Loader size="lg" text="Loading profile..." />;
    if (!profileUser) return null;

    return (
        <div className="page-container animate-fade-in">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="glass-card p-6 sm:p-10 mb-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
                            <span className="text-white font-bold text-3xl">
                                {profileUser.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    {editing ? (
                                        <input
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="input-field !text-xl font-bold mb-2"
                                        />
                                    ) : (
                                        <h1 className="text-2xl sm:text-3xl font-bold t-heading">{profileUser.name}</h1>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        <span className="badge-primary capitalize">{profileUser.role}</span>
                                        {profileUser.rating > 0 && (
                                            <span className="flex items-center gap-1 text-amber-400 text-sm">
                                                <HiOutlineStar className="w-4 h-4" /> {profileUser.rating}
                                            </span>
                                        )}
                                        {profileUser.completedProjects > 0 && (
                                            <span className="text-xs t-muted">
                                                {profileUser.completedProjects} projects completed
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {isOwnProfile && (
                                    <div className="flex gap-2">
                                        {editing ? (
                                            <>
                                                <button onClick={handleSave} disabled={saving} className="btn-primary !py-2 !px-5 text-sm">
                                                    {saving ? 'Saving...' : 'Save'}
                                                </button>
                                                <button onClick={() => setEditing(false)} className="btn-secondary !py-2 !px-5 text-sm">Cancel</button>
                                            </>
                                        ) : (
                                            <button onClick={() => setEditing(true)} className="btn-secondary !py-2 !px-5 text-sm">Edit Profile</button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm t-muted">
                                <span className="flex items-center gap-1.5">
                                    <HiOutlineMail className="w-4 h-4" /> {profileUser.email}
                                </span>
                                {profileUser.location && (
                                    <span className="flex items-center gap-1.5">
                                        <HiOutlineLocationMarker className="w-4 h-4" /> {profileUser.location}
                                    </span>
                                )}
                                {profileUser.hourlyRate > 0 && (
                                    <span className="flex items-center gap-1.5 text-accent-400 font-medium">
                                        <HiOutlineCurrencyDollar className="w-4 h-4" /> ${profileUser.hourlyRate}/hr
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold t-muted mb-2">About</h3>
                        {editing ? (
                            <textarea
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                className="input-field min-h-[100px] resize-none"
                                placeholder="Write something about yourself..."
                            />
                        ) : (
                            <p className="t-muted leading-relaxed">
                                {profileUser.bio || 'No bio yet.'}
                            </p>
                        )}
                    </div>

                    {/* Details */}
                    {editing && profileUser.role === 'freelancer' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            <div>
                                <label className="label-text">Hourly Rate ($)</label>
                                <input
                                    type="number"
                                    value={form.hourlyRate}
                                    onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                                    className="input-field"
                                    placeholder="50"
                                />
                            </div>
                            <div>
                                <label className="label-text">Location</label>
                                <input
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    className="input-field"
                                    placeholder="San Francisco, CA"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Skills */}
                <div className="glass-card p-6 sm:p-8 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <HiOutlineCode className="w-5 h-5 text-primary-400" />
                        <h2 className="text-lg font-semibold t-heading">Skills</h2>
                    </div>

                    {editing ? (
                        <div>
                            <input
                                value={form.skills}
                                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                                className="input-field"
                                placeholder="React, Node.js, Python, etc."
                            />
                            <p className="text-xs t-faint mt-1">Comma-separated</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {profileUser.skills?.length > 0 ? (
                                profileUser.skills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-primary-500/10 text-primary-400 rounded-lg text-sm border border-primary-500/20">
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <p className="t-faint text-sm">No skills listed</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Portfolio */}
                {(profileUser.role === 'freelancer' || portfolio.length > 0) && (
                    <div className="glass-card p-6 sm:p-8">
                        <div className="flex items-center gap-2 mb-4">
                            <HiOutlineBriefcase className="w-5 h-5 text-accent-400" />
                            <h2 className="text-lg font-semibold t-heading">Portfolio</h2>
                        </div>

                        {portfolio.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                {portfolio.map((item, i) => (
                                    <div key={i} className="p-4 bg-subtle rounded-xl border border-theme">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold t-heading">{item.title}</h4>
                                                <p className="text-sm t-muted mt-1">{item.description}</p>
                                                {item.url && (
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary-400 hover:text-primary-300 mt-2 inline-block transition-colors"
                                                    >
                                                        View Project →
                                                    </a>
                                                )}
                                            </div>
                                            {editing && (
                                                <button
                                                    onClick={() => removePortfolioItem(i)}
                                                    className="t-faint hover:text-red-400 transition-colors"
                                                >
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="t-faint text-sm mb-6">No portfolio items yet.</p>
                        )}

                        {editing && (
                            <div className="p-4 bg-subtle rounded-xl border border-theme">
                                <p className="text-sm font-medium t-muted mb-3">Add Portfolio Item</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                    <input
                                        value={newPortfolio.title}
                                        onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                                        className="input-field !py-2 text-sm"
                                        placeholder="Project title"
                                    />
                                    <input
                                        value={newPortfolio.description}
                                        onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                                        className="input-field !py-2 text-sm"
                                        placeholder="Description"
                                    />
                                    <input
                                        value={newPortfolio.url}
                                        onChange={(e) => setNewPortfolio({ ...newPortfolio, url: e.target.value })}
                                        className="input-field !py-2 text-sm"
                                        placeholder="URL"
                                    />
                                </div>
                                <button onClick={addPortfolioItem} className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-1">
                                    <HiOutlinePlusCircle className="w-4 h-4" /> Add Item
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
