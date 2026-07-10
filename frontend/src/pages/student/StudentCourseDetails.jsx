import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDepartmentCourses } from '../../services/hubApi';
import { ArrowLeft, BookOpen, Code, ChevronRight, Layers } from 'lucide-react';

const StudentCourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const courses = await fetchDepartmentCourses();
        const found = courses.find(c => c.id === courseId);
        if (found) {
          setCourse(found);
        } else {
          setError('Course not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3 mt-6">
        <span className="font-medium">{error || 'Course not found'}</span>
        <button onClick={() => navigate(-1)} className="ml-auto underline text-sm">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/student-dashboard/courses')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Courses
        </button>
        <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Layers size={120} />
          </div>
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold tracking-wider mb-4 border border-blue-500/30">
              COURSE CURRICULUM
            </span>
            <h1 className="text-4xl font-bold mb-3">{course.title}</h1>
            {course.description && course.description !== 'Imported via CSV Dual Upload' && (
              <p className="text-slate-300 max-w-2xl text-lg">
                {course.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
          <Layers className="text-blue-500" /> Course Modules
        </h2>
        
        {course.modules && course.modules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {course.modules.map(mod => (
              <div 
                key={mod.id} 
                onClick={() => navigate(`/student-dashboard/courses/module/${mod.id}`)}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-lg mb-2">{mod.title}</h4>
                  <div className="flex items-center gap-4">
                    {mod.questions && mod.questions.length > 0 && (
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                        <Code size={14} className="text-blue-500" /> {mod.questions.length} Questions
                      </p>
                    )}
                    {mod.articles && mod.articles.length > 0 && (
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md">
                        <BookOpen size={14} className="text-emerald-500" /> {mod.articles.length} Articles
                      </p>
                    )}
                    {(!mod.questions || mod.questions.length === 0) && (!mod.articles || mod.articles.length === 0) && (
                      <p className="text-xs text-slate-400 italic">Empty Module</p>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                  <ChevronRight className="text-slate-400 group-hover:text-blue-500 transition-colors" size={20} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
            <Layers className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-lg font-medium text-slate-600">No modules available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourseDetails;
