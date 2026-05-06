import React, { useState } from 'react';
import { 
  LayoutGrid, FileText, ShieldAlert, ClipboardList, 
  Trophy, BarChart3, MessageSquare, Settings, CheckCircle2,
  Plus, Activity, LogOut, X, Calendar, Clock, Upload, Trash2, ChevronDown, Repeat
} from 'lucide-react';

export const TeacherDashboard = () => {
  // State for Navigation and Modal
  const [activeTab, setActiveTab] = useState('LIVE MONITORING');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for Deployment
  const [testData, setTestData] = useState({
    examTitle: '',
    course: '',
    facultyId: '',
    duration: '60',
    description: '',
    questions: [{ id: 1, type: 'MCQ', text: '', options: ['', '', '', ''], correct: 0 }],
    uploadedFile: null
  });

  // --- Logic Helpers ---
  const addQuestion = () => {
    setTestData({
      ...testData,
      questions: [...testData.questions, { id: Date.now(), type: 'MCQ', text: '', options: ['', '', '', ''], correct: 0 }]
    });
  };

  const removeQuestion = (id) => {
    setTestData({
      ...testData,
      questions: testData.questions.filter(q => q.id !== id)
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setTestData({ ...testData, uploadedFile: file });
  };

  const removeFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setTestData({ ...testData, uploadedFile: null });
  };

  // --- Sub-Component: The Deployment Modal ---
  const CreateTestModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-10 py-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Deploy New Assessment</h2>
          <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form className="p-10 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Section: Basic Info (From image_694292.png) */}
          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Exam Title *</label>
              <input type="text" placeholder="e.g. Advanced Computer Architecture Final" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Module / Course *</label>
                <input type="text" placeholder="B.Tech SEM VI" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Subject Faculty ID *</label>
                <input type="text" placeholder="e.g. FAC_DR_SHARMA" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Duration (Minutes) *</label>
                <input type="number" placeholder="60" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">HOD ID (Auto-Assigned)</label>
                <input type="text" disabled value="HOD_Computer_Science" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-400 italic cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Section: Schedule */}
          <div className="bg-emerald-50/30 p-8 rounded-[2rem] border border-emerald-100/50 space-y-6">
            <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} /> Schedule Examination
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <input type="date" className="px-6 py-3 bg-white border border-emerald-100 rounded-xl font-bold text-gray-600 outline-none" />
              <input type="time" className="px-6 py-3 bg-white border border-emerald-100 rounded-xl font-bold text-gray-600 outline-none" />
            </div>
          </div>

          {/* Section: Dynamic Question Bank */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question Bank Builder</label>
              <button type="button" onClick={addQuestion} className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 hover:text-emerald-700">
                <Plus size={14} /> Add Question
              </button>
            </div>

            {testData.questions.map((q, qIndex) => (
              <div key={q.id} className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 space-y-6 relative animate-in slide-in-from-bottom-4 duration-300">
                
                {/* UPGRADED CONTROL BAR (image_68d53b.png style) */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="bg-white px-5 py-2 rounded-xl text-xs font-black text-gray-500 border border-gray-100 shadow-sm uppercase tracking-tighter">
                      Q#{qIndex + 1}
                    </span>
                    <div className="relative">
                      <select 
                        value={q.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setTestData({
                            ...testData,
                            questions: testData.questions.map(item => item.id === q.id ? { ...item, type: newType } : item)
                          });
                        }}
                        className="appearance-none pl-6 pr-12 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all cursor-pointer outline-none shadow-sm"
                      >
                        <option value="MCQ">TYPE: MCQ</option>
                        <option value="OTHER">TYPE: SUBJECTIVE</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600" />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeQuestion(q.id)} className="p-2.5 bg-white text-gray-300 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-100">
                    <Trash2 size={18} />
                  </button>
                </div>

                <input 
                  type="text" 
                  placeholder={q.type === 'MCQ' ? "Enter MCQ Question Statement..." : "Enter Subjective Question..."} 
                  className="w-full bg-transparent border-b border-gray-200 py-2 font-bold text-gray-800 outline-none focus:border-emerald-500 transition-colors"
                />
                
                {q.type === 'MCQ' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
                    {[0,1,2,3].map((oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group">
                        <input type="radio" name={`correct-${q.id}`} className="accent-emerald-500 h-4 w-4" />
                        <input type="text" placeholder={`Option ${oIndex + 1}`} className="w-full text-xs font-bold text-gray-600 outline-none" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Section: File Upload with Removal */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Bulk Upload Question File</label>
            <div className="relative">
              <label className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${testData.uploadedFile ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100 hover:border-emerald-200'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${testData.uploadedFile ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-emerald-500 shadow-sm'}`}>
                  <Upload size={20} />
                </div>
                <p className="text-[11px] font-black text-gray-900 uppercase">
                  {testData.uploadedFile ? testData.uploadedFile.name : 'Select .DOCX or .PDF'}
                </p>
                <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
              </label>

              {testData.uploadedFile && (
                <button onClick={removeFile} className="absolute top-4 right-4 p-2.5 bg-white text-red-500 rounded-full shadow-lg hover:bg-red-50 transition-all border border-red-100">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-10 py-8 bg-gray-50/30 border-t border-gray-50 flex justify-end gap-4">
          <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400">Cancel</button>
          <button className="px-10 py-4 bg-[#4B775E] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/10 hover:scale-105 transition-all">Confirm Deployment</button>
        </div>
      </div>
    </div>
  );

  // --- Main Layout ---
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {isModalOpen && <CreateTestModal />}
      
      {/* Sidebar (image_69a82b.png) */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-12 px-2">
          <CheckCircle2 className="text-emerald-600" size={30} />
          <h1 className="text-2xl font-black tracking-tighter text-gray-900 uppercase">Trainer<span className="text-gray-300">_</span>Core</h1>
        </div>

        <nav className="flex-1 space-y-1.5">
          {[
            { icon: <LayoutGrid size={18} />, label: 'LIVE MONITORING' },
            { icon: <FileText size={18} />, label: 'ASSESSMENT MANAGER' },
            { icon: <ShieldAlert size={18} />, label: 'ESCALATION VAULT' },
            { icon: <ClipboardList size={18} />, label: 'ACADEMIC RECORDS' },
            { icon: <Trophy size={18} />, label: 'LEADERBOARD' },
            { icon: <BarChart3 size={18} />, label: 'BATCH ANALYTICS' },
            { icon: <MessageSquare size={18} />, label: 'SUPPORT DESK' },
            { icon: <Settings size={18} />, label: 'GLOBAL SETTINGS' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-[11px] tracking-wide transition-all ${
                activeTab === item.label 
                  ? 'bg-[#4B775E] text-white shadow-xl shadow-emerald-900/20' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-50">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-sm border border-emerald-100">A</div>
            <div>
              <p className="text-xs font-black text-gray-900 uppercase">Admin Test User</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Academic Head</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 uppercase hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut size={14} /> Return to Gateway
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto p-12">
        {activeTab === 'LIVE MONITORING' ? (
          <div className="animate-in fade-in duration-500">
            {/* Header Row (image_694993.png) */}
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-emerald-600 rounded-full"></div>
                <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Overview</h2>
                <Activity size={24} className="text-gray-300 ml-2" />
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System_Status:</span>
                  <span className="text-xs font-black text-emerald-500 uppercase">Operational</span>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#4B775E] hover:bg-[#3d614d] text-white px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-900/10 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus size={20} /> Deploy New Test
                </button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-8 mb-10">
              {[
                { label: 'Total Exams', value: '2', color: 'text-emerald-600' },
                { label: 'Active Sessions', value: '0', color: 'text-blue-500' },
                { label: 'Flagged Anomalies', value: '0', color: 'text-red-500' },
                { label: 'Total Questions', value: '3', color: 'text-emerald-600' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{stat.label}</p>
                  <h3 className={`text-6xl font-black ${stat.color}`}>{stat.value}</h3>
                </div>
              ))}
            </div>

            {/* Node Grid Table */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-Time Examination Node Grid</h4>
                <Activity size={20} className="text-emerald-500" />
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50/30">
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-10 py-6">Assessment</th>
                    <th className="px-10 py-6">Course</th>
                    <th className="px-10 py-6">Schedule</th>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-10 py-6 text-center">Questions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr>
                    <td className="px-10 py-8">
                      <p className="font-black text-gray-900 text-sm">Advanced Computer Architecture</p>
                      <span className="text-[10px] text-gray-400 font-mono">EXAM_001</span>
                    </td>
                    <td className="px-10 py-8 text-xs font-black text-gray-500">C.S.E - Semester VI</td>
                    <td className="px-10 py-8 text-[11px] font-bold text-gray-400">15 Apr 2026, 11:49 am</td>
                    <td className="px-10 py-8">
                      <span className="bg-red-50 text-red-500 px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest">ENDED</span>
                    </td>
                    <td className="px-10 py-8 text-center font-black text-gray-900">2</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6">
              <FileText size={48} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{activeTab}</h2>
            <p className="text-gray-400 font-bold max-w-sm mt-3 uppercase text-[10px] tracking-widest leading-loose">Access Denied • Module under maintenance by security protocols</p>
          </div>
        )}
      </div>
    </div>
  );
};