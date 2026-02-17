import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../utils/api';
import Loader from '../components/Loader';
import { formatCurrency, formatDate, timeAgo, getStatusColor } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
    HiOutlineCurrencyDollar, HiOutlineClock, HiOutlineTag,
    HiOutlineUser, HiOutlineChatAlt2, HiOutlineCheckCircle,
    HiOutlineStar, HiOutlineArrowLeft,
} from 'react-icons/hi';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { socket, joinProject, leaveProject } = useSocket();

    const [project, setProject] = useState(null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bidForm, setBidForm] = useState({ amount: '', deliveryDays: '', proposal: '' });
    const [submitting, setSubmitting] = useState(false);
    const [selecting, setSelecting] = useState(null);

    useEffect(() => {
        fetchProject();
        if (id) joinProject(id);
        return () => { if (id) leaveProject(id); };
    }, [id]);

    // Listen for real-time bids
    useEffect(() => {
        if (!socket) return;

        const handleNewBid = ({ bid }) => {
            setBids((prev) => {
                if (prev.find(b => b._id === bid._id)) return prev;
                return [bid, ...prev];
            });
            setProject((prev) => prev ? { ...prev, bidCount: (prev.bidCount || 0) + 1 } : prev);
            toast.success('New bid received!', { icon: '🔔' });
        };

        const handleFreelancerSelected = ({ project: updatedProject }) => {
            setProject(updatedProject);
            toast.success('A freelancer has been selected!');
        };

        socket.on('new-bid', handleNewBid);
        socket.on('freelancer-selected', handleFreelancerSelected);

        return () => {
            socket.off('new-bid', handleNewBid);
            socket.off('freelancer-selected', handleFreelancerSelected);
        };
    }, [socket]);

    const fetchProject = async () => {
        try {
            const { data } = await API.get(`/projects/${id}`);
            setProject(data.project);
            setBids(data.bids);
        } catch (error) {
            toast.error('Project not found');
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return navigate('/login');
        setSubmitting(true);

        try {
            await API.post('/bids', {
                projectId: id,
                amount: Number(bidForm.amount),
                deliveryDays: Number(bidForm.deliveryDays),
                proposal: bidForm.proposal,
            });
            toast.success('Bid placed successfully!');
            setBidForm({ amount: '', deliveryDays: '', proposal: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to place bid');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectFreelancer = async (bidId) => {
        if (!window.confirm('Are you sure you want to select this freelancer?')) return;
        setSelecting(bidId);

        try {
            const { data } = await API.put(`/projects/${id}/select-freelancer`, { bidId });
            setProject(data.project);
            toast.success('Freelancer selected successfully!');
            fetchProject();
        } catch (error) {
            toast.error('Failed to select freelancer');
        } finally {
            setSelecting(null);
        }
    };

    if (loading) return <Loader size="lg" text="Loading project..." />;
    if (!project) return null;

    const isOwner = user?._id === project.client?._id;
    const isFreelancer = user?.role === 'freelancer';
    const hasAlreadyBid = bids.some((b) => b.freelancer?._id === user?._id);
    const canBid = isFreelancer && project.status === 'open' && !hasAlreadyBid && !isOwner;

    return (
        <div className="page-container animate-fade-in">
            {/* Back */}
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 t-muted hover:t-heading transition-colors mb-6">
                <HiOutlineArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Project Header */}
                    <div className="glass-card p-6 sm:p-8">
                        <div className="flex flex-wrap items-start gap-3 mb-4">
                            <span className={getStatusColor(project.status)}>
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </span>
                            <span className="badge-primary">
                                <HiOutlineTag className="w-3.5 h-3.5 mr-1" />
                                {project.category}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold t-heading mb-4">{project.title}</h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm t-muted mb-6">
                            <span className="flex items-center gap-1.5">
                                <HiOutlineUser className="w-4 h-4" />
                                {project.client?.name}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <HiOutlineClock className="w-4 h-4" />
                                Posted {timeAgo(project.createdAt)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <HiOutlineChatAlt2 className="w-4 h-4" />
                                {bids.length} bids
                            </span>
                        </div>

                        <div className="prose prose-invert max-w-none">
                            <p className="t-body leading-relaxed whitespace-pre-wrap">{project.description}</p>
                        </div>

                        {/* Skills */}
                        {project.skills?.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold t-muted mb-3">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.skills.map((skill, i) => (
                                        <span key={i} className="text-xs px-3 py-1.5 bg-subtle t-muted rounded-lg border border-theme">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bids Section */}
                    <div className="glass-card p-6 sm:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-semibold t-heading">Bids</h2>
                            <span className="w-6 h-6 bg-primary-500/20 text-primary-400 rounded-full text-xs flex items-center justify-center font-medium">
                                {bids.length}
                            </span>
                            {project.status === 'open' && (
                                <span className="ml-auto flex items-center gap-1.5 text-xs text-accent-400 animate-pulse">
                                    <span className="w-2 h-2 bg-accent-400 rounded-full"></span>
                                    Live
                                </span>
                            )}
                        </div>

                        {bids.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="t-faint">No bids yet. Be the first!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bids.map((bid) => (
                                    <div
                                        key={bid._id}
                                        className={`p-5 rounded-xl border transition-all ${bid.status === 'accepted'
                                            ? 'bg-accent-500/5 border-accent-500/30'
                                            : 'bg-subtle border-theme hover:border-primary-500/20'
                                            }`}
                                        id={`bid-${bid._id}`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-bold text-sm">
                                                        {bid.freelancer?.name?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <Link
                                                        to={`/profile/${bid.freelancer?._id}`}
                                                        className="font-semibold t-heading hover:text-primary-400 transition-colors text-sm"
                                                    >
                                                        {bid.freelancer?.name}
                                                    </Link>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {bid.freelancer?.rating > 0 && (
                                                            <span className="flex items-center gap-0.5 text-xs text-amber-400">
                                                                <HiOutlineStar className="w-3.5 h-3.5" />
                                                                {bid.freelancer.rating}
                                                            </span>
                                                        )}
                                                        <span className="text-xs t-faint">
                                                            {bid.freelancer?.completedProjects || 0} completed
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-accent-400">{formatCurrency(bid.amount)}</p>
                                                    <p className="text-xs t-muted">{bid.deliveryDays} days</p>
                                                </div>
                                                {bid.status !== 'pending' && (
                                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${bid.status === 'accepted' ? 'bg-accent-500/15 text-accent-400' : 'bg-red-500/15 text-red-400'
                                                        }`}>
                                                        {bid.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-sm t-muted mt-3 leading-relaxed">{bid.proposal}</p>

                                        {/* Select button for project owner */}
                                        {isOwner && project.status === 'open' && bid.status === 'pending' && (
                                            <button
                                                onClick={() => handleSelectFreelancer(bid._id)}
                                                disabled={selecting === bid._id}
                                                className="mt-4 btn-accent !py-2 !px-4 text-sm flex items-center gap-1.5"
                                            >
                                                {selecting === bid._id ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <HiOutlineCheckCircle className="w-4 h-4" /> Select Freelancer
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        <p className="text-xs t-faint mt-2">{timeAgo(bid.createdAt)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Budget & Details */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold t-heading mb-4">Project Details</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="t-muted text-sm flex items-center gap-2">
                                    <HiOutlineCurrencyDollar className="w-4 h-4" /> Budget
                                </span>
                                <span className="text-accent-400 font-bold">
                                    {formatCurrency(project.budget?.min)} - {formatCurrency(project.budget?.max)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="t-muted text-sm flex items-center gap-2">
                                    <HiOutlineClock className="w-4 h-4" /> Deadline
                                </span>
                                <span className="t-heading text-sm font-medium">{formatDate(project.deadline)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="t-muted text-sm flex items-center gap-2">
                                    <HiOutlineChatAlt2 className="w-4 h-4" /> Total Bids
                                </span>
                                <span className="t-heading text-sm font-medium">{bids.length}</span>
                            </div>
                            {project.selectedFreelancer && (
                                <div className="pt-4 border-t border-theme">
                                    <p className="text-xs t-muted mb-2">Selected Freelancer</p>
                                    <Link
                                        to={`/profile/${project.selectedFreelancer._id}`}
                                        className="flex items-center gap-2 text-accent-400 font-medium hover:text-accent-300 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                                {project.selectedFreelancer.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        {project.selectedFreelancer.name}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold t-heading mb-4">Client</h3>
                        <Link
                            to={`/profile/${project.client?._id}`}
                            className="flex items-center gap-3 group"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold">
                                    {project.client?.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="font-semibold t-heading group-hover:text-primary-400 transition-colors">
                                    {project.client?.name}
                                </p>
                                <p className="text-xs t-muted">{project.client?.email}</p>
                            </div>
                        </Link>
                    </div>

                    {/* Bid Form */}
                    {canBid && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold t-heading mb-4">Place Your Bid</h3>
                            <form onSubmit={handleBidSubmit} className="space-y-4" id="bid-form">
                                <div>
                                    <label className="label-text">Bid Amount ($)</label>
                                    <input
                                        type="number"
                                        value={bidForm.amount}
                                        onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                                        className="input-field"
                                        placeholder="Enter amount"
                                        required
                                        min="1"
                                        id="bid-amount"
                                    />
                                </div>
                                <div>
                                    <label className="label-text">Delivery (days)</label>
                                    <input
                                        type="number"
                                        value={bidForm.deliveryDays}
                                        onChange={(e) => setBidForm({ ...bidForm, deliveryDays: e.target.value })}
                                        className="input-field"
                                        placeholder="Delivery time"
                                        required
                                        min="1"
                                        id="bid-delivery"
                                    />
                                </div>
                                <div>
                                    <label className="label-text">Proposal</label>
                                    <textarea
                                        value={bidForm.proposal}
                                        onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                                        className="input-field min-h-[120px] resize-none"
                                        placeholder="Describe your approach..."
                                        required
                                        id="bid-proposal"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary w-full flex items-center justify-center"
                                    id="bid-submit"
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        'Submit Bid'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {hasAlreadyBid && (
                        <div className="glass-card p-6 text-center">
                            <HiOutlineCheckCircle className="w-8 h-8 text-accent-400 mx-auto mb-2" />
                            <p className="text-sm t-muted">You've already placed a bid on this project</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
