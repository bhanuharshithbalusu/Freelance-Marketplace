import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineLightningBolt, HiOutlineShieldCheck, HiOutlineGlobe,
    HiOutlineCurrencyDollar, HiOutlineChatAlt2, HiOutlineChartBar,
    HiArrowRight,
} from 'react-icons/hi';

const Landing = () => {
    const { isAuthenticated, user } = useAuth();

    const features = [
        { icon: HiOutlineLightningBolt, title: 'Real-Time Bidding', desc: 'Watch bids come in live with Socket.io powered updates. No refresh needed.', color: 'from-primary-500 to-primary-600' },
        { icon: HiOutlineShieldCheck, title: 'Secure & Trusted', desc: 'JWT authentication, encrypted passwords, and role-based access control.', color: 'from-accent-500 to-accent-600' },
        { icon: HiOutlineGlobe, title: 'Global Talent Pool', desc: 'Connect with skilled freelancers and quality clients from around the world.', color: 'from-violet-500 to-violet-600' },
        { icon: HiOutlineCurrencyDollar, title: 'Competitive Pricing', desc: 'Set your budget range and receive competitive bids from top professionals.', color: 'from-amber-500 to-amber-600' },
        { icon: HiOutlineChatAlt2, title: 'Instant Notifications', desc: 'Stay updated with real-time notifications for bids, selections, and more.', color: 'from-rose-500 to-rose-600' },
        { icon: HiOutlineChartBar, title: 'Smart Dashboards', desc: 'Track projects, bids, and performance with intuitive analytics dashboards.', color: 'from-cyan-500 to-cyan-600' },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary-500/5 to-transparent rounded-full"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-36">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-8 animate-fade-in">
                            <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></span>
                            Live bidding powered by Socket.io
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight mb-6 animate-slide-up">
                            <span className="t-heading">Where Talent</span>
                            <br />
                            <span className="gradient-text">Meets Opportunity</span>
                        </h1>

                        <p className="text-lg sm:text-xl t-muted max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            The modern marketplace for freelancers and clients. Post projects,
                            receive competitive bids in real-time, and hire the best talent — all in one place.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            {isAuthenticated ? (
                                <Link
                                    to={user?.role === 'client' ? '/client/dashboard' : '/freelancer/dashboard'}
                                    className="btn-primary text-lg !px-8 !py-4 flex items-center gap-2 group"
                                >
                                    Go to Dashboard
                                    <HiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            ) : (
                                <>
                                    <Link to="/signup" className="btn-primary text-lg !px-8 !py-4 flex items-center gap-2 group">
                                        Get Started Free
                                        <HiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                    <Link to="/projects" className="btn-secondary text-lg !px-8 !py-4">
                                        Browse Projects
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold t-heading mb-4">
                            Everything You Need to <span className="gradient-text">Succeed</span>
                        </h2>
                        <p className="t-muted text-lg max-w-2xl mx-auto">
                            Powerful features designed to streamline your freelancing experience
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <div key={i} className="glass-card-hover p-8 group">
                                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-5
                  transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold t-heading mb-2">{feature.title}</h3>
                                <p className="t-muted text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-24 bg-subtle/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold t-heading mb-4">
                            How It <span className="gradient-text">Works</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { step: '01', title: 'Post Your Project', desc: 'Describe your project, set your budget range, and choose a deadline.' },
                            { step: '02', title: 'Receive Live Bids', desc: 'Freelancers bid in real-time. Compare proposals, skills, and pricing.' },
                            { step: '03', title: 'Hire & Collaborate', desc: 'Select the best freelancer and start working together immediately.' },
                        ].map((item, i) => (
                            <div key={i} className="relative text-center group">
                                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl flex items-center justify-center
                  transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-primary-500/20">
                                    <span className="text-white font-bold text-xl">{item.step}</span>
                                </div>
                                <h3 className="text-xl font-semibold t-heading mb-3">{item.title}</h3>
                                <p className="t-muted text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="glass-card p-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-accent-600/20"></div>
                        <div className="relative">
                            <h2 className="text-3xl sm:text-4xl font-bold t-heading mb-4">
                                Ready to Get Started?
                            </h2>
                            <p className="t-muted text-lg mb-8 max-w-lg mx-auto">
                                Join freelancers and clients who are building the future of work on FreelanceHub.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/signup?role=freelancer" className="btn-primary text-lg !px-8 !py-4 flex items-center gap-2 group">
                                    Start Freelancing
                                    <HiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <Link to="/signup?role=client" className="btn-accent text-lg !px-8 !py-4">
                                    Hire Talent
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
