import React, { useEffect, useState, useMemo } from 'react';
import useSWR from '../../hooks/useSWR';
import { BookOpen, Download, AlertCircle, RefreshCw, Layers, ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const TeacherCourseProgress = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadStep, setDownloadStep] = useState(1);
  const [selectedAcademicCourse, setSelectedAcademicCourse] = useState(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const endpoint = `/hub-courses/faculty/student-progress?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`;

  const { data: response, loading, isValidating, error: swrError, revalidate } = useSWR(endpoint, {
    staleTime: 60000
  });

  const students = useMemo(() => response?.data || [], [response]);
  const courses = useMemo(() => response?.courses || [], [response]);
  const pagination = response?.pagination || {
    totalRecords: students.length,
    totalPages: 1,
    currentPage: page,
    limit
  };

  const academicCourses = useMemo(() => {
    return [...new Set(students.map(s => s.course).filter(Boolean))];
  }, [students]);

  const toggleStudent = (studentId) => {
    setExpandedStudentId(prev => prev === studentId ? null : studentId);
  };

  const handleDownloadCSV = (courseId = null) => {
    let targetStudents = students;
    if (selectedAcademicCourse) {
      targetStudents = students.filter(s => s.course === selectedAcademicCourse);
    }

    if (targetStudents.length === 0) return;

    let targetCourses = courses;
    if (courseId) {
      targetCourses = courses.filter(c => c.id === courseId);
    }

    const courseHeaders = targetCourses.map(c => `"${c.title} Progress (%)"`).join(',');
    const header = `Roll No,Name,Email,Program,${courseHeaders}\n`;

    const rows = targetStudents.map(student => {
      const courseData = targetCourses.map(c => {
        const cp = (student.courseProgress || []).find(p => p.courseId === c.id);
        return cp ? cp.progress : 0;
      }).join(',');
      return `"${student.studentId || ''}","${student.name || ''}","${student.email || ''}","${student.course || ''}",${courseData}`;
    });

    const csvContent = header + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileNameSuffix = courseId ? targetCourses[0].title.replace(/\s+/g, '_').toLowerCase() : 'all_courses';
    link.setAttribute("download", `student_progress_${fileNameSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowDownloadMenu(false);
  };

  const startRecord = (pagination.currentPage - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <BookOpen size={24} />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Course Progress</h1>
              {isValidating && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  <RefreshCw size={10} className="animate-spin" /> Updating...
                </span>
              )}
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Track your department's students across all available courses.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-64"
            />
          </div>

          <button 
            onClick={() => revalidate()}
            disabled={loading || isValidating}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all border shadow-sm active:scale-95 disabled:opacity-60"
          >
            <RefreshCw size={14} className={isValidating ? 'animate-spin' : ''} /> Refresh
          </button>
          
          <div className="relative">
            <button 
              onClick={() => {
                setShowDownloadMenu(!showDownloadMenu);
                if (!showDownloadMenu) setDownloadStep(1);
              }}
              disabled={students.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Download size={14} /> Download CSV
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <div className="p-2">
                  {downloadStep === 1 ? (
                    <>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 pt-1">Select Program</div>
                      <button 
                        onClick={() => {
                          setSelectedAcademicCourse(null);
                          setDownloadStep(2);
                        }}
                        className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-between"
                      >
                        All Programs
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{students.length}</span>
                      </button>
                      {academicCourses.length > 0 && <div className="my-1 border-t border-gray-100"></div>}
                      <div className="max-h-60 overflow-y-auto">
                        {academicCourses.map(course => {
                          const count = students.filter(s => s.course === course).length;
                          return (
                            <button 
                              key={course}
                              onClick={() => {
                                setSelectedAcademicCourse(course);
                                setDownloadStep(2);
                              }}
                              className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-between truncate"
                            >
                              {course}
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2 px-2 pt-1">
                        <button 
                          onClick={() => setDownloadStep(1)} 
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <ChevronUp size={14} className="-rotate-90" />
                        </button>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Subject</div>
                      </div>
                      <button 
                        onClick={() => handleDownloadCSV(null)}
                        className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-between"
                      >
                        All Subjects
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{courses.length}</span>
                      </button>
                      <div className="my-1 border-t border-gray-100"></div>
                      <div className="max-h-60 overflow-y-auto">
                        {courses.map(course => (
                          <button 
                            key={course.id}
                            onClick={() => handleDownloadCSV(course.id)}
                            className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors truncate"
                          >
                            {course.title}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {swrError && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 font-medium border border-red-100">
          <AlertCircle size={18} />
          {swrError.response?.data?.message || swrError.message || 'An error occurred while fetching progress data.'}
        </div>
      )}

      {loading && !response ? (
        <div className="flex-1 h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading progress...</span>
          </div>
        </div>
      ) : !swrError && students.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
            <Layers size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No Students Found</h3>
          <p className="text-gray-500">There are currently no students matching your filter criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-slate-500 w-1/3">Student</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-slate-500 w-1/3">Roll No</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-slate-500 w-1/4">Overall Progress</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-slate-500 text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const isExpanded = expandedStudentId === student.id;
                  
                  const totalProgressSum = courses.reduce((acc, course) => {
                    const cp = (student.courseProgress || []).find(p => p.courseId === course.id);
                    return acc + (cp ? cp.progress : 0);
                  }, 0);
                  const avgProgress = courses.length ? Math.round(totalProgressSum / courses.length) : 0;

                  return (
                    <React.Fragment key={student.id}>
                      <tr 
                        onClick={() => toggleStudent(student.id)}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0">
                              {student.name ? student.name[0].toUpperCase() : 'S'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-800 truncate group-hover:text-blue-600 transition-colors">{student.name}</p>
                              <p className="text-xs text-slate-400 truncate">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono font-medium">
                            {student.studentId || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${avgProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${avgProgress}%` }}
                              />
                            </div>
                            <span className={`font-bold text-xs ${avgProgress === 100 ? 'text-emerald-500' : 'text-slate-600'}`}>
                              {avgProgress}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50 border-b border-slate-100 shadow-inner">
                          <td colSpan={4} className="p-0">
                            <div className="p-6 bg-blue-50/30">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                  <BookOpen size={16} className="text-blue-500" /> 
                                  Course Breakdown
                                </h4>
                                {(student.course || student.section) && (
                                  <div className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm flex items-center gap-1.5">
                                    <Layers size={14} />
                                    {student.course || 'Unknown Course'} {student.section ? `(Sec ${student.section})` : ''}
                                  </div>
                                )}
                              </div>
                              {courses.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No courses found.</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {courses.map(course => {
                                    const cp = (student.courseProgress || []).find(p => p.courseId === course.id) || { progress: 0, solvedQuestions: 0, totalQuestions: course.totalQuestions || 0 };
                                    return (
                                      <div key={course.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 transition-all hover:shadow-md hover:border-blue-200">
                                        <p className="font-bold text-sm text-slate-800 line-clamp-1" title={course.title}>
                                          {course.title}
                                        </p>
                                        <div className="flex justify-between items-center text-xs mt-1">
                                          <span className="font-medium text-slate-500">
                                            {cp.solvedQuestions} / {cp.totalQuestions} <span className="text-slate-400 font-normal">solved</span>
                                          </span>
                                          <span className={`font-bold ${cp.progress === 100 ? 'text-emerald-500' : 'text-blue-600'}`}>
                                            {cp.progress}%
                                          </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                          <div 
                                            className={`h-full rounded-full transition-all duration-500 ${cp.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                            style={{ width: `${cp.progress}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {pagination.totalRecords > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-3">
                <span>Showing <strong className="text-slate-800">{startRecord}</strong> to <strong className="text-slate-800">{endRecord}</strong> of <strong className="text-slate-800">{pagination.totalRecords}</strong> students</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-slate-400">Rows:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs font-semibold"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className="px-2 font-bold text-slate-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs font-semibold"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherCourseProgress;
