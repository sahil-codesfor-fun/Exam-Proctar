import React, { useEffect, useState } from 'react';
import api from '../../services/api'; 
import { Users, Code2 } from 'lucide-react';

export const TeacherCodingProgress = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const res = await api.get('/metrics/all');
        if (res.data.success) {
          setStudents(res.data.data);
        } else {
          setError('Failed to gather student metrics.');
        }
      } catch (err) {
        console.error(err);
        setError('Could not establish connection to aggregate analytics server.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A5F53] border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-[#1A5F53] font-black text-sm uppercase tracking-widest animate-pulse">Loading Student Metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-600 font-medium shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-700 font-sans pb-12">
      
      {/* Header Section */}
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700">
          <Users size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Coding Progress Monitor</h3>
          <p className="text-sm font-medium text-gray-400 mt-1">Real-time LeetCode integrations across all active students.</p>
        </div>
      </div>

      {/* 🚀 THE SLEEK LIST UI */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        
        {/* Table Header Row */}
        <div className="flex items-center justify-between py-4 px-8 bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <div className="w-1/4">Student</div>
          <div className="w-1/5">Global Rank</div>
          <div className="w-1/6">Total Solved</div>
          <div className="w-1/5">Easy / Med / Hard</div>
          <div className="w-1/6 text-right">Activity (Wk/Mo)</div>
        </div>

        {/* Student Data Rows */}
        <div className="flex flex-col">
          {students.map((metrics) => (
            <div key={metrics.id} className="flex items-center justify-between py-5 px-8 bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              
              {/* Column 1: Student Name & ID */}
              <div className="w-1/4 pr-4">
                <h4 className="text-sm font-black text-gray-900 group-hover:text-[#1A5F53] transition-colors truncate">
                  {metrics.user?.name || 'Unknown Student'}
                </h4>
                <p className="text-xs text-gray-400 font-medium mt-0.5 font-mono truncate">
                  {metrics.user?.studentId || 'N/A'}
                </p>
              </div>

              {/* Column 2: Platform & Rank */}
              <div className="w-1/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FFA116] flex items-center justify-center shrink-0">
                  <Code2 size={16} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700">#{metrics?.ranking?.toLocaleString() || '0'}</span>
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">LeetCode</span>
                </div>
              </div>

              {/* Column 3: Total Solved */}
              <div className="w-1/6 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-gray-900">{metrics?.totalSolved || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Solved</span>
              </div>

              {/* Column 4: Difficulty Breakdown */}
              <div className="w-1/5 flex items-center gap-4 text-sm font-black">
                <div className="flex flex-col items-center">
                  <span className="text-[#00B8A3]">{metrics?.easySolved || 0}</span>
                </div>
                <span className="text-gray-200">/</span>
                <div className="flex flex-col items-center">
                  <span className="text-[#FFC01E]">{metrics?.mediumSolved || 0}</span>
                </div>
                <span className="text-gray-200">/</span>
                <div className="flex flex-col items-center">
                  <span className="text-[#EF4743]">{metrics?.hardSolved || 0}</span>
                </div>
              </div>

              {/* Column 5: Consistency / Status (Now with Both Wk & Mo!) */}
              <div className="w-1/6 flex flex-col items-end justify-center gap-1.5">
                {/* Weekly Badge */}
                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                  metrics?.thisWeek > 0 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-gray-50 text-gray-400 border border-gray-100'
                }`}>
                  {metrics?.thisWeek > 0 ? `+${metrics.thisWeek} This Week` : '0 This Week'}
                </span>
                
                {/* Monthly Badge */}
                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                  metrics?.thisMonth > 0 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                    : 'bg-gray-50 text-gray-400 border border-gray-100'
                }`}>
                  {metrics?.thisMonth > 0 ? `+${metrics.thisMonth} This Month` : '0 This Month'}
                </span>
              </div>

            </div>
          ))}

          {/* Empty State */}
          {students.length === 0 && !loading && (
             <div className="text-center py-20 bg-white">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No student metrics found in the database.</p>
             </div>
          )}
        </div>
      </div>

    </div>
  );
};