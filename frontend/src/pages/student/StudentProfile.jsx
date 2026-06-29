import React from 'react';
import { useOutletContext } from 'react-router-dom';

const StudentProfile = () => {
  const { user, submissions } = useOutletContext();

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-500 relative">
          <div className="absolute -bottom-16 left-12">
            <div className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-2xl">
              <div className="w-full h-full rounded-[1.5rem] bg-emerald-50 flex items-center justify-center text-4xl font-black text-emerald-600 border border-emerald-100">
                {user?.name?.[0]}
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-20 px-12 pb-12 space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h3 className="text-3xl font-black text-gray-900 mb-1">{user?.name}</h3>
              <p className="text-sm font-bold text-gray-400">{user?.email}</p>
            </div>
            <div className="flex flex-col md:items-end">
               <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase border border-emerald-100 tracking-widest">Active Academic Core</span>
               <p className="text-[9px] font-bold text-gray-300 mt-2 uppercase tracking-widest">System Status: Secure</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] border-b pb-2">Academic Identity</h4>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Student Node ID</span>
                  <span className="text-sm font-bold text-gray-700">{user?.studentId || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Department / Sector</span>
                  <span className="text-sm font-bold text-gray-700">Engineering & Tech</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] border-b pb-2">System Analytics</h4>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Assessment Success Rate</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {submissions.length > 0 ? Math.round((submissions.filter(s => s.percentage >= 33.33).length / submissions.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Total Logged Hours</span>
                  <span className="text-sm font-bold text-gray-700">14.28 Nodes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
