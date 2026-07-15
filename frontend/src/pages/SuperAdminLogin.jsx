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
    <div className="min-h-screen w-full flex flex-col bg-[#F8FAFC] font-sans text-slate-800 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-amber-200/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-50/50 blur-3xl pointer-events-none"></div>

      {/* Floating Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-3 flex justify-between items-center z-20 relative">
        <Logo />
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary bg-white shadow-sm border border-slate-200/60 px-4 py-2 rounded-full transition-all hover:shadow hover:border-slate-300 active:scale-[0.97]">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </header>

      {/* Main Split Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-3 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-center justify-center lg:justify-between z-10 relative lg:min-h-0">
        
        {/* Left Column: Hero Description */}
        <section className="w-full lg:w-[50%] flex flex-col justify-center py-4 h-full">
          <div>
            {/* Super Admin Portal Badge */}
            <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider inline-block mb-4 uppercase shadow-sm">
              Super Admin Portal
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[2.75rem] lg:leading-[1.15] font-extrabold tracking-tight text-slate-900 mb-3">
              Power. Control.<br /><span className="text-[#F59E0B]">Lead the Institution.</span>
            </h1>

            <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-md mb-5">
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
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white border border-slate-200 text-primary shadow-sm mt-0.5 transition-transform hover:scale-105">
                    <item.icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-none mb-1.5">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Building Image with Banner */}
          <div className="mt-8 lg:mt-12 relative max-w-sm mx-auto lg:mx-0 mb-8">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10 aspect-[4/3] bg-slate-100">
              <img 
                src={about1} 
                alt="Institution building" 
                className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
            </div>
            
            {/* Overlay Banner */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white p-4 sm:p-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700/80 w-[92%] max-w-[340px] backdrop-blur-xl hover:-translate-y-1 transition-transform duration-300 group cursor-default">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Star className="w-6 h-6 text-[#F59E0B]" fill="currentColor" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-sm font-bold text-white mb-0.5 tracking-wide">Secure. Scalable. Smart.</div>
                <div className="text-[11px] text-slate-300 font-medium">Built for excellence. Designed for leaders.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Auth Card & Bottom Stats */}
        <section className="w-full lg:w-[50%] flex flex-col justify-center items-center lg:items-end h-full">
          <div className="w-full max-w-[460px] bg-white border border-slate-100 shadow-2xl rounded-[2rem] p-6 sm:p-8 transition-all">
            
            {/* Top Icon */}
            <div className="mx-auto w-12 h-12 bg-[#0F172A] rounded-full flex items-center justify-center mb-4 border-2 border-primary/20 shadow-inner relative overflow-hidden transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <Shield className="w-6 h-6 text-[#F59E0B] absolute z-0" fill="currentColor" />
                <Crown className="w-4 h-4 text-white z-10 -mt-1" />
            </div>

            {/* Card Titles */}
            <h2 className="font-display text-2xl font-bold text-slate-900 text-center mb-1">
              {isSignUp ? 'Super Admin Registration' : 'Super Admin Login'}
            </h2>
            <p className="text-sm text-slate-500 text-center mb-4 max-w-xs mx-auto">
              Sign in to access the Super Admin Dashboard
            </p>

            {/* Status alerts */}
            {status.message && (
              <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 text-sm ${
                status.type === 'error' 
                  ? 'bg-red-50/70 border-red-100 text-red-800' 
                  : status.type === 'success' 
                    ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800' 
                    : 'bg-blue-50/70 border-blue-100 text-blue-800'
              }`}>
                {status.type === 'error' ? (
                  <XCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <div className="font-medium leading-normal">{status.message}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name (sign up only) */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Full Name</label>
                  <div className="relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary w-5 h-5 transition-colors" />
                    <input 
                      type="text" 
                      name="name" 
                      value={credentials.name} 
                      onChange={handleChange} 
                      required 
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-medium" 
                      placeholder="Super Administrator" 
                    />
                  </div>
                </div>
              )}

              {/* Admin Email */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary w-5 h-5 transition-colors" />
                  <input 
                    type="text" 
                    name="email" 
                    value={credentials.email} 
                    onChange={handleChange} 
                    required 
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-medium" 
                    placeholder="Enter super admin email" 
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary w-5 h-5 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    value={credentials.password} 
                    onChange={handleChange} 
                    required 
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-medium" 
                    placeholder="Enter password" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              {!isSignUp && (
                <div className="flex items-center py-1">
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-600 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 accent-[#0F172A] rounded border-slate-300 focus:ring-primary/20"
                    />
                    Remember Me
                  </label>
                </div>
              )}

              {/* Submit button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-70 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/25 hover:shadow-xl hover:shadow-slate-900/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm uppercase tracking-widest font-display mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>{isSignUp ? 'Create Super Admin' : 'Login to Dashboard'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Help / Contact */}
            <p className="text-sm font-medium text-slate-500 text-center mt-5">
              Need help? <Link to="/contact" className="text-primary hover:text-primary/80 hover:underline font-bold transition-colors">Contact Support</Link>
            </p>
          </div>

          {/* Bottom horizontal stat grid */}
          <div className="grid grid-cols-4 gap-3 mt-4 sm:mt-5 w-full max-w-[460px]">
            {[
              { value: "Secure Access", label: "Advanced encryption", icon: ShieldCheck },
              { value: "Real-time", label: "Live insights", icon: BarChart3 },
              { value: "Management", label: "Control everything", icon: Users },
              { value: "Audit & Logs", label: "Detailed activity tracking", icon: History },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all rounded-2xl p-2.5 flex flex-col items-center justify-start text-center group min-h-[80px]"
              >
                <span className="text-primary bg-primary/5 p-1.5 rounded-xl mb-1.5 group-hover:scale-110 transition-transform group-hover:bg-primary/10">
                  <item.icon className="w-4 h-4" />
                </span>
                <span className="font-display text-[10px] font-extrabold text-slate-800 leading-tight tracking-tight uppercase mb-0.5">{item.value}</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Styled Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row justify-between items-center border-t border-slate-200/50 text-xs text-slate-400 font-bold uppercase tracking-wider z-10 relative gap-4 mt-auto bg-[#F8FAFC]/80 backdrop-blur-sm">
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
