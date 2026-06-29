import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';

const TeacherOverview = () => {
  const navigate = useNavigate();
  const { exams, loading, setModal, openEditModal, toggleStatus, deleteExam } = useOutletContext();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <div className="flex justify-between items-end mb-10">
        <div>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 border-b border-emerald-100 inline-block pb-1">System Control</p>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">OVERVIEW</h2>
        </div>
        <button onClick={() => setModal(true)} className="bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black text-[10px] tracking-[0.1em] uppercase flex items-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">
          <div className="bg-white/20 p-1 rounded-md"><Plus size={14}/></div> Generate Exam
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[{ l: 'Total Exams', v: exams.length, c: 'text-gray-900', i: '📦' },
          { l: 'Live Exams', v: exams.filter(e => e.status === 'active' || e.status === 'published').length, c: 'text-emerald-600', i: '📡' },
          { l: 'Drafted Exams', v: exams.filter(e => e.status === 'draft').length, c: 'text-amber-500', i: '📝' },
          { l: 'Past Exams', v: exams.filter(e => e.status === 'ended').length, c: 'text-gray-400', i: '🏁' }
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">{s.i}</div>
            </div>
            <h3 className={`text-4xl font-black mb-2 ${s.c}`}>{s.v}</h3>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.15em] flex items-center gap-3">
            <div className="w-2 h-8 bg-[#4B775E] rounded-full"></div>
            Exams Registry
          </h4>
        </div>
        
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center opacity-50">
             <div className="w-8 h-8 border-4 border-gray-200 border-t-[#4B775E] rounded-full animate-spin mb-4"></div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Querying Databanks...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="p-20 text-center">
             <div className="text-5xl mb-4 opacity-20">📂</div>
             <p className="text-xs font-black text-gray-300 uppercase tracking-widest italic">No deployments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-gray-100"><tr className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">
                <th className="px-8 py-5">Exam Profile</th><th className="px-6 py-5">Course</th><th className="px-6 py-5">Questions</th><th className="px-6 py-5">Exam Status</th><th className="px-8 py-5 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {exams.map(exam => (
                  <tr key={exam._id} className="hover:bg-gray-50/80 cursor-pointer transition-colors group" onClick={() => navigate(`/teacher-dashboard/exams/${exam._id}`)}>
                    <td className="px-8 py-6">
                      <p className="font-black text-sm text-gray-900 group-hover:text-[#4B775E] transition-colors">{exam.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Window: {exam.durationMinutes}m</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-xs font-bold text-gray-500">{exam.course || '—'}</td>
                    <td className="px-6 py-6"><span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-[10px] font-black border border-gray-200">{exam.questions?.length || 0} Nodes</span></td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        {exam.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-md uppercase tracking-widest shadow-sm ${exam.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : exam.status === 'published' ? 'bg-blue-50 text-blue-600 border border-blue-100' : exam.status === 'draft' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>{exam.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                        {exam.status === 'draft' && (
                          <button onClick={() => openEditModal(exam)} className="text-[10px] bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-1">
                            <Edit size={12}/> Edit
                          </button>
                        )}
                        {exam.status === 'draft' && <button onClick={() => toggleStatus(exam, 'published')} className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm transition-all">Publish</button>}
                        {exam.status === 'published' && <button onClick={() => toggleStatus(exam, 'draft')} className="text-[10px] bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm transition-all">Revoke</button>}
                        {exam.status === 'active' && <button onClick={() => toggleStatus(exam, 'ended')} className="text-[10px] bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm transition-all">End</button>}
                        <button onClick={() => deleteExam(exam._id)} className="text-gray-300 hover:text-red-500 p-1.5 bg-white border border-transparent hover:border-red-100 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherOverview;
