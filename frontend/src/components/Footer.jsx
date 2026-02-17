import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-elevated/80 backdrop-blur-xl border-t border-theme mt-auto transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-lg">F</span>
                            </div>
                            <span className="text-xl font-bold gradient-text">FreelanceHub</span>
                        </div>
                        <p className="t-muted text-sm leading-relaxed max-w-md">
                            The modern marketplace connecting talented freelancers with innovative clients.
                            Find your next project or hire the perfect talent.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-sm font-semibold t-heading uppercase tracking-wider mb-4">Platform</h4>
                        <ul className="space-y-2">
                            <li><Link to="/projects" className="text-sm t-muted hover:text-primary-400 transition-colors">Browse Projects</Link></li>
                            <li><Link to="/signup" className="text-sm t-muted hover:text-primary-400 transition-colors">Become a Freelancer</Link></li>
                            <li><Link to="/signup" className="text-sm t-muted hover:text-primary-400 transition-colors">Post a Project</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold t-heading uppercase tracking-wider mb-4">Support</h4>
                        <ul className="space-y-2">
                            <li><span className="text-sm t-muted cursor-default">Help Center</span></li>
                            <li><span className="text-sm t-muted cursor-default">Terms of Service</span></li>
                            <li><span className="text-sm t-muted cursor-default">Privacy Policy</span></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-theme mt-8 pt-8 text-center">
                    <p className="text-sm t-faint">
                        © {new Date().getFullYear()} FreelanceHub. Built with ❤️ for the freelance community.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
