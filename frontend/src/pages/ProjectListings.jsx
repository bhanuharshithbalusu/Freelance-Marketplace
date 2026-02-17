import { useState, useEffect } from 'react';
import API from '../utils/api';
import ProjectCard from '../components/ProjectCard';
import Loader from '../components/Loader';
import { categories } from '../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineX } from 'react-icons/hi';

const ProjectListings = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('open');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, [page, category, status]);

    const fetchProjects = async (searchQuery = search) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', 12);
            if (searchQuery) params.append('search', searchQuery);
            if (category) params.append('category', category);
            if (status) params.append('status', status);

            const { data } = await API.get(`/projects?${params.toString()}`);
            setProjects(data.projects);
            setPagination(data.pagination);
        } catch (error) {
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProjects();
    };

    const clearFilters = () => {
        setSearch('');
        setCategory('');
        setStatus('open');
        setPage(1);
        fetchProjects('');
    };

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold t-heading mb-2">
                    Browse <span className="gradient-text">Projects</span>
                </h1>
                <p className="t-muted">Find projects that match your skills</p>
            </div>

            {/* Search & Filter Bar */}
            <div className="glass-card p-4 sm:p-6 mb-8">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 t-faint" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-field !pl-11"
                            placeholder="Search projects..."
                            id="search-input"
                        />
                    </div>
                    <button type="submit" className="btn-primary !py-2.5" id="search-btn">
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-secondary !py-2.5 flex items-center gap-2 sm:hidden"
                    >
                        <HiOutlineFilter className="w-4 h-4" /> Filters
                    </button>
                </form>

                {/* Filters */}
                <div className={`mt-4 flex flex-col sm:flex-row gap-3 ${showFilters ? '' : 'hidden sm:flex'}`}>
                    <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                        className="input-field !w-auto"
                        id="filter-category"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="input-field !w-auto"
                        id="filter-status"
                    >
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>

                    {(category || status !== 'open' || search) && (
                        <button onClick={clearFilters} className="flex items-center gap-1 text-sm t-muted hover:t-heading transition-colors">
                            <HiOutlineX className="w-4 h-4" /> Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <Loader size="lg" text="Loading projects..." />
            ) : projects.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <HiOutlineSearch className="w-10 h-10 t-faint" />
                    </div>
                    <h3 className="text-xl font-semibold t-muted mb-2">No projects found</h3>
                    <p className="t-faint mb-4">Try adjusting your search or filters</p>
                    <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm t-muted">
                            Showing {projects.length} of {pagination.total} projects
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <ProjectCard key={project._id} project={project} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-10">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-40"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${page === pageNum
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                                            : 'bg-subtle t-muted hover:t-heading hover:bg-inset'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                                disabled={page === pagination.pages}
                                className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProjectListings;
