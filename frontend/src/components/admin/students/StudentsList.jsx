import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Search, Key, Trash2, Power, X, User as UserIcon, Activity, Clock, ShieldCheck, Mail, Phone, Calendar, Monitor, Globe, HardDrive, Archive, GraduationCap, BookOpen } from 'lucide-react';

const StudentsList = ({ apiEndpoint }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [toastState, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  // Student Drawer
  const [drawerStudent, setDrawerStudent] = useState(null);
  const [studentLoginHistory, setStudentLoginHistory] = useState([]);
  const [studentActivity, setStudentActivity] = useState([]);

  // Dashboard Stats
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, loggedInToday: 0 });

  // Generated Creds (for password reset)
  const [generatedCreds, setGeneratedCreds] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${apiEndpoint}?search=${search}`);
      setStudents(res.data.data);

      // Compute local stats
      const active = res.data.data.filter(s => s.status === 'ACTIVE' || s.isActive).length;
      const suspended = res.data.data.filter(s => s.status === 'DISABLED' || !s.isActive).length;
      setStats({
        total: res.data.data.length,
        active,
        suspended,
        loggedInToday: res.data.data.filter(s => {
          if (!s.lastLogin) return false;
          return new Date(s.lastLogin).toDateString() === new Date().toDateString();
        }).length
      });
    } catch (err) {
      showToast("Failed to fetch student data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ message, onConfirm });
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      await api.put(`${apiEndpoint}/${id}`, { status: newStatus, isActive: newStatus === 'ACTIVE' });
      fetchStudents();
      showToast('Student status updated!', 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const triggerPasswordReset = (id) => {
    showConfirm("Are you sure you want to generate a new temporary password for this student?", async () => {
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
    showConfirm("Are you sure you want to archive this student account? They will lose access and be hidden from the active list.", async () => {
      try {
        await api.delete(`${apiEndpoint}/${id}`);
        fetchStudents();
        showToast('Student archived successfully.', 'success');
      } catch (err) {
        showToast('Failed to archive student', 'error');
      }
    });
  };

  const handleHardDelete = (id) => {
    showConfirm("Are you sure you want to PERMANENTLY DELETE this student account? This action cannot be undone.", async () => {
      try {
        await api.delete(`${apiEndpoint}/${id}/hard`);
        fetchStudents();
        showToast('Student permanently deleted.', 'success');
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to permanently delete student', 'error');
      }
    });
  };

  const openDrawer = async (student) => {
    setDrawerStudent(student);
    try {
      const [loginRes, actRes] = await Promise.all([
        api.get(`${apiEndpoint}/${student.id}/login-history`),
        api.get(`${apiEndpoint}/${student.id}/activity`)
      ]);
      setStudentLoginHistory(loginRes.data.data || []);
      setStudentActivity(actRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="font-sans relative">
      {toastState && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[600] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className={`px-6 py-3.5 rounded-full shadow-2xl border flex items-center gap-3 text-sm font-bold ${
            toastState.type === 'error' ? 'bg-red-600 text-white border-red-500 shadow-red-600/20' : 
            'bg-gray-900 text-white border-gray-700 shadow-xl'
          }`}>
            <span className="text-lg">{toastState.type === 'error' ? '⚠️' : '✨'}</span>
            <span className="tracking-wide pr-2">{toastState.message}</span>
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
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Student <span className="text-blue-600">Directory</span></h2>
          <p className="text-gray-500 text-sm font-medium mt-1">View and manage department students</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 px-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Students</p><p className="text-2xl font-black text-gray-900">{stats.total}</p></div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><UserIcon className="w-5 h-5"/></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Students</p><p className="text-2xl font-black text-gray-900">{stats.active}</p></div>
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
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-400 transition-all text-sm font-medium" />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Identity</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Info</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam Stats</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Last Login</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest italic animate-pulse">Syncing Student Directory...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest italic">No students found.</td></tr>
              ) : (
                students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => openDrawer(s)}>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-100 uppercase shadow-sm">
                          {s.name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{s.name}</p>
                          <p className="text-[10px] font-bold text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                       <p className="text-xs font-black text-gray-700 font-mono tracking-tighter">{s.studentId || 'N/A'}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">{s.course || 'N/A'}{s.section ? ` — Sec ${s.section}` : ''}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex gap-3">
                        <div className="text-center">
                          <p className="text-sm font-black text-gray-900">{s._count?.examAssignments || 0}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Exams</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-gray-900">{s._count?.submissions || 0}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Submissions</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border inline-block mb-1 ${s.status === 'ACTIVE' || s.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {s.status || (s.isActive ? 'Active' : 'Disabled')}
                      </span>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">
                         {s.lastLogin ? new Date(s.lastLogin).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                       </p>
                    </td>
                    <td className="p-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                       <button onClick={() => handleToggleStatus(s.id, s.status || (s.isActive ? 'ACTIVE' : 'DISABLED'))} title={s.status === 'ACTIVE' || s.isActive ? 'Disable' : 'Enable'}
                        className={`p-2 rounded-lg border transition-all ${s.status === 'ACTIVE' || s.isActive ? 'border-amber-100 text-amber-600 hover:bg-amber-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}>
                         <Power className="w-4 h-4" />
                       </button>
                       <button onClick={() => triggerPasswordReset(s.id)} title="Reset Password"
                        className="p-2 rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-50 transition-all">
                         <Key className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleArchive(s.id)} title="Archive Student"
                        className="p-2 rounded-lg border border-orange-100 text-orange-600 hover:bg-orange-50 transition-all">
                         <Archive className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleHardDelete(s.id)} title="Permanently Delete Student"
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

      {/* Generated Credentials Modal */}
      {generatedCreds && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-5 shadow-inner"><Key className="w-8 h-8"/></div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Credentials Generated</h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">{generatedCreds.message || 'Please securely copy these credentials for the student.'}</p>
            
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

      {/* Student Details Drawer */}
      {drawerStudent && (
        <div className="fixed inset-0 z-[300] bg-gray-900/20 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Student Profile</h2>
              <button onClick={() => setDrawerStudent(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-2xl border border-blue-100 uppercase shadow-sm">
                  {drawerStudent.name?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{drawerStudent.name}</h3>
                  <p className="text-sm font-medium text-gray-500">{drawerStudent.course || 'Student'}{drawerStudent.section ? ` — Section ${drawerStudent.section}` : ''}</p>
                  <p className="text-xs font-bold text-gray-400">{drawerStudent.departmentRel?.name}</p>
                  <span className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${drawerStudent.status === 'ACTIVE' || drawerStudent.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {drawerStudent.status || (drawerStudent.isActive ? 'Active' : 'Disabled')}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1"><Mail className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">Email</span></div>
                  <p className="text-xs font-medium text-gray-900 truncate" title={drawerStudent.email}>{drawerStudent.email}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1"><ShieldCheck className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">Student ID</span></div>
                  <p className="text-xs font-mono font-bold text-gray-900">{drawerStudent.studentId || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1"><Phone className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">Phone</span></div>
                  <p className="text-xs font-medium text-gray-900">{drawerStudent.phone || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1"><GraduationCap className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">Course</span></div>
                  <p className="text-xs font-medium text-gray-900">{drawerStudent.course || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1"><BookOpen className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">Section</span></div>
                  <p className="text-xs font-medium text-gray-900">{drawerStudent.section || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1"><Calendar className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">Joined</span></div>
                  <p className="text-xs font-medium text-gray-900">{drawerStudent.createdAt ? new Date(drawerStudent.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              {/* Exam Stats */}
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500"/> Exam Statistics</h4>
                <div className="flex gap-4">
                   <div className="flex-1 bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-center">
                     <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Exams Assigned</p>
                     <p className="text-xl font-black text-blue-700">{drawerStudent._count?.examAssignments || 0}</p>
                   </div>
                   <div className="flex-1 bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-center">
                     <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Submissions</p>
                     <p className="text-xl font-black text-blue-700">{drawerStudent._count?.submissions || 0}</p>
                   </div>
                </div>
              </div>

              {/* Login History Timeline */}
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500"/> Recent Logins</h4>
                <div className="space-y-3">
                  {studentLoginHistory.length > 0 ? studentLoginHistory.map(log => (
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
                  {studentActivity.length > 0 ? studentActivity.map(act => (
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

export default StudentsList;
