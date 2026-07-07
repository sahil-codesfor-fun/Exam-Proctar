import React, { useState, useEffect } from 'react';
import { User, Mail, BookOpen, Clock, Building, Briefcase, FileText, Activity } from 'lucide-react';
import api from '../../services/api';

const TeacherProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/faculty/profile');
      setProfile(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh] text-red-500 font-bold">
        {error || 'Profile not found'}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-10">
      <div className="mb-10">
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 border-b border-emerald-100 inline-block pb-1">Faculty Portal</p>
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">MY PROFILE</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Basic Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.02)] text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-emerald-500 to-teal-600"></div>
            
            <div className="relative w-28 h-28 mx-auto bg-white rounded-full p-2 shadow-lg mt-6 mb-4 transform group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-4xl border-4 border-emerald-50">
                👨‍🏫
              </div>
            </div>
            
            <h3 className="text-xl font-black text-gray-900 mt-2">{profile.name}</h3>
            <p className="text-sm font-bold text-gray-500 mb-6">{profile.designation || 'Faculty Member'}</p>
            
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail size={16} className="text-emerald-600" />
                <div className="overflow-hidden">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-gray-700 truncate">{profile.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Briefcase size={16} className="text-blue-600" />
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Faculty ID</p>
                  <p className="text-sm font-bold text-gray-700">{profile.facultyId || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Building size={16} className="text-purple-600" />
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Department</p>
                  <p className="text-sm font-bold text-gray-700">{profile.department?.name || 'Not Assigned'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Subjects */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4"><FileText size={20} /></div>
              <h4 className="text-3xl font-black text-gray-900 mb-1">{profile.stats?.totalExamsCreated || 0}</h4>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Exams</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4"><Activity size={20} /></div>
              <h4 className="text-3xl font-black text-gray-900 mb-1">{profile.stats?.activeExams || 0}</h4>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Exams</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4"><Clock size={20} /></div>
              <h4 className="text-3xl font-black text-gray-900 mb-1">{profile.stats?.draftedExams || 0}</h4>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Drafts</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4"><BookOpen size={20} /></div>
              <h4 className="text-3xl font-black text-gray-900 mb-1">{profile.stats?.totalPracticeSheets || 0}</h4>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Practice Sheets</p>
            </div>
          </div>

          {/* Allocated Subjects */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                Allocated Subjects
              </h4>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                {profile.subjects?.length || 0} Subjects
              </span>
            </div>
            
            <div className="p-8">
              {profile.subjects && profile.subjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.subjects.map(sub => (
                    <div key={sub.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all group cursor-default">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                        {sub.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900">{sub.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 py-0.5 bg-gray-100 rounded-md">{sub.code}</span>
                          {sub.semester && <span className="text-[10px] font-bold text-gray-500">Sem {sub.semester}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl opacity-50">📚</div>
                  <h3 className="text-lg font-bold text-gray-800">No Subjects Allocated</h3>
                  <p className="text-gray-500 text-sm mt-1">You haven't been assigned any subjects yet.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
