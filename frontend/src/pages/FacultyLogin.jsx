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
  TrendingUp,
  Award,
  ShieldCheck,
  Headphones,
  GraduationCap,
  Presentation,
  LogIn
} from 'lucide-react';
import { Logo } from '../components/landing/Logo';
import about1 from '../assets/about-1.jpg';

export const FacultyLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); 
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ message: 'Authenticating…', type: 'info' });
    try {
      const payload = { ...credentials, role: 'teacher' };
      
      if (!credentials.email.includes('@')) {
        payload.id = credentials.email;
        delete payload.email;
      }

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, payload);
      
      if (res.data.success) {
        setStatus({ message: '✅ Login successful!', type: 'success' });
        login(res.data); 
        setTimeout(() => {
          if (res.data.passwordResetRequired) {
            navigate('/change-password');
          } else {
            const routes = { student: '/student-dashboard', teacher: '/teacher-dashboard', faculty: '/teacher-dashboard', admin: '/admin' };
            navigate(routes[res.data.role] || '/');
          }
        }, 800);
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
            {/* Faculty Portal Badge */}
            <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider inline-block mb-3 uppercase">
              Faculty Portal
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-3">
              Empower Learning.<br /><span className="text-[#F59E0B]">Inspire Futures.</span>
            </h1>

            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-md mb-4">
              Welcome to the Faculty Portal. Manage courses, guide students and track academic excellence seamlessly.
            </p>

            {/* Micro value list */}
            <div className="space-y-3">
              {[
                { title: "Manage Courses", desc: "Create and organize your courses effortlessly.", icon: Users },
                { title: "Track Progress", desc: "Monitor student performance and provide meaningful feedback.", icon: TrendingUp },
                { title: "Inspire Excellence", desc: "Support students and help them achieve their goals.", icon: Award }
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

          {/* Desk Banner Image */}
          <div className="mt-4 lg:mt-6 flex justify-center lg:justify-start">
            <img 
              src={about1} 
              alt="Faculty desk image" 
              className="max-h-[30vh] lg:max-h-[34vh] w-auto rounded-2xl border border-slate-100 shadow-md object-contain" 
            />
          </div>
        </section>

        {/* Right Column: Auth Card & Bottom Stats */}
        <section className="w-full lg:w-[48%] flex flex-col justify-center items-center h-full lg:max-h-full">
          <div className="w-full max-w-[420px] bg-white border border-slate-100 shadow-xl rounded-3xl p-6 sm:p-8 transition-all hover:shadow-2xl">
            
            {/* Top Presentation Icon */}
            <div className="mx-auto w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Presentation className="w-5 h-5 text-primary" />
            </div>

            {/* Card Titles */}
            <h2 className="font-display text-lg font-bold text-slate-900 text-center mb-1">
              Faculty Login
            </h2>
            <p className="text-xs text-slate-500 text-center mb-4 max-w-xs mx-auto">
              Sign in to access your faculty dashboard
            </p>

            {/* Status alerts */}
            {status.message && (
              <div className={`mb-5 p-3.5 rounded-2xl border flex items-start gap-3 text-xs ${
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
              
              {/* Faculty ID / Email Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Faculty ID or Email Address
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
                    placeholder="Enter your email or faculty ID" 
                  />
                </div>
              </div>

              {/* Password Input */}
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
                    placeholder="Enter your password" 
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
              <div className="flex items-center py-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded border-slate-300"
                  />
                  Remember Me
                </label>
              </div>

              {/* Submit button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-primary hover:bg-primary/95 disabled:opacity-60 text-white font-bold py-2 rounded-lg shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-display"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login to Portal</span>
                  </>
                )}
              </button>
            </form>

            {/* Help / Contact */}
            <p className="text-[11px] font-semibold text-slate-500 text-center mt-3">
              Need help? <Link to="/contact" className="text-primary hover:underline font-bold">Contact Support</Link>
            </p>
          </div>

          {/* Bottom horizontal stat grid (Faculty specific value props) */}
          <div className="grid grid-cols-4 gap-3 mt-5 w-full max-w-[420px]">
            {[
              { value: "Secure Access", label: "Your data is safe with us", icon: ShieldCheck },
              { value: "24/7 Support", label: "We're here to help", icon: Headphones },
              { value: "Academic Excellence", label: "Building future leaders", icon: GraduationCap },
              { value: "Privacy First", label: "We respect your privacy", icon: Lock },
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