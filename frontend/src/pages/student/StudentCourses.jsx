import React, { useState, useEffect } from 'react';
import { fetchDepartmentCourses } from '../../services/hubApi';
import { BookOpen, AlertCircle, ChevronRight, CheckCircle, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchDepartmentCourses();
        setCourses(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3 mt-6">
        <AlertCircle className="w-6 h-6" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-slate-50 p-10 rounded-2xl border border-slate-200 text-center mt-6">
        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-700">No Courses Available</h3>
        <p className="text-slate-500 mt-2">Your department hasn't published any courses yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          My Courses
        </h1>
        <p className="text-slate-500 mt-2">
          Explore the official curriculum provided by your department.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div 
            key={course.id} 
            onClick={() => navigate(`/student-dashboard/courses/${course.id}`)}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col"
          >
            <div className="p-6 md:p-8 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                  Course Curriculum
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                {course.title}
              </h2>
              {course.description && course.description !== 'Imported via CSV Dual Upload' ? (
                <p className="text-slate-600 mb-6 leading-relaxed flex-grow line-clamp-3">
                  {course.description}
                </p>
              ) : (
                <div className="flex-grow mb-6"></div>
              )}

              <div className="mt-auto flex flex-col">
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500 uppercase tracking-wider">Course Progress</span>
                    <span className="text-blue-600">{course.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${course.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Modules</span>
                      <span className="text-lg font-bold text-slate-700">
                        {course.modules?.length || 0}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-full group-hover:bg-blue-50 transition-colors">
                    <ChevronRight className="text-slate-400 group-hover:text-blue-600 transition-colors" size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentCourses;
