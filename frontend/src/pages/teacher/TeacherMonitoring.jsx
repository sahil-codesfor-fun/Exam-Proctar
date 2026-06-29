import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Users } from 'lucide-react';

const TeacherMonitoring = () => {
  const navigate = useNavigate();
  const { exams, loading } = useOutletContext();
  
  const liveExams = exams.filter(e => e.status === 'active');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <div className="flex justify-between items-end mb-10">
        <div>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 border-b border-emerald-100 inline-block pb-1">System Control</p>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">MONITORING</h2>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.15em] flex items-center gap-3">
            <div className="w-2 h-8 bg-[#4B775E] rounded-full"></div>
            Live Proctoring Network
          </h4>
        </div>
        
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center opacity-50">
             <div className="w-8 h-8 border-4 border-gray-200 border-t-[#4B775E] rounded-full animate-spin mb-4"></div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning Network...</p>
          </div>
        ) : liveExams.length === 0 ? (
          <div className="p-20 text-center">
             <div className="text-5xl mb-4 opacity-20">📡</div>
             <p className="text-xs font-black text-gray-300 uppercase tracking-widest italic">No active exams to monitor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8">
            {liveExams.map(exam => (
              <div 
                key={exam._id} 
                onClick={() => navigate(`/teacher-dashboard/exams/${exam._id}`)}
                className="bg-gray-900 rounded-3xl p-6 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <h3 className="text-lg font-black text-white">{exam.title}</h3>
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold relative z-10">
                  <Users size={14} /> Enter Command Center
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherMonitoring;
