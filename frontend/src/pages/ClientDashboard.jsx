import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import Loader from '../components/Loader';
import ProjectCard from '../components/ProjectCard';
import { formatCurrency, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
    HiOutlineClipboardList, HiOutlineClock, HiOutlineCheckCircle,
    HiOutlinePlusCircle, HiOutlineChatAlt2, HiOutlineTrendingUp,
    HiOutlineTrash, HiOutlinePencil,
} from 'react-icons/hi';

const ClientDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, projectsRes] = await Promise.all([
                API.get('/users/dashboard'),
                API.get('/projects/my-projects'),
            ]);
            setStats(statsRes.data.stats);
            setProjects(projectsRes.data.projects);
        } catch (error) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await API.delete(`/projects/${projectId}`);
            setProjects(projects.filter((p) => p._id !== projectId));
            toast.success('Project deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    if (loading) return <Loader size="lg" text="Loading dashboard..." />;

    const statCards = [
        { icon: HiOutlineClipboardList, label: 'Total Projects', value: stats?.totalProjects || 0, color: 'from-primary-500 to-primary-600' },
        { icon: HiOutlineTrendingUp, label: 'Open Projects', value: stats?.openProjects || 0, color: 'from-accent-500 to-accent-600' },
        { icon: HiOutlineClock, label: 'In Progress', value: stats?.inProgressProjects || 0, color: 'from-amber-500 to-amber-600' },
        { icon: HiOutlineCheckCircle, label: 'Completed', value: stats?.completedProjects || 0, color: 'from-green-500 to-green-600' },
        { icon: HiOutlineChatAlt2, label: 'Total Bids Received', value: stats?.totalBidsReceived || 0, color: 'from-violet-500 to-violet-600' },
    ];

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold t-heading">
                        Welcome back, <span className="gradient-text">{user?.name}</span>
                    </h1>
                    <p className="t-muted mt-1">Manage your projects and review bids</p>
                </div>
                <Link to="/projects/create" className="btn-primary flex items-center gap-2">
                    <HiOutlinePlusCircle className="w-5 h-5" />
                    New Project
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {statCards.map((stat, i) => (
                    <div key={i} className="stat-card group">
                        <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center
              transition-transform duration-300 group-hover:scale-110`}>
                            <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-2xl font-bold t-heading mt-2">{stat.value}</p>
                        <p className="text-xs t-muted">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Projects */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold t-heading">Your Projects</h2>
                    <Link to="/projects" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                        View All →
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <HiOutlineClipboardList className="w-8 h-8 t-faint" />
                        </div>
                        <h3 className="text-lg font-semibold t-muted mb-2">No projects yet</h3>
                        <p className="t-faint mb-6 text-sm">Create your first project and start receiving bids</p>
                        <Link to="/projects/create" className="btn-primary">
                            Create Project
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {projects.map((project) => (
                            <div key={project._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-subtle rounded-xl border border-theme hover:border-primary-500/20 transition-all">
                                <div className="flex-1 min-w-0">
                                    <Link to={`/projects/${project._id}`} className="text-base font-semibold t-heading hover:text-primary-400 transition-colors line-clamp-1">
                                        {project.title}
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${project.status === 'open' ? 'bg-accent-500/15 text-accent-400' :
                                            project.status === 'in-progress' ? 'bg-amber-500/15 text-amber-400' :
                                                project.status === 'completed' ? 'bg-primary-500/15 text-primary-400' :
                                                    'bg-red-500/15 text-red-400'
                                            }`}>
                                            {project.status}
                                        </span>
                                        <span className="text-xs t-muted">{project.bidCount || 0} bids</span>
                                        <span className="text-xs text-accent-400 font-medium">
                                            {formatCurrency(project.budget?.min)} - {formatCurrency(project.budget?.max)}
                                        </span>
                                        <span className="text-xs t-faint">{timeAgo(project.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`/projects/${project._id}`}
                                        className="p-2 t-muted hover:text-primary-400 hover:bg-subtle rounded-lg transition-colors"
                                        title="View"
                                    >
                                        <HiOutlinePencil className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(project._id)}
                                        className="p-2 t-muted hover:text-red-400 hover:bg-subtle rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientDashboard;
