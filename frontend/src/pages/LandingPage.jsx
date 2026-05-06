import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const LandingPage = () => {
  const navigate = useNavigate();
  
  // UI State
  const [activeTab, setActiveTab] = useState('student');
  const [isSignUp, setIsSignUp] = useState(false); 
  const [status, setStatus] = useState({ message: '', type: 'info' });

  // --- FIXED FORM STATE ---
  const [credentials, setCredentials] = useState({
    name: '',
    studentId: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ message: isSignUp ? 'Creating account...' : 'Authenticating...', type: 'info' });

    // 1. Matches your updated auth.routes.js (/signup and /login)
    const endpoint = isSignUp ? '/auth/signup' : '/auth/login';

    try {
      // 2. We send everything + the role selected in the tabs
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
        ...credentials,
        role: activeTab 
      });

      // 3. We check for response.data.success (which I added to your Controller)
      if (response.data.success) {
        setStatus({ 
          message: isSignUp ? 'Registration successful! Please login.' : 'Login Successful!', 
          type: 'success' 
        });
        
        if (!isSignUp) {
          localStorage.setItem('token', response.data.token);
          // Save the role too so we know where they belong!
          localStorage.setItem('role', response.data.role);

          setTimeout(() => {
            // Use the role from the DATABASE to navigate, much safer!
            const userRole = response.data.role;
            navigate(userRole === 'student' ? '/student-dashboard' : '/teacher-dashboard');
          }, 1000);
        } else {
          // If they just registered, reset and go to login mode
          setTimeout(() => {
            setIsSignUp(false);
            setStatus({ message: 'Now please sign in with your new account.', type: 'info' });
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Auth Error:', error);
      // 4. This catches the "Action failed" and shows the REAL error from the backend
      const errorMsg = error.response?.data?.message || 'Backend unreachable, bro!';
      setStatus({ message: `❌ ${errorMsg}`, type: 'error' });
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white font-sans text-gray-900">
      
      {/* --- Left Column: Branding --- */}
      <div className="hidden lg:flex lg:w-5/12 bg-gray-50 flex-col justify-between p-12 border-r border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl bg-blue-100 text-blue-600 p-2.5 rounded-xl shadow-sm">🛡️</span>
          <h1 className="text-2xl font-extrabold tracking-tight">
            NEXUS <span className="text-blue-600">PROCTOR</span>
          </h1>
        </div>

        <div className="max-w-sm">
          <h2 className="text-4xl font-bold mb-4 leading-tight text-gray-900">
            Ensuring Academic Integrity.
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Welcome to your secure examination environment. {isSignUp ? 'Create your profile' : 'Log in'} to get started.
          </p>
        </div>

        <div className="text-sm text-gray-400 font-medium">
          &copy; {new Date().getFullYear()} Nexus Systems. All rights reserved.
        </div>
      </div>

      {/* --- Right Column: The Form --- */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-10">
          
          {/* TABS (Sets the Role) */}
          <div className="flex border-b border-gray-200 mb-8">
            <button 
              type="button"
              onClick={() => setActiveTab('student')}
              className={`pb-4 px-6 text-sm font-bold transition-all relative ${
                activeTab === 'student' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Student {isSignUp ? 'Reg' : 'Login'}
              {activeTab === 'student' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-700"></span>}
            </button>
            
            <button 
              type="button"
              onClick={() => setActiveTab('teacher')}
              className={`pb-4 px-6 text-sm font-bold transition-all relative ${
                activeTab === 'teacher' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Faculty {isSignUp ? 'Reg' : 'Login'}
              {activeTab === 'teacher' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-700"></span>}
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{isSignUp ? 'Create Account' : 'Login'}</h2>
            <p className={`text-sm font-bold transition-all ${status.type === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
              {status.message || `Welcome to the ${activeTab} portal.`}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Full Name</label>
                  <input type="text" name="name" value={credentials.name} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all" placeholder="Sahil Bhardwaj" required />
                </div>
                {activeTab === 'student' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Student ID</label>
                    <input type="text" name="studentId" value={credentials.studentId} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all" placeholder="GU-2026-001" required />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Email Address</label>
              <input type="email" name="email" value={credentials.email} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all" placeholder="test@university.edu" required />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1 uppercase tracking-wider">Password</label>
              <input type="password" name="password" value={credentials.password} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none transition-all" placeholder="••••••••" required />
            </div>

            <button type="submit" className="w-full bg-[#1A5F53] hover:bg-[#134d42] text-white font-bold py-4 rounded-lg shadow-lg transition-all transform active:scale-[0.98]">
              {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setStatus({ message: '', type: 'info' }); // Clear errors when switching
              }}
              className="text-sm font-bold text-emerald-700 hover:underline"
            >
              {isSignUp ? "Already have an account? Sign In" : "New here? Create a Student or Faculty account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};