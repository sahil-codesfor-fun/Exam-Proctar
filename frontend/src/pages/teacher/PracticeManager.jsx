import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Code, BookOpen, Clock, Users, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { Routes, Route, useNavigate } from 'react-router-dom';
import PracticeSheetEditor from './PracticeSheetEditor';

const PracticeManagerList = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorModal, setEditorModal] = useState({ isOpen: false, id: null });
  const navigate = useNavigate();

  const fetchSheets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/practice');
      setSheets(res.data.sheets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this practice sheet? This action cannot be undone.")) {
      try {
        await api.delete(`/practice/${id}`);
        fetchSheets();
      } catch (err) {
        console.error("Failed to delete sheet", err);
        alert(err.response?.data?.message || "Failed to delete practice sheet");
      }
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      {editorModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-y-auto animate-in zoom-in-95 p-4">
             <PracticeSheetEditor 
                sheetId={editorModal.id} 
                onClose={() => setEditorModal({ isOpen: false, id: null })}
                onSave={() => fetchSheets()}
             />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <BookOpen className="text-emerald-500" />
            DSA Practice Manager
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Create, assign, and manage weekly coding practice sheets.</p>
        </div>
        <button 
          onClick={() => setEditorModal({ isOpen: true, id: null })}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={16} /> New Sheet
        </button>
      </div>

      {/* Sheets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400 font-bold uppercase tracking-widest">Loading...</div>
        ) : sheets.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-black text-gray-500">No Practice Sheets Yet</h3>
            <p className="text-sm font-medium text-gray-400 mt-1 mb-4">Start by creating a new weekly challenge or practice sheet.</p>
            <button onClick={() => setEditorModal({ isOpen: true, id: null })} className="bg-white border border-gray-200 hover:border-emerald-500 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 mx-auto">
              <Plus size={16} /> Create Sheet
            </button>
          </div>
        ) : (
          sheets.map((sheet) => (
            <div key={sheet.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all group flex flex-col">
              <div className="p-5 border-b border-gray-100 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${
                    sheet.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                    sheet.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {sheet.status}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setEditorModal({ isOpen: true, id: sheet.id })} className="text-gray-400 hover:text-emerald-500"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(sheet.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-1 line-clamp-1" title={sheet.title}>{sheet.title}</h3>
                <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-4 h-10">{sheet.description || 'No description provided.'}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <Code size={14} className="text-gray-400" />
                    <span>{sheet.questions?.length || 0} Questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <Clock size={14} className="text-gray-400" />
                    <span>{sheet.dueDate ? `Due ${new Date(sheet.dueDate).toLocaleDateString()}` : 'No Due Date'}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 flex justify-between items-center">
                <div className="flex -space-x-2">
                   {/* Placeholder for assigned students count */}
                   <div className="w-7 h-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-blue-700">
                     {sheet.assignments?.length || 0}
                   </div>
                   <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 self-center">Assigned</div>
                </div>
                <button onClick={() => navigate(`manage/${sheet.id}`)} className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 group-hover:text-emerald-700">
                  Manage <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PracticeManager = () => {
  return (
    <Routes>
      <Route path="/" element={<PracticeManagerList />} />
    </Routes>
  );
};

export default PracticeManager;
