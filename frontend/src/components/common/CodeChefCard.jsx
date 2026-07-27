import React, { useState } from 'react';
import api from '../../services/api';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';

const CodeChefCard = ({ 
  isOwner,
  isConnected, 
  stats, 
  onConnectSuccess
}) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState(null);
  const [showInput, setShowInput] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/platforms/codechef/connect', { username });
      
      if (response.data.success) {
        if (onConnectSuccess) {
          onConnectSuccess(response.data.data); 
        }
        setShowInput(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect CodeChef');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (isDisconnecting) return;
    if (!window.confirm('Are you sure you want to disconnect CodeChef?')) return;
    
    setIsDisconnecting(true);
    try {
      const response = await api.delete('/platforms/codechef/disconnect');
      if (response.data.success) {
        if (onConnectSuccess) {
          onConnectSuccess({
            codechefUsername: null,
            codechefTotalSolved: 0,
            codechefStars: 0
          });
        }
      }
    } catch (err) {
      alert('Failed to disconnect CodeChef');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden transition-transform hover:-translate-y-1 duration-300 flex flex-col">
      {}

      {}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#5B3922] to-[#8C5A35]"></div>
      
      <div className="p-5 h-full flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#5B3922]/10 text-[#5B3922]">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">CodeChef</h2>
              {isConnected ? (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Connected as {stats?.codechefUsername}
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
              <span className="text-4xl font-black text-gray-900 leading-none">{stats?.codechefTotalSolved || 0}</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Solved</span>
            </div>
          )}
        </div>

        {isConnected ? (
          <div className="flex flex-col space-y-4 mb-8">
             <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Star Rating</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-black uppercase tracking-widest rounded-full border border-yellow-200">
                  {stats?.codechefStars || 0}★ Rating
                </span>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            {showInput ? (
              <form onSubmit={handleConnect} className="w-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                <label className="text-xs font-black text-gray-900 uppercase tracking-widest text-left w-full">Platform Username</label>
                <div className="flex flex-col gap-2 w-full">
                  <input
                    type="text"
                    placeholder="Enter CodeChef username"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-[#5B3922] focus:border-[#5B3922] outline-none transition-all text-sm"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                  {error && <p className="text-red-500 text-[10px] font-bold flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
                  <div className="flex gap-2 w-full mt-2">
                    <button
                      type="button"
                      onClick={() => setShowInput(false)}
                      disabled={loading}
                      className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold uppercase tracking-widest rounded-xl text-xs hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !username.trim()}
                      className="flex-[2] flex items-center justify-center gap-2 py-2 bg-gray-900 text-white font-bold uppercase tracking-widest rounded-xl text-xs hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-lg shadow-gray-900/20"
                    >
                      {loading ? <RefreshCw size={14} className="animate-spin" /> : 'Connect'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm font-medium mb-4 text-center">Connect your CodeChef account to sync progress.</p>
                <button
                  onClick={() => setShowInput(true)}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg shadow-gray-900/20"
                >
                  <Plus size={16} /> Connect Account
                </button>
              </>
            )}
          </div>
        )}

        {isConnected && (
          <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-3">
             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-green-500"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Data Synced</span>
             </div>
             {isOwner && (
               <div className="flex justify-end mt-auto">
                 <button
                   onClick={handleDisconnect}
                   disabled={isDisconnecting}
                   className="w-full py-2 bg-red-50 border border-red-100 rounded-lg text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                 >
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

export default CodeChefCard;
