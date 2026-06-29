import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loading: authLoading } = useAuth();
  
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [nowTime, setNowTime] = useState(Date.now());

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

  const currentTab = location.pathname.includes('profile') ? 'PROFILE' : 'DASHBOARD';

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-gray-50/30 p-6 sm:p-10 animate-in fade-in duration-700">
      
      <div className="fixed bottom-6 left-6 z-50">
        <button 
          onClick={() => { logout(); navigate('/'); }} 
          className="flex items-center gap-2 bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 font-bold py-3 px-5 rounded-xl shadow-lg border border-gray-200 transition-all"
        >
          🚪 Logout
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 xl:p-10 border border-gray-100 shadow-xl shadow-gray-200/20 mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
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
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <NavLink to="/student-dashboard/overview" className={({ isActive }) => `text-center flex-1 md:flex-none font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-2xl transition-all shadow-lg active:scale-95 ${isActive ? 'bg-gray-900 text-white shadow-gray-900/10' : 'bg-white text-gray-400 border border-gray-100'}`}>🏠 Dashboard</NavLink>
          <button onClick={() => navigate('/compiler')} className="text-center flex-1 md:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-2xl transition-all border border-emerald-100 active:scale-95">💻 Code Playground</button>
          <NavLink to="/student-dashboard/profile" className={({ isActive }) => `text-center flex-1 md:flex-none font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-2xl transition-all shadow-lg active:scale-95 ${isActive ? 'bg-emerald-600 text-white shadow-emerald-900/10' : 'bg-white text-gray-400 border border-gray-100'}`}>👤 Profile</NavLink>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-30">
          <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-widest">Querying Assessments...</p>
        </div>
      ) : (
        <Outlet context={{ exams, submissions, activeExams, upcomingExams, getSub, nowTime, user }} />
      )}
    </div>
  );
};