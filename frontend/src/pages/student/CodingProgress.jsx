import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import { Code2, Terminal, Flame, RefreshCw, X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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

export const CodingProgress = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState([]);
  const [practiceSheets, setPracticeSheets] = useState([]);
  const [internalStats, setInternalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Input, 2: Preview
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [previewProfile, setPreviewProfile] = useState(null);

  const isOwner = user?.role === 'student';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resInt, resSheets, resExt] = await Promise.all([
        api.get('/progress/dashboard').catch(() => null),
        api.get('/practice').catch(() => null),
        api.get('/integrations').catch(() => null) 
      ]);

      if (resInt?.data?.success) setInternalStats(resInt.data.data);
      if (resSheets?.data?.success) setPracticeSheets(resSheets.data.sheets.filter(s => s.status === 'published'));
      if (resExt?.data?.success) setIntegrations(resExt.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async () => {
    if (!usernameInput.trim()) return;
    setVerifying(true);
    setVerifyError('');
    try {
      const res = await api.post(`/integrations/${selectedPlatform}/verify`, { username: usernameInput });
      if (res.data.success) {
        setPreviewProfile(res.data.data);
        setModalStep(2);
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleConnect = async () => {
    try {
      await api.post(`/integrations/${selectedPlatform}/connect`, { username: usernameInput });
      setModalOpen(false);
      fetchData(); // Reload integrations
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Connection failed.');
    }
  };

  const handleDisconnect = async (platform) => {
    if (!window.confirm(`Are you sure you want to disconnect ${PLATFORM_CONFIG[platform]?.name}?`)) return;
    try {
      await api.delete(`/integrations/${platform}`);
      fetchData();
    } catch (err) {
      alert('Disconnect failed');
    }
  };

  const openConnectModal = (platform) => {
    if (!isOwner) return;
    setSelectedPlatform(platform);
    setUsernameInput('');
    setVerifyError('');
    setModalStep(1);
    setPreviewProfile(null);
    setModalOpen(true);
  };

  const getPrimaryMetric = (integration) => {
    if (!integration?.statistics) return 0;
    return integration.statistics.problemStats?.total || integration.statistics.activityStats?.stars || integration.statistics.activityStats?.badges || 0;
  };

  // --- Combined Statistics Calculations ---
  let combinedTotal = internalStats?.progress?.totalSolved || 0;
  integrations.filter(i => i.syncStatus !== 'DISCONNECTED').forEach(i => {
    combinedTotal += getPrimaryMetric(i);
  });

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
    const integration = integrations.find(i => i.platform === platformKey);
    const isConnected = integration && integration.syncStatus !== 'DISCONNECTED';
    
    // Check if connected but never successfully synced yet
    const isPendingInitialSync = isConnected && !integration.lastSuccessfulSync;

    return (
      <div key={platformKey} className="snap-start shrink-0 w-full max-w-[420px] bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden transition-transform hover:-translate-y-1 duration-300 flex flex-col">
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${config.color}`}></div>
        <div className="p-8 h-full flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${config.bgColor} ${config.iconColor}`}>
                <Logo size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">{config.name}</h2>
                {isConnected ? (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Connected as {integration.username}
                  </p>
                ) : (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Not Connected
                  </p>
                )}
              </div>
            </div>
            {isConnected && !isPendingInitialSync && (
              <div className="flex flex-col items-end">
                <span className="text-4xl font-black text-gray-900 leading-none">{getPrimaryMetric(integration)}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Solved / Badges</span>
              </div>
            )}
          </div>

          {/* 🌮 PENDING INITIAL SYNC STATE */}
          {isPendingInitialSync ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={28} strokeWidth={2.5} />
              </div>
              <p className="text-gray-900 font-black text-sm uppercase tracking-widest mb-2">Account Linked Successfully!</p>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                Your data will be fetched automatically in the background by our system sync once a week 
              </p>
              <p className="text-xs text-gray-400 mt-4 font-bold uppercase tracking-widest">Check back later!</p>
            </div>
          ) : isConnected && integration.statistics?.problemStats?.total > 0 ? (
            <div className="space-y-4 mb-8">
              {['easy', 'medium', 'hard'].map((diff) => {
                const count = integration.statistics.problemStats[diff] || 0;
                const total = integration.statistics.problemStats.total || 1;
                const percentage = (count / total) * 100;
                const colors = {
                  easy: { text: 'text-[#00B8A3]', bg: 'bg-[#00B8A3]' },
                  medium: { text: 'text-[#FFC01E]', bg: 'bg-[#FFC01E]' },
                  hard: { text: 'text-[#EF4743]', bg: 'bg-[#EF4743]' }
                };
                
                if (integration.statistics.problemStats[diff] === undefined) return null;

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
            </div>
          ) : null}

          {isConnected ? (
            <div className="mt-auto pt-4 border-t border-gray-100">
               {integration.syncStatus === 'ERROR' && (
                 <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2 font-bold">
                   <AlertCircle size={14} /> Sync Failed: {integration.syncErrorMessage || 'Unknown error'}
                 </div>
               )}
               
               {isOwner && (
                 <div className="flex justify-end mt-auto">
                   <button 
                     onClick={() => handleDisconnect(platformKey)}
                     className="w-full py-2 bg-red-50 border border-red-100 rounded-lg text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-100 transition-colors">
                     Disconnect Platform
                   </button>
                 </div>
               )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
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
        </div>
      </div>
    );
  };

  return (
    <div className="w-full animate-in fade-in duration-700 font-sans pb-12 relative">
      
      {/* SECTION 1: Connected Platforms */}
      <div className="mb-6 px-2">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Connected Platforms</h3>
        <p className="text-sm font-medium text-gray-400 mt-1">Manage and sync your external coding profiles.</p>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-8 snap-x pt-2 px-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        
        {/* NEXUS Code Playground (Internal) */}
        <div className="snap-start shrink-0 w-full max-w-[420px] bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
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
                <span className="text-4xl font-black text-gray-900 leading-none">{internalStats?.progress?.totalSolved || 0}</span>
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
                  <div className="bg-[#00B8A3] h-full rounded-full" style={{ width: `${internalStats?.progress?.totalSolved ? (internalStats?.progress?.easySolved / internalStats?.progress?.totalSolved) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-bold">
                  <span className="text-[#FFC01E]">Medium</span>
                  <span className="text-gray-900">{internalStats?.progress?.mediumSolved || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#FFC01E] h-full rounded-full" style={{ width: `${internalStats?.progress?.totalSolved ? (internalStats?.progress?.mediumSolved / internalStats?.progress?.totalSolved) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-bold">
                  <span className="text-[#EF4743]">Hard</span>
                  <span className="text-gray-900">{internalStats?.progress?.hardSolved || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#EF4743] h-full rounded-full" style={{ width: `${internalStats?.progress?.totalSolved ? (internalStats?.progress?.hardSolved / internalStats?.progress?.totalSolved) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
            
            <div className="pt-5 border-t border-gray-100 flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Always Synced</span>
            </div>
          </div>
        </div>

        {/* Dynamic External Platform Cards */}
        {Object.keys(PLATFORM_CONFIG).map(platformKey => renderPlatformCard(platformKey))}
      </div>

      {/* SECTION 2: Platform Summary */}
      <div className="mt-12 px-2">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-6">Platform Summary</h3>
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col md:flex-row gap-8 items-center justify-between">
          <div>
            <h4 className="text-gray-500 font-bold mb-2 uppercase tracking-widest text-sm">Combined Coding Activity</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-gray-900">{combinedTotal}</span>
              <span className="text-gray-400 font-bold uppercase tracking-widest">Total Problems Solved</span>
            </div>
            <p className="text-sm text-gray-400 font-medium mt-2 max-w-sm">
              This metric represents your total output across all connected platforms, including the Nexus Playground.
            </p>
          </div>
          <div className="flex flex-col gap-4 w-full md:w-auto shrink-0">
             <div className="bg-orange-50 text-orange-600 px-6 py-4 rounded-2xl border border-orange-100 flex flex-col items-center justify-center shadow-sm w-full">
               <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1 flex items-center gap-1"><Flame size={12} strokeWidth={3} /> Current Streak</span>
               <span className="text-4xl font-black">{internalStats?.stats?.currentStreak || 0} 🔥</span>
             </div>
             <div className="grid grid-cols-2 gap-4 w-full">
               <div className="bg-gray-50 px-6 py-4 rounded-2xl flex flex-col justify-center border border-gray-100">
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nexus Output</span>
                 <span className="text-2xl font-black text-[#1A5F53]">{internalStats?.progress?.totalSolved || 0}</span>
               </div>
               {integrations.filter(i => i.syncStatus !== 'DISCONNECTED').map(i => (
                 <div key={i.platform} className="bg-gray-50 px-6 py-4 rounded-2xl flex flex-col justify-center border border-gray-100">
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{PLATFORM_CONFIG[i.platform]?.name || i.platform} Output</span>
                   <span className="text-2xl font-black text-gray-900">{getPrimaryMetric(i)}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
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
              {modalStep === 1 && (
                <div>
                  <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Platform Username</label>
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter your exact username"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                  {verifyError && <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1"><AlertCircle size={14}/> {verifyError}</p>}
                  
                  <button 
                    onClick={handleVerify}
                    disabled={!usernameInput.trim() || verifying}
                    className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 py-3 font-bold uppercase tracking-widest text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {verifying ? <RefreshCw size={18} className="animate-spin" /> : 'Verify Account'}
                  </button>
                </div>
              )}

              {modalStep === 2 && previewProfile && (
                <div className="animate-in fade-in duration-300">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center mb-6">
                    {previewProfile.avatarUrl ? (
                      <img src={previewProfile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-md" />
                    ) : (
                      <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-md bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-2xl">
                        {previewProfile.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h4 className="text-lg font-black text-gray-900">{previewProfile.displayName || previewProfile.username}</h4>
                    <p className="text-sm font-bold text-gray-400">@{previewProfile.username}</p>
                    {previewProfile.country && <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{previewProfile.country}</p>}
                  </div>

                  <button 
                    onClick={handleConnect}
                    className="w-full bg-[#1A5F53] hover:bg-[#13493f] text-white rounded-xl px-4 py-3 font-bold uppercase tracking-widest text-sm transition-colors shadow-lg shadow-emerald-900/20">
                    Yes, Connect This Account
                  </button>
                  <button 
                    onClick={() => setModalStep(1)}
                    className="mt-3 w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-3 font-bold uppercase tracking-widest text-sm transition-colors">
                    Wait, go back
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};