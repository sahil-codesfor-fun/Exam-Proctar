import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; 
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); 
  const [isSignUp, setIsSignUp] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  
  const [credentials, setCredentials] = useState({ name: '', studentId: '', email: '', password: '', course: '', section: '', leetcodeUsername: '' });
  
  // Real-Time Verification State
  const [leetStatus, setLeetStatus] = useState('idle'); 
  const debounceTimer = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));

    if (name === 'leetcodeUsername') {
      if (value.trim() === '') {
        setLeetStatus('idle');
        return;
      }
      
      setLeetStatus('checking');
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      
      debounceTimer.current = setTimeout(async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/leetcode/verify/${value}`);
          if (res.data.success) {
            setLeetStatus('valid');
          } else {
            setLeetStatus('invalid');
          }
        } catch (error) {
          setLeetStatus('invalid');
        }
      }, 800);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp && credentials.leetcodeUsername && leetStatus === 'invalid') {
      setStatus({ message: '❌ Please provide a valid LeetCode username.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatus({ message: isSignUp ? 'Creating account…' : 'Authenticating…', type: 'info' });
    const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
    
    try {
      const payload = { ...credentials, role: 'student' };
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
              const routes = { student: '/student-dashboard', teacher: '/teacher-dashboard', faculty: '/teacher-dashboard', admin: '/admin' };
              navigate(routes[res.data.role] || '/');
            }
          }, 800);
        } else {
          setTimeout(() => { setIsSignUp(false); setStatus({ message: 'Now sign in with your new account.', type: 'info' }); }, 2000);
        }
      }
    } catch (err) {
      setStatus({ message: `❌ ${err.response?.data?.message || err.message || 'Cannot reach cloud server.'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white font-sans text-gray-900">
      <div className="hidden lg:flex lg:w-5/12 bg-gray-50 flex-col justify-between p-12 border-r border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🛡️</span>
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight hidden md:block">Nexus Proctor</span>
        </div>
        <div className="max-w-sm">
          <h2 className="text-4xl font-bold mb-4 leading-tight text-gray-900">Ensuring Academic Integrity.</h2>
          <p className="text-gray-500 text-lg leading-relaxed">Welcome to the Student Portal. {isSignUp ? 'Create your profile' : 'Log in'} to access your exams.</p>
        </div>
        <div className="text-sm text-gray-400 font-medium">© {new Date().getFullYear()} Nexus Systems. All rights reserved.</div>
      </div>

      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-10">
          <div className="mb-8 text-center flex flex-col items-center">
            <span className="text-5xl mb-4">🛡️</span>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">Nexus Proctor</h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{isSignUp ? 'Student Registration' : 'Student Login'}</h2>
            <p className={`text-sm font-medium transition-all ${status.type === 'error' ? 'text-red-500' : status.type === 'success' ? 'text-emerald-600' : 'text-gray-500'}`}>
              {status.message || `Welcome to the Student portal.`}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Full Name</label>
                  <input type="text" name="name" value={credentials.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-emerald-400" placeholder="Your full name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Roll No.</label>
                  <input type="text" name="studentId" value={credentials.studentId} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-emerald-400" placeholder="e.g. 2401301059" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Course</label>
                    <select name="course" value={credentials.course} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-emerald-400 cursor-pointer">
                      <option value="" disabled>Select</option>
                      <option value="B.Tech CSE">B.Tech CSE (Core)</option>
                      <option value="B.Tech CSE (AI/ML)">B.Tech CSE (AI/ML)</option>
                      <option value="B.Tech CSE (Data Science)">B.Tech CSE (Data Science)</option>
                      <option value="B.Tech CSE (Cyber Security)">B.Tech CSE (Cyber Security)</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Section</label>
                    <select name="section" value={credentials.section} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-emerald-400 cursor-pointer">
                      <option value="" disabled>Select</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">LeetCode Username</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="leetcodeUsername" 
                      value={credentials.leetcodeUsername} 
                      onChange={handleChange} 
                      required 
                      className={`w-full px-4 py-3 rounded-lg border bg-gray-50 focus:bg-white outline-none transition-all pr-12 ${leetStatus === 'valid' ? 'border-emerald-400' : leetStatus === 'invalid' ? 'border-red-400' : 'border-gray-200 focus:border-emerald-400'}`} 
                      placeholder="e.g. neetcode" 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {leetStatus === 'checking' && <Loader2 size={18} className="animate-spin text-blue-500" />}
                      {leetStatus === 'valid' && <CheckCircle2 size={18} className="text-emerald-500" />}
                      {leetStatus === 'invalid' && <XCircle size={18} className="text-red-500" />}
                    </div>
                  </div>
                  {leetStatus === 'invalid' && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase">User not found</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">{isSignUp ? 'Email Address' : 'Roll No. or Email Address'}</label>
              <input type="text" name="email" value={credentials.email} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-emerald-400" placeholder={isSignUp ? "email@example.com" : "ID or Email"} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Password</label>
              <input type="password" name="password" value={credentials.password} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-emerald-400" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading || (isSignUp && leetStatus === 'invalid')} className="w-full bg-[#1A5F53] hover:bg-[#134d42] disabled:opacity-60 text-white font-bold py-4 rounded-lg shadow-lg transition-all transform active:scale-[0.98]">
              {loading ? '⏳ Please wait…' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setStatus({ message: '', type: 'info' }); }} className="text-sm font-bold text-emerald-700 hover:underline">
              {isSignUp ? 'Already have an account? Sign In' : 'New here? Create a Student account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};