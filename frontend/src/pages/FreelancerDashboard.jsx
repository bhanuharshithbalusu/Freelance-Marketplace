import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import Loader from '../components/Loader';
import { formatCurrency, timeAgo, getStatusColor } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
    HiOutlineChatAlt2, HiOutlineCheckCircle, HiOutlineClock,
    HiOutlineTrendingUp, HiOutlineBriefcase,
} from 'react-icons/hi';

const FreelancerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, bidsRes] = await Promise.all([
                API.get('/users/dashboard'),
                API.get('/bids/my-bids'),
            ]);
            setStats(statsRes.data.stats);
            setBids(bidsRes.data.bids);
        } catch (error) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader size="lg" text="Loading dashboard..." />;

    const statCards = [
        { icon: HiOutlineChatAlt2, label: 'Total Bids', value: stats?.totalBids || 0, color: 'from-primary-500 to-primary-600' },
        { icon: HiOutlineCheckCircle, label: 'Accepted', value: stats?.acceptedBids || 0, color: 'from-accent-500 to-accent-600' },
        { icon: HiOutlineClock, label: 'Pending', value: stats?.pendingBids || 0, color: 'from-amber-500 to-amber-600' },
        { icon: HiOutlineBriefcase, label: 'Active Projects', value: stats?.activeProjects || 0, color: 'from-violet-500 to-violet-600' },
    ];

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold t-heading">
                        Welcome back, <span className="gradient-text">{user?.name}</span>
                    </h1>
                    <p className="t-muted mt-1">Track your bids and active projects</p>
                </div>
                <Link to="/projects" className="btn-primary flex items-center gap-2">
                    <HiOutlineTrendingUp className="w-5 h-5" />
                    Find Projects
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

            {/* My Bids */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold t-heading">Your Bids</h2>
                    <Link to="/projects" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                        Browse Projects →
                    </Link>
                </div>

                {bids.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <HiOutlineChatAlt2 className="w-8 h-8 t-faint" />
                        </div>
                        <h3 className="text-lg font-semibold t-muted mb-2">No bids yet</h3>
                        <p className="t-faint mb-6 text-sm">Browse projects and place your first bid</p>
                        <Link to="/projects" className="btn-primary">Browse Projects</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bids.map((bid) => (
                            <div key={bid._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-subtle rounded-xl border border-theme hover:border-primary-500/20 transition-all">
                                <div className="flex-1 min-w-0">
                                    <Link
                                        to={`/projects/${bid.project?._id}`}
                                        className="text-base font-semibold t-heading hover:text-primary-400 transition-colors line-clamp-1"
                                    >
                                        {bid.project?.title || 'Project'}
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${bid.status === 'accepted' ? 'bg-accent-500/15 text-accent-400' :
                                            bid.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                                                'bg-red-500/15 text-red-400'
                                            }`}>
                                            {bid.status}
                                        </span>
                                        <span className="text-sm text-accent-400 font-semibold">
                                            {formatCurrency(bid.amount)}
                                        </span>
                                        <span className="text-xs t-muted">{bid.deliveryDays} days delivery</span>
                                        <span className="text-xs t-faint">{timeAgo(bid.createdAt)}</span>
                                    </div>
                                    {bid.project?.client && (
                                        <p className="text-xs t-faint mt-1">Client: {bid.project.client.name}</p>
                                    )}
                                </div>
                                <Link
                                    to={`/projects/${bid.project?._id}`}
                                    className="btn-secondary !py-2 !px-4 text-sm"
                                >
                                    View Project
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FreelancerDashboard;
