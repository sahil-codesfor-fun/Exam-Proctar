import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// 🚀 THE FIX: Dynamic Value Engine
const getExamValue = (exam, sub) => {
  // 1. If the student already started, their submission holds the absolute truth!
  if (sub && sub.maxScore) return sub.maxScore;
  
  const isRandomized = exam.randomizeQuestions === true || exam.randomizeQuestions === 'true' || exam.randomizeQuestions === 1;
  
  // 2. If not randomized, just sum up the whole array
  if (!isRandomized) {
    return exam.totalMarks || exam.questions?.reduce((acc, q) => acc + (Number(q.points) || 10), 0) || 0;
  }

  const isTypeDistEnabled = exam.proctoringRules?.enableTypeDistribution || exam.proctoring?.enableTypeDistribution;
  const dist = exam.proctoringRules?.typeDistribution || exam.proctoring?.typeDistribution;

  // 3. If using Type Distribution (Berserk Mode!), calculate based on requested slice
  if (isTypeDistEnabled && dist) {
    let estimatedTotal = 0;
    ['mcq', 'coding', 'matching', 'subjective'].forEach(t => {
       const reqCount = parseInt(dist[t], 10) || 0;
       if (reqCount > 0) {
          // Find a question of this type to get its standard point value
          const sampleQ = exam.questions?.find(q => q.type === t);
          const pts = sampleQ ? (Number(sampleQ.points) || 10) : 10;
          estimatedTotal += (reqCount * pts);
       }
    });
    return estimatedTotal > 0 ? estimatedTotal : (exam.totalMarks || 0);
  }

  // 4. Fallback: If just grabbing N random questions unconditionally
  const serveLimit = parseInt(exam.questionsToServe, 10);
  if (!isNaN(serveLimit) && serveLimit > 0 && exam.questions?.length > 0) {
     const avgPoints = exam.questions.reduce((acc, q) => acc + (Number(q.points) || 10), 0) / exam.questions.length;
     return Math.round(serveLimit * avgPoints);
  }

  return exam.totalMarks || exam.questions?.reduce((acc, q) => acc + (Number(q.points) || 10), 0) || 0;
};

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('DASHBOARD');
  
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
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => setTab('DASHBOARD')} className={`flex-1 md:flex-none font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-2xl transition-all shadow-lg active:scale-95 ${tab === 'DASHBOARD' ? 'bg-gray-900 text-white shadow-gray-900/10' : 'bg-white text-gray-400 border border-gray-100'}`}>🏠 Dashboard</button>
          <button onClick={() => navigate('/compiler')} className="flex-1 md:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-2xl transition-all border border-emerald-100 active:scale-95">💻 Code Playground</button>
          <button onClick={() => setTab('PROFILE')} className={`flex-1 md:flex-none font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-2xl transition-all shadow-lg active:scale-95 ${tab === 'PROFILE' ? 'bg-emerald-600 text-white shadow-emerald-900/10' : 'bg-white text-gray-400 border border-gray-100'}`}>👤 Profile</button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-30">
          <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-widest">Querying Assessments...</p>
        </div>
      ) : tab === 'PROFILE' ? (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-500 relative">
              <div className="absolute -bottom-16 left-12">
                <div className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-2xl">
                  <div className="w-full h-full rounded-[1.5rem] bg-emerald-50 flex items-center justify-center text-4xl font-black text-emerald-600 border border-emerald-100">
                    {user?.name?.[0]}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-20 px-12 pb-12 space-y-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-1">{user?.name}</h3>
                  <p className="text-sm font-bold text-gray-400">{user?.email}</p>
                </div>
                <div className="flex flex-col items-end">
                   <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase border border-emerald-100 tracking-widest">Active Academic Core</span>
                   <p className="text-[9px] font-bold text-gray-300 mt-2 uppercase tracking-widest">System Status: Secure</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] border-b pb-2">Academic Identity</h4>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Student Node ID</span>
                      <span className="text-sm font-bold text-gray-700">{user?.studentId || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Department / Sector</span>
                      <span className="text-sm font-bold text-gray-700">Engineering & Tech</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] border-b pb-2">System Analytics</h4>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Assessment Success Rate</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {submissions.length > 0 ? Math.round((submissions.filter(s => s.percentage >= 33.33).length / submissions.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Total Logged Hours</span>
                      <span className="text-sm font-bold text-gray-700">14.28 Nodes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-10 pb-20">
            <section>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
                Assessment Feed
              </h3>
              
              {activeExams.length === 0 && upcomingExams.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-16 border border-gray-100 text-center">
                  <div className="text-4xl mb-4 opacity-20">📂</div>
                  <p className="text-xs font-black text-gray-300 uppercase tracking-widest italic">No deployments found in this sector.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeExams.map(exam => {
                    const examIdSafe = exam._id || exam.id;
                    const sub = getSub(examIdSafe);
                    const done = sub && ['submitted', 'auto_submitted'].includes(sub.status);
                    const inProgress = sub && sub.status === 'in_progress';
                    const isExpired = exam.status === 'ended' || (exam.endTime && new Date(exam.endTime).getTime() < nowTime);
                    
                    // 🚀 APPLIED FIX: Get dynamically calculated true value!
                    const calculatedValue = getExamValue(exam, sub);

                    return (
                      <div key={examIdSafe} className={`bg-white rounded-[2rem] border border-gray-100 p-8 hover:shadow-2xl hover:shadow-gray-200/50 transition-all group ${isExpired && !done ? 'opacity-60 grayscale' : ''}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{exam.title}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="bg-gray-100 text-gray-600 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                                {exam.course || 'General'}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                • Faculty ID: {exam.creator?.name || exam.faculty?.name || 'Academic Core'}
                              </span>
                            </div>
                          </div>

                          {done ? (
                            <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-emerald-100">✓ Completed</span>
                          ) : isExpired ? (
                            <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-gray-200">❌ Expired</span>
                          ) : inProgress ? (
                            <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-amber-100 animate-pulse">⏳ Session Open</span>
                          ) : (
                            <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-blue-100 italic">Ready to Initialize</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                          <div className="flex gap-6">
                            {exam.startTime && (
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-300 uppercase">Started At</span>
                                <span className="text-xs font-black text-gray-700">{new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-gray-300 uppercase">Window</span>
                              <span className="text-xs font-black text-gray-700">{exam.durationMinutes}m</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-gray-300 uppercase">Value</span>
                              <span className="text-xs font-black text-gray-700">{calculatedValue}pts</span>
                            </div>
                          </div>
                          
                          {!done && (
                            <button 
                              onClick={() => navigate(`/exam/live/${examIdSafe}`)}
                              disabled={isExpired}
                              className={`font-black text-[10px] uppercase tracking-widest py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95 ${isExpired ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none' : 'bg-[#1A5F53] hover:bg-[#134d42] text-white shadow-emerald-900/10'}`}
                            >
                              {isExpired ? 'Session Expired' : inProgress ? 'Resume Terminal' : 'Initialize Exam'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {upcomingExams.length > 0 && (
              <section className="animate-in slide-in-from-bottom-4 duration-500 mt-12">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
                  Upcoming Nodes
                </h4>
                
                <div className="space-y-4">
                  {upcomingExams.map(exam => {
                    const examIdSafe = exam._id || exam.id;
                    // 🚀 APPLIED FIX: Get dynamically calculated true value!
                    const calculatedValue = getExamValue(exam, null);

                    return (
                    <div key={examIdSafe} className="bg-white rounded-[2rem] border border-gray-100 p-8 hover:shadow-2xl hover:shadow-gray-200/50 transition-all group opacity-80">
                      
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{exam.title}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="bg-gray-100 text-gray-600 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                              {exam.course || 'General'}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                              • Faculty ID: {exam.creator?.name || exam.faculty?.name || 'Academic Core'}
                            </span>
                          </div>
                        </div>
                        <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-blue-100 italic shadow-sm">Scheduled Node</span>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div className="flex gap-6">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-300 uppercase">Starts On</span>
                            <span className="text-xs font-black text-blue-600">
                              {new Date(exam.startTime).toLocaleDateString()} at {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-300 uppercase">Window</span>
                            <span className="text-xs font-black text-gray-700">{exam.durationMinutes}m</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-300 uppercase">Value</span>
                            <span className="text-xs font-black text-gray-700">{calculatedValue}pts</span>
                          </div>
                        </div>
                        
                        <button disabled className="bg-gray-50 border border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest py-3 px-8 rounded-xl cursor-not-allowed shadow-inner flex items-center gap-2">
                          <span>🔒</span> Locked
                        </button>
                      </div>

                    </div>
                  )})}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4 space-y-10">
            <section>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Performance Vault</h3>
              <div className="space-y-4">
                {submissions.filter(s => ['submitted', 'auto_submitted'].includes(s.status)).length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-8 border border-gray-100 border-dashed text-center">
                    <p className="text-[10px] font-bold text-gray-300 uppercase italic">No records in vault.</p>
                  </div>
                ) : (
                  submissions.filter(s => ['submitted', 'auto_submitted'].includes(s.status)).map(sub => (
                    <div key={sub._id || sub.id} className="bg-white rounded-[2rem] border border-gray-100 p-6 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{sub.exam?.title || 'System Test'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400">{sub.totalScore}/{sub.maxScore}</span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase italic">{sub.percentage}%</span>
                        </div>
                      </div>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black border ${sub.percentage >= 33.33 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {sub.percentage >= 33.33 ? 'P' : 'F'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <div className="bg-[#1A5F53] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-900/20">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-6">Aggregate Stats</p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="text-3xl font-black">{submissions.length}</h5>
                  <p className="text-[9px] font-bold uppercase opacity-50">Total Attempts</p>
                </div>
                <div>
                  <h5 className="text-3xl font-black">{activeExams.length}</h5>
                  <p className="text-[9px] font-bold uppercase opacity-50">Live Ops</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};