import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckSquare, Square, X } from 'lucide-react';
import api from '../../services/api';

const TeacherReschedulePanel = ({ examId }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [rescheduleData, setRescheduleData] = useState({
    newStartTime: '',
    newEndTime: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRescheduleRequests = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/tickets/reschedule/${examId}`);
        setTickets(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch tickets', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRescheduleRequests();
  }, [examId]);

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === tickets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tickets.map(t => t.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return alert('Select at least one student to reschedule.');
    if (!rescheduleData.newStartTime || !rescheduleData.newEndTime) return alert('Please set both start and end times.');

    if (new Date(rescheduleData.newEndTime) <= new Date(rescheduleData.newStartTime)) {
      return alert('End time must be after start time.');
    }

    try {
      setSubmitting(true);
      await api.post('/tickets/reschedule', {
        ticketIds: selectedIds,
        newStartTime: new Date(rescheduleData.newStartTime).toISOString(),
        newEndTime: new Date(rescheduleData.newEndTime).toISOString()
      });
      alert('Rescheduling successful!');
      
      // Update local state
      setTickets(tickets.map(t => {
        if (selectedIds.includes(t.id)) {
          return {
            ...t,
            isRescheduled: true,
            rescheduledStartTime: new Date(rescheduleData.newStartTime).toISOString(),
            rescheduledEndTime: new Date(rescheduleData.newEndTime).toISOString()
          };
        }
        return t;
      }));
      setSelectedIds([]);
      setRescheduleData({ newStartTime: '', newEndTime: '' });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reschedule exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 font-medium animate-pulse">Loading appeals...</div>;
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-12 border border-gray-100 border-dashed text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-400 font-bold tracking-widest uppercase text-xs">No approved appeals to reschedule.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          Approved Appeals
        </h3>

        <div className="overflow-x-auto rounded-xl border border-gray-100 mb-8">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4 cursor-pointer" onClick={handleSelectAll}>
                  {selectedIds.length === tickets.length && tickets.length > 0 ? (
                    <CheckSquare className="text-emerald-500" size={16} />
                  ) : (
                    <Square className="text-gray-300 hover:text-emerald-500 transition-colors" size={16} />
                  )}
                </th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Reason Given</th>
                <th className="px-6 py-4">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map(ticket => (
                <tr key={ticket.id} className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedIds.includes(ticket.id) ? 'bg-emerald-50/30' : ''}`} onClick={() => handleSelect(ticket.id)}>
                  <td className="px-6 py-4">
                    {selectedIds.includes(ticket.id) ? (
                      <CheckSquare className="text-emerald-500" size={16} />
                    ) : (
                      <Square className="text-gray-300" size={16} />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{ticket.student?.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono tracking-widest mt-1">{ticket.student?.studentId}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 line-clamp-2 max-w-xs">{ticket.reason}</td>
                  <td className="px-6 py-4">
                    {ticket.isRescheduled ? (
                      <span className="inline-flex flex-col text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                        <span>Rescheduled</span>
                        <span className="text-emerald-500/80">{new Date(ticket.rescheduledStartTime).toLocaleDateString()}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg">
                        Pending Time
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedIds.length > 0 && (
          <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Set Make-Up Window for {selectedIds.length} Student{selectedIds.length !== 1 && 's'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">New Start Time</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="datetime-local" 
                    value={rescheduleData.newStartTime}
                    onChange={e => setRescheduleData({...rescheduleData, newStartTime: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">New End Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="datetime-local" 
                    value={rescheduleData.newEndTime}
                    onChange={e => setRescheduleData({...rescheduleData, newEndTime: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-3 px-8 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 active:scale-95"
              >
                {submitting ? 'Applying...' : 'Apply Reschedule Window'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TeacherReschedulePanel;
