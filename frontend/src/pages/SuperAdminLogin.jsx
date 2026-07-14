import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; 
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowLeft,
  Users,
  BarChart3,
  ShieldCheck,
  Shield,
  History,
  Landmark,
  Crown,
  LogIn,
  Star
} from 'lucide-react';
import { Logo } from '../components/landing/Logo';
import about1 from '../assets/about-1.jpg';

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); 
  const [isSignUp, setIsSignUp] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [credentials, setCredentials] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ message: isSignUp ? 'Creating account…' : 'Authenticating…', type: 'info' });
    const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
    try {
      const payload = { ...credentials, role: 'superadmin' };
      
      if (!isSignUp && !credentials.email.includes('@')) {
        payload.id = credentials.email;
        delete payload.email;
      }

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, payload);
      
      if (res.data.success) {
        setStatus({ message: isSignUp ? 'Account created! Please sign in.' : '✅ Login successful!', type: 'success' });
        if (!isSignUp) {
          login(res.data); 
          setTimeout(() => {
            if (res.data.passwordResetRequired) {
              navigate('/change-password');
            } else {
              const routes = { student: '/student-dashboard', teacher: '/teacher-dashboard', faculty: '/teacher-dashboard', admin: '/admin', superadmin: '/superadmin' };
              navigate(routes[res.data.role] || '/');
            }
          }, 800);
        } else {
          setTimeout(() => { setIsSignUp(false); setStatus({ message: 'Now sign in with your new account.', type: 'info' }); }, 2000);
        }
      }
    } catch (err) {
      setStatus({ message: `❌ ${err.response?.data?.message || err.message || 'Cannot reach server.'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#F8FAFC] font-sans text-slate-800 relative overflow-y-auto lg:overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-amber-200/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-50/50 blur-3xl pointer-events-none"></div>

      {/* Floating Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-3 flex justify-between items-center z-20 relative">
        <Logo />
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary bg-white shadow-sm border border-slate-200/60 px-4 py-2 rounded-full transition-all hover:shadow hover:border-slate-300 active:scale-[0.97]">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </header>

      {/* Main Split Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-3 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-center lg:justify-between z-10 relative lg:min-h-0 lg:overflow-hidden">
        
        {/* Left Column: Hero Description */}
        <section className="w-full lg:w-[48%] flex flex-col justify-center py-2 lg:py-4 h-full lg:max-h-full">
          <div>
            {/* Super Admin Portal Badge */}
            <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider inline-block mb-3 uppercase">
              Super Admin Portal
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-3">
              Power. Control.<br /><span className="text-[#F59E0B]">Lead the Institution.</span>
            </h1>

            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-md mb-4">
              Welcome to the Super Admin Portal. Oversee the entire platform, manage departments, users, roles and ensure everything runs smoothly.
            </p>

            {/* Micro value list */}
            <div className="space-y-3">
              {[
                { title: "Complete Control", desc: "Manage departments, users, roles and system settings.", icon: Crown },
                { title: "Institution Overview", desc: "Get real-time insights and analytics across the platform.", icon: Landmark },
                { title: "User & Role Management", desc: "Create and manage admins, faculty, students and permissions.", icon: Users },
                { title: "Security & Audit", desc: "Ensure data security and monitor all system activities.", icon: ShieldCheck }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white border border-slate-100 text-primary shadow-sm mt-0.5">
                    <item.icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-none mb-0.5">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Building Image with Banner */}
          <div className="mt-4 lg:mt-6 flex justify-center lg:justify-start relative">
            <img 
              src={about1} 
              alt="Institution building" 
              className="max-h-[28vh] lg:max-h-[30vh] w-auto rounded-2xl border border-slate-100 shadow-md object-contain" 
            />
            {/* Overlay Banner like in mockup */}
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-[#0F172A] text-white p-3 sm:p-4 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700/50 max-w-[280px]">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                <Star className="w-5 h-5 text-[#F59E0B]" fill="currentColor" />
              </div>
              <div>
                <div className="text-xs font-bold mb-0.5">Secure. Scalable. Smart.</div>
                <div className="text-[9px] text-slate-300">Built for excellence. Designed for leaders.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Auth Card & Bottom Stats */}
        <section className="w-full lg:w-[48%] flex flex-col justify-center items-center h-full lg:max-h-full">
          <div className="w-full max-w-[420px] bg-white border border-slate-100 shadow-xl rounded-3xl p-6 sm:p-8 transition-all hover:shadow-2xl">
            
            {/* Top Icon */}
            <div className="mx-auto w-12 h-12 bg-[#0F172A] rounded-full flex items-center justify-center mb-4 border-2 border-primary/20 shadow-inner relative overflow-hidden">
                <Shield className="w-6 h-6 text-[#F59E0B] absolute z-0" fill="currentColor" />
                <Crown className="w-4 h-4 text-white z-10 -mt-1" />
            </div>

            {/* Card Titles */}
            <h2 className="font-display text-lg font-bold text-slate-900 text-center mb-1">
              {isSignUp ? 'Super Admin Registration' : 'Super Admin Login'}
            </h2>
            <p className="text-xs text-slate-500 text-center mb-4 max-w-xs mx-auto">
              Sign in to access the Super Admin Dashboard
            </p>

            {/* Status alerts */}
            {status.message && (
              <div className={`mb-4 p-3 rounded-2xl border flex items-start gap-3 text-xs ${
                status.type === 'error' 
                  ? 'bg-red-50/70 border-red-100 text-red-800' 
                  : status.type === 'success' 
                    ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800' 
                    : 'bg-blue-50/70 border-blue-100 text-blue-800'
              }`}>
                {status.type === 'error' ? (
                  <XCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <div className="font-medium leading-normal">{status.message}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Full Name (sign up only) */}
              {isSignUp && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      name="name" 
                      value={credentials.name} 
                      onChange={handleChange} 
                      required 
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200/80 bg-slate-50/30 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-xs" 
                      placeholder="Super Administrator" 
                    />
                  </div>
                </div>
              )}

              {/* Admin Email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="email" 
                    value={credentials.email} 
                    onChange={handleChange} 
                    required 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200/80 bg-slate-50/30 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-xs" 
                    placeholder="Enter super admin email" 
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    value={credentials.password} 
                    onChange={handleChange} 
                    required 
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200/80 bg-slate-50/30 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-xs" 
                    placeholder="Enter password" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              {!isSignUp && (
                <div className="flex items-center py-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 accent-[#0F172A] rounded border-slate-300"
                    />
                    Remember Me
                  </label>
                </div>
              )}

              {/* Submit button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-60 text-white font-bold py-2 rounded-lg shadow-md shadow-slate-900/10 hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-display"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{isSignUp ? 'Create Super Admin' : 'Login to Dashboard'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Help / Contact */}
            <p className="text-[11px] font-semibold text-slate-500 text-center mt-3">
              Need help? <Link to="/contact" className="text-primary hover:underline font-bold">Contact Support</Link>
            </p>
          </div>

          {/* Bottom horizontal stat grid */}
          <div className="grid grid-cols-4 gap-3 mt-5 w-full max-w-[420px]">
            {[
              { value: "Secure Access", label: "Advanced authentication and encryption", icon: ShieldCheck },
              { value: "Real-time Analytics", label: "Live insights across all departments", icon: BarChart3 },
              { value: "Centralized Management", label: "Manage everything from one place", icon: Users },
              { value: "Audit & Logs", label: "Track all activities with detailed logs", icon: History },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all rounded-xl p-2 flex flex-col items-center justify-start text-center group min-h-[80px]"
              >
                <span className="text-primary bg-primary/5 p-1.5 rounded-lg mb-1.5 group-hover:scale-110 transition-transform">
                  <item.icon className="w-3.5 h-3.5" />
                </span>
                <span className="font-display text-[8px] font-extrabold text-slate-800 leading-tight tracking-tight uppercase">{item.value}</span>
                <span className="text-[7px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Styled Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row justify-between items-center border-t border-slate-200/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider z-10 relative gap-3 mt-auto">
        <div>© {new Date().getFullYear()} Nexus Proctor, Academic Integrity. All rights reserved.</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-600 transition-colors">Terms & Conditions</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default SuperAdminLogin;
