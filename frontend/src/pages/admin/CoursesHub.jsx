import React, { useState, useEffect } from 'react';
import { fetchAllCourses, uploadCourseCsv, createNewCourse, createNewModule, assignCourse, deleteCourse } from '../../services/hubApi';
import api from '../../services/api';
import {
  UploadCloud, CheckCircle, AlertCircle, Loader2,
  BookOpen, Code, FileText, Plus, ChevronDown, ChevronUp,
  FolderPlus, Link2, Trash2
} from 'lucide-react';

const CoursesHub = () => {
  // Data
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload form
  const [articlesFile, setArticlesFile] = useState(null);
  const [questionsFile, setQuestionsFile] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  // Create forms
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [showNewModule, setShowNewModule] = useState(null); // courseId
  const [newModuleTitle, setNewModuleTitle] = useState('');

  // Assign
  const [assigningCourse, setAssigningCourse] = useState(null);
  const [selectedDept, setSelectedDept] = useState('');

  // Expandable
  const [expandedCourse, setExpandedCourse] = useState(null);

  // Status
  const [status, setStatus] = useState({ type: '', message: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const coursesData = await fetchAllCourses();
      setCourses(coursesData || []);

      // Fetch departments for assignment
      try {
        const deptRes = await api.get('/metadata/departments');
        setDepartments(deptRes.data?.departments || deptRes.data?.data || deptRes.data || []);
      } catch { setDepartments([]); }
    } catch (err) {
      console.error("LOAD DATA ERROR:", err);
      setStatus({ type: 'error', message: `Failed to load courses: ${err.message || 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!articlesFile || !questionsFile || !courseTitle) {
      setStatus({ type: 'error', message: 'Course Title and BOTH CSV files are required.' });
      return;
    }
    setUploading(true);
    setStatus({ type: '', message: '' });
    const formData = new FormData();
    formData.append('articlesCsv', articlesFile);
    formData.append('questionsCsv', questionsFile);
    formData.append('courseTitle', courseTitle);
    
    try {
      const result = await uploadCourseCsv(formData);
      setStatus({ type: 'success', message: `Success! Created ${result.data?.modulesCreated} modules and imported ${result.data?.questionsImported} questions.` });
      setArticlesFile(null); setQuestionsFile(null); setCourseTitle('');
      document.getElementById('articles-csv-upload')?.value && (document.getElementById('articles-csv-upload').value = '');
      document.getElementById('questions-csv-upload')?.value && (document.getElementById('questions-csv-upload').value = '');
      loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally { setUploading(false); }
  };

  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim()) return;
    try {
      await createNewCourse(newCourseTitle, newCourseDesc);
      setNewCourseTitle(''); setNewCourseDesc('');
      setShowNewCourse(false);
      setStatus({ type: 'success', message: 'Course created!' });
      loadData();
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to create course.' });
    }
  };

  const handleDeleteCourse = async (courseId, title) => {
    if (!window.confirm(`Are you sure you want to delete ${title}? This cannot be undone.`)) return;
    try {
      await deleteCourse(courseId);
      setStatus({ type: 'success', message: 'Course deleted successfully!' });
      loadData();
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to delete course.' });
    }
  };

  const handleCreateModule = async (courseId) => {
    if (!newModuleTitle.trim()) return;
    try {
      await createNewModule(courseId, newModuleTitle);
      setNewModuleTitle(''); setShowNewModule(null);
      setStatus({ type: 'success', message: 'Module created!' });
      loadData();
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to create module.' });
    }
  };

  const handleAssign = async (courseId) => {
    setAssigningCourse(courseId);
    try {
      await assignCourse(courseId);
      setStatus({ type: 'success', message: 'Course assigned to your department!' });
      loadData();
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to assign.' });
    } finally {
      setAssigningCourse(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BookOpen className="text-blue-600" size={28} /> Courses Hub
          </h1>
          <p className="text-slate-500 mt-1">Manage courses, modules, and upload curriculum content.</p>
        </div>
        <button
          onClick={() => setShowNewCourse(!showNewCourse)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-md"
        >
          <Plus size={18} /> New Course
        </button>
      </div>

      {/* Status Toast */}
      {status.message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span className="font-medium text-sm">{status.message}</span>
          <button onClick={() => setStatus({ type: '', message: '' })} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Create Course Form */}
      {showNewCourse && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-700">Create New Course</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} placeholder="Course Title (e.g., Advanced DSA)" className="px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" />
            <input value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} placeholder="Description (optional)" className="px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreateCourse} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all">Create</button>
            <button onClick={() => setShowNewCourse(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* Course Cards */}
      <div className="space-y-4">
        {courses.length === 0 ? (
          <div className="bg-slate-50 p-10 rounded-2xl border border-slate-200 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No Courses Yet</h3>
            <p className="text-slate-500 mt-2">Create a course or import data to get started.</p>
          </div>
        ) : (
          courses.map((course) => {
            const totalQuestions = course.modules?.reduce((s, m) => s + (m._count?.questions || 0), 0) || 0;
            const totalArticles = course.modules?.reduce((s, m) => s + (m._count?.articles || 0), 0) || 0;
            const isExpanded = expandedCourse === course.id;

            return (
              <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Course Header */}
                <div
                  className="p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
                      {course.title?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">{course.title}</h2>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Code size={12} /> {totalQuestions} Questions</span>
                        <span className="flex items-center gap-1"><FileText size={12} /> {totalArticles} Articles</span>
                        <span className="flex items-center gap-1"><FolderPlus size={12} /> {course.modules?.length || 0} Modules</span>
                        {course.department && (
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            {course.department.name}
                          </span>
                        )}
                        {!course.departmentId && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id, course.title);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 size={18} />
                    </button>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 md:p-6 space-y-4 bg-slate-50/50">
                    {/* Assign to Department */}
                    {!course.departmentId && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                          <Link2 size={16} /> This course is not assigned to any department.
                        </div>
                        <button
                          onClick={() => handleAssign(course.id)}
                          disabled={assigningCourse === course.id}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-all"
                        >
                          {assigningCourse === course.id ? 'Assigning...' : 'Assign to My Department'}
                        </button>
                      </div>
                    )}

                    {/* Modules List */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Modules</h4>
                      {course.modules?.map((mod) => (
                        <div key={mod.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-700">{mod.title}</span>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span>{mod._count?.questions || 0} Questions</span>
                              <span>{mod._count?.articles || 0} Articles</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              mod.title.includes('Practice') ? 'bg-blue-100 text-blue-700' :
                              mod.title.includes('Trainer') ? 'bg-purple-100 text-purple-700' :
                              mod.title.includes('Lab') ? 'bg-orange-100 text-orange-700' :
                              mod.title.includes('Article') ? 'bg-teal-100 text-teal-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {mod.title.includes('Practice') ? 'Practice' :
                               mod.title.includes('Trainer') ? 'Trainer' :
                               mod.title.includes('Lab') ? 'Lab' :
                               mod.title.includes('Article') ? 'Reading' : 'Module'}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Add Module */}
                      {showNewModule === course.id ? (
                        <div className="flex items-center gap-3 mt-2">
                          <input value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="New Module Title" className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                          <button onClick={() => handleCreateModule(course.id)} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Add</button>
                          <button onClick={() => setShowNewModule(null)} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowNewModule(course.id)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 px-2">
                          <Plus size={16} /> Add Module
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CSV Upload Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2"><UploadCloud size={20} /> Bulk CSV Upload (Auto-Chunking)</h2>
        </div>
        <form onSubmit={handleUpload} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Course Title</label>
            <input type="text" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="e.g., Advanced DSA" className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="articles-csv-upload" className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer bg-emerald-50/30 border-emerald-300 hover:bg-emerald-50 transition-all group">
                <FileText className={`w-10 h-10 mb-2 ${articlesFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                <p className="text-sm text-slate-600"><span className="font-semibold text-emerald-600">Click to upload</span> Articles CSV</p>
                {articlesFile && <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={14} /> {articlesFile.name}</p>}
                <input id="articles-csv-upload" type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.length && setArticlesFile(e.target.files[0])} />
              </label>
            </div>

            <div>
              <label htmlFor="questions-csv-upload" className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer bg-blue-50/30 border-blue-300 hover:bg-blue-50 transition-all group">
                <Code className={`w-10 h-10 mb-2 ${questionsFile ? 'text-blue-500' : 'text-slate-400'}`} />
                <p className="text-sm text-slate-600"><span className="font-semibold text-blue-600">Click to upload</span> Questions CSV</p>
                {questionsFile && <p className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1"><CheckCircle size={14} /> {questionsFile.name}</p>}
                <input id="questions-csv-upload" type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.length && setQuestionsFile(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={uploading || !articlesFile || !questionsFile || !courseTitle} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-md disabled:opacity-70 flex items-center gap-2">
              {uploading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : 'Process & Import CSVs'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoursesHub;
