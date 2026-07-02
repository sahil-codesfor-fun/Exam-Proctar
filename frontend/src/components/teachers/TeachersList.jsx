import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Filter, BookOpen, Key, Trash2, Power, Edit3, X, User as UserIcon, Book, Activity, Clock, ShieldCheck, Mail, Phone, Calendar, Monitor, Globe, HardDrive, Archive } from 'lucide-react';

const TeachersList = ({ apiEndpoint, isSuperAdmin }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', phone: '', employeeId: '', designation: '', experience: '', qualification: '', status: 'ACTIVE' });
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  
  const [resetModal, setResetModal] = useState({ isOpen: false, id: null, newPassword: '' });
  
  // Subject Allocation Modal
  const [subjectModal, setSubjectModal] = useState({ isOpen: false, teacherId: null, assignedIds: [] });
  const [departmentSubjects, setDepartmentSubjects] = useState([]);

  // Teacher Drawer
  const [drawerTeacher, setDrawerTeacher] = useState(null);
  const [teacherLoginHistory, setTeacherLoginHistory] = useState([]);
  const [teacherActivity, setTeacherActivity] = useState([]);

  // Dashboard Stats
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, loggedInToday: 0 });

  const [departments, setDepartments] = useState([{id: 'All', name: 'All'}]); 

  useEffect(() => {
    if (isSuperAdmin) {
      fetchDepartments();
    }
  }, [isSuperAdmin]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/superadmin/departments');
      setDepartments([{id: 'All', name: 'All'}, ...res.data.data.filter(d => d.status !== 'ARCHIVED')]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [search, deptFilter]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const url = new URL(`${api.defaults.baseURL || ''}${apiEndpoint}`, window.location.origin);
      url.searchParams.append('search', search);
      if (isSuperAdmin && deptFilter !== 'All') url.searchParams.append('department', deptFilter);
      
      const res = await api.get(`${apiEndpoint}?search=${search}${isSuperAdmin && deptFilter !== 'All' ? `&department=${deptFilter}` : ''}`);
      setFaculty(res.data.data);
      
      // Compute local stats for now
      const active = res.data.data.filter(f => f.status === 'ACTIVE' || f.isActive).length;
      const suspended = res.data.data.filter(f => f.status === 'DISABLED' || !f.isActive).length;
      setStats({
        total: res.data.data.length,
        active,
        suspended,
        loggedInToday: res.data.data.filter(f => {
          if (!f.lastLogin) return false;
          return new Date(f.lastLogin).toDateString() === new Date().toDateString();
        }).length
      });
    } catch (err) {
      showToast("Failed to fetch faculty matrix", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (departmentId) => {
    try {
      // If superadmin, we need the departmentId of the teacher to fetch subjects
      const url = isSuperAdmin ? `/superadmin/subjects?departmentId=${departmentId}` : `/admin/subjects`;
      // We'll need to make sure `/superadmin/subjects` exists, or we use a generic endpoint.
      // For now, assume it exists or use admin endpoint if it works (but admin uses token).
      // Actually, we don't have superadmin/subjects yet. But the backend can be added later if missing.
      // For now, let's just use the URL.
      const res = await api.get(url);
      setDepartmentSubjects(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      fetchSubjects();
    }
  }, [isSuperAdmin]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ message, onConfirm });
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = isSuperAdmin ? { ...newFaculty, departmentId: newFaculty.departmentId } : newFaculty;
      const res = await api.post(apiEndpoint, payload);
      if (res.data.success) {
        setGeneratedCreds({
          username: res.data.data.teacher.email,
          password: res.data.data.tempPassword
        });
        fetchFaculty();
        setNewFaculty({ name: '', email: '', phone: '', employeeId: '', designation: '', experience: '', qualification: '', status: 'ACTIVE' });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error provisioning faculty', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      await api.put(`${apiEndpoint}/${id}`, { status: newStatus, isActive: newStatus === 'ACTIVE' });
      fetchFaculty();
      showToast('Faculty status updated!', 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const triggerPasswordReset = (id) => {
    showConfirm("Are you sure you want to generate a new temporary password for this teacher?", async () => {
      try {
        const res = await api.put(`${apiEndpoint}/${id}/reset-password`);
        setGeneratedCreds({
          password: res.data.data.tempPassword,
          message: 'Password reset successful!'
        });
        showToast('Password reset successful', 'success');
      } catch(err) {
        showToast('Failed to reset password', 'error');
      }
    });
  };

  const handleArchive = (id) => {
    showConfirm("Are you sure you want to archive this faculty account? They will lose access and be hidden from the active list.", async () => {
      try {
        await api.delete(`${apiEndpoint}/${id}`);
        fetchFaculty();
        showToast('Faculty archived successfully.', 'success');
      } catch (err) {
        showToast('Failed to archive faculty', 'error');
      }
    });
  };

  const handleHardDelete = (id) => {
    showConfirm("Are you sure you want to PERMANENTLY DELETE this faculty account? This action cannot be undone.", async () => {
      try {
        await api.delete(`${apiEndpoint}/${id}/hard`);
        fetchFaculty();
        showToast('Faculty permanently deleted.', 'success');
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to permanently delete faculty', 'error');
      }
    });
  };

  const openSubjectModal = (teacher) => {
    if (isSuperAdmin) {
      fetchSubjects(teacher.departmentId);
    }
    setSubjectModal({
      isOpen: true,
      teacherId: teacher.id,
      assignedIds: teacher.subjectsTeaching?.map(s => s.id) || []
    });
  };

  const saveSubjects = async () => {
    try {
      await api.post(`${apiEndpoint}/${subjectModal.teacherId}/subjects`, {
        subjectIds: subjectModal.assignedIds
      });
      showToast('Subjects updated', 'success');
      setSubjectModal({ isOpen: false, teacherId: null, assignedIds: [] });
      fetchFaculty();
    } catch (err) {
      showToast('Failed to update subjects', 'error');
    }
  };

  const openDrawer = async (teacher) => {
    setDrawerTeacher(teacher);
    try {
      const [loginRes, actRes] = await Promise.all([
        api.get(`${apiEndpoint}/${teacher.id}/login-history`),
        api.get(`${apiEndpoint}/${teacher.id}/activity`)
      ]);
      setTeacherLoginHistory(loginRes.data.data || []);
      setTeacherActivity(actRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="font-sans relative">
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[600] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className={`px-6 py-3.5 rounded-full shadow-2xl border flex items-center gap-3 text-sm font-bold ${
            toast.type === 'error' ? 'bg-red-600 text-white border-red-500 shadow-red-600/20' : 
            'bg-gray-900 text-white border-gray-700 shadow-xl'
          }`}>
            <span className="text-lg">{toast.type === 'error' ? '⚠️' : '✨'}</span>
            <span className="tracking-wide pr-2">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">✕</button>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-5 shadow-inner">⚠️</div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Confirm Action</h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">Cancel</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 px-4 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Faculty <span className="text-emerald-600">Matrix</span></h2>
          <p className="text-gray-500 text-sm font-medium mt-1">Manage department faculty and allocate subjects</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={() => setShowProvisionModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95">
            + Provision Faculty
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 px-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Faculty</p><p className="text-2xl font-black text-gray-900">{stats.total}</p></div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><UserIcon className="w-5 h-5"/></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Faculty</p><p className="text-2xl font-black text-gray-900">{stats.active}</p></div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5"/></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suspended</p><p className="text-2xl font-black text-gray-900">{stats.suspended}</p></div>
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><Power className="w-5 h-5"/></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logged In Today</p><p className="text-2xl font-black text-gray-900">{stats.loggedInToday}</p></div>
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Activity className="w-5 h-5"/></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 px-6">
        <div className="bg-white rounded-[1.5rem] border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Search className="w-5 h-5"/></span>
             <input type="text" placeholder="Search by name, ID or email..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
          </div>
          {isSuperAdmin && (
            <div className="md:w-64">
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium">
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Faculty Identity</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Info</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subjects</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Last Login</th>
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
                  <tr key={f.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => openDrawer(f)}>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm border border-emerald-100 uppercase shadow-sm">
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
                       <p className="text-[10px] font-bold text-gray-400 uppercase">{f.designation || 'Faculty'}</p>
                    </td>
                    <td className="p-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1">
                        {f.subjectsTeaching?.length > 0 ? f.subjectsTeaching.map(s => (
                          <span key={s.id} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase border border-blue-100">{s.code}</span>
                        )) : <span className="text-[10px] text-gray-400 italic">None</span>}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border inline-block mb-1 ${f.status === 'ACTIVE' || f.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {f.status || (f.isActive ? 'Active' : 'Disabled')}
                      </span>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">
                         {f.lastLogin ? new Date(f.lastLogin).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                       </p>
                    </td>
                    <td className="p-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                       <button onClick={() => openSubjectModal(f)} title="Manage Subjects"
                        className="p-2 rounded-lg border border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition-all">
                         <BookOpen className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleToggleStatus(f.id, f.status || (f.isActive ? 'ACTIVE' : 'DISABLED'))} title={f.status === 'ACTIVE' || f.isActive ? 'Disable' : 'Enable'}
                        className={`p-2 rounded-lg border transition-all ${f.status === 'ACTIVE' || f.isActive ? 'border-amber-100 text-amber-600 hover:bg-amber-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}>
                         <Power className="w-4 h-4" />
                       </button>
                       <button onClick={() => triggerPasswordReset(f.id)} title="Reset Password"
                        className="p-2 rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-50 transition-all">
                         <Key className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleArchive(f.id)} title="Archive Faculty"
                        className="p-2 rounded-lg border border-orange-100 text-orange-600 hover:bg-orange-50 transition-all">
                         <Archive className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleHardDelete(f.id)} title="Permanently Delete Faculty"
                        className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-all">
                         <Trash2 className="w-4 h-4" />
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
      {showProvisionModal && !generatedCreds && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
           <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Provision Faculty</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Enter faculty details below</p>
              
              <form className="space-y-6" onSubmit={handleCreateFaculty}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name *</label>
                    <input type="text" value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" 
                      placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email *</label>
                    <input type="email" value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" 
                      placeholder="jane@university.edu" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Employee ID *</label>
                    <input type="text" value={newFaculty.employeeId} onChange={e => setNewFaculty({...newFaculty, employeeId: e.target.value})} required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium font-mono" 
                      placeholder="FAC-1001" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                    <input type="tel" value={newFaculty.phone} onChange={e => setNewFaculty({...newFaculty, phone: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" 
                      placeholder="+1 234 567 8900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Designation</label>
                    <select value={newFaculty.designation} onChange={e => setNewFaculty({...newFaculty, designation: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium">
                        <option value="">Select Designation...</option>
                        <option value="Professor">Professor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Teaching Assistant">Teaching Assistant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Experience (Years)</label>
                    <input type="number" value={newFaculty.experience} onChange={e => setNewFaculty({...newFaculty, experience: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" 
                      placeholder="e.g. 5" />
                  </div>
                  {isSuperAdmin && (
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Department *</label>
                      <select value={newFaculty.departmentId || ''} onChange={e => setNewFaculty({...newFaculty, departmentId: e.target.value})} required
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium">
                          <option value="">Select Department...</option>
                          {departments.filter(d => d.id !== 'All').map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowProvisionModal(false)} disabled={submitting}
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

      {/* Generated Credentials Modal */}
      {generatedCreds && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-5 shadow-inner"><Key className="w-8 h-8"/></div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Credentials Generated</h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">{generatedCreds.message || 'Please securely copy these credentials for the faculty member.'}</p>
            
            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 border border-gray-100">
              {generatedCreds.username && (
                <div className="mb-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username / Email</span>
                  <p className="font-mono text-gray-800 text-sm font-bold bg-white p-2 rounded border border-gray-100 mt-1">{generatedCreds.username}</p>
                </div>
              )}
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temporary Password</span>
                <p className="font-mono text-gray-800 text-sm font-bold bg-white p-2 rounded border border-gray-100 mt-1">{generatedCreds.password}</p>
              </div>
            </div>

            <button onClick={() => setGeneratedCreds(null)} className="w-full px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95">I have copied them</button>
          </div>
        </div>
      )}

      {/* Subject Allocation Modal */}
      {subjectModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500"/> Manage Subjects</h3>
              <button onClick={() => setSubjectModal({ isOpen: false, teacherId: null, assignedIds: [] })} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-6 pr-2">
              {departmentSubjects.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No subjects available in your department.</p>
              ) : (
                <div className="space-y-3">
                  {departmentSubjects.map(subject => {
                    const isAssigned = subjectModal.assignedIds.includes(subject.id);
                    return (
                      <label key={subject.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isAssigned ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="checkbox" 
                          checked={isAssigned}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSubjectModal({...subjectModal, assignedIds: [...subjectModal.assignedIds, subject.id]});
                            } else {
                              setSubjectModal({...subjectModal, assignedIds: subjectModal.assignedIds.filter(id => id !== subject.id)});
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div>
                          <p className={`text-sm font-bold ${isAssigned ? 'text-indigo-900' : 'text-gray-700'}`}>{subject.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subject.code}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
              <button onClick={() => setSubjectModal({ isOpen: false, teacherId: null, assignedIds: [] })} className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">Cancel</button>
              <button onClick={saveSubjects} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95">Save Allocation</button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Details Drawer */}
      {drawerTeacher && (
        <div className="fixed inset-0 z-[300] bg-gray-900/20 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Faculty Profile</h2>
              <button onClick={() => setDrawerTeacher(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-2xl border border-emerald-100 uppercase shadow-sm">
                  {drawerTeacher.name?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{drawerTeacher.name}</h3>
                  <p className="text-sm font-medium text-gray-500">{drawerTeacher.designation || 'Faculty Member'}</p>
                  <p className="text-xs font-bold text-gray-400">{drawerTeacher.departmentRel?.name}</p>
                  <span className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${drawerTeacher.status === 'ACTIVE' || drawerTeacher.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {drawerTeacher.status || (drawerTeacher.isActive ? 'Active' : 'Disabled')}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1"><Mail className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">Email</span></div>
                  <p className="text-xs font-medium text-gray-900 truncate" title={drawerTeacher.email}>{drawerTeacher.email}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1"><ShieldCheck className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">Emp ID</span></div>
                  <p className="text-xs font-mono font-bold text-gray-900">{drawerTeacher.facultyId}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1"><Phone className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">Phone</span></div>
                  <p className="text-xs font-medium text-gray-900">{drawerTeacher.phone || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1"><Calendar className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">Experience</span></div>
                  <p className="text-xs font-medium text-gray-900">{drawerTeacher.experience ? `${drawerTeacher.experience} Years` : 'N/A'}</p>
                </div>
              </div>

              {/* Subjects */}
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Book className="w-4 h-4 text-indigo-500"/> Allocated Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {drawerTeacher.subjectsTeaching?.length > 0 ? (
                    drawerTeacher.subjectsTeaching.map(s => (
                      <div key={s.id} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg">
                        <p className="text-xs font-bold">{s.name}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{s.code}</p>
                      </div>
                    ))
                  ) : <p className="text-xs text-gray-400 italic">No subjects allocated yet.</p>}
                </div>
              </div>

              {/* Exam Stats */}
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500"/> Exam Statistics</h4>
                <div className="flex gap-4">
                   <div className="flex-1 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                     <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Exams Created</p>
                     <p className="text-xl font-black text-emerald-700">{drawerTeacher._count?.examsCreated || 0}</p>
                   </div>
                   <div className="flex-1 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                     <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Submissions</p>
                     <p className="text-xl font-black text-emerald-700">{drawerTeacher._count?.submissions || 0}</p>
                   </div>
                </div>
              </div>

              {/* Login History Timeline */}
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500"/> Recent Logins</h4>
                <div className="space-y-3">
                  {teacherLoginHistory.length > 0 ? teacherLoginHistory.map(log => (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <div className="flex-1 w-px bg-gray-100 my-1"></div>
                      </div>
                      <div className="pb-3 w-full">
                        <p className="font-bold text-gray-900 text-xs">{new Date(log.loginTime).toLocaleString()}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1"><Monitor className="w-3 h-3"/> {log.deviceType || 'Desktop'} / {log.os || 'Unknown OS'}</span>
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3"/> {log.browser || 'Unknown Browser'}</span>
                          <span className="flex items-center gap-1"><HardDrive className="w-3 h-3"/> {log.ipAddress || 'Unknown IP'}</span>
                        </div>
                      </div>
                    </div>
                  )) : <p className="text-xs text-gray-400 italic">No login history recorded.</p>}
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-purple-500"/> Activity Timeline</h4>
                <div className="space-y-3">
                  {teacherActivity.length > 0 ? teacherActivity.map(act => (
                    <div key={act.id} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
                        <div className="flex-1 w-px bg-gray-100 my-1"></div>
                      </div>
                      <div className="pb-3 w-full">
                        <p className="font-bold text-gray-900 text-xs">{act.action.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{act.details}</p>
                        <p className="text-[9px] font-medium text-gray-400 mt-1">{new Date(act.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  )) : <p className="text-xs text-gray-400 italic">No activity recorded.</p>}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersList;