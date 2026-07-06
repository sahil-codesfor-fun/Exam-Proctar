import React, { useEffect, useState } from 'react';
import api from '../../services/api'; 
import { Users, Code2, Terminal, ChevronDown, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';

// 🌮 THE SALSA SWITCHER: Styles rows dynamically based on the platform!
const getPlatformStyling = (platformString) => {
  const platform = (platformString || 'LEETCODE').toUpperCase();
  
  if (platform === 'HACKERRANK') {
    return {
      name: 'HackerRank',
      icon: <Terminal size={14} strokeWidth={2.5} />,
      bg: 'bg-[#2EC866]/10',
      text: 'text-[#2EC866]',
      easy: 'text-[#2EC866]', 
      medium: 'text-[#FFC01E]',
      hard: 'text-[#EF4743]'
    };
  }

  if (platform === 'NEXUS') {
    return {
      name: 'Nexus Playground',
      icon: <Code2 size={14} strokeWidth={2.5} />,
      bg: 'bg-emerald-50',
      text: 'text-[#1A5F53]',
      easy: 'text-[#00B8A3]',
      medium: 'text-[#FFC01E]',
      hard: 'text-[#EF4743]'
    };
  }
  
  // Default to LeetCode
  return {
    name: 'LeetCode',
    icon: <Code2 size={14} strokeWidth={2.5} />,
    bg: 'bg-orange-50',
    text: 'text-[#FFA116]',
    easy: 'text-[#00B8A3]',
    medium: 'text-[#FFC01E]',
    hard: 'text-[#EF4743]'
  };
};

export const TeacherCodingProgress = () => {
  const [groupedStudents, setGroupedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State to track which student rows are expanded
  const [expandedRows, setExpandedRows] = useState({});
  
  // State for Universal Sync
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncWarning, setSyncWarning] = useState('');

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/metrics/all');
      
      if (res.data.success) {
        const rawData = res.data.data;
        
        // 🧠 THE BRAIN: Group the flat data by Student ID
        const grouped = rawData.reduce((acc, curr) => {
          const m = curr || {};
          const sId = m.user?.studentId || m.id || 'unknown';
          
          if (!acc[sId]) {
            acc[sId] = {
              user: m.user,
              totalSolved: 0,
              easySolved: 0,
              mediumSolved: 0,
              hardSolved: 0,
              platforms: []
            };
          }
          
          // Add to the student's combined totals
          acc[sId].totalSolved += (m.totalSolved || 0);
          acc[sId].easySolved += (m.easySolved || 0);
          acc[sId].mediumSolved += (m.mediumSolved || 0);
          acc[sId].hardSolved += (m.hardSolved || 0);
          
          // Push the specific platform data into their array
          acc[sId].platforms.push(m);
          
          return acc;
        }, {});

        // Convert the object back to an array and sort by whoever has the most total solved
        const sortedArray = Object.values(grouped).sort((a, b) => b.totalSolved - a.totalSolved);
        setGroupedStudents(sortedArray);
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

  useEffect(() => {
    fetchAllStats();
  }, []);

  const toggleRow = (studentId) => {
    setExpandedRows(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleUniversalSync = async () => {
    // 🛡️ COOLDOWN: 24-hour rate limit for the whole class
    const lastSync = localStorage.getItem('global_sync_time');
    if (lastSync && (Date.now() - parseInt(lastSync) < 86400000)) {
        setSyncWarning('¡Cálmate! Universal sync is limited to once every 24 hours to protect our servers.');
        setTimeout(() => setSyncWarning(''), 4000);
        return;
    }

    setIsSyncingAll(true);
    try {
      // ⚠️ Note to Jefe: Make sure you create this backend route to trigger a mass sync if you haven't!
      // If it doesn't exist yet, this will just gracefully fail and refresh the page data anyway.
      await api.post('/integrations/sync-all').catch(() => console.log('Mass sync route not found, refreshing data instead.'));
      
      localStorage.setItem('global_sync_time', Date.now().toString());
      await fetchAllStats();
    } catch (err) {
      console.error('Universal sync failed', err);
    } finally {
      setIsSyncingAll(false);
    }
  };

  if (loading && groupedStudents.length === 0) {
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
      
      {/* Header Section with Universal Sync Button */}
      <div className="mb-8 px-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 shrink-0">
            <Users size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Coding Progress Monitor</h3>
            <p className="text-sm font-medium text-gray-400 mt-1">Real-time platform integrations across all active students.</p>
          </div>
        </div>

        {/* 🚀 Universal Sync Button */}
        <div className="flex flex-col items-end">
          <button 
            onClick={handleUniversalSync}
            disabled={isSyncingAll}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-gray-900/20 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncingAll ? "animate-spin" : ""} />
            {isSyncingAll ? 'Syncing Class...' : 'Universal Sync'}
          </button>
          {syncWarning && (
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-2 animate-in slide-in-from-top-1">
               <AlertCircle size={10} className="inline mr-1" /> {syncWarning}
            </span>
          )}
        </div>
      </div>

      {/* 🚀 THE SLEEK ACCORDION UI */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        
        {/* Table Header Row */}
        <div className="flex items-center py-4 px-8 bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <div className="w-1/3">Student</div>
          <div className="w-1/4">Combined Output</div>
          <div className="w-1/4">Total Easy / Med / Hard</div>
          <div className="w-1/6 text-right">Details</div>
        </div>

        {/* Student Grouped Rows */}
        <div className="flex flex-col">
          {groupedStudents.map((student) => {
            const sId = student.user?.studentId || 'unknown';
            const isExpanded = expandedRows[sId];

            return (
              <React.Fragment key={sId}>
                {/* 🔽 TOP LEVEL ROW (Clickable) */}
                <div 
                  onClick={() => toggleRow(sId)}
                  className={`flex items-center py-5 px-8 bg-white cursor-pointer transition-colors group ${isExpanded ? 'border-b border-gray-50' : 'border-b border-gray-100 hover:bg-gray-50/50'}`}
                >
                  {/* Column 1: Student Name */}
                  <div className="w-1/3 pr-4">
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-[#1A5F53] transition-colors truncate">
                      {student.user?.name || 'Unknown Student'}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5 font-mono uppercase tracking-widest">
                      {student.user?.studentId || 'N/A'} • {student.platforms.length} Platforms
                    </p>
                  </div>

                  {/* Column 2: Combined Total Solved */}
                  <div className="w-1/4 flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-[#1A5F53]">{student.totalSolved}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Solved</span>
                  </div>

                  {/* Column 3: Combined Difficulty */}
                  <div className="w-1/4 flex items-center gap-4 text-sm font-black">
                    <span className="text-[#00B8A3]">{student.easySolved}</span>
                    <span className="text-gray-200">/</span>
                    <span className="text-[#FFC01E]">{student.mediumSolved}</span>
                    <span className="text-gray-200">/</span>
                    <span className="text-[#EF4743]">{student.hardSolved}</span>
                  </div>

                  {/* Column 4: Expand Toggle */}
                  <div className="w-1/6 flex justify-end">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                      {isExpanded ? <ChevronUp size={16} strokeWidth={3} /> : <ChevronDown size={16} strokeWidth={3} />}
                    </div>
                  </div>
                </div>

                {/* ⏬ EXPANDED PLATFORM DETAILS */}
                {isExpanded && (
                  <div className="bg-gray-50/50 border-b border-gray-100 shadow-inner">
                    {student.platforms.map((m, index) => {
                      const pInfo = getPlatformStyling(m.platform);
                      
                      return (
                        <div key={m.id || index} className="flex items-center py-4 px-8 pl-16 border-t border-gray-100/50 hover:bg-white transition-colors">
                          
                          {/* Sub-Column 1: Platform Icon & Name */}
                          <div className="w-1/3 flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-md ${pInfo.bg} ${pInfo.text} flex items-center justify-center shrink-0`}>
                              {pInfo.icon}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{pInfo.name}</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">#{m.ranking?.toLocaleString() || '0'} Rank</span>
                            </div>
                          </div>

                          {/* Sub-Column 2: Platform Total */}
                          <div className="w-1/4 flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-gray-700">{m.totalSolved || 0}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Solved</span>
                          </div>

                          {/* Sub-Column 3: Platform Difficulty */}
                          <div className="w-1/4 flex items-center gap-3 text-xs font-black">
                            <span className={pInfo.easy}>{m.easySolved || 0}</span>
                            <span className="text-gray-200">/</span>
                            <span className={pInfo.medium}>{m.mediumSolved || 0}</span>
                            <span className="text-gray-200">/</span>
                            <span className={pInfo.hard}>{m.hardSolved || 0}</span>
                          </div>

                          {/* Sub-Column 4: Activity Status */}
                          <div className="w-1/6 flex flex-col items-end justify-center gap-1">
                             <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-all ${
                              m.thisWeek > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                             }`}>
                              {m.thisWeek > 0 ? `+${m.thisWeek} Wk` : '0 Wk'}
                            </span>
                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-all ${
                              m.thisMonth > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {m.thisMonth > 0 ? `+${m.thisMonth} Mo` : '0 Mo'}
                            </span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Empty State */}
          {groupedStudents.length === 0 && !loading && (
             <div className="text-center py-20 bg-white">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No student metrics found in the database.</p>
             </div>
          )}
        </div>
      </div>

    </div>
  );
};