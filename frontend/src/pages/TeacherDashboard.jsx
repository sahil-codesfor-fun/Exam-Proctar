import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Plus, X, Trash2, CheckCircle2, LogOut, LayoutGrid, FileText, ShieldAlert, ChevronDown } from 'lucide-react';

const EMPTY_Q = { type: 'mcq', title: '', description: '', points: 10, options: [{ text: '', isCorrect: false },{ text: '', isCorrect: false },{ text: '', isCorrect: false },{ text: '', isCorrect: false }], testCases: [{ input: '', expectedOutput: '', isHidden: false }], timeLimitSeconds: 5, constraints: '' };

export const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('OVERVIEW');
  const [modal, setModal] = useState(false);
  const [exams, setExams] = useState([]);
  const [subs, setSubs] = useState({});
  const [violations, setViolations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewExam, setViewExam] = useState(null);

  const [form, setForm] = useState({ title: '', description: '', course: '', startTime: '', endTime: '', durationMinutes: 60, proctoring: { maxViolations: 3, restrictionMinutes: 30, requireFullscreen: true, disableCopyPaste: true, autoSubmitOnMax: true, enableWebcam: false }, questions: [{ ...EMPTY_Q }] });

  const load = () => {
    setLoading(true);
    api.get('/exams').then(r => setExams(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const loadSubs = async (examId) => {
    const [s, v] = await Promise.all([
      api.get(`/submissions/exam/${examId}`).then(r => r.data.data).catch(() => []),
      api.get(`/violations/exam/${examId}`).then(r => r.data.data).catch(() => []),
    ]);
    setSubs(p => ({ ...p, [examId]: s }));
    setViolations(p => ({ ...p, [examId]: v }));
  };

  const addQ = () => setForm(p => ({ ...p, questions: [...p.questions, { ...EMPTY_Q, options: EMPTY_Q.options.map(o => ({...o})), testCases: EMPTY_Q.testCases.map(t => ({...t})) }] }));
  const rmQ = (i) => setForm(p => ({ ...p, questions: p.questions.filter((_, idx) => idx !== i) }));
  const updQ = (i, field, val) => setForm(p => ({ ...p, questions: p.questions.map((q, idx) => idx === i ? { ...q, [field]: val } : q) }));
  const updOpt = (qi, oi, field, val) => {
    setForm(p => {
      const qs = [...p.questions];
      const opts = [...qs[qi].options];
      if (field === 'isCorrect') opts.forEach((o, i) => o.isCorrect = i === oi);
      else opts[oi] = { ...opts[oi], [field]: val };
      qs[qi] = { ...qs[qi], options: opts };
      return { ...p, questions: qs };
    });
  };
  const addTc = (qi) => updQ(qi, 'testCases', [...form.questions[qi].testCases, { input: '', expectedOutput: '', isHidden: false }]);
  const rmTc = (qi, ti) => updQ(qi, 'testCases', form.questions[qi].testCases.filter((_, i) => i !== ti));
  const updTc = (qi, ti, field, val) => {
    const tcs = [...form.questions[qi].testCases];
    tcs[ti] = { ...tcs[ti], [field]: val };
    updQ(qi, 'testCases', tcs);
  };

  const deploy = async (status = 'published') => {
    if (!form.title.trim()) return alert('Exam title is required.');

    // Validate all question titles
    for (let i = 0; i < form.questions.length; i++) {
      if (!form.questions[i].title.trim()) {
        return alert(`Question ${i + 1} title is required.`);
      }
    }

    // Clean payload: strip irrelevant fields per question type, remove empty dates
    const cleanedQuestions = form.questions.map(q => {
      const base = {
        type: q.type,
        title: q.title.trim(),
        description: q.description || '',
        points: q.points || 10,
      };
      if (q.type === 'mcq') {
        base.options = q.options;
      } else if (q.type === 'coding') {
        // Only include test cases that have at least an expectedOutput
        base.testCases = (q.testCases || []).filter(tc => tc.expectedOutput.trim() !== '');
        base.constraints = q.constraints || '';
        base.timeLimitSeconds = q.timeLimitSeconds || 5;
      }
      // subjective: no options, no testCases needed
      return base;
    });

    const payload = {
      ...form,
      status,
      questions: cleanedQuestions,
      // Don't send empty strings for Date fields — Mongoose will reject them
      startTime: form.startTime || undefined,
      endTime:   form.endTime   || undefined,
    };

    setSaving(true);
    try {
      await api.post('/exams', payload);
      setModal(false);
      setForm({ title: '', description: '', course: '', startTime: '', endTime: '', durationMinutes: 60, proctoring: { maxViolations: 3, restrictionMinutes: 30, requireFullscreen: true, disableCopyPaste: true, autoSubmitOnMax: true, enableWebcam: false }, questions: [{ ...EMPTY_Q }] });
      load();
    } catch (e) { alert(e.response?.data?.message || 'Deployment failed. Check all fields.'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (exam, status) => {
    await api.patch(`/exams/${exam._id}/status`, { status }).catch(() => {});
    load();
  };

  const deleteExam = async (id) => {
    if (!confirm('Delete this exam?')) return;
    await api.delete(`/exams/${id}`).catch(() => {});
    load();
  };

  // ── MODAL rendered inline to preserve input focus across re-renders ──
  const renderModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-8 py-5 border-b flex justify-between items-center">
          <h2 className="text-lg font-black uppercase">Deploy New Exam</h2>
          <button onClick={() => setModal(false)}><X size={20} /></button>
        </div>
        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {/* Basic info */}
          <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Exam Title *" className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input value={form.course} onChange={e => setForm(p => ({...p, course: e.target.value}))} placeholder="Course" className="px-4 py-3 bg-gray-50 rounded-xl font-bold outline-none" />
            <input type="number" value={form.durationMinutes} onChange={e => setForm(p => ({...p, durationMinutes: +e.target.value}))} placeholder="Duration (min)" className="px-4 py-3 bg-gray-50 rounded-xl font-bold outline-none" />
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 mb-1">Start Time (Optional)</label>
              <input type="datetime-local" value={form.startTime} onChange={e => setForm(p => ({...p, startTime: e.target.value}))} className="px-4 py-3 bg-gray-50 rounded-xl font-bold outline-none text-gray-600" />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 mb-1">End Time (Optional)</label>
              <input type="datetime-local" value={form.endTime} onChange={e => setForm(p => ({...p, endTime: e.target.value}))} className="px-4 py-3 bg-gray-50 rounded-xl font-bold outline-none text-gray-600" />
            </div>
          </div>
          <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Description" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none h-20 resize-none" />

          {/* Proctoring */}
          <div className="bg-emerald-50 p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-black text-emerald-700 uppercase">Security Settings</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex items-center gap-2"><input type="number" value={form.proctoring.maxViolations} onChange={e => setForm(p => ({...p, proctoring: {...p.proctoring, maxViolations: +e.target.value}}))} className="w-16 px-2 py-1 rounded border" /> Max Violations</label>
              <label className="flex items-center gap-2"><input type="number" value={form.proctoring.restrictionMinutes} onChange={e => setForm(p => ({...p, proctoring: {...p.proctoring, restrictionMinutes: +e.target.value}}))} className="w-16 px-2 py-1 rounded border" /> Restriction (min)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.proctoring.requireFullscreen} onChange={e => setForm(p => ({...p, proctoring: {...p.proctoring, requireFullscreen: e.target.checked}}))} /> Require Fullscreen</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.proctoring.disableCopyPaste} onChange={e => setForm(p => ({...p, proctoring: {...p.proctoring, disableCopyPaste: e.target.checked}}))} /> Disable Copy/Paste</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.proctoring.autoSubmitOnMax} onChange={e => setForm(p => ({...p, proctoring: {...p.proctoring, autoSubmitOnMax: e.target.checked}}))} /> Auto-submit on Max</label>
            </div>
          </div>

          {/* Questions */}
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-gray-400 uppercase">Questions ({form.questions.length})</h3>
            <button onClick={addQ} className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Plus size={14} /> Add Question</button>
          </div>

          {form.questions.map((q, qi) => (
            <div key={qi} className="bg-gray-50 rounded-2xl p-6 space-y-4 border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="bg-white px-3 py-1 rounded-lg text-xs font-black border">Q{qi+1}</span>
                  <select value={q.type} onChange={e => updQ(qi, 'type', e.target.value)} className="bg-emerald-50 text-emerald-700 rounded-lg px-3 py-1.5 text-xs font-black border border-emerald-100 cursor-pointer">
                    <option value="mcq">MCQ</option>
                    <option value="coding">CODING</option>
                    <option value="subjective">SUBJECTIVE</option>
                  </select>
                  <input type="number" value={q.points} onChange={e => updQ(qi, 'points', +e.target.value)} className="w-16 px-2 py-1 rounded border text-xs" placeholder="Points" />
                </div>
                <button onClick={() => rmQ(qi)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
              </div>

              <input value={q.title} onChange={e => updQ(qi, 'title', e.target.value)} placeholder="Question title *" className="w-full bg-white border-b py-2 font-bold outline-none" />
              <textarea value={q.description} onChange={e => updQ(qi, 'description', e.target.value)} placeholder="Description / problem statement" className="w-full bg-white border rounded-lg p-2 text-sm outline-none h-16 resize-none" />

              {q.type === 'mcq' && (
                <div className="grid grid-cols-2 gap-3">
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2 bg-white p-3 rounded-xl border">
                      <input type="radio" name={`correct-${qi}`} checked={o.isCorrect} onChange={() => updOpt(qi, oi, 'isCorrect', true)} className="accent-emerald-500" />
                      <input value={o.text} onChange={e => updOpt(qi, oi, 'text', e.target.value)} placeholder={`Option ${oi+1}`} className="flex-1 text-sm outline-none" />
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'coding' && (
                <div className="space-y-3">
                  <textarea value={q.constraints} onChange={e => updQ(qi, 'constraints', e.target.value)} placeholder="Constraints (e.g. 1 ≤ n ≤ 10^5)" className="w-full bg-white border rounded-lg p-2 text-sm outline-none h-12 resize-none font-mono" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase">Test Cases ({q.testCases.length})</span>
                    <button onClick={() => addTc(qi)} className="text-xs font-bold text-blue-600 flex items-center gap-1"><Plus size={12} /> Add</button>
                  </div>
                  {q.testCases.map((tc, ti) => (
                    <div key={ti} className="bg-white rounded-lg border p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500">TC {ti+1}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={tc.isHidden} onChange={e => updTc(qi, ti, 'isHidden', e.target.checked)} /> Hidden</label>
                          <button onClick={() => rmTc(qi, ti)} className="text-gray-300 hover:text-red-500"><X size={14} /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <textarea value={tc.input} onChange={e => updTc(qi, ti, 'input', e.target.value)} placeholder="Input" className="bg-gray-50 rounded p-2 text-xs font-mono outline-none h-14 resize-none" />
                        <textarea value={tc.expectedOutput} onChange={e => updTc(qi, ti, 'expectedOutput', e.target.value)} placeholder="Expected Output" className="bg-gray-50 rounded p-2 text-xs font-mono outline-none h-14 resize-none" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="px-8 py-5 border-t flex justify-end gap-3">
          <button onClick={() => setModal(false)} className="px-6 py-3 text-gray-400 font-bold text-sm hover:text-gray-600">Cancel</button>
          <button onClick={() => deploy('draft')} disabled={saving} className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-gray-50">
            Save Draft
          </button>
          <button onClick={() => deploy('published')} disabled={saving} className="px-8 py-3 bg-[#4B775E] text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">
            {saving ? 'Deploying…' : 'Publish Exam'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── EXAM DETAIL VIEW (LIVE MONITORING) ──
  const ExamDetail = ({ exam }) => {
    const [liveStudents, setLiveStudents] = useState([]);
    const [liveViolations, setLiveViolations] = useState([]);

    useEffect(() => { loadSubs(exam._id); }, [exam._id]);
    const es = subs[exam._id] || [];
    const ev = violations[exam._id] || [];

    useEffect(() => {
      import('../services/socket').then(({ connectSocket, disconnectSocket }) => {
        const socket = connectSocket();
        socket.emit('join_monitoring', { examId: exam._id });

        socket.on('active_students', (data) => setLiveStudents(data.students || []));
        socket.on('student_joined', (data) => setLiveStudents(p => [...p.filter(s => s.studentId !== data.studentId), data]));
        socket.on('student_left', (data) => setLiveStudents(p => p.filter(s => s.studentId !== data.studentId)));
        
        socket.on('violation_alert', (data) => {
          setLiveViolations(p => [data, ...p]);
        });

        return () => {
          socket.off('active_students');
          socket.off('student_joined');
          socket.off('student_left');
          socket.off('violation_alert');
          // Don't disconnect if the teacher might monitor multiple, but for now we keep it simple
        };
      });
    }, [exam._id]);

    const forceSubmit = (studentId) => {
      if (!confirm('Are you sure you want to forcibly submit and lock this student out of the exam?')) return;
      import('../services/socket').then(({ getSocket }) => {
        const socket = getSocket();
        if (socket) {
          socket.emit('force_submit_student', { examId: exam._id, studentId, reason: 'Manual termination by proctor' });
        }
      });
    };

    return (
      <div className="space-y-6">
        <button onClick={() => setViewExam(null)} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              {exam.title}
              {exam.status === 'active' && <span className="bg-red-500 text-white text-[10px] uppercase px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
            </h2>
            <p className="text-gray-400 text-sm">{exam.course} • {exam.durationMinutes}min • {exam.questions.length} questions • {exam.totalMarks} marks</p>
          </div>
          <div className="flex gap-2">
            {exam.status === 'draft' && <button onClick={() => toggleStatus(exam, 'published')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Publish</button>}
            {exam.status === 'published' && <button onClick={() => toggleStatus(exam, 'draft')} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold">Unpublish</button>}
            {(exam.status === 'published' || exam.status === 'draft') && <button onClick={() => toggleStatus(exam, 'active')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Start Now (Override)</button>}
            {exam.status === 'active' && <button onClick={() => toggleStatus(exam, 'ended')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold">End Exam</button>}
            <button onClick={() => deleteExam(exam._id)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold border border-red-100">Delete</button>
          </div>
        </div>

        {/* Live Monitoring */}
        {exam.status === 'active' && (
          <div className="bg-gray-900 text-white rounded-2xl border border-gray-800 p-6 shadow-2xl">
            <h3 className="text-xs font-black text-emerald-400 uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Monitoring Dashboard
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Active Students */}
              <div>
                <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Active Sessions ({liveStudents.length})</h4>
                {liveStudents.length === 0 ? <p className="text-xs text-gray-600">No students currently connected.</p> : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {liveStudents.map(s => (
                      <div key={s.studentId} className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-sm font-bold">{s.name}</span>
                        </div>
                        <button onClick={() => forceSubmit(s.studentId)} className="text-[10px] font-bold bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition-all">
                          FORCE SUBMIT
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Alerts */}
              <div>
                <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Live AI Alerts</h4>
                {liveViolations.length === 0 ? <p className="text-xs text-gray-600">No alerts detected.</p> : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {liveViolations.map((v, i) => (
                      <div key={i} className="flex flex-col bg-gray-800 p-3 rounded-xl border border-red-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-300">{v.studentName}</span>
                          <span className="text-[10px] text-gray-500">{new Date(v.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${v.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                          <span className="text-xs text-red-400 font-bold">{v.type?.replace(/_/g, ' ').toUpperCase()}</span>
                        </div>
                        {v.details && <p className="text-[10px] text-gray-400 mt-1">{v.details}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submissions */}
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="text-xs font-black text-gray-400 uppercase mb-4">Historical Submissions ({es.length})</h3>
          {es.length === 0 ? <p className="text-gray-400 text-sm">No submissions yet.</p> : (
            <table className="w-full text-left text-sm">
              <thead><tr className="text-xs text-gray-400 uppercase border-b"><th className="py-2">Student</th><th>Score</th><th>%</th><th>Status</th><th>Violations</th></tr></thead>
              <tbody>{es.map(s => (
                <tr key={s._id} className="border-b border-gray-50">
                  <td className="py-3 font-bold">{s.student?.name} <span className="text-gray-400 text-xs">{s.student?.studentId}</span></td>
                  <td>{s.totalScore}/{s.maxScore}</td>
                  <td className={`font-bold ${s.percentage >= 40 ? 'text-emerald-600' : 'text-red-500'}`}>{s.percentage}%</td>
                  <td><span className={`text-xs font-bold px-2 py-0.5 rounded ${s.status === 'submitted' ? 'bg-green-50 text-green-600' : s.status === 'auto_submitted' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{s.status}</span></td>
                  <td className={s.violationCount > 0 ? 'text-red-500 font-bold' : ''}>{s.violationCount}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        {/* Database Violations */}
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="text-xs font-black text-gray-400 uppercase mb-4">Violation Log ({ev.length})</h3>
          {ev.length === 0 ? <p className="text-gray-400 text-sm">No violations recorded.</p> : (
            <div className="max-h-60 overflow-y-auto space-y-1">
              {ev.map((v, i) => (
                <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-gray-50">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${v.severity === 'critical' ? 'bg-red-500' : v.severity === 'high' ? 'bg-orange-500' : 'bg-amber-400'}`} />
                  <span className="font-bold text-gray-700 w-32 truncate">{v.student?.name}</span>
                  <span className="text-gray-500 w-32 truncate">{v.type?.replace(/_/g, ' ')}</span>
                  <span className="text-gray-400 flex-1 truncate">{v.details}</span>
                  <span className="ml-auto text-gray-400">{new Date(v.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── MAIN ──
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {modal && renderModal()}

      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col p-5 overflow-y-auto">
        <div className="flex items-center gap-2 mb-10 px-2">
          <CheckCircle2 className="text-emerald-600" size={24} />
          <h1 className="text-lg font-black tracking-tight uppercase">Trainer<span className="text-gray-300">_</span>Core</h1>
        </div>
        <nav className="flex-1 space-y-1">
          {[{ icon: <LayoutGrid size={16}/>, label: 'OVERVIEW' }, { icon: <FileText size={16}/>, label: 'EXAMS' }, { icon: <ShieldAlert size={16}/>, label: 'MONITORING' }].map(item => (
            <button key={item.label} onClick={() => { setTab(item.label); setViewExam(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wide transition-all ${tab === item.label ? 'bg-[#4B775E] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs border">{user?.name?.[0] || 'A'}</div>
            <div><p className="text-xs font-bold">{user?.name}</p><p className="text-[9px] text-gray-400">Faculty</p></div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center justify-center gap-2 py-2.5 border rounded-xl text-xs font-bold text-gray-400 hover:bg-red-50 hover:text-red-500">
            <LogOut size={12}/> Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-10">
        {viewExam ? <ExamDetail exam={viewExam} /> : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase">{tab}</h2>
              <button onClick={() => setModal(true)} className="bg-[#4B775E] hover:bg-[#3d614d] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase flex items-center gap-2 shadow-lg">
                <Plus size={18}/> Deploy New Exam
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              {[{ l: 'Total Exams', v: exams.length, c: 'text-emerald-600' },
                { l: 'Published/Active', v: exams.filter(e => e.status === 'active' || e.status === 'published').length, c: 'text-blue-500' },
                { l: 'Drafts', v: exams.filter(e => e.status === 'draft').length, c: 'text-amber-500' },
                { l: 'Ended', v: exams.filter(e => e.status === 'ended').length, c: 'text-gray-400' }
              ].map((s, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl border">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">{s.l}</p>
                  <h3 className={`text-4xl font-black ${s.c}`}>{s.v}</h3>
                </div>
              ))}
            </div>

            {/* Exam List */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-6 border-b"><h4 className="text-xs font-black text-gray-400 uppercase">Exam Registry</h4></div>
              {loading ? <p className="p-6 text-gray-400">Loading…</p> : exams.length === 0 ? <p className="p-6 text-gray-400">No exams created yet.</p> : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50"><tr className="text-[10px] font-black text-gray-400 uppercase">
                    <th className="px-6 py-4">Title</th><th className="px-6 py-4">Course</th><th className="px-6 py-4">Questions</th><th className="px-6 py-4">Duration</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {exams.map(exam => (
                      <tr key={exam._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewExam(exam)}>
                        <td className="px-6 py-4"><p className="font-bold text-sm">{exam.title}</p></td>
                        <td className="px-6 py-4 text-xs text-gray-500">{exam.course || '—'}</td>
                        <td className="px-6 py-4 font-bold text-sm">{exam.questions?.length || 0}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{exam.durationMinutes}m</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-lg ${exam.status === 'active' ? 'bg-emerald-50 text-emerald-600' : exam.status === 'published' ? 'bg-blue-50 text-blue-600' : exam.status === 'draft' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>{exam.status?.toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            {exam.status === 'draft' && <button onClick={() => toggleStatus(exam, 'published')} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">Publish</button>}
                            {exam.status === 'published' && <button onClick={() => toggleStatus(exam, 'draft')} className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded font-bold">Unpublish</button>}
                            {exam.status === 'active' && <button onClick={() => toggleStatus(exam, 'ended')} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-bold">End</button>}
                            <button onClick={() => deleteExam(exam._id)} className="text-xs text-gray-300 hover:text-red-500 px-2 py-1"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};