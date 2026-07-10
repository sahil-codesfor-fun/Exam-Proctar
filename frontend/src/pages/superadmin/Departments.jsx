import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, MoreVertical, Building2, Layers, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import AllocateCoursesModal from '../../components/superadmin/departments/AllocateCoursesModal';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [editId, setEditId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // 👈 Added processing state

  // Allocate Courses State
  const [allocatingDept, setAllocatingDept] = useState(null);

  const fetchDepartments = async () => {
    try {
      // Use standard api get
      const res = await api.get('/superadmin/departments');

      // For each department, we could fetch allocated courses count if backend doesn't provide it, 
      // but assuming the backend was updated to return _count or we can fetch it. 
      // Since we didn't add it to department list API, we'll fetch them manually for now, or just show a button.
      // Actually, since we didn't change getDepartments to return _count.allocatedCourses in the service, 
      // let's fetch it via Promise.all for each, or just use a generic label. Let's just use a label.
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

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true); // 👈 Start processing
    try {
      if (editId) {
        await api.put(`/superadmin/departments/${editId}`, formData);
      } else {
        await api.post('/superadmin/departments', formData);
      }
      setShowModal(false);
      setFormData({ name: '', code: '' });
      setEditId(null);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save department');
    } finally {
      setIsSaving(false); // 👈 Stop processing
    }
  };

  const handleEdit = (dept) => {
    setFormData({ name: dept.name, code: dept.code });
    setEditId(dept.id);
    setShowModal(true);
    setActiveDropdown(null);
  };

  const handleDeleteClick = (dept) => {
    setDeleteConfirm(dept);
    setActiveDropdown(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.delete(`/superadmin/departments/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department');
    } finally {
      setIsDeleting(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Departments</h2>
          <p className="text-gray-500 mt-1">Manage university departments and assignments.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (departments.length > 0) {
                setAllocatingDept(departments[0]);
              } else {
                alert("Please add a department first.");
              }
            }}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <Layers className="w-5 h-5 text-blue-500" /> Allocate Courses
          </button>
          <button
            onClick={() => {
              setEditId(null);
              setFormData({ name: '', code: '' });
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" /> Add Department
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="relative w-64">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showArchived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showArchived" className="text-sm text-gray-600 cursor-pointer">Show Archived</label>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4">Department Name</th>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Head</th>
              <th className="px-6 py-4">Courses</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-6 float-right"></div></td>
                </tr>
              ))
            ) : departments.filter(d => showArchived || d.status !== 'ARCHIVED').map(dept => (
              <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAllocatingDept(dept);
                    }}
                    className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1 w-fit"
                  >
                    Manage Allocation
                  </button>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${dept.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {dept.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === dept.id ? null : dept.id);
                    }}
                    className="text-gray-400 hover:text-gray-900 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {activeDropdown === dept.id && (
                    <div className="absolute right-6 top-10 mt-1 w-40 bg-white rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setAllocatingDept(dept); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Allocate Courses
                      </button>
                      <button onClick={() => handleEdit(dept)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Edit</button>
                      <button onClick={() => handleDeleteClick(dept)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {departments.filter(d => showArchived || d.status !== 'ARCHIVED').length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
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
              <h3 className="text-xl font-bold text-gray-900">{editId ? 'Edit Department' : 'Add New Department'}</h3>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  type="text" required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                <input
                  type="text" required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} disabled={isSaving} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50">Cancel</button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors min-w-[140px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      PROCESSING...
                    </>
                  ) : editId ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Department?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirm.name}"</span>?
                This action cannot be undone. If there are users or subjects attached, it may be archived instead.
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

      {allocatingDept && (
        <AllocateCoursesModal
          department={allocatingDept}
          onClose={() => setAllocatingDept(null)}
          onRefresh={fetchDepartments}
        />
      )}
    </div>
  );
};

export default Departments;