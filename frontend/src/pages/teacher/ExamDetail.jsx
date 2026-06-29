import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Edit, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import HistoricalSubmissions from '../../components/results/HistoricalSubmissions';
import api from '../../services/api';

const ExamDetail = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { exams, subs, loadSubs, toggleStatus, deleteExam, showConfirm, openEditModal } = useOutletContext();
  
  const [liveStudents, setLiveStudents] = useState([]);
  
  // Find the exam from the context or fetch it if not found
  const exam = exams.find(e => e._id === examId);

  useEffect(() => {
    if (examId && loadSubs) {
      loadSubs(examId);
    }
  }, [examId, loadSubs]);

  useEffect(() => {
    if (!exam) return;
    let socket;
    import('../../services/socket').then(({ connectSocket }) => {
      socket = connectSocket();
      socket.emit('join_monitoring', { examId: exam._id });

      socket.on('active_students', (data) => {
        const uniqueStudents = Array.from(new Map(data.students.map(s => [s.studentId, s])).values());
        setLiveStudents(uniqueStudents);
      });

      socket.on('student_joined', (data) => {
        setLiveStudents(p => {
          const filtered = p.filter(s => s.studentId !== data.studentId);
          return [...filtered, data];
        });
      });

      socket.on('student_left', (data) => {
        setLiveStudents(p => p.filter(s => s.studentId !== data.studentId));
      });

      socket.on('violation_alert', (data) => {
        setLiveStudents(p => p.map(s => s.studentId === data.studentId ? { ...s, violations: (s.violations || 0) + 1 } : s));
      });
    });

    return () => {
      if (socket) {
        socket.off('active_students');
        socket.off('student_joined');
        socket.off('student_left');
        socket.off('violation_alert');
      }
    };
  }, [exam]);

  const forceSubmit = (studentId) => {
    showConfirm('Are you sure you want to forcibly submit and lock this student out of the exam?', () => {
      import('../../services/socket').then(({ getSocket }) => {
        const socket = getSocket();
        if (socket) {
          socket.emit('force_submit_student', { examId: exam._id, studentId, reason: 'Manual termination by proctor' });
        }
      });
    });
  };

  if (!exam) {
    return <div className="p-10 text-center">Loading Exam Details...</div>;
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <button onClick={() => navigate('/teacher-dashboard/overview')} className="text-sm font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">← Back to Registry</button>
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-2xl border shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
            {exam.title}
            {exam.status === 'active' && <span className="bg-red-500 text-white text-[10px] uppercase px-3 py-1 rounded-full animate-pulse shadow-sm tracking-widest">LIVE NOW</span>}
            {exam.status === 'published' && <span className="bg-blue-50 text-blue-600 text-[10px] uppercase px-3 py-1 rounded-full border border-blue-100 tracking-widest shadow-sm">PUBLISHED</span>}
          </h2>
          <div className="flex items-center gap-3 mt-2 text-sm">
             <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-bold text-xs">{exam.course || 'General Sector'}</span>
             <span className="text-gray-400 font-medium">• {exam.durationMinutes}min window • {exam.questions?.length || 0} total nodes • {exam.randomizeQuestions ? `🎲 Random` : 'Static Layout'}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {exam.status === 'draft' && (
             <button onClick={() => openEditModal(exam)} className="flex items-center gap-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
               <Edit size={14}/> Edit Details
             </button>
          )}
          {exam.status === 'draft' && <button onClick={() => toggleStatus(exam, 'published')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20">Publish Network</button>}
          {exam.status === 'published' && <button onClick={() => toggleStatus(exam, 'draft')} className="bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">Revoke</button>}
          {(exam.status === 'published' || exam.status === 'draft') && <button onClick={() => toggleStatus(exam, 'active')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20">FORCE START NOW</button>}
          {exam.status === 'active' && <button onClick={() => toggleStatus(exam, 'ended')} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 animate-pulse">TERMINATE SESSION</button>}
          <button onClick={() => { deleteExam(exam._id); navigate('/teacher-dashboard/overview'); }} className="bg-white text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"><Trash2 size={14}/> Dump</button>
        </div>
      </div>

      {exam.status === 'active' && (
        <div className="bg-gray-900 text-white rounded-3xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
          
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-8 flex items-center gap-3 relative z-10">
            <Users size={16}/> Live Proctoring Matrix ({liveStudents.length} Connected)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            {liveStudents.length === 0 ? <p className="text-xs text-gray-600 italic font-medium">Awaiting incoming student nodes...</p> : liveStudents.map(s => (
              <div key={s.studentId} className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700 flex justify-between items-center group hover:bg-gray-800 transition-all">
                <div className="flex items-center gap-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
                  <div>
                    <p className="font-bold text-sm text-gray-100">{s.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono tracking-tighter">{s.studentId}</p>
                  </div>
                </div>
                <div className="text-center group-hover:hidden">
                   <p className="text-[9px] text-gray-400 uppercase tracking-wider font-black">Infractions</p>
                   <span className={`text-xl font-black ${s.violations > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{s.violations || 0}</span>
                </div>
                <button onClick={() => forceSubmit(s.studentId)} className="hidden group-hover:block text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white px-3 py-2 rounded-lg transition-all uppercase tracking-widest">
                  Force Kill
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <HistoricalSubmissions exam={exam} />
    </div>
  );
};

export default ExamDetail;
