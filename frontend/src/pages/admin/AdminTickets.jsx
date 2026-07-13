import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, XCircle, Search, Clock } from 'lucide-react';
import api from '../../services/api';

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets/admin');
      setTickets(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleResolve = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this appeal as ${status}?`)) return;
    try {
      await api.patch(`/tickets/admin/${id}/resolve`, { status });
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update appeal');
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.exam?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Missed Exam Appeals</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Review and manage student appeals for missed exams.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by student, exam, or reason..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Exam</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium">Loading appeals...</td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium">No appeals found.</td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{ticket.student?.name}</div>
                      <div className="text-xs text-gray-500">{ticket.student?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-700">{ticket.exam?.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{ticket.exam?.examCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 line-clamp-2" title={ticket.reason}>{ticket.reason}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 flex flex-col items-start gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        ticket.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        ticket.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {ticket.status === 'pending' && <Clock size={12} />}
                        {ticket.status === 'approved' && <CheckCircle2 size={12} />}
                        {ticket.status === 'rejected' && <XCircle size={12} />}
                        {ticket.status}
                      </span>
                      {ticket.appealNumber === 2 && (
                        <span className="bg-[#ff7b00]/10 text-[#ff7b00] border border-[#ff7b00]/20 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest mt-1">Final Appeal</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ticket.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleResolve(ticket.id, 'approved')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                            <CheckCircle2 size={18} />
                          </button>
                          <button onClick={() => handleResolve(ticket.id, 'rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                            <XCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Resolved by {ticket.resolver?.name}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTickets;
