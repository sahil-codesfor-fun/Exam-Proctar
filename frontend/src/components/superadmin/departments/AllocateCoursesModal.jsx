import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Search, X, Check, Filter, Layers, LayoutGrid, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

const AllocateCoursesModal = ({ department, onClose, onRefresh }) => {
  const [courses, setCourses] = useState([]);
  const [allocatedCourses, setAllocatedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  
  const [config, setConfig] = useState({
    academicYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString().slice(-2),
    batch: new Date().getFullYear().toString(),
    semesterStructure: 'ODD_EVEN',
    totalSections: 2,
    intakeCapacity: 60,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '', code: '', duration: 4, credits: 160, semesters: 8
  });
  const [creatingCourse, setCreatingCourse] = useState(false);

  const [courseToDelete, setCourseToDelete] = useState(null);
  
  const [courseToRemove, setCourseToRemove] = useState(null);

  useEffect(() => {
    fetchData();
  }, [department.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allCoursesRes, allocatedRes] = await Promise.all([
        api.get('/superadmin/courses'),
        api.get(`/superadmin/departments/${department.id}/courses`)
      ]);
      setCourses(allCoursesRes.data.data || []);
      setAllocatedCourses(allocatedRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAllocated = (courseId) => {
    return allocatedCourses.some(ac => ac.courseId === courseId);
  };

  const handleSelect = (courseId) => {
    if (isAllocated(courseId)) return;
    
    setSelectedCourseIds(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAll = () => {
    const availableCourseIds = filteredCourses.filter(c => !isAllocated(c.id)).map(c => c.id);
    if (selectedCourseIds.length === availableCourseIds.length && availableCourseIds.length > 0) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(availableCourseIds);
    }
  };

  const handleAllocate = async () => {
    if (selectedCourseIds.length === 0) {
      setError('Please select at least one course to allocate.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/superadmin/departments/${department.id}/courses`, {
        courseIds: selectedCourseIds,
        metadata: config
      });
      setSuccess(`Successfully allocated ${selectedCourseIds.length} course(s).`);
      setSelectedCourseIds([]);
      await fetchData();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to allocate courses.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code) {
      setError('Course name and code are required.');
      return;
    }
    setCreatingCourse(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/superadmin/courses', newCourse);
      setSuccess(`Course ${res.data.data.name} created successfully!`);
      setShowCreateCourse(false);
      setNewCourse({ name: '', code: '', duration: 4, credits: 160, semesters: 8 });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleRemove = (courseId) => {
    setCourseToRemove(courseId);
  };

  const confirmRemoveCourse = async () => {
    if (!courseToRemove) return;
    
    setSaving(true);
    try {
      await api.delete(`/superadmin/departments/${department.id}/courses/${courseToRemove}`);
      setSuccess('Course removed successfully.');
      await fetchData();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove course.');
    } finally {
      setSaving(false);
      setCourseToRemove(null);
    }
  };

  const handleDeleteCourseGlobally = (courseId, e) => {
    e.stopPropagation();
    setCourseToDelete(courseId);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/superadmin/courses/${courseToDelete}`);
      setSuccess('Course deleted successfully.');
      setSelectedCourseIds(prev => prev.filter(id => id !== courseToDelete));
      await fetchData();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course.');
    } finally {
      setSaving(false);
      setCourseToDelete(null);
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const availableCourseIds = filteredCourses.filter(c => !isAllocated(c.id)).map(c => c.id);
  const isAllSelected = selectedCourseIds.length > 0 && selectedCourseIds.length === availableCourseIds.length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              Course Allocation
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {department.name} ({department.code})
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 shrink-0">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-5 h-5" /> {success}
          </div>
        )}

        {}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
          
          {}
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-blue-600" />
                Available Courses
              </h4>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setShowCreateCourse(true)}
                  className="px-3 py-2 text-sm font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 shrink-0"
                >
                  + Create New
                </button>
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search courses..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-1 overflow-y-auto min-h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-500 text-sm flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Loading courses...
                  </span>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No courses found matching your criteria.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      disabled={availableCourseIds.length === 0}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-sm font-semibold text-gray-700">Select All Available</span>
                  </div>
                  
                  {filteredCourses.map(course => {
                    const allocated = isAllocated(course.id);
                    const selected = selectedCourseIds.includes(course.id);
                    return (
                      <div 
                        key={course.id} 
                        onClick={() => !allocated && handleSelect(course.id)}
                        className={`p-4 border rounded-lg flex items-start gap-4 transition-all ${
                          allocated 
                            ? 'bg-green-50 border-green-200 cursor-not-allowed opacity-80' 
                            : selected
                              ? 'bg-blue-50 border-blue-300 cursor-pointer'
                              : 'bg-white border-gray-200 hover:border-blue-300 cursor-pointer shadow-sm'
                        }`}
                      >
                        <div className="mt-1 shrink-0">
                          {allocated ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <input 
                              type="checkbox" 
                              checked={selected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h5 className="font-bold text-gray-900 truncate pr-2">{course.name}</h5>
                            <span className="text-xs font-mono font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {course.code}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span>Duration: {course.duration} Years</span>
                            <span>Credits: {course.credits}</span>
                            <span>Semesters: {course.semesters}</span>
                          </div>
                          {allocated && (
                            <div className="mt-2 text-xs font-medium text-green-700 bg-green-100/50 inline-block px-2 py-1 rounded">
                              Already Allocated
                            </div>
                          )}
                        </div>
                        {allocated && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemove(course.id); }}
                            className="shrink-0 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium border border-red-200"
                          >
                            Remove
                          </button>
                        )}
                        {!allocated && (
                          <button 
                            onClick={(e) => handleDeleteCourseGlobally(course.id, e)}
                            title="Delete Course Globally"
                            className="shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-blue-600" />
                Allocation Config
              </h4>
              <p className="text-xs text-blue-700 mb-4 leading-relaxed">
                Configure the default settings for the selected courses. These can be modified later per course.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Academic Year</label>
                  <input 
                    type="text" 
                    value={config.academicYear} 
                    onChange={e => setConfig({...config, academicYear: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Batch</label>
                  <input 
                    type="text" 
                    value={config.batch} 
                    onChange={e => setConfig({...config, batch: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1">Sections</label>
                    <input 
                      type="number" 
                      min="1"
                      value={config.totalSections} 
                      onChange={e => setConfig({...config, totalSections: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1">Intake</label>
                    <input 
                      type="number" 
                      min="1"
                      value={config.intakeCapacity} 
                      onChange={e => setConfig({...config, intakeCapacity: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Semester Structure</label>
                  <select 
                    value={config.semesterStructure} 
                    onChange={e => setConfig({...config, semesterStructure: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ODD_EVEN">Odd & Even (Standard)</option>
                    <option value="TRIMESTER">Trimester</option>
                    <option value="ANNUAL">Annual (Yearly)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-700">Selected</span>
                <span className="text-lg font-bold text-blue-600">{selectedCourseIds.length}</span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-semibold text-slate-700">Currently Allocated</span>
                <span className="text-lg font-bold text-green-600">{allocatedCourses.length}</span>
              </div>
              
              <button 
                onClick={handleAllocate}
                disabled={selectedCourseIds.length === 0 || saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Allocating...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Allocate Courses
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {}
      {showCreateCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Create New Course</h3>
              <button onClick={() => setShowCreateCourse(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Course Name</label>
                <input 
                  type="text" required
                  placeholder="e.g. Master of Computer Applications"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Course Code</label>
                <input 
                  type="text" required
                  placeholder="e.g. MCA"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  value={newCourse.code} onChange={e => setNewCourse({...newCourse, code: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Yrs)</label>
                  <input 
                    type="number" required min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Credits</label>
                  <input 
                    type="number" required min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newCourse.credits} onChange={e => setNewCourse({...newCourse, credits: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Semesters</label>
                  <input 
                    type="number" required min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newCourse.semesters} onChange={e => setNewCourse({...newCourse, semesters: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateCourse(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creatingCourse}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creatingCourse ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {courseToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Course?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to PERMANENTLY delete this course from the entire system? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors w-full"
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteCourse}
                disabled={saving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors w-full disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {courseToRemove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Course?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to remove this course from the department?
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setCourseToRemove(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors w-full"
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemoveCourse}
                disabled={saving}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors w-full disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllocateCoursesModal;
