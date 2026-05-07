import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        api.get('/exams').then(r => setExams(r.data.data || [])),
        api.get('/submissions/my').then(r => setSubmissions(r.data.data || [])),
      ]).catch(() => {}).finally(() => setLoading(false));
    };
    
    fetchData();

    // Listen for real-time exam deployments
    let socket;
    import('../services/socket').then(({ connectSocket, disconnectSocket }) => {
      socket = connectSocket();
      socket.emit('join_dashboard', { role: 'student' });
      socket.on('exam_published', (newExam) => {
        setExams(prev => {
          const exists = prev.find(e => e._id === newExam._id);
          if (exists) return prev.map(e => e._id === newExam._id ? newExam : e);
          return [newExam, ...prev];
        });
      });
    });

    return () => {
      if (socket) socket.off('exam_published');
    };
  }, []);

  const getSub = (examId) => submissions.find(s => s.exam?._id === examId);

  // Categorize exams
  const now = new Date();
  const activeExams = exams.filter(e => e.status === 'active' || (e.status === 'published' && (!e.startTime || new Date(e.startTime) <= now) && (!e.endTime || new Date(e.endTime) >= now)));
  const upcomingExams = exams.filter(e => e.status === 'published' && e.startTime && new Date(e.startTime) > now);

  return (
    <div className="max-w-6xl mx-auto mt-6 px-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Welcome, {user?.name} 👋</h2>
          <p className="text-gray-500 font-medium">Student ID: {user?.studentId || 'N/A'} • <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-sm">Verified</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/compiler')} className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all text-sm">
            💻 Code Playground
          </button>
          <button onClick={() => { logout(); navigate('/'); }} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-6 rounded-xl transition-all text-sm border border-red-100">
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Exams */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">📝 Available Exams</h3>
            {activeExams.length === 0 && upcomingExams.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center text-gray-400 text-sm">No exams available.</div>
            ) : (
              <div className="space-y-4">
                
                {activeExams.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-emerald-500 uppercase mb-2">Live Now</h4>
                    <div className="space-y-3">
                      {activeExams.map(exam => {
                  const sub = getSub(exam._id);
                  const done = sub && ['submitted', 'auto_submitted'].includes(sub.status);
                  const inProgress = sub && sub.status === 'in_progress';
                  return (
                    <div key={exam._id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-gray-900">{exam.title}</h4>
                        {done ? <span className="bg-green-50 text-green-600 text-xs font-bold px-3 py-1 rounded-lg">✅ Done</span>
                         : inProgress ? <span className="bg-amber-50 text-amber-600 text-xs font-bold px-3 py-1 rounded-lg">⏳ In Progress</span>
                         : <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-lg">{exam.status}</span>}
                      </div>
                      {exam.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{exam.description}</p>}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>⏱ {exam.durationMinutes}m</span>
                          <span>📊 {exam.totalMarks} marks</span>
                          <span>❓ {exam.questions?.length || 0} Q</span>
                        </div>
                        {!done && exam.status === 'active' && (
                          <button onClick={() => navigate(`/exam/live/${exam._id}`)}
                            className="bg-[#1A5F53] hover:bg-[#134d42] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all">
                            {inProgress ? 'Resume' : 'Start Exam'} →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                    </div>
                  </div>
                )}

                {upcomingExams.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-xs font-black text-blue-500 uppercase mb-2">Upcoming</h4>
                    <div className="space-y-3">
                      {upcomingExams.map(exam => (
                        <div key={exam._id} className="bg-white rounded-2xl border border-gray-100 p-6 opacity-75">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-bold text-gray-900">{exam.title}</h4>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider">Scheduled</span>
                          </div>
                          {exam.startTime && <p className="text-blue-500 text-xs font-bold mb-3">Starts at: {new Date(exam.startTime).toLocaleString()}</p>}
                          <div className="flex gap-4 text-xs text-gray-400">
                            <span>⏱ {exam.durationMinutes}m</span>
                            <span>📊 {exam.totalMarks} marks</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* My Results */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">📊 My Results</h3>
            {submissions.filter(s => ['submitted', 'auto_submitted'].includes(s.status)).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center text-gray-400 text-sm">No completed exams yet.</div>
            ) : (
              <div className="space-y-3">
                {submissions.filter(s => ['submitted', 'auto_submitted'].includes(s.status)).map(sub => (
                  <div key={sub._id} className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{sub.exam?.title || 'Exam'}</p>
                      <p className="text-xs text-gray-400 mt-1">Score: {sub.totalScore} / {sub.maxScore}</p>
                      <span className={`text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded ${sub.status === 'auto_submitted' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                        {sub.status === 'auto_submitted' ? 'Auto-submitted' : 'Submitted'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-emerald-600">{sub.percentage}%</p>
                      <p className="text-xs text-gray-400">{sub.percentage >= (sub.exam?.passingMarks || 40) ? '✓ Pass' : '✗ Fail'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};