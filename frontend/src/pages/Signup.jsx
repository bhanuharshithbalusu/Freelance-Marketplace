import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import {
    HiOutlineMail, HiOutlineLockClosed, HiOutlineUser,
    HiOutlineEye, HiOutlineEyeOff, HiOutlineBriefcase, HiOutlineCode,
} from 'react-icons/hi';

const Signup = () => {
    const [searchParams] = useSearchParams();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(searchParams.get('role') || '');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signup, googleLogin } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!role) {
            toast.error('Please select a role');
            return;
        }
        setLoading(true);

        try {
            const data = await signup(name, email, password, role);
            toast.success('Account created successfully!');
            navigate(data.user.role === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        if (!role) {
            toast.error('Please select a role first, then click Google Sign-Up');
            return;
        }

        try {
            const data = await googleLogin(credentialResponse.credential, role);
            toast.success('Account created with Google!');
            navigate(data.user.role === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Google signup failed');
        }
    };

    const handleGoogleError = () => {
        toast.error('Google Sign-Up failed. Please try again.');
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/3 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative animate-scale-in">
                <div className="glass-card p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-bold text-2xl">F</span>
                        </div>
                        <h1 className="text-2xl font-bold t-heading">Create Account</h1>
                        <p className="t-muted mt-2 text-sm">Join the FreelanceHub community</p>
                    </div>

                    {/* Role Selection — needed BEFORE Google signup */}
                    <div className="mb-6">
                        <label className="label-text">I want to...</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole('client')}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${role === 'client'
                                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                    : 'border-theme bg-subtle t-muted hover:border-primary-500/30'
                                    }`}
                                id="role-client"
                            >
                                <HiOutlineBriefcase className="w-6 h-6" />
                                <span className="text-sm font-medium">Hire Talent</span>
                                <span className="text-xs opacity-60">Client</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('freelancer')}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${role === 'freelancer'
                                    ? 'border-accent-500 bg-accent-500/10 text-accent-400'
                                    : 'border-theme bg-subtle t-muted hover:border-accent-500/30'
                                    }`}
                                id="role-freelancer"
                            >
                                <HiOutlineCode className="w-6 h-6" />
                                <span className="text-sm font-medium">Find Work</span>
                                <span className="text-xs opacity-60">Freelancer</span>
                            </button>
                        </div>
                    </div>

                    {/* Google Sign-Up */}
                    <div className="mb-6">
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme={isDark ? 'filled_black' : 'outline'}
                                size="large"
                                width="100%"
                                text="signup_with"
                                shape="rectangular"
                                logo_alignment="left"
                            />
                        </div>
                        {!role && (
                            <p className="text-xs text-amber-400 text-center mt-2">
                                ↑ Select a role above before using Google Sign-Up
                            </p>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-theme"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-card t-faint uppercase tracking-wider">or sign up with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5" id="signup-form">
                        <div>
                            <label className="label-text">Full Name</label>
                            <div className="relative">
                                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 t-faint" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-field !pl-11"
                                    placeholder="enter your name"
                                    required
                                    id="signup-name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label-text">Email Address</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 t-faint" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field !pl-11"
                                    placeholder="you@example.com"
                                    required
                                    id="signup-email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label-text">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 t-faint" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field !pl-11 !pr-11"
                                    placeholder="Min. 6 characters"
                                    required
                                    minLength={6}
                                    id="signup-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 t-faint hover:t-muted transition-colors"
                                >
                                    {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full !py-3.5 text-center flex items-center justify-center"
                            id="signup-submit"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-sm t-muted">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
