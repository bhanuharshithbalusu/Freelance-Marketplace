import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import {
    HiOutlineMenu,
    HiOutlineX,
    HiOutlineBell,
    HiOutlineLogout,
    HiOutlineUser,
    HiOutlineViewGrid,
    HiOutlineSun,
    HiOutlineMoon,
} from 'react-icons/hi';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const { notifications, clearNotifications } = useSocket();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const dashboardPath = user?.role === 'client' ? '/client/dashboard' : '/freelancer/dashboard';

    return (
        <nav className="sticky top-0 z-50 bg-elevated/80 backdrop-blur-xl border-b border-theme transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center
              transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                            <span className="text-white font-bold text-lg">F</span>
                        </div>
                        <span className="text-xl font-bold gradient-text hidden sm:inline">FreelanceHub</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link to="/projects" className="px-4 py-2 t-muted hover:t-heading transition-colors rounded-lg hover:bg-subtle text-sm font-medium">
                            Browse Projects
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link to={dashboardPath} className="px-4 py-2 t-muted hover:t-heading transition-colors rounded-lg hover:bg-subtle text-sm font-medium">
                                    Dashboard
                                </Link>

                                {/* Notifications */}
                                <div className="relative" ref={notifRef}>
                                    <button
                                        onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
                                        className="relative p-2 t-muted hover:t-heading transition-colors rounded-lg hover:bg-subtle"
                                    >
                                        <HiOutlineBell className="w-5 h-5" />
                                        {notifications.length > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-pulse">
                                                {notifications.length}
                                            </span>
                                        )}
                                    </button>

                                    {showNotif && (
                                        <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl overflow-hidden animate-slide-down">
                                            <div className="px-4 py-3 border-b border-theme flex items-center justify-between">
                                                <h3 className="font-semibold text-sm t-heading">Notifications</h3>
                                                {notifications.length > 0 && (
                                                    <button onClick={clearNotifications} className="text-xs text-primary-400 hover:text-primary-300">
                                                        Clear all
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-72 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <p className="p-4 text-sm t-faint text-center">No new notifications</p>
                                                ) : (
                                                    notifications.map((n, i) => (
                                                        <div key={i} className="px-4 py-3 border-b border-theme hover:bg-subtle transition-colors">
                                                            <p className="text-sm t-body">{n.message}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Theme Toggle */}
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 t-muted hover:t-heading transition-all rounded-lg hover:bg-subtle"
                                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                    id="theme-toggle"
                                >
                                    {isDark ? (
                                        <HiOutlineSun className="w-5 h-5 text-amber-400" />
                                    ) : (
                                        <HiOutlineMoon className="w-5 h-5" />
                                    )}
                                </button>

                                {/* Profile */}
                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
                                        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-subtle transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <span className="text-sm font-medium t-body hidden lg:inline">{user?.name}</span>
                                    </button>

                                    {showProfile && (
                                        <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl overflow-hidden animate-slide-down">
                                            <div className="px-4 py-3 border-b border-theme">
                                                <p className="font-semibold text-sm t-heading">{user?.name}</p>
                                                <p className="text-xs t-faint capitalize">{user?.role}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    to={dashboardPath}
                                                    onClick={() => setShowProfile(false)}
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm t-muted hover:t-heading hover:bg-subtle transition-colors"
                                                >
                                                    <HiOutlineViewGrid className="w-4 h-4" /> Dashboard
                                                </Link>
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setShowProfile(false)}
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm t-muted hover:t-heading hover:bg-subtle transition-colors"
                                                >
                                                    <HiOutlineUser className="w-4 h-4" /> Profile
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-subtle transition-colors"
                                                >
                                                    <HiOutlineLogout className="w-4 h-4" /> Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 ml-2">
                                {/* Theme Toggle (unauthenticated) */}
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 t-muted hover:t-heading transition-all rounded-lg hover:bg-subtle"
                                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                    id="theme-toggle-unauth"
                                >
                                    {isDark ? (
                                        <HiOutlineSun className="w-5 h-5 text-amber-400" />
                                    ) : (
                                        <HiOutlineMoon className="w-5 h-5" />
                                    )}
                                </button>
                                <Link to="/login" className="btn-secondary !py-2 !px-4 text-sm">Log In</Link>
                                <Link to="/signup" className="btn-primary !py-2 !px-4 text-sm">Sign Up</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile buttons */}
                    <div className="flex items-center gap-1 md:hidden">
                        <button
                            onClick={toggleTheme}
                            className="p-2 t-muted hover:t-heading transition-all rounded-lg"
                            id="theme-toggle-mobile"
                        >
                            {isDark ? (
                                <HiOutlineSun className="w-5 h-5 text-amber-400" />
                            ) : (
                                <HiOutlineMoon className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 t-muted hover:t-heading transition-colors"
                        >
                            {mobileOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden bg-elevated/95 backdrop-blur-xl border-t border-theme animate-slide-down transition-colors">
                    <div className="px-4 py-4 space-y-2">
                        <Link to="/projects" onClick={() => setMobileOpen(false)} className="block px-4 py-3 t-muted hover:t-heading hover:bg-subtle rounded-xl transition-colors">
                            Browse Projects
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="block px-4 py-3 t-muted hover:t-heading hover:bg-subtle rounded-xl transition-colors">
                                    Dashboard
                                </Link>
                                <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-3 t-muted hover:t-heading hover:bg-subtle rounded-xl transition-colors">
                                    Profile
                                </Link>
                                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="w-full text-left px-4 py-3 text-red-500 dark:text-red-400 hover:bg-subtle rounded-xl transition-colors">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="flex gap-2 pt-2">
                                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary !py-2.5 flex-1 text-center text-sm">Log In</Link>
                                <Link to="/signup" onClick={() => setMobileOpen(false)} className="btn-primary !py-2.5 flex-1 text-center text-sm">Sign Up</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
