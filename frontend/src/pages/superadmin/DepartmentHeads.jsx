import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, MoreVertical, ShieldCheck, Key, Trash2, Eye, EyeOff } from 'lucide-react';

const DepartmentHeads = () => {
  const [heads, setHeads] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', employeeId: '', departmentId: '' });
  
  const [passwordMode, setPasswordMode] = useState('auto');
  const [manualPassword, setManualPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchData = async () => {
    try {
      const [headsRes, deptsRes] = await Promise.all([
        api.get('/superadmin/users?role=admin'),
        api.get('/superadmin/departments')
      ]);
      setHeads(headsRes.data.data);
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

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8 && pass.length <= 32) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };
  
  const strengthScore = getPasswordStrength(manualPassword);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (passwordMode === 'manual') {
      if (strengthScore < 5) {
        alert("Please ensure the manual password meets all requirements.");
        return;
      }
      if (manualPassword !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
    }

    try {
      const res = await api.post('/superadmin/users', {
        ...formData,
        role: 'admin',
        passwordMode,
        manualPassword: passwordMode === 'manual' ? manualPassword : undefined
      });

      if (passwordMode === 'auto') {
        setGeneratedCreds({
          email: res.data.data.user.email,
          password: res.data.data.tempPassword
        });
      } else {
        setSuccessMessage('Department Head provisioned successfully!');
        // We do not close modals immediately so the user can see the success message
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to provision department head');
    }
  };

  const closeModals = () => {
    setShowModal(false);
    setGeneratedCreds(null);
    setFormData({ name: '', email: '', employeeId: '', departmentId: '' });
    setPasswordMode('auto');
    setManualPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSuccessMessage('');
  };

  const handleDeleteClick = (head) => {
    setDeleteConfirm(head);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.delete(`/superadmin/users/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department head');
    } finally {
      setIsDeleting(false);
    }
  };

  const isSubmitDisabled = !formData.departmentId || 
    (passwordMode === 'manual' && (strengthScore < 5 || manualPassword !== confirmPassword || !confirmPassword));

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
                    onClick={() => handleDeleteClick(head)}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Provision Dept Head</h3>
              <p className="text-sm text-gray-500 mt-1">Set up a new department head account.</p>
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

              {/* Password Setup Section */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Password Setup</h4>
                
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="passwordMode" 
                      value="auto"
                      checked={passwordMode === 'auto'}
                      onChange={() => setPasswordMode('auto')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Auto Generate</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="passwordMode" 
                      value="manual"
                      checked={passwordMode === 'manual'}
                      onChange={() => setPasswordMode('manual')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Create Manually</span>
                  </label>
                </div>

                {passwordMode === 'manual' && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={manualPassword} onChange={e => setManualPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {confirmPassword && manualPassword !== confirmPassword && (
                        <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-600">Strength</span>
                        <span className={`text-xs font-bold ${strengthScore < 3 ? 'text-red-500' : strengthScore < 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {strengthScore < 3 ? 'Weak' : strengthScore < 5 ? 'Medium' : 'Strong'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 flex overflow-hidden">
                        {[1, 2, 3, 4, 5].map(level => (
                          <div 
                            key={level} 
                            className={`flex-1 h-full ${level <= strengthScore ? (strengthScore < 3 ? 'bg-red-500' : strengthScore < 5 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-transparent border-r border-white border-opacity-50 last:border-0'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 text-xs mt-2">
                      <div className="flex gap-4">
                        <span className={`flex-1 ${manualPassword.length >= 8 && manualPassword.length <= 32 ? 'text-green-600' : 'text-gray-500'}`}>
                          {manualPassword.length >= 8 && manualPassword.length <= 32 ? '✓' : '✗'} 8-32 characters
                        </span>
                        <span className={`flex-1 ${/[A-Z]/.test(manualPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                          {/[A-Z]/.test(manualPassword) ? '✓' : '✗'} Uppercase letter
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <span className={`flex-1 ${/[a-z]/.test(manualPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                          {/[a-z]/.test(manualPassword) ? '✓' : '✗'} Lowercase letter
                        </span>
                        <span className={`flex-1 ${/[0-9]/.test(manualPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                          {/[0-9]/.test(manualPassword) ? '✓' : '✗'} Number
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <span className={`flex-1 ${/[^A-Za-z0-9]/.test(manualPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                          {/[^A-Za-z0-9]/.test(manualPassword) ? '✓' : '✗'} Special character
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitDisabled} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">Generate Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal showing credentials (Auto Generate Only) */}
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

      {/* Manual Success Modal */}
      {successMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-center transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">
                {successMessage}
              </p>
              <button 
                onClick={closeModals} 
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Department Head?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirm.name}"</span>? 
                This action cannot be undone and they will lose access to the system.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Deleting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Yes, Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentHeads;
