import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ message: 'Authenticating…', type: 'info' });
    setLoading(true);

    try {
      const res = await api.post('/superadmin/login', { email, password });

      if (res.data.success) {
        setStatus({ message: '✅ Login successful!', type: 'success' });
        login({
          ...res.data.user,
          token: res.data.token,
          role: res.data.user.role
        });
        setTimeout(() => {
          navigate('/superadmin/dashboard');
        }, 800);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Cannot reach server.';
      setStatus({ message: `❌ ${msg}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white font-sans text-gray-900">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-gray-900 text-white flex-col justify-between p-12 border-r border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-4xl opacity-90">🛡️</span>
          <span className="text-3xl font-extrabold text-white tracking-tight hidden md:block opacity-90">Nexus Proctor</span>
        </div>
        <div className="max-w-sm">
          <h2 className="text-4xl font-bold mb-4 leading-tight text-white">System Override.</h2>
          <p className="text-gray-400 text-lg leading-relaxed">Super Admin Control Center. Highest-level clearance required.</p>
        </div>
        <div className="text-sm text-gray-500 font-medium">© {new Date().getFullYear()} Nexus Systems. All rights reserved.</div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-10">
          <div className="mb-8 text-center flex flex-col items-center">
            <span className="text-5xl mb-4">🛡️</span>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">Nexus Proctor</h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Login</h2>
            <p className={`text-sm font-medium transition-all ${
              status.type === 'error' ? 'text-red-500' 
              : status.type === 'success' ? 'text-emerald-600' 
              : 'text-gray-500'
            }`}>
              {status.message || 'Welcome to the Super Admin portal.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="sa-email" className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="sa-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@nexusproctor.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-blue-400"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="sa-password" className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="sa-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all focus:border-blue-400 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black disabled:opacity-60 text-white font-bold py-4 rounded-lg shadow-lg transition-all transform active:scale-[0.98]"
            >
              {loading ? '⏳ Processing…' : 'SYSTEM LOGIN'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              ← Back to Student Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
