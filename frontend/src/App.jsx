import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';
import ProjectListings from './pages/ProjectListings';
import ProjectDetails from './pages/ProjectDetails';
import CreateProject from './pages/CreateProject';
import Profile from './pages/Profile';

function App() {
    const { isDark } = useTheme();

    return (
        <div className="min-h-screen flex flex-col bg-base transition-colors duration-300">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#e2e8f0' : '#0f172a',
                        border: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '14px',
                        boxShadow: isDark
                            ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                            : '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                    },
                    success: {
                        iconTheme: { primary: '#10b981', secondary: '#fff' },
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#fff' },
                    },
                }}
            />
            <Navbar />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/projects" element={<ProjectListings />} />
                    <Route path="/projects/:id" element={<ProjectDetails />} />
                    <Route
                        path="/projects/create"
                        element={
                            <ProtectedRoute allowedRoles={['client']}>
                                <CreateProject />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/client/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['client']}>
                                <ClientDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/freelancer/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['freelancer']}>
                                <FreelancerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/profile/:id" element={<Profile />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}

export default App;
