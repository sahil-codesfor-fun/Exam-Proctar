import React, { useEffect, useState } from 'react';
import api from '../../services/api'; 
import { Code2, Target, Flame } from 'lucide-react';

export const CodingProgress = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/metrics/my-stats');
        if (res.data.success) {
          setMetrics(res.data.data);
        } else {
          setError('Failed to gather stats array.');
        }
      } catch (err) {
        console.error(err);
        setError('Could not establish connection to aggregate analytics server.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A5F53] border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-[#1A5F53] font-black text-sm uppercase tracking-widest animate-pulse">Fetching Telemetry...</span>
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
      
      {/* Header Section (Clean and Simple) */}
      <div className="mb-6 px-2">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Platform Integrations</h3>
        <p className="text-sm font-medium text-gray-400 mt-1">Scroll horizontally to view all connected coding profiles.</p>
      </div>

      {/* 🚀 HORIZONTAL SCROLLING CONTAINER */}
      <div className="flex overflow-x-auto gap-6 pb-8 snap-x pt-2 px-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        
        {/* --- LEETCODE CARD --- */}
        <div className="snap-start shrink-0 w-full max-w-[420px] bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
          
          {/* Top Orange Brand Line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FFA116] to-amber-300"></div>

          <div className="p-8">
            {/* Card Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#FFA116]">
                  <Code2 size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">LeetCode</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Rank #{metrics?.ranking ? metrics.ranking.toLocaleString() : '0'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-4xl font-black text-gray-900 leading-none">{metrics?.totalSolved || 0}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Solved</span>
              </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="space-y-4 mb-8">
              {/* Easy */}
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-bold">
                  <span className="text-[#00B8A3]">Easy</span>
                  <span className="text-gray-900">{metrics?.easySolved || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#00B8A3] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${metrics?.totalSolved ? (metrics.easySolved / metrics.totalSolved) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-bold">
                  <span className="text-[#FFC01E]">Medium</span>
                  <span className="text-gray-900">{metrics?.mediumSolved || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#FFC01E] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${metrics?.totalSolved ? (metrics.mediumSolved / metrics.totalSolved) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Hard */}
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-bold">
                  <span className="text-[#EF4743]">Hard</span>
                  <span className="text-gray-900">{metrics?.hardSolved || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#EF4743] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${metrics?.totalSolved ? (metrics.hardSolved / metrics.totalSolved) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>

            {/* Card Footer (Activity) */}
            <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-orange-500" />
                <span className="text-sm font-bold text-gray-900">Consistency</span>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">This Week</span>
                  <span className="text-sm font-black text-[#1A5F53]">{metrics?.thisWeek > 0 ? `+${metrics.thisWeek}` : '0'}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">This Month</span>
                  <span className="text-sm font-black text-[#1A5F53]">{metrics?.thisMonth > 0 ? `+${metrics.thisMonth}` : '0'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
        {/* --- END LEETCODE CARD --- */}

        {/* --- PLACEHOLDER CARD --- */}
        <div className="snap-start shrink-0 w-full max-w-[420px] bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer group">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
            <Target size={28} className="text-gray-300" />
          </div>
          <h3 className="font-black text-gray-500 mb-1 text-lg">Add Platform</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-center">Connect HackerRank or CodeChef</p>
        </div>

      </div>
    </div>
  );
};