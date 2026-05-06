import React from 'react';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto mt-6">
      
      {/* Welcome Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome back, bro! 👋</h2>
        <p className="text-gray-500 font-medium">Student ID: BTECH-CSE-2026 | <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md text-sm">Verified Profile</span></p>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Pending Assessments</h3>
      
      {/* Assessment Item Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300">
        <div>
          <h4 className="text-xl font-bold text-gray-900 mb-1">Advanced Algorithms Final 📝</h4>
          <p className="text-gray-500 text-sm mb-3">Duration: 120 Minutes | Strict Proctoring Enabled</p>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg inline-flex">
            <span>⚠️</span> Camera, Microphone, and Screen Share required.
          </div>
        </div>
        
        <div className="mt-6 md:mt-0 w-full md:w-auto">
          <button 
            onClick={() => navigate('/exam')}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all transform hover:scale-[1.02] shadow-md"
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
};