import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, MoreVertical, Building2 } from 'lucide-react';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/superadmin/departments');
      setDepartments(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/superadmin/departments', formData);
      setShowModal(false);
      setFormData({ name: '', code: '' });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Departments</h2>
          <p className="text-gray-500 mt-1">Manage university departments and assignments.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Department
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search departments..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4">Department Name</th>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Head</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {departments.map(dept => (
              <tr key={dept.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-900">{dept.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{dept.code}</td>
                <td className="px-6 py-4 text-gray-600">{dept.head?.name || 'Unassigned'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    dept.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {dept.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-gray-900"><MoreVertical className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No departments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Add New Department</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input 
                  type="text" required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                <input 
                  type="text" required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
