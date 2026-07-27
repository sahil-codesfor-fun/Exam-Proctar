import React, { useState, useEffect } from 'react';
import { X, Users, CheckSquare } from 'lucide-react';
import api from '../../../services/api';
const AssignExamModal = ({ exam, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  
  const [assignType, setAssignType] = useState('department');
  const [semester, setSemester] = useState('');
  const [batch, setBatch] = useState('');

  const handleAssign = async () => {
    setLoading(true);
    try {
      const payload = {
        assignType,
        semester: semester ? parseInt(semester) : undefined,
        batch: batch || undefined
      };

      await api.post(`/admin/exams/${exam.id}/assign`, payload);
      alert('Exam assigned successfully.');
      onSave();
    } catch (error) {
      alert("Failed to assign exam: " + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 ">
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900 ">Assign Exam</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 :bg-slate-700 text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 ">
            <p className="text-sm font-medium text-blue-800 ">
              Exam: <span className="font-bold">{exam.title}</span> ({exam.examCode})
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Scope</label>
            <select 
              value={assignType} 
              onChange={(e) => setAssignType(e.target.value)} 
              className="w-full px-3 py-2 border rounded-lg "
            >
              <option value="department">Entire Department</option>
              <option value="semester">By Semester</option>
              <option value="batch">By Batch</option>
            </select>
          </div>

          {assignType === 'semester' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <input 
                type="number" min="1" max="10"
                value={semester} 
                onChange={(e) => setSemester(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg " 
                placeholder="e.g. 4"
              />
            </div>
          )}

          {assignType === 'batch' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch (Year)</label>
              <input 
                type="text" 
                value={batch} 
                onChange={(e) => setBatch(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg " 
                placeholder="e.g. 2026"
              />
            </div>
          )}
        </div>

        {}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 :bg-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleAssign} disabled={loading} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70">
            {loading ? 'Assigning...' : <><CheckSquare size={18} /> Confirm Assignment</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AssignExamModal;
