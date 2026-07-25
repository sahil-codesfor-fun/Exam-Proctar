import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Code2, Terminal, Flame, RefreshCw, X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CodeChefCard from '../../components/common/CodeChefCard';

// 🌮 DYNAMIC PLATFORM CONFIGURATION
const PLATFORM_CONFIG = {
  LEETCODE: {
    name: 'LeetCode',
    color: 'from-[#FFA116] to-amber-300',
    iconColor: 'text-[#FFA116]',
    bgColor: 'bg-orange-50',
    logo: Code2
  },
  HACKERRANK: {
    name: 'HackerRank',
    color: 'from-[#2EC866] to-[#4ceb83]',
    iconColor: 'text-[#2EC866]',
    bgColor: 'bg-[#2EC866]/10',
    logo: Terminal
  }
};

// 🌑 THE DARK MODE HEATMAP COMPONENT (Now 100% authentic, no fake data!)
const NexusContributionGraph = ({ activityMap }) => {
  const [days, setDays] = useState([]);
  const [monthLabels, setMonthLabels] = useState([]);

  useEffect(() => {
    const temp = [];
    // Determine the calendar year (Jan 1 to Dec 31)
    const currentYear = new Date().getUTCFullYear();
    const startDate = new Date(Date.UTC(currentYear, 0, 1));
    const endDate = new Date(Date.UTC(currentYear, 11, 31));

    // Get the day of the week for Jan 1 (0 = Sunday, 6 = Saturday)
    const startDayOfWeek = startDate.getUTCDay();

    // Pad the beginning with null to align the first date to its correct weekday
    for (let i = 0; i < startDayOfWeek; i++) {
      temp.push({ date: null, count: 0, isPadding: true });
    }

    // Generate days from startDate to endDate
    const iterDate = new Date(startDate);
    while (iterDate <= endDate) {
      const d = new Date(iterDate);
      const dateStr = d.toISOString().split('T')[0];
      const count = activityMap?.[dateStr] || 0;

      temp.push({ date: d, count, isPadding: false });
      
      // Move to next day
      iterDate.setUTCDate(iterDate.getUTCDate() + 1);
    }
    setDays(temp);

    // Calculate dynamic month labels with colSpan
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totalColumns = Math.ceil(temp.length / 7);
    const labels = [];
    
    let currentMonthStr = null;
    let currentSpan = 0;

    for (let col = 0; col < totalColumns; col++) {
      const columnDays = temp.slice(col * 7, col * 7 + 7);
      const firstValidDay = columnDays.find(d => !d.isPadding);
      
      if (firstValidDay) {
        const monthIndex = firstValidDay.date.getMonth();
        const monthName = monthsName[monthIndex];
        
        if (currentMonthStr !== monthName) {
          if (currentMonthStr !== null) {
            labels.push({ label: currentMonthStr, colSpan: currentSpan });
          }
          currentMonthStr = monthName;
          currentSpan = 1;
        } else {
          currentSpan++;
        }
      } else {
        currentSpan++;
      }
    }
    if (currentMonthStr !== null) {
      labels.push({ label: currentMonthStr, colSpan: currentSpan });
    }
    
    setMonthLabels({ labels, totalColumns });
  }, [activityMap]);

  const getLevelClass = (count) => {
    if (count === 0) return 'bg-[#161b22]'; // Dark empty square
    if (count === 1) return 'bg-[#0e4429]'; // Light green
    if (count === 2) return 'bg-[#006d32]'; // Med green
    if (count === 3) return 'bg-[#26a641]'; // Bright green
    return 'bg-[#39d353]'; // Super bright green
  };

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-6 mt-8 shadow-2xl overflow-hidden w-full">
      <h4 className="text-gray-300 font-bold mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
        <Code2 size={16} className="text-[#39d353]" /> Nexus Activity Heatmap
      </h4>

      <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-[#0d1117]">
        <div className="min-w-[750px]">

          <div className="flex gap-2">
            {/* Days of Week Labels */}
            <div className="flex flex-col gap-[3px] text-[9px] text-gray-400 font-medium pr-2 mt-5">
              <span className="h-[10px]"></span>
              <span className="h-[10px] leading-[10px]">Mon</span>
              <span className="h-[10px]"></span>
              <span className="h-[10px] leading-[10px]">Wed</span>
              <span className="h-[10px]"></span>
              <span className="h-[10px] leading-[10px]">Fri</span>
              <span className="h-[10px]"></span>
            </div>
            
            {/* Grid Squares and Months */}
            <div className="flex flex-col w-full">
               {/* Months Header - EXACT ALIGNMENT USING FLEX PERCENTAGES */}
               <div className="flex mb-1 w-full text-[10px] text-gray-400 font-medium">
                  {monthLabels.labels?.map((m, i) => (
                    <span 
                      key={i} 
                      style={{ width: `${(m.colSpan / monthLabels.totalColumns) * 100}%` }}
                      className="inline-block text-left"
                    >
                      {m.label}
                    </span>
                  ))}
               </div>
               
               {/* Grid Squares */}
               <div className="grid grid-flow-col grid-rows-7 gap-[3px] w-full">
                 {days.map((day, i) => (
                   <div 
                     key={i} 
                     className={`w-[10px] h-[10px] rounded-[2px] transition-colors duration-300 ${day.isPadding ? 'bg-transparent' : getLevelClass(day.count)} ${!day.isPadding ? 'hover:ring-1 hover:ring-white/50 cursor-pointer' : ''}`} 
                     title={day.isPadding ? '' : `${day.count} contributions on ${day.date?.toDateString()}`}
                   ></div>
                 ))}
               </div>
            </div>
          </div>

          {/* Footer Legend */}
          <div className="flex justify-between items-center mt-3 pt-2">
            <span className="text-[10px] text-gray-500 font-medium hover:text-blue-400 cursor-pointer transition-colors pl-8">
              Learn how we count contributions
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium pr-4">
              <span>Less</span>
              <div className="flex gap-[3px]">
                <div className="w-[10px] h-[10px] rounded-[2px] bg-[#161b22]"></div>
                <div className="w-[10px] h-[10px] rounded-[2px] bg-[#0e4429]"></div>
                <div className="w-[10px] h-[10px] rounded-[2px] bg-[#006d32]"></div>
                <div className="w-[10px] h-[10px] rounded-[2px] bg-[#26a641]"></div>
                <div className="w-[10px] h-[10px] rounded-[2px] bg-[#39d353]"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CodingProgress = () => {
  const { user } = useAuth();
  const [practiceSheets, setPracticeSheets] = useState([]);
  const [courses, setCourses] = useState([]);
  const [internalStats, setInternalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Never';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return "Just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  };

  const isOwner = user?.role === 'student';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resInt, resSheets, resCourses] = await Promise.all([
        api.get('/progress/dashboard').catch(() => null),
        api.get('/practice').catch(() => null),
        api.get('/hub-courses').catch(() => null)
      ]);

      if (resInt?.data?.success) setInternalStats(resInt.data.data);
      if (resSheets?.data?.success) setPracticeSheets(resSheets.data.sheets.filter(s => s.status === 'published'));
      if (resCourses?.data?.success) setCourses(resCourses.data.courses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnect = async () => {
    if (!usernameInput.trim()) return;
    if (isConnecting) return;
    setIsConnecting(true);
    setVerifyError('');
    try {
      await api.post(`/platforms/${selectedPlatform.toLowerCase()}/connect`, { username: usernameInput });
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Connection failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (platform) => {
    if (isDisconnecting) return;
    if (!window.confirm(`Are you sure you want to disconnect ${PLATFORM_CONFIG[platform]?.name}?`)) return;
    setIsDisconnecting(true);
    try {
      await api.delete(`/platforms/${platform.toLowerCase()}/disconnect`);
      fetchData();
    } catch (err) {
      alert('Disconnect failed');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const openConnectModal = (platform) => {
    if (!isOwner) return;
    setSelectedPlatform(platform);
    setUsernameInput('');
    setVerifyError('');
    setModalOpen(true);
  };

  const getPrimaryMetric = (platformKey) => {
    if (!internalStats?.user) return 0;
    const key = `${platformKey.toLowerCase()}TotalSolved`;
    return internalStats.user[key] || 0;
  };

  // --- Combined Statistics & Progress Calculations ---
  // Ensure the formula is strictly: totalProblemsSolved = external + unifiedNexusCount
  const unifiedNexusCount = internalStats?.nexusSolvedCount || internalStats?.progress?.totalSolved || 0;
  let combinedTotal = unifiedNexusCount;
  
  if (internalStats?.user?.leetcodeUsername) combinedTotal += getPrimaryMetric('LEETCODE');
  if (internalStats?.user?.hackerrankUsername) combinedTotal += getPrimaryMetric('HACKERRANK');
  if (internalStats?.user?.codechefUsername) combinedTotal += getPrimaryMetric('CODECHEF');

  // 🚀 FALLBACK CALCULATION
  const sheetQuestionsCount = practiceSheets.reduce((acc, sheet) => {
    return acc + (sheet.questions?.length || sheet.problems?.length || sheet.totalQuestions || 0);
  }, 0);

  const calculatedUploaded = sheetQuestionsCount;

  // Use the newly added backend metric specifically for Practice Sheets
  const nexusSolved = unifiedNexusCount;
  const nexusUploaded = internalStats?.progress?.totalUploaded || calculatedUploaded || Math.max(nexusSolved, 1);
  const nexusProgressPercent = nexusUploaded > 0 ? Math.round((nexusSolved / nexusUploaded) * 100) : 0;

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A5F53] border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-[#1A5F53] font-black text-sm uppercase tracking-widest animate-pulse">Fetching Telemetry...</span>
      </div>
    );
  }

  const renderPlatformCard = (platformKey) => {
    const config = PLATFORM_CONFIG[platformKey];
    const Logo = config.logo;
    const usernameField = `${platformKey.toLowerCase()}Username`;
    const username = internalStats?.user?.[usernameField];
    const isConnected = !!username;

    return (
      <div key={platformKey} className="w-full bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden transition-transform hover:-translate-y-1 duration-300 flex flex-col">
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${config.color}`}></div>
        <div className="p-5 h-full flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${config.bgColor} ${config.iconColor}`}>
                <Logo size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">{config.name}</h2>
                {isConnected ? (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Connected as {username}
                  </p>
                ) : (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Not Connected
                  </p>
                )}
              </div>
            </div>
            {isConnected && (
              <div className="flex flex-col items-end">
                <span className="text-4xl font-black text-gray-900 leading-none">{getPrimaryMetric(platformKey)}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Solved</span>
              </div>
            )}
          </div>

          {isConnected ? (
            <div className="space-y-4 mb-8 flex-1 mt-6">
              {platformKey === 'LEETCODE' && (
                <>
                  {['easy', 'medium', 'hard'].map((diff) => {
                    const fieldMap = {
                      easy: 'leetcodeEasySolved',
                      medium: 'leetcodeMediumSolved',
                      hard: 'leetcodeHardSolved'
                    };
                    const count = internalStats?.user?.[fieldMap[diff]] || 0;
                    const total = internalStats?.user?.leetcodeTotalSolved || 1;
                    const percentage = (count / total) * 100;
                    const colors = {
                      easy: { text: 'text-[#00B8A3]', bg: 'bg-[#00B8A3]' },
                      medium: { text: 'text-[#FFC01E]', bg: 'bg-[#FFC01E]' },
                      hard: { text: 'text-[#EF4743]', bg: 'bg-[#EF4743]' }
                    };

                    return (
                      <div key={diff}>
                        <div className="flex justify-between text-sm mb-1.5 font-bold capitalize">
                          <span className={colors[diff].text}>{diff}</span>
                          <span className="text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div className={`${colors[diff].bg} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-6">
              <p className="text-sm font-medium mb-4 text-center">Connect your {config.name} account to sync progress.</p>
              {isOwner && (
                <button
                  onClick={() => openConnectModal(platformKey)}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg shadow-gray-900/20">
                  <Plus size={16} /> Connect Account
                </button>
              )}
            </div>
          )}

          {isConnected && (
            <div className="mt-auto pt-4 border-t border-gray-100">
              {isOwner && (
                <div className="flex justify-end mt-auto">
                  <button
                    onClick={() => handleDisconnect(platformKey)}
                    disabled={isDisconnecting}
                    className="w-full py-2 bg-red-50 border border-red-100 rounded-lg text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect Platform'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full animate-in fade-in duration-700 font-sans pb-12 relative">

      {/* 🚀 SECTION 1: Platform Summary (Kept at Top) */}
      <div className="mb-12 px-2">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-6">Platform Summary</h3>
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col gap-8">

          {/* Top Row: Overall Stats & Breakdown */}
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="w-full md:w-1/2">
              <h4 className="text-gray-500 font-bold mb-2 uppercase tracking-widest text-sm">Combined Coding Activity</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-gray-900">{combinedTotal}</span>
                <span className="text-gray-400 font-bold uppercase tracking-widest">Total Problems Solved</span>
              </div>
              <p className="text-sm text-gray-400 font-medium mt-2 max-w-sm">
                This metric represents your total output across all connected platforms, including the Nexus Playground.
              </p>

              {/* THE SMART PROGRESS BAR */}
              <div className="mt-8 border-t border-gray-100 pt-6 pr-4">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nexus Playground Progress</span>
                    <p className="text-sm font-bold text-gray-700">{nexusSolved} / {nexusUploaded} Questions Solved</p>
                  </div>
                  <span className="text-xl font-black text-[#1A5F53]">{nexusProgressPercent}%</span>
                </div>
                <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${nexusProgressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full md:w-1/2 shrink-0">
              <div className="bg-orange-50 text-orange-600 px-6 py-4 rounded-2xl border border-orange-100 flex flex-col items-center justify-center shadow-sm w-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1 flex items-center gap-1"><Flame size={12} strokeWidth={3} /> Current Streak</span>
                <span className="text-4xl font-black">{internalStats?.stats?.currentStreak || 0} 🔥</span>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-gray-50 px-6 py-4 rounded-2xl flex flex-col justify-center border border-gray-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nexus Output</span>
                  <span className="text-2xl font-black text-[#1A5F53]">{nexusSolved}</span>
                </div>
                {['LEETCODE', 'HACKERRANK'].filter(k => !!internalStats?.user?.[`${k.toLowerCase()}Username`]).map(k => (
                  <div key={k} className="bg-gray-50 px-6 py-4 rounded-2xl flex flex-col justify-center border border-gray-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{PLATFORM_CONFIG[k]?.name || k} Output</span>
                    <span className="text-2xl font-black text-gray-900">{getPrimaryMetric(k)}</span>
                  </div>
                ))}
                {!!internalStats?.user?.codechefUsername && (
                  <div className="bg-gray-50 px-6 py-4 rounded-2xl flex flex-col justify-center border border-gray-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">CodeChef Output</span>
                    <span className="text-2xl font-black text-gray-900">{internalStats?.user?.codechefTotalSolved || 0}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 SECTION 2: Connected Platforms (Perfect CSS Grid, NO Scrollbars) */}
      <div className="mb-6 px-2 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Connected Platforms</h3>
          <p className="text-sm font-medium text-gray-400 mt-1">Manage and sync your external coding profiles.</p>
        </div>
        
        {/* UNIFIED SYNC UI */}
        <div className="flex flex-col md:items-end gap-2 relative">
           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 
             Last Updated: {getRelativeTime(internalStats?.user?.platformsLastSyncedAt)}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-2 px-2 pb-8">

        {/* NEXUS Code Playground (Internal) */}
        <div className="w-full bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden transition-transform hover:-translate-y-1 duration-300 flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
          <div className="p-5 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Code2 size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Nexus Playground</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Native Integration
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-4xl font-black text-gray-900 leading-none">{nexusSolved}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Solved</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-bold">
                  <span className="text-[#00B8A3]">Easy</span>
                  <span className="text-gray-900">{internalStats?.progress?.easySolved || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#00B8A3] h-full rounded-full" style={{ width: `${nexusSolved ? (internalStats?.progress?.easySolved / nexusSolved) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-bold">
                  <span className="text-[#FFC01E]">Medium</span>
                  <span className="text-gray-900">{internalStats?.progress?.mediumSolved || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#FFC01E] h-full rounded-full" style={{ width: `${nexusSolved ? (internalStats?.progress?.mediumSolved / nexusSolved) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-bold">
                  <span className="text-[#EF4743]">Hard</span>
                  <span className="text-gray-900">{internalStats?.progress?.hardSolved || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#EF4743] h-full rounded-full" style={{ width: `${nexusSolved ? (internalStats?.progress?.hardSolved / nexusSolved) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-5 border-t border-gray-100 flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Always Synced</span>
            </div>
          </div>
        </div>

        {/* Dynamic External Platform Cards */}
        {Object.keys(PLATFORM_CONFIG).map(platformKey => renderPlatformCard(platformKey))}

        {/* CodeChef Specific Card */}
        <CodeChefCard 
          isOwner={isOwner}
          isConnected={!!internalStats?.user?.codechefUsername}
          stats={internalStats?.user}
          onConnectSuccess={(data) => {
            // Update local state immediately for seamless UX
            setInternalStats(prev => ({
              ...prev,
              user: {
                ...prev.user,
                codechefUsername: data.codechefUsername,
                codechefTotalSolved: data.codechefTotalSolved,
                codechefStars: data.codechefStars
              }
            }));
          }}
        />
      </div>

      {/* 🚀 SECTION 3: The Dark Mode Contribution Graph (Moved to the very bottom) */}
      <div className="px-2 pb-12">
        <NexusContributionGraph activityMap={internalStats?.activityMap} />
      </div>

      {/* CONNECTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`h-2 w-full bg-gradient-to-r ${PLATFORM_CONFIG[selectedPlatform]?.color}`}></div>
            <div className="p-6 pb-0 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900">Connect {PLATFORM_CONFIG[selectedPlatform]?.name}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6">
              <div className="animate-in fade-in duration-300">
                <div>
                  <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Platform Username</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter your exact username"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                  {verifyError && <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1"><AlertCircle size={14} /> {verifyError}</p>}

                  <button
                    onClick={handleConnect}
                    disabled={!usernameInput.trim() || isConnecting}
                    className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 py-3 font-bold uppercase tracking-widest text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {isConnecting ? <RefreshCw size={18} className="animate-spin" /> : 'Connect Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};