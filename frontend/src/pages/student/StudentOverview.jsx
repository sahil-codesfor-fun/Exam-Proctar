import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../services/api';

const getExamValue = (exam, sub) => {
  if (sub && sub.maxScore) return sub.maxScore;
  const isRandomized = exam.randomizeQuestions === true || exam.randomizeQuestions === 'true' || exam.randomizeQuestions === 1;
  if (!isRandomized) {
    return exam.totalMarks || exam.questions?.reduce((acc, q) => acc + (Number(q.points) || 10), 0) || 0;
  }
  const isTypeDistEnabled = exam.proctoringRules?.enableTypeDistribution || exam.proctoring?.enableTypeDistribution;
  const dist = exam.proctoringRules?.typeDistribution || exam.proctoring?.typeDistribution;
  if (isTypeDistEnabled && dist) {
    let estimatedTotal = 0;
    ['mcq', 'coding', 'matching', 'subjective'].forEach(t => {
       const reqCount = parseInt(dist[t], 10) || 0;
       if (reqCount > 0) {
          const sampleQ = exam.questions?.find(q => q.type === t);
          const pts = sampleQ ? (Number(sampleQ.points) || 10) : 10;
          estimatedTotal += (reqCount * pts);
       }
    });
    return estimatedTotal > 0 ? estimatedTotal : (exam.totalMarks || 0);
  }
  const serveLimit = parseInt(exam.questionsToServe, 10);
  if (!isNaN(serveLimit) && serveLimit > 0 && exam.questions?.length > 0) {
     const avgPoints = exam.questions.reduce((acc, q) => acc + (Number(q.points) || 10), 0) / exam.questions.length;
     return Math.round(serveLimit * avgPoints);
  }
  return exam.totalMarks || exam.questions?.reduce((acc, q) => acc + (Number(q.points) || 10), 0) || 0;
};

const StudentOverview = () => {
  const navigate = useNavigate();
  const { exams, submissions, activeExams, upcomingExams, getSub, nowTime } = useOutletContext();
  const [myTickets, setMyTickets] = useState([]);
  const [ticketModal, setTicketModal] = useState({ open: false, examId: null, examTitle: '', reason: '' });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get('/tickets/my');
        setMyTickets(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch tickets', err);
      }
    };
    fetchTickets();
  }, []);

  const handleSubmitTicket = async () => {
    if (!ticketModal.reason.trim()) return alert('Please provide a reason');
    setSubmittingTicket(true);
    try {
      const res = await api.post('/tickets', { examId: ticketModal.examId, reason: ticketModal.reason });
      setMyTickets([res.data.data, ...myTickets]);
      setTicketModal({ open: false, examId: null, examTitle: '', reason: '' });
      alert('Ticket submitted successfully');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const getTicketStatus = (examId) => myTickets.find(t => (t.exam?._id || t.exam?.id || t.examId) === examId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      <div className="lg:col-span-8 space-y-10 pb-20">
        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
            <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
            Assessment Feed
          </h3>
          
          {activeExams.length === 0 && upcomingExams.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-16 border border-gray-100 text-center">
              <div className="text-4xl mb-4 opacity-20">📂</div>
              <p className="text-xs font-black text-gray-300 uppercase tracking-widest italic">No deployments found in this sector.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeExams.map(exam => {
                const examIdSafe = exam._id || exam.id;
                const sub = getSub(examIdSafe);
                const done = sub && ['submitted', 'auto_submitted'].includes(sub.status);
                const inProgress = sub && sub.status === 'in_progress';
                const isExpired = exam.status === 'ended' || (exam.endTime && new Date(exam.endTime).getTime() < nowTime);
                
                const calculatedValue = getExamValue(exam, sub);

                return (
                  <div key={examIdSafe} className={`bg-white rounded-[2rem] border border-gray-100 p-8 hover:shadow-2xl hover:shadow-gray-200/50 transition-all group ${isExpired && !done ? 'opacity-60 grayscale' : ''}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{exam.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-gray-100 text-gray-600 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                            {exam.course || 'General'}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            • Faculty ID: {exam.creator?.name || exam.faculty?.name || 'Academic Core'}
                          </span>
                        </div>
                      </div>

                      {done ? (
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-emerald-100">✓ Completed</span>
                      ) : isExpired ? (
                        <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-gray-200">❌ Expired</span>
                      ) : inProgress ? (
                        <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-amber-100 animate-pulse">⏳ Session Open</span>
                      ) : (
                        <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-blue-100 italic">Ready to Initialize</span>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between pt-6 border-t border-gray-50 gap-4">
                      <div className="flex flex-wrap gap-4 md:gap-6">
                        {exam.startTime && (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-300 uppercase">Started At</span>
                            <span className="text-xs font-black text-gray-700">{new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-300 uppercase">Window</span>
                          <span className="text-xs font-black text-gray-700">{exam.durationMinutes}m</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-300 uppercase">Value</span>
                          <span className="text-xs font-black text-gray-700">{calculatedValue}pts</span>
                        </div>
                      </div>
                      
                      {!done && (
                        <>
                          {isExpired ? (
                            <div className="flex gap-2">
                              {getTicketStatus(examIdSafe) ? (
                                <span className={`font-black text-[10px] uppercase tracking-widest py-3 px-6 rounded-xl border ${getTicketStatus(examIdSafe).status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : getTicketStatus(examIdSafe).status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                  Ticket: {getTicketStatus(examIdSafe).status}
                                </span>
                              ) : (
                                <button 
                                  onClick={() => setTicketModal({ open: true, examId: examIdSafe, examTitle: exam.title, reason: '' })}
                                  className="font-black text-[10px] uppercase tracking-widest py-3 px-6 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                >
                                  Submit Ticket
                                </button>
                              )}
                            </div>
                          ) : (
                            <button 
                              onClick={() => navigate(`/exam/live/${examIdSafe}`)}
                              className="font-black text-[10px] uppercase tracking-widest py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95 bg-[#1A5F53] hover:bg-[#134d42] text-white shadow-emerald-900/10"
                            >
                              {inProgress ? 'Resume Terminal' : 'Initialize Exam'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {upcomingExams.length > 0 && (
          <section className="animate-in slide-in-from-bottom-4 duration-500 mt-12">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
              Upcoming Nodes
            </h4>
            
            <div className="space-y-4">
              {upcomingExams.map(exam => {
                const examIdSafe = exam._id || exam.id;
                const calculatedValue = getExamValue(exam, null);

                return (
                <div key={examIdSafe} className="bg-white rounded-[2rem] border border-gray-100 p-8 hover:shadow-2xl hover:shadow-gray-200/50 transition-all group opacity-80">
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{exam.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-gray-100 text-gray-600 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                          {exam.course || 'General'}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          • Faculty ID: {exam.creator?.name || exam.faculty?.name || 'Academic Core'}
                        </span>
                      </div>
                    </div>
                    <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-blue-100 italic shadow-sm">Scheduled Node</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between pt-6 border-t border-gray-50 gap-4">
                    <div className="flex flex-wrap gap-4 md:gap-6">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-300 uppercase">Starts On</span>
                        <span className="text-xs font-black text-blue-600">
                          {new Date(exam.startTime).toLocaleDateString()} at {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-300 uppercase">Window</span>
                        <span className="text-xs font-black text-gray-700">{exam.durationMinutes}m</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-300 uppercase">Value</span>
                        <span className="text-xs font-black text-gray-700">{calculatedValue}pts</span>
                      </div>
                    </div>
                    
                    <button disabled className="bg-gray-50 border border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest py-3 px-8 rounded-xl cursor-not-allowed shadow-inner flex items-center gap-2">
                      <span>🔒</span> Locked
                    </button>
                  </div>

                </div>
              )})}
            </div>
          </section>
        )}
      </div>

      <div className="lg:col-span-4 space-y-10">
        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Performance Vault</h3>
          <div className="space-y-4">
            {submissions.filter(s => ['submitted', 'auto_submitted'].includes(s.status)).length === 0 ? (
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 border-dashed text-center">
                <p className="text-[10px] font-bold text-gray-300 uppercase italic">No records in vault.</p>
              </div>
            ) : (
              submissions.filter(s => ['submitted', 'auto_submitted'].includes(s.status)).map(sub => (
                <div key={sub._id || sub.id} className="bg-white rounded-[2rem] border border-gray-100 p-6 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{sub.exam?.title || 'System Test'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-gray-400">{sub.totalScore}/{sub.maxScore}</span>
                      <span className="text-[10px] font-black text-emerald-500 uppercase italic">{sub.percentage}%</span>
                    </div>
                  </div>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black border ${sub.percentage >= 33.33 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {sub.percentage >= 33.33 ? 'P' : 'F'}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="bg-[#1A5F53] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-900/20">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-6">Aggregate Stats</p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h5 className="text-3xl font-black">{submissions.length}</h5>
              <p className="text-[9px] font-bold uppercase opacity-50">Total Attempts</p>
            </div>
            <div>
              <h5 className="text-3xl font-black">{activeExams.length}</h5>
              <p className="text-[9px] font-bold uppercase opacity-50">Live Ops</p>
            </div>
          </div>
        </div>
      </div>

      {ticketModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2 uppercase">Submit Ticket</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">Appeal for {ticketModal.examTitle}</p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for missed exam</label>
                <textarea 
                  value={ticketModal.reason}
                  onChange={(e) => setTicketModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please provide a valid reason..."
                  className="w-full mt-1 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition-colors h-32 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setTicketModal({ open: false, examId: null, examTitle: '', reason: '' })} className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">Cancel</button>
                <button onClick={handleSubmitTicket} disabled={submittingTicket} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-50">
                  {submittingTicket ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentOverview;
