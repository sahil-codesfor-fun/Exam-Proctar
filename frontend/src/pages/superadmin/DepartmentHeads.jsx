import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, MoreVertical, ShieldCheck, Key, Trash2 } from 'lucide-react';

const DepartmentHeads = () => {
  const [heads, setHeads] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', employeeId: '', departmentId: '' });

  const fetchData = async () => {
    try {
      const [headsRes, deptsRes] = await Promise.all([
        api.get('/superadmin/users?role=admin'),
        api.get('/superadmin/departments')
      ]);
      setHeads(headsRes.data.data);
      // Only show active departments that don't have a head assigned
      setDepartments(deptsRes.data.data.filter(d => !d.head && d.status !== 'ARCHIVED'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/superadmin/users', {
        ...formData,
        role: 'admin'
      });
      setGeneratedCreds({
        email: res.data.data.user.email,
        password: res.data.data.tempPassword
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to provision department head');
    }
  };

  const closeModals = () => {
    setShowModal(false);
    setGeneratedCreds(null);
    setFormData({ name: '', email: '', employeeId: '', departmentId: '' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/superadmin/users/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department head');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Department Heads</h2>
          <p className="text-gray-500 mt-1">Provision and manage department head accounts.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Provision Account
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Emp ID</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {heads.map(head => (
              <tr key={head.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-900">{head.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{head.email}</td>
                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{head.facultyId}</td>
                <td className="px-6 py-4 text-gray-600">{head.departmentRel?.name || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    head.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {head.status || 'ACTIVE'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(head.id, head.name)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Delete Department Head"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {heads.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No department heads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && !generatedCreds && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Provision Dept Head</h3>
              <p className="text-sm text-gray-500 mt-1">A secure password will be auto-generated.</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input 
                  type="text" required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Department</label>
                <select 
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}
                >
                  <option value="">Select a department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
                {departments.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No unassigned departments available. Create a department first.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={!formData.departmentId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">Generate Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal showing credentials */}
      {generatedCreds && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden text-center">
            <div className="p-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Provisioned!</h3>
              <p className="text-gray-600 mb-6">
                Please copy these credentials and provide them to the department head. They will be forced to change this password on their first login.
              </p>
              
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-left space-y-3 mb-6">
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Email / Username</span>
                  <div className="font-mono text-gray-900 bg-white p-2 border border-gray-200 rounded">{generatedCreds.email}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Temporary Password</span>
                  <div className="font-mono text-gray-900 bg-white p-2 border border-gray-200 rounded">{generatedCreds.password}</div>
                </div>
              </div>

              <button 
                onClick={closeModals} 
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                I have copied the credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentHeads;
