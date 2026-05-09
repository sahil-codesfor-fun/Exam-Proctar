import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', department: '' });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });

  const departments = ['All', 'Computer Science', 'Information Technology', 'Mechanical Engineering', 'Business', 'Arts', 'General'];

  useEffect(() => {
    fetchFaculty();
  }, [search, deptFilter]);

  const fetchFaculty = async () => {
    try {
      const res = await api.get(`/admin/faculty?search=${search}&department=${deptFilter}`);
      setFaculty(res.data.data);
    } catch (err) {
      console.error("Failed to fetch faculty", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/admin/faculty', newFaculty);
      if (res.data.success) {
        setStatus({ message: res.data.message, type: 'success' });
        setNewFaculty({ name: '', email: '', department: '' });
        fetchFaculty();
        setTimeout(() => { setShowModal(false); setStatus({ message: '', type: '' }); }, 2000);
      }
    } catch (err) {
      setStatus({ message: err.response?.data?.message || 'Error creating faculty', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/admin/faculty/${id}/status`);
      fetchFaculty();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm("Are you sure you want to reset this faculty's password? A new credential email will be sent.")) return;
    try {
      const res = await api.post(`/admin/faculty/${id}/reset-password`);
      alert(res.data.message);
    } catch (err) {
      alert("Failed to reset password");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("CRITICAL ACTION: Delete this faculty account forever?")) return;
    try {
      await api.delete(`/admin/faculty/${id}`);
      fetchFaculty();
    } catch (err) {
      alert("Failed to delete faculty");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 font-sans">
      
      {/* Header Area */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-lg">🛡️</span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Admin <span className="text-emerald-600">Control Center</span></h1>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Faculty Management & Credential Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95">
            + Provision Faculty
          </button>
          <button onClick={() => { logout(); navigate('/'); }} className="bg-white border border-gray-200 text-gray-500 font-black text-[10px] uppercase tracking-widest py-3 px-6 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8">
        
        {/* Search & Filters */}
        <div className="bg-white rounded-[1.5rem] border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
             <input type="text" placeholder="Search by name, ID or email..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-bold text-gray-600">
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Faculty Table */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Faculty Identity</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Dept</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Activity</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest italic animate-pulse">Syncing Faculty Matrix...</td></tr>
              ) : faculty.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest italic">No faculty nodes found.</td></tr>
              ) : (
                faculty.map(f => (
                  <tr key={f._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm border border-emerald-100 uppercase">
                          {f.name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{f.name}</p>
                          <p className="text-[10px] font-bold text-gray-400">{f.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                       <p className="text-xs font-black text-gray-700 font-mono tracking-tighter">{f.facultyId}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">{f.department}</p>
                    </td>
                    <td className="p-6">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border ${f.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {f.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-6">
                       <p className="text-[10px] font-bold text-gray-500 uppercase">
                         {f.lastLogin ? new Date(f.lastLogin).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never Logged In'}
                       </p>
                    </td>
                    <td className="p-6 text-right space-x-2">
                       <button onClick={() => handleToggleStatus(f._id)} title={f.isActive ? 'Disable' : 'Enable'}
                        className={`p-2 rounded-lg border transition-all ${f.isActive ? 'border-amber-100 text-amber-600 hover:bg-amber-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}>
                         {f.isActive ? '🚫' : '✅'}
                       </button>
                       <button onClick={() => handleResetPassword(f._id)} title="Reset Password"
                        className="p-2 rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-50 transition-all">
                         🔑
                       </button>
                       <button onClick={() => handleDelete(f._id)} title="Delete Forever"
                        className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-all">
                         🗑️
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provisioning Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
           <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Provision Faculty</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Automatic ID & Credential Generation</p>
              
              <form className="space-y-6" onSubmit={handleCreateFaculty}>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input type="text" value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} required
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" 
                    placeholder="Enter full name..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Institutional Email</label>
                  <input type="email" value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} required
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" 
                    placeholder="faculty@geetauniversity.edu.in" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Department Sector</label>
                  <select value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value})} required
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-bold text-gray-600">
                    <option value="">Select Department...</option>
                    {departments.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {status.message && (
                  <p className={`text-xs font-bold text-center p-3 rounded-xl border ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {status.message}
                  </p>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} disabled={submitting}
                    className="flex-1 py-4 bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-4 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                    {submitting ? '⏳ Processing...' : 'Create Account'}
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
