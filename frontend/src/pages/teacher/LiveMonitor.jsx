import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';

export function LiveMonitor() {
  const [sheets, setSheets] = useState([]);
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [liveEvents, setLiveEvents] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Fetch active sheets for the teacher to select
    api.get('/practice').then(res => {
      if (res.data.success) {
        setSheets(res.data.sheets);
      }
    });

    const newSocket = io('http://localhost:5002/practice');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && selectedSheetId) {
      socket.emit('join_sheet', { sheetId: selectedSheetId, role: 'teacher' });

      socket.on('new_submission', (data) => {
        setLiveEvents(prev => [data, ...prev].slice(0, 50)); // Keep last 50 events
      });

      return () => {
        socket.emit('leave_sheet', { sheetId: selectedSheetId });
        socket.off('new_submission');
      };
    }
  }, [socket, selectedSheetId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-6">Live Practice Monitor</h1>
      
      <div className="mb-6">
        <label className="block text-[#8b949e] text-sm mb-2">Select Practice Sheet to Monitor</label>
        <select 
          value={selectedSheetId} 
          onChange={e => { setSelectedSheetId(e.target.value); setLiveEvents([]); }}
          className="w-full md:w-1/3 bg-[#161b22] border border-[#30363d] rounded p-2 text-[#c9d1d9]"
        >
          <option value="">-- Select Sheet --</option>
          {sheets.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden">
          <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] font-bold text-[#e6edf3]">
            Live Activity Feed
          </div>
          <div className="p-4 flex flex-col gap-3 h-[500px] overflow-y-auto">
            {liveEvents.length === 0 ? (
              <div className="text-[#8b949e] text-center mt-10">Waiting for student submissions...</div>
            ) : (
              liveEvents.map((evt, idx) => (
                <div key={idx} className="bg-[#161b22] border border-[#30363d] p-3 rounded shadow">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#58a6ff]">{evt.studentName} ({evt.rollNo})</span>
                    <span className="text-xs text-[#8b949e]">{new Date(evt.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-sm text-[#c9d1d9] flex justify-between items-center mt-2">
                    <span>Question ID: {evt.questionId.substring(0, 8)}...</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${evt.verdict === 'accepted' ? 'bg-[#2ea04315] text-[#3fb950]' : 'bg-[#da363315] text-[#f85149]'}`}>
                      {evt.verdict === 'accepted' ? 'Accepted' : 'Failed'} (Attempt #{evt.attemptNumber})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
