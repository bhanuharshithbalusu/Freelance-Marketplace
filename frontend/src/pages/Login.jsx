import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, googleLogin } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await login(email, password);
            toast.success('Login successful!');
            navigate(data.user.role === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const data = await googleLogin(credentialResponse.credential);
            toast.success('Logged in with Google!');
            navigate(data.user.role === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
        } catch (error) {
            if (error.response?.data?.requiresRole) {
                toast.error('Account not found. Please sign up first and select a role.');
                navigate('/signup');
            } else {
                toast.error(error.response?.data?.message || 'Google login failed');
            }
        }
    };

    const handleGoogleError = () => {
        toast.error('Google Sign-In failed. Please try again.');
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative animate-scale-in">
                <div className="glass-card p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-bold text-2xl">F</span>
                        </div>
                        <h1 className="text-2xl font-bold t-heading">Welcome Back</h1>
                        <p className="t-muted mt-2 text-sm">Sign in to continue to FreelanceHub</p>
                    </div>

                    {/* Google Sign-In */}
                    <div className="mb-6">
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme={isDark ? 'filled_black' : 'outline'}
                                size="large"
                                width="100%"
                                text="signin_with"
                                shape="rectangular"
                                logo_alignment="left"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-theme"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-card t-faint uppercase tracking-wider">or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
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
                                    id="login-email"
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
                                    placeholder="••••••••"
                                    required
                                    id="login-password"
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
                            id="login-submit"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-sm t-muted">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
