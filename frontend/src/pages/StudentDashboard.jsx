import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { LayoutGrid, Code, User as UserIcon, LogOut, Terminal } from 'lucide-react';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loading: authLoading } = useAuth();
  
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [nowTime, setNowTime] = useState(Date.now());

  // Timer interval for real-time exam status updates
  useEffect(() => {
    const ticker = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  if (authLoading || (!user && localStorage.getItem('token'))) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Syncing Secure Node...</p>
        </div>
      </div>
    );
  }

  if (!user && !localStorage.getItem('token')) {
    navigate('/');
    return null;
  }

  // Your original Data Fetching & Socket Logic 🚀
  useEffect(() => {
    const fetchData = async () => {
      try {
        let fetchedExams = [];
        let fetchedSubs = [];

        try {
          const eRes = await api.get('/exams');
          fetchedExams = eRes.data?.data || [];
        } catch (e) {
          console.error("Exams fetch failed, falling back", e);
        }

        try {
          const sRes = await api.get('/submissions/my');
          fetchedSubs = sRes.data?.data || [];
        } catch (e) {
          console.error("Submissions fetch failed, falling back", e);
        }

        setExams(fetchedExams);
        setSubmissions(fetchedSubs);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const silentPoll = setInterval(fetchData, 15000);
    let socket;
    
    import('../services/socket').then(({ connectSocket }) => {
      socket = connectSocket();
      socket.emit('join_dashboard', { role: 'student' });
      socket.on('exam_published', (newExam) => {
        setExams(prev => {
          const exists = prev.find(e => (e._id || e.id) === (newExam._id || newExam.id));
          if (exists) return prev.map(e => (e._id || e.id) === (newExam._id || newExam.id) ? newExam : e);
          return [newExam, ...prev];
        });
      });

      socket.on('exam_deleted', (data) => {
        setExams(prev => prev.filter(e => (e._id || e.id) !== data.examId));
      });

      socket.on('exam_status_changed', () => {
        fetchData(); 
      });
    });

    return () => {
      clearInterval(silentPoll);
      if (socket) {
        socket.off('exam_published');
        socket.off('exam_deleted');
        socket.off('exam_status_changed');
      }
    };
  }, []);

  const getSub = (examId) => submissions.find(s => (s.exam?._id || s.exam?.id) === examId);

  const activeExams = exams.filter(e => {
    if (e.status === 'active' || e.status === 'ended') return true; 
    if (e.status === 'published') {
      if (!e.startTime) return true; 
      const startMs = new Date(e.startTime).getTime();
      return !isNaN(startMs) && startMs <= nowTime; 
    }
    return false;
  });

  const upcomingExams = exams.filter(e => {
    if (e.status === 'published' && e.startTime) {
      const startMs = new Date(e.startTime).getTime();
      return !isNaN(startMs) && startMs > nowTime;
    }
    return false;
  });

  return (
    <div className="flex h-[calc(100vh-80px)] -mt-4 md:-mt-8 -mx-4 md:-mx-8 bg-gray-50/50 overflow-hidden font-sans">
      
      {/* 🚀 THE NEW LEFT SIDEBAR NAVIGATION */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-6 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="space-y-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Main Menu</p>
          
          <nav className="space-y-2">
            <NavLink to="overview" className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${isActive ? 'bg-[#1A5F53] text-white shadow-lg shadow-emerald-900/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
              <LayoutGrid size={16} /> Dashboard
            </NavLink>

            <NavLink to="coding-progress" className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider  transition-all duration-200 ${isActive ? 'bg-[#1A5F53] text-white shadow-lg shadow-emerald-900/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Code size={16} /> Coding Progress
            </NavLink>

            <button onClick={() => navigate('/compiler')} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200">
              <Terminal size={16} /> Code Playground
            </button>

            <NavLink to="profile" className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-100 transition-all duration-200 ${isActive ? 'bg-[#1A5F53] text-white shadow-lg shadow-emerald-900/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
              <UserIcon size={16} /> Profile
            </NavLink>
          </nav>
        </div>

        <button onClick={() => { logout(); navigate('/'); }} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 font-bold text-xs uppercase tracking-widest transition-all duration-200 border border-red-100">
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* 🚀 THE MAIN CONTENT AREA */}
      <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 relative">
        <div className="max-w-6xl mx-auto w-full">
          
          {/* Your Original Welcome Banner */}
          <div className="bg-white rounded-[2.5rem] p-8 xl:p-10 border border-gray-100 shadow-xl shadow-gray-200/20 mb-8 flex justify-between items-center gap-6">
            <div>
              <h2 className="text-3xl xl:text-4xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                Welcome, {user?.name?.split(' ')[0]} <span className="animate-pulse">👋</span>
              </h2>
              <div className="flex items-center gap-3">
                 <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Node ID: {user?.studentId || 'EXTERNAL'}</p>
                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                 <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Live Status: Verified</span>
              </div>
            </div>
          </div>

          {/* Dynamic Content Outlet */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-30">
              <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[10px] font-black uppercase tracking-widest">Querying Assessments...</p>
            </div>
          ) : (
            <Outlet context={{ exams, submissions, activeExams, upcomingExams, getSub, nowTime, user }} />
          )}

        </div>
      </div>
    </div>
  );
};