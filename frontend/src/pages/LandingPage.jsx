import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // <-- ADDED THIS

export const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // <-- ADDED THIS
  const [activeTab, setActiveTab] = useState('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ name: '', studentId: '', email: '', password: '' });

  const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ message: isSignUp ? 'Creating account…' : 'Authenticating…', type: 'info' });
    const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
    try {
      const payload = { ...credentials, role: activeTab };
      // If logging in and email field doesn't look like an email, send it as 'id'
      if (!isSignUp && !credentials.email.includes('@')) {
        payload.id = credentials.email;
        delete payload.email;
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api'}${endpoint}`,
        payload
      );
      if (res.data.success) {
        setStatus({ message: isSignUp ? 'Account created! Please sign in.' : '✅ Login successful!', type: 'success' });
        if (!isSignUp) {
          login(res.data); 
          setTimeout(() => {
            if (res.data.passwordResetRequired) {
              navigate('/change-password');
            } else {
              const routes = { student: '/student-dashboard', teacher: '/teacher-dashboard', admin: '/admin' };
              navigate(routes[res.data.role] || '/');
            }
          }, 800);
        } else {
          setTimeout(() => { setIsSignUp(false); setStatus({ message: 'Now sign in with your new account.', type: 'info' }); }, 2000);
        }
      }
    } catch (err) {
      setStatus({ message: `❌ ${err.response?.data?.message || 'Cannot reach server on port 5002'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white font-sans text-gray-900">

      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-gray-50 flex-col justify-between p-12 border-r border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl bg-blue-100 text-blue-600 p-2.5 rounded-xl shadow-sm">🛡️</span>
          <h1 className="text-2xl font-extrabold tracking-tight">NEXUS <span className="text-blue-600">PROCTOR</span></h1>
        </div>
        <div className="max-w-sm">
          <h2 className="text-4xl font-bold mb-4 leading-tight text-gray-900">Ensuring Academic Integrity.</h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Welcome to your secure examination environment. {isSignUp ? 'Create your profile' : 'Log in'} to get started.
          </p>
          <div className="mt-8 space-y-3">
            {['🔒 End-to-end proctored sessions', '💻 Multi-language coding compiler', '🧪 Auto-graded test cases', '⚠️ Real-time violation monitoring'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-500 font-medium">{f}</div>
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-400 font-medium">© {new Date().getFullYear()} Nexus Systems. All rights reserved.</div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-10">

          {/* Role Tabs */}
          <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
            {[['student', 'Student'], ['teacher', 'Faculty'], ['admin', 'Admin']].map(([val, label]) => (
              <button key={val} type="button" onClick={() => setActiveTab(val)}
                className={`pb-4 px-6 text-sm font-bold transition-all whitespace-nowrap relative ${activeTab === val ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}>
                {label} {isSignUp ? 'Register' : 'Login'}
                {activeTab === val && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-700" />}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
            <p className={`text-sm font-medium transition-all ${status.type === 'error' ? 'text-red-500' : status.type === 'success' ? 'text-emerald-600' : 'text-gray-500'}`}>
              {status.message || `Welcome to the ${activeTab} portal.`}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Full Name</label>
                  <input type="text" name="name" value={credentials.name} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-emerald-400"
                    placeholder="Your full name" />
                </div>
                {activeTab === 'student' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Roll No.</label>
                    <input type="text" name="studentId" value={credentials.studentId} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-emerald-400"
                      placeholder="e.g. 2401301059" />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">
                {isSignUp ? 'Email Address' : `${activeTab === 'student' ? 'Roll No. or ' : activeTab === 'teacher' ? 'Faculty ID or ' : ''}Email Address`}
              </label>
              <input type="text" name="email" value={credentials.email} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-emerald-400"
                placeholder={isSignUp ? "email@example.com" : "ID or Email"} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Password</label>
              <input type="password" name="password" value={credentials.password} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-emerald-400"
                placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#1A5F53] hover:bg-[#134d42] disabled:opacity-60 text-white font-bold py-4 rounded-lg shadow-lg transition-all transform active:scale-[0.98]">
              {loading ? '⏳ Please wait…' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-8 text-center">
            {activeTab !== 'admin' && (
              <button type="button" onClick={() => { setIsSignUp(!isSignUp); setStatus({ message: '', type: 'info' }); }}
                className="text-sm font-bold text-emerald-700 hover:underline">
                {isSignUp ? 'Already have an account? Sign In' : 'New here? Create a Student or Faculty account'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};