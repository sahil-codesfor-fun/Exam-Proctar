import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import useProctoring from '../hooks/useProctoring';
import Editor from '@monaco-editor/react';

const LANGS = [
  { id:'javascript', name:'JavaScript', m:'javascript' },{ id:'typescript', name:'TypeScript', m:'typescript' },
  { id:'python', name:'Python', m:'python' },{ id:'java', name:'Java', m:'java' },
  { id:'c', name:'C', m:'c' },{ id:'cpp', name:'C++', m:'cpp' },{ id:'csharp', name:'C#', m:'csharp' },
  { id:'go', name:'Go', m:'go' },{ id:'rust', name:'Rust', m:'rust' },{ id:'php', name:'PHP', m:'php' },
  { id:'ruby', name:'Ruby', m:'ruby' },{ id:'kotlin', name:'Kotlin', m:'kotlin' },{ id:'swift', name:'Swift', m:'swift' },
  { id:'perl', name:'Perl', m:'perl' },{ id:'bash', name:'Bash', m:'shell' },{ id:'r', name:'R', m:'r' },
  { id:'dart', name:'Dart', m:'dart' },{ id:'lua', name:'Lua', m:'lua' },{ id:'scala', name:'Scala', m:'scala' },
];

export const LiveExamPage = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [phase, setPhase] = useState('loading'); 
  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [judgeResult, setJudgeResult] = useState(null);
  const [judging, setJudging] = useState(false);
  const [codeStdin, setCodeStdin] = useState('');
  
  const timerRef = useRef(null);
  const submittedRef = useRef(false);
  const initFiredRef = useRef(false);

  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); 

  // 🚀 SVG Laser Beam Line Drawer State
  const [activeDraw, setActiveDraw] = useState(null);
  const [hoveredRight, setHoveredRight] = useState(null); // Tracks massive hitboxes!
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [drawnLines, setDrawnLines] = useState([]);
  const matchingContainerRef = useRef(null);
  const leftDots = useRef({});
  const rightDots = useRef({});

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ message, onConfirm });
  };

  const [proctorReady, setProctorReady] = useState(false);
  useEffect(() => {
    if (phase === 'exam') {
      setProctorReady(true);
    } else {
      setProctorReady(false);
    }
  }, [phase]);

  const handleRestricted = useCallback((msg) => { setPhase('restricted'); setError(msg); }, []);
  const handleAutoSubmit = useCallback((reason) => { doSubmit(true, reason); }, []);
  
  const proctoring = useProctoring({
    examId, 
    enabled: ['exam', 'fullscreen'].includes(phase) && proctorReady && !submittedRef.current,
    maxViolations: 99, 
    onRestricted: handleRestricted, 
    onAutoSubmit: handleAutoSubmit,
  });

  const phaseRef = useRef(phase);
  const vCountRef = useRef(0);
  const proctoringRef = useRef(proctoring);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { vCountRef.current = proctoring.violationCount; }, [proctoring.violationCount]);
  useEffect(() => { proctoringRef.current = proctoring; }, [proctoring]);

  useEffect(() => {
    if (phase !== 'exam') return;
    const heartbeat = setInterval(async () => {
      try {
        const res = await api.get(`/exams/${examId}`);
        if (res.data.data.status === 'ended' || res.data.data.status === 'draft') {
          doSubmit(true, 'The proctor has closed this exam.');
        }
      } catch (err) {
        if (err.response?.status === 404) {
          document.exitFullscreen?.().catch(()=>{});
          alert("🚨 EXAM DELETED BY PROCTOR. You are being disconnected.");
          window.location.href = '/student-dashboard'; 
        }
      }
    }, 15000);
    return () => clearInterval(heartbeat);
  }, [phase, examId]);

  useEffect(() => {
    const preventBack = () => window.history.forward();
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', preventBack);

    const handleBeforeUnload = (e) => {
      if ((phaseRef.current === 'exam' || phaseRef.current === 'fullscreen') && !submittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleFullscreenChange = async () => {
      if (phaseRef.current === 'exam' && !document.fullscreenElement && !submittedRef.current) {
        vCountRef.current += 1;
        const newCount = vCountRef.current;
        proctoringRef.current.logViolation('fullscreen_exit', 'critical', `Student exited fullscreen mode (Total: ${newCount})`);
        try {
          await document.documentElement.requestFullscreen();
        } catch (err) {
          console.error("Failed to re-enter fullscreen.", err);
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('popstate', preventBack);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []); 

  useEffect(() => {
    if (phase !== 'exam' || submittedRef.current) return;
    const blockAction = (e) => {
      e.preventDefault();
      const type = e.type.toUpperCase();
      showToast(`${type} is strictly disabled during this exam.`, 'error');
      proctoring.logViolation(`${type}_ATTEMPT`, 'medium', `Student attempted to ${e.type} content.`);
    };

    const blockShortcuts = (e) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (['c', 'v', 'x', 'a'].includes(key))) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Shortcuts (Copy/Paste/Select-All) are disabled.', 'error');
        proctoring.logViolation('shortcut_attempt', 'medium', `Attempted Ctrl+${key.toUpperCase()}`);
      }
      if (ctrl && e.shiftKey && key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        showToast('Paste shortcut is disabled.', 'error');
        proctoring.logViolation('shortcut_attempt', 'medium', 'Attempted Ctrl+Shift+V');
      }
    };

    window.addEventListener('copy', blockAction);
    window.addEventListener('paste', blockAction);
    window.addEventListener('cut', blockAction);
    window.addEventListener('contextmenu', blockAction);
    window.addEventListener('keydown', blockShortcuts, true);
    window.addEventListener('dragover', blockAction);
    window.addEventListener('drop', blockAction);

    return () => {
      window.removeEventListener('copy', blockAction);
      window.removeEventListener('paste', blockAction);
      window.removeEventListener('cut', blockAction);
      window.removeEventListener('contextmenu', blockAction);
      window.removeEventListener('keydown', blockShortcuts, true);
      window.removeEventListener('dragover', blockAction);
      window.removeEventListener('drop', blockAction);
    };
  }, [phase, proctoring]);

  useEffect(() => {
    if (initFiredRef.current) return;
    initFiredRef.current = true;

    (async () => {
      try {
        const examRes = await api.get(`/exams/${examId}`);
        let e = examRes.data.data;

        if (e.status !== 'active' && e.startTime && new Date(e.startTime) <= new Date()) {
          try {
            await api.patch(`/exams/${examId}/status`, { status: 'active' });
            e.status = 'active'; 
          } catch (patchErr) {}
        }

        const subRes = await api.post(`/submissions/start/${examId}`);
        const s = subRes.data.data;
        
        if (s.answers && s.answers.length > 0) {
          const dealtQuestions = s.answers.map(ans => {
            const originalQ = e.questions.find(q => (q._id || q.id) === ans.questionId);
            if (!originalQ) return null;
            return { 
                ...originalQ, 
                options: ans.options || originalQ.options,
                matchingLeft: ans.matchingLeft,
                matchingRight: ans.matchingRight
            };
          }).filter(Boolean);

          e.questions = dealtQuestions;
          
          setAnswers(s.answers.map(ans => ({
            ...ans,
            studentMatches: ans.studentMatches || {}
          })));
        } else {
          setAnswers(e.questions.map(q => ({
            questionId: q._id || q.id, questionType: q.type,
            selectedOption: -1, selectedOptionId: null, code: '', language: 'python', textAnswer: '',
            studentMatches: {},
            score: 0, maxScore: q.points,
          })));
        }

        let initialTimeLeft = e.durationMinutes * 60; 
        if (e.endTime) {
          const endMs = new Date(e.endTime).getTime();
          const nowMs = Date.now();
          initialTimeLeft = Math.max(0, Math.floor((endMs - nowMs) / 1000));
        } else if (e.startTime) {
          const endMs = new Date(e.startTime).getTime() + (e.durationMinutes * 60 * 1000);
          const nowMs = Date.now();
          initialTimeLeft = Math.max(0, Math.floor((endMs - nowMs) / 1000));
        }
        
        setTimeLeft(initialTimeLeft);
        setExam(e);
        setSubmission(s);

        const socket = connectSocket();
        socket.emit('join_exam', { examId, studentId: user?._id || user?.id, studentName: user?.name });

        socket.on('force_submit', (data) => {
          showToast(`Your exam was terminated by the proctor. Reason: ${data.reason}`, 'error');
          doSubmit(true, data.reason);
        });

        socket.on('exam_deleted', (data) => {
          if (String(data.examId) === String(examId)) {
             document.exitFullscreen?.().catch(()=>{});
             alert('This exam has been deleted by the instructor.');
             window.location.href = '/student-dashboard'; 
          }
        });

        socket.on('exam_status_changed', (data) => {
          if (String(data.examId) === String(examId) && (data.status === 'ended' || data.status === 'draft')) {
            showToast(`The proctor has ended this exam.`, 'error');
            doSubmit(true, 'Exam ended by instructor');
          }
        });

        setPhase(e.proctoring?.requireFullscreen ? 'fullscreen' : 'exam');
      } catch (err) {
        let msg = err.response?.data?.message || err.message || 'Failed to load exam';
        setError(msg);
        setPhase('error');
      }
    })();
    return () => { 
      const socket = getSocket();
      if (socket) {
        socket.off('force_submit');
        socket.off('exam_deleted');
        socket.off('exam_status_changed');
      }
      disconnectSocket(); 
      if (timerRef.current) clearInterval(timerRef.current); 
    };
  }, [examId, user]);

  useEffect(() => {
    if (phase !== 'exam') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { doSubmit(true, 'Exam window has closed.'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'exam' || !submission) return;
    const submissionId = submission._id || submission.id;
    const iv = setInterval(() => {
      api.put(`/submissions/${submissionId}/save`, { answers }).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, [phase, answers, submission]);

  // 🚀 The Auto-Snapping Line Renderer!
  const updateLines = useCallback(() => {
    if (!matchingContainerRef.current) return;
    const rect = matchingContainerRef.current.getBoundingClientRect();
    const newLines = [];
    const q = exam?.questions?.[currentQ];
    
    if (!q || q.type !== 'matching') {
      setDrawnLines([]);
      return;
    }
    
    const ans = answers.find(a => a.questionId === (q._id || q.id)) || {};
    const matches = ans.studentMatches || {};

    Object.entries(matches).forEach(([lId, rId]) => {
       const lDot = leftDots.current[lId];
       const rDot = rightDots.current[rId];
       if (lDot && rDot) {
          const lRect = lDot.getBoundingClientRect();
          const rRect = rDot.getBoundingClientRect();
          newLines.push({
             key: lId + rId,
             x1: lRect.left + lRect.width/2 - rect.left,
             y1: lRect.top + lRect.height/2 - rect.top,
             x2: rRect.left + rRect.width/2 - rect.left,
             y2: rRect.top + rRect.height/2 - rect.top
          });
       }
    });
    setDrawnLines(newLines);
  }, [answers, currentQ, exam]);

  // Force snap the lines instantly when matches change
  useEffect(() => {
    updateLines();
    window.addEventListener('resize', updateLines);
    window.addEventListener('scroll', updateLines, true); 
    const timeout = setTimeout(updateLines, 50); 
    return () => {
       window.removeEventListener('resize', updateLines);
       window.removeEventListener('scroll', updateLines, true);
       clearTimeout(timeout);
    };
  }, [updateLines, phase, answers]);


  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.()
      .then(() => setPhase('exam'))
      .catch(() => setPhase('exam'));
  };

  const updateAnswer = (qId, field, value) => {
    setAnswers(prev => prev.map(a => a.questionId === qId ? { ...a, [field]: value } : a));
  };

  const doSubmit = async (auto = false, reason = '') => {
    if (submittedRef.current) return;
    
    if (!auto) {
      showConfirm('Are you sure you want to submit this exam? This action cannot be undone.', () => {
        performSubmit(auto, reason);
      });
    } else {
      performSubmit(auto, reason);
    }
  };

  const performSubmit = async (auto = false, reason = '') => {
    submittedRef.current = true;
    setSubmitting(true);
    const submissionId = submission._id || submission.id;
    try {
      await api.put(`/submissions/${submissionId}/submit`, { answers, autoSubmit: auto, reason });
      document.exitFullscreen?.().catch(() => {});      
      setPhase('submitted');
    } catch (err) {
      showToast('Submit failed: ' + (err.response?.data?.message || err.message), 'error');
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  const handleRunCode = async () => {
    const ans = answers[currentQ];
    const q = exam?.questions?.[currentQ];
    if (!ans?.code) return;
    setRunning(true); setRunResult(null);
    try {
      const r = await api.post('/compiler/execute', { language: ans.language, code: ans.code, stdin: codeStdin });
      const resData = r.data;
      let runRes = null;

      if (resData.success) {
        runRes = { output: resData.output, error: null, executionTime: resData.executionTime, success: true };
      } else {
        runRes = { error: resData.stderr, output: '', errorType: resData.errorType, success: false };
      }

      if (q?.testCases?.length > 0) {
        const tr = await api.post('/compiler/judge', {
          language: ans.language, code: ans.code,
          testCases: q.testCases, timeLimitSec: q.timeLimitSeconds || 5,
        });
        const d = tr.data.data;
        runRes.testSummary = `Passed ${d.passed} / ${d.total} test cases`;
        runRes.passedCount = d.passed;
        runRes.totalCount = d.total;
        runRes.verdict = d.verdict;
        
        const score = d.verdict === 'accepted' ? q.points : Math.round((d.passed / d.total) * q.points);
        updateAnswer(ans.questionId, 'score', score);
        updateAnswer(ans.questionId, 'verdict', d.verdict);
        updateAnswer(ans.questionId, 'passedTests', d.passed);
        updateAnswer(ans.questionId, 'totalTests', d.total);
      }
      setRunResult(runRes);
    } catch (e) { 
      setRunResult({ error: e.response?.data?.message || e.message || 'Execution failed', output: '' }); 
    } finally { setRunning(false); }
  };

  const handleJudge = async () => {
    const ans = answers[currentQ];
    const q = exam?.questions?.[currentQ];
    if (!ans?.code || !q?.testCases?.length) return;
    setJudging(true); setJudgeResult(null);
    try {
      const r = await api.post('/compiler/judge', {
        language: ans.language, code: ans.code,
        testCases: q.testCases, timeLimitSec: q.timeLimitSeconds || 5,
      });
      const d = r.data.data;
      setJudgeResult(d);
      const score = d.verdict === 'accepted' ? q.points : Math.round((d.passed / d.total) * q.points);
      updateAnswer(ans.questionId, 'score', score);
      updateAnswer(ans.questionId, 'verdict', d.verdict);
      updateAnswer(ans.questionId, 'passedTests', d.passed);
      updateAnswer(ans.questionId, 'totalTests', d.total);
    } catch (e) { 
      console.error("Judge failed:", e);
    } finally { setJudging(false); }
  };

  const fmtTime = (s) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const isLow = timeLeft < 300;

  const totalSeconds = (exam?.durationMinutes || 0) * 60;
  const elapsedSeconds = totalSeconds - timeLeft; 
  const isHalfTimePassed = totalSeconds > 0 ? elapsedSeconds >= (totalSeconds / 2) : true;

  const q = exam?.questions?.[currentQ];
  const qIdSafe = q ? (q._id || q.id) : null;
  const ans = q ? (answers.find(a => a.questionId === qIdSafe) || {}) : {};

  const vCount = proctoring.violationCount;
  const lastPenalizedRef = useRef(0);

  useEffect(() => {
    const maxV = exam?.proctoring?.maxViolations || exam?.proctoringRules?.maxViolations || 3;
    const penaltyThreshold = Math.floor(maxV / 2);
    
    if (vCount > penaltyThreshold && vCount > lastPenalizedRef.current && phase === 'exam') {
      lastPenalizedRef.current = vCount;
      setTimeLeft(prev => Math.max(0, Math.floor(prev * 0.75))); 
    }
  }, [vCount, phase, exam]);
  
  useEffect(() => {
    const maxV = exam?.proctoring?.maxViolations || exam?.proctoringRules?.maxViolations || 3;
    
    if (vCount >= maxV && !submittedRef.current && phase === 'exam') {
      doSubmit(true, `Exceeded maximum fullscreen exit violations (${maxV})`);
    }
  }, [vCount, phase, exam]);

  return (
    <React.Fragment>
      {phase === 'loading' && (
        <div className="h-screen flex items-center justify-center bg-gray-950 text-white">
          <div className="text-center"><div className="text-4xl mb-4 animate-pulse">🛡️</div><p className="text-gray-400">Loading secure exam environment…</p></div>
        </div>
      )}

      {(phase === 'error' || phase === 'restricted') && (
        <div className="h-screen flex items-center justify-center bg-gray-950 text-white">
          <div className="text-center max-w-md"><div className="text-5xl mb-4">{phase === 'restricted' ? '🚫' : '❌'}</div>
            <h2 className="text-2xl font-bold mb-2">{phase === 'restricted' ? 'Access Restricted' : 'Error'}</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button onClick={() => navigate('/student-dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl">Back to Dashboard</button>
          </div>
        </div>
      )}

      {phase === 'fullscreen' && (
        <div className="h-screen flex items-center justify-center bg-gray-950 text-white">
          <div className="text-center max-w-md"><div className="text-5xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold mb-2">Fullscreen Required</h2>
            <p className="text-gray-400 mb-8">This exam requires fullscreen mode for security.</p>
            <button onClick={enterFullscreen} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-xl text-lg">Enter Fullscreen & Start</button>
          </div>
        </div>
      )}

      {phase === 'submitted' && (
        <div className="h-screen flex items-center justify-center bg-gray-950 text-white">
          <div className="text-center"><div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2 text-emerald-400">Exam Submitted!</h2>
            <p className="text-gray-400 mb-6">Your answers have been securely recorded.</p>
            <button onClick={() => navigate('/student-dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl">Back to Dashboard</button>
          </div>
        </div>
      )}

      {phase === 'exam' && (!exam || !answers.length || !q) && (
        <div className="h-screen flex items-center justify-center bg-gray-950 text-white">
          <div className="text-center"><div className="text-4xl mb-4 animate-spin">⌛</div><p className="text-gray-400">Preparing questions…</p></div>
        </div>
      )}

      {phase === 'exam' && exam && answers.length > 0 && q && (
        <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden select-none transition-all duration-700" style={{ fontFamily: "'Inter', sans-serif" }}>
          
          {!document.fullscreenElement && !submittedRef.current && (
            <div className="fixed inset-0 z-[500] bg-gray-950 flex items-center justify-center p-6 text-center animate-in fade-in duration-300">
              <div className="max-w-md">
                <div className="text-7xl mb-6">🚫</div>
                <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">EXAM LOCKED</h2>
                <p className="text-gray-400 mb-10 font-medium leading-relaxed">
                  Fullscreen exit detected. Please return to fullscreen immediately to resume your session.
                </p>
                <button 
                  onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-emerald-900/40 transition-all transform active:scale-95 text-lg"
                >
                  RETURN TO FULLSCREEN
                </button>
                <p className="mt-6 text-[10px] font-black text-red-500 uppercase tracking-[0.3em] animate-pulse">Violation Logged • Proctor Notified</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold">🛡️ {exam?.title || 'Exam Terminal'}</span>
              
              {proctoring?.violationCount > 0 ? (
                <span className="text-xs font-black px-3 py-1 rounded-lg bg-red-500/20 text-red-400 animate-pulse border border-red-500/40">
                  ⚠️ WARNING: {proctoring.violationCount}/{exam?.proctoring?.maxViolations || exam?.proctoringRules?.maxViolations || 3} Infractions Registered
                </span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  ✓ Core Environment Stable
                </span>
              )}
            </div>
            
            <div className={`font-mono text-xl font-bold px-6 py-2 rounded-lg border ${isLow ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-gray-800 border-gray-700 text-white'}`}>
              {fmtTime(timeLeft)}
            </div>
            
            <button 
              onClick={() => doSubmit(false)} 
              disabled={submitting || !isHalfTimePassed}
              className={`${isHalfTimePassed ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-700 opacity-50 cursor-not-allowed'} text-white font-bold py-2 px-6 rounded-lg text-sm transition-all shadow-lg`}
            >
              {submitting ? '⏳ Submitting…' : !isHalfTimePassed ? '🔒 Submit Locked' : '✅ Submit'}
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-56 flex-shrink-0 bg-gray-900/50 border-r border-gray-800 flex flex-col overflow-y-auto p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Questions ({exam?.questions?.length || 0})</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {exam?.questions?.map((qq, idx) => {
                  const qqIdSafe = qq._id || qq.id;
                  const a = answers.find(x => x.questionId === qqIdSafe);
                  
                  const isMatchingDone = a && a.studentMatches && qq.matchingPairs && Object.keys(a.studentMatches).length === qq.matchingPairs.length;
                  const done = a && (a.selectedOptionId || a.selectedOption >= 0 || (a.code && a.code.length > 10) || a.textAnswer || isMatchingDone);
                  
                  return (
                    <button key={qqIdSafe} onClick={() => { setCurrentQ(idx); setRunResult(null); setJudgeResult(null); }}
                      className={`h-9 rounded-lg text-xs font-bold border transition-all ${
                        currentQ === idx ? 'bg-blue-600 border-blue-500 text-white' :
                        done ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' :
                        'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}>{idx + 1}</button>
                  );
                })}
              </div>
              
              {proctoring.violations.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">⚠️ Violations</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {proctoring.violations.slice(-6).map((v, i) => (
                      <div key={i} className="text-[10px] text-gray-500 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${v.severity === 'critical' ? 'bg-red-500' : v.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                        <span className="truncate">{v.type?.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              {q.type === 'mcq' ? (
                <div className="flex-1 overflow-auto p-8">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-lg">Q{currentQ + 1}</span>
                      <span className="bg-gray-800 text-gray-400 text-xs font-bold px-3 py-1 rounded-lg">{q.points} pts</span>
                      <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-3 py-1 rounded-lg">MCQ</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">{q.title}</h2>
                    {q.description && <p className="text-gray-400 mb-6 whitespace-pre-wrap">{q.description}</p>}
                    <div className="space-y-3">
                      {q.options?.map((opt, oi) => {
                        const optId = opt.id || opt._id;
                        const isSelected = optId ? ans.selectedOptionId === optId : ans.selectedOption === oi;

                        return (
                          <label key={optId || oi} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}>
                            <input type="radio" name={`q-${qIdSafe}`} className="w-5 h-5 accent-blue-500"
                              checked={isSelected}
                              onChange={() => {
                                setAnswers(prev => prev.map(a => 
                                  a.questionId === qIdSafe 
                                    ? { ...a, selectedOptionId: optId, selectedOption: oi } 
                                    : a
                                ));
                              }} />
                            <span className="text-gray-200">{opt.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

              ) : q.type === 'matching' ? (
                 <div className="flex-1 overflow-auto p-8">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-lg">Q{currentQ + 1}</span>
                      <span className="bg-gray-800 text-gray-400 text-xs font-bold px-3 py-1 rounded-lg">{q.points} pts</span>
                      <span className="bg-pink-500/20 text-pink-400 text-xs font-bold px-3 py-1 rounded-lg">MATCHING (LASER BEAM)</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">{q.title}</h2>
                    {q.description && <p className="text-gray-400 mb-6 whitespace-pre-wrap">{q.description}</p>}
                    
                    {/* 🚀 THE LASER BEAM UI */}
                    <div 
                      ref={matchingContainerRef} 
                      className="relative mt-10 p-6 bg-gray-900/30 rounded-[2rem] border border-gray-800 select-none overflow-hidden touch-none"
                      onPointerMove={(e) => {
                         if (activeDraw && matchingContainerRef.current) {
                            const rect = matchingContainerRef.current.getBoundingClientRect();
                            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                         }
                      }}
                      onPointerUp={(e) => {
                         // 🚀 BINGO! Connects if dropped anywhere on the hovered right card!
                         if (activeDraw && hoveredRight) {
                            const newMatches = {...(ans.studentMatches || {})};
                            Object.keys(newMatches).forEach(k => {
                               if (newMatches[k] === hoveredRight) delete newMatches[k];
                            });
                            newMatches[activeDraw] = hoveredRight;
                            updateAnswer(qIdSafe, 'studentMatches', newMatches);
                         }
                         setActiveDraw(null);
                      }}
                      onPointerLeave={() => setActiveDraw(null)}
                    >
                       <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                          {drawnLines.map(line => (
                             <line key={line.key} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#10b981" strokeWidth="4" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                          ))}
                          
                          {activeDraw && leftDots.current[activeDraw] && matchingContainerRef.current && (() => {
                             const lRect = leftDots.current[activeDraw].getBoundingClientRect();
                             const cRect = matchingContainerRef.current.getBoundingClientRect();
                             const x1 = lRect.left + lRect.width / 2 - cRect.left;
                             const y1 = lRect.top + lRect.height / 2 - cRect.top;
                             return (
                               <line 
                                 x1={x1} y1={y1} 
                                 x2={mousePos.x} y2={mousePos.y} 
                                 stroke="#3b82f6" strokeWidth="4" strokeDasharray="8,8" strokeLinecap="round" className="animate-pulse drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                               />
                             );
                          })()}
                       </svg>

                       <div className="flex justify-between items-stretch gap-20 relative z-20">
                          {/* Left Column (Start Point) */}
                          <div className="flex-1 flex flex-col justify-around space-y-6">
                             {q.matchingLeft?.map(item => (
                                <div 
                                  key={item.id} 
                                  className={`relative bg-gray-800/80 p-5 rounded-2xl border flex justify-between items-center shadow-lg cursor-pointer transition-all ${activeDraw === item.id ? 'border-blue-500 scale-[1.02]' : 'border-gray-700'}`}
                                  onPointerDown={(e) => {
                                    e.preventDefault(); 
                                    const newMatches = {...(ans.studentMatches || {})};
                                    delete newMatches[item.id];
                                    updateAnswer(qIdSafe, 'studentMatches', newMatches);
                                    
                                    setActiveDraw(item.id);
                                    const rect = matchingContainerRef.current.getBoundingClientRect();
                                    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                                  }}
                                >
                                   <span className="font-bold text-gray-200 text-sm pointer-events-none">{item.text}</span>
                                   <div 
                                     ref={el => leftDots.current[item.id] = el}
                                     className={`w-6 h-6 rounded-full border-4 transition-all z-30 flex-shrink-0 -mr-8 shadow-xl ${ans.studentMatches?.[item.id] ? 'bg-emerald-500 border-emerald-400' : 'bg-gray-900 border-gray-500'}`}
                                   ></div>
                                </div>
                             ))}
                          </div>

                          {/* Right Column (End Point) */}
                          <div className="flex-1 flex flex-col justify-around space-y-6">
                             {q.matchingRight?.map(item => (
                                <div 
                                  key={item.id} 
                                  className={`relative bg-gray-800/80 p-5 rounded-2xl border flex justify-between items-center flex-row-reverse shadow-lg cursor-pointer transition-all ${hoveredRight === item.id && activeDraw ? 'border-emerald-500 scale-[1.02] bg-gray-800' : 'border-gray-700'}`}
                                  onPointerEnter={() => setHoveredRight(item.id)}
                                  onPointerLeave={() => setHoveredRight(null)}
                                  onClick={() => {
                                     if (!activeDraw) {
                                        const newMatches = {...(ans.studentMatches || {})};
                                        let found = false;
                                        Object.keys(newMatches).forEach(k => {
                                           if (newMatches[k] === item.id) { delete newMatches[k]; found = true; }
                                        });
                                        if (found) updateAnswer(qIdSafe, 'studentMatches', newMatches);
                                     }
                                  }}
                                >
                                   <span className="font-bold text-gray-200 text-sm text-right pointer-events-none">{item.text}</span>
                                   <div 
                                     ref={el => rightDots.current[item.id] = el}
                                     className={`w-6 h-6 rounded-full border-4 transition-all z-30 flex-shrink-0 -ml-8 shadow-xl ${Object.values(ans.studentMatches || {}).includes(item.id) ? 'bg-emerald-500 border-emerald-400' : 'bg-gray-900 border-gray-500'}`}
                                   ></div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                    {/* End Matching Grid */}

                  </div>
                </div>

              ) : q.type === 'coding' ? (
                <div className="flex-1 flex overflow-hidden">
                  <div className="w-2/5 border-r border-gray-800 overflow-y-auto p-6 bg-gray-900/30">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-lg">Q{currentQ + 1}</span>
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-lg">{q.points} pts</span>
                      <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-lg">Coding</span>
                    </div>
                    <h2 className="text-xl font-bold mb-3">{q.title}</h2>
                    <p className="text-gray-400 whitespace-pre-wrap mb-6 leading-relaxed">{q.description}</p>
                    {q.constraints && (
                      <div className="mb-4"><h4 className="text-sm font-bold text-white mb-2">Constraints</h4>
                        <pre className="bg-gray-800 border border-gray-700 p-3 rounded-lg text-blue-300 font-mono text-sm">{q.constraints}</pre>
                      </div>
                    )}
                    {q.testCases?.filter(tc => !tc.isHidden).length > 0 && (
                      <div><h4 className="text-sm font-bold text-white mb-3">Examples</h4>
                        {q.testCases.filter(tc => !tc.isHidden).map((tc, i) => (
                          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden mb-3">
                            <div className="bg-gray-900 px-3 py-1.5 text-xs font-bold text-gray-400 border-b border-gray-700">Example {i + 1}</div>
                            <div className="p-3 grid grid-cols-2 gap-4 text-sm">
                              <div><div className="text-[10px] text-gray-500 uppercase mb-1">Input</div><pre className="font-mono text-gray-300">{tc.input}</pre></div>
                              <div><div className="text-[10px] text-gray-500 uppercase mb-1">Output</div><pre className="font-mono text-gray-300">{tc.expectedOutput}</pre></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0">
                      <select value={ans.language || 'python'} onChange={e => updateAnswer(qIdSafe, 'language', e.target.value)}
                        className="bg-gray-800 text-white text-sm border border-gray-700 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
                        {LANGS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                      <div className="ml-auto flex gap-2">
                        <button onClick={handleRunCode} disabled={running || judging}
                          className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg">
                          {running ? '⏳…' : '▶ Run'}
                        </button>
                        <button onClick={handleJudge} disabled={running || judging}
                          className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg">
                          {judging ? '⏳…' : '⚖️ Judge'}
                        </button>
                      </div>
                    </div>

                    <div className="flex-1">
                      <Editor height="100%" language={(LANGS.find(l => l.id === (ans.language || 'python'))?.m) || 'python'}
                        value={ans.code || ''} theme="vs-dark"
                        onChange={v => updateAnswer(qIdSafe, 'code', v || '')}
                        onMount={(editor) => {
                          editor.onKeyDown((e) => {
                            const ctrl = e.ctrlKey || e.metaKey;
                            const key = e.browserEvent.key.toLowerCase();
                            if (ctrl && ['c', 'v', 'x', 'a'].includes(key)) {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const type = key === 'v' ? 'PASTE' : key === 'c' ? 'COPY' : key === 'x' ? 'CUT' : 'SELECT_ALL';
                              showToast(`${type} shortcut is disabled.`, 'error');
                              proctoring.logViolation(`${type}_SHORTCUT`, 'medium', `Attempted ${type} via keyboard shortcut.`);
                            }
                          });
                        }}
                        options={{ fontSize: 14, fontFamily: "'JetBrains Mono',monospace", minimap: { enabled: false },
                          scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 12 },
                          lineNumbers: 'on', wordWrap: 'on', tabSize: 2, cursorBlinking: 'smooth', smoothScrolling: true,
                          contextmenu: false, dragAndDrop: false, copyWithSyntaxHighlighting: false,
                        }} />
                    </div>

                    <div className="h-40 border-t border-gray-800 bg-[#0d1117] overflow-auto p-3 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        <input value={codeStdin} onChange={e => setCodeStdin(e.target.value)}
                          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 font-mono outline-none"
                          placeholder="Custom stdin input…" />
                      </div>
                      {running && <p className="text-gray-500 text-xs">⏳ Running…</p>}
                      {runResult && (
                        <div className="flex flex-col gap-2">
                          {runResult.testSummary && (
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${runResult.passedCount === runResult.totalCount ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {runResult.testSummary}
                              </span>
                              {runResult.executionTime && <span className="text-[10px] text-gray-500">{runResult.executionTime}</span>}
                            </div>
                          )}
                          {runResult.testSummary && (
                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-2">
                              <div className={`h-full transition-all duration-500 ${runResult.passedCount === runResult.totalCount ? 'bg-emerald-500' : 'bg-red-500'}`}
                                style={{ width: `${(runResult.passedCount / runResult.totalCount) * 100}%` }} />
                            </div>
                          )}
                          <pre className={`font-mono text-[11px] whitespace-pre-wrap p-3 rounded-lg border ${runResult.error ? 'text-red-400 bg-red-500/5 border-red-500/20' : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'}`}>
                            {runResult.error || runResult.output || '(no output)'}
                          </pre>
                        </div>
                      )}

                      {judgeResult && (
                        <div className="mt-2">
                          <div className={`text-xs font-bold mb-1 ${judgeResult.verdict === 'accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {judgeResult.verdict === 'accepted' ? '✅ All Passed' : `❌ ${judgeResult.passed}/${judgeResult.total} passed`}
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {judgeResult.results?.map((r, i) => (
                              <span key={i} className={`text-[10px] px-2 py-0.5 rounded ${r.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {r.hidden ? `H${i + 1}` : `T${i + 1}`}: {r.passed ? '✓' : '✗'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto p-8">
                  <div className="max-w-3xl mx-auto">
                    <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-lg">Q{currentQ + 1} • {q.points} pts</span>
                    <h2 className="text-xl font-bold mt-3 mb-2">{q.title}</h2>
                    <p className="text-gray-400 mb-6 whitespace-pre-wrap">{q.description}</p>
                    <textarea value={ans.textAnswer || ''} onChange={e => updateAnswer(qIdSafe, 'textAnswer', e.target.value)}
                      className="w-full h-64 bg-gray-800 border border-gray-700 text-gray-200 p-4 rounded-xl outline-none resize-none font-medium"
                      placeholder="Type your answer here…" />
                  </div>
                </div>
              )}

              {/* Bottom nav */}
              <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-t border-gray-800 flex-shrink-0">
                <button onClick={() => { setCurrentQ(p => Math.max(0, p - 1)); setRunResult(null); setJudgeResult(null); }}
                  disabled={currentQ === 0} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white font-bold py-2 px-6 rounded-lg text-sm">
                  ← Previous
                </button>
                <span className="text-gray-500 text-sm">{currentQ + 1} / {exam?.questions?.length || 0}</span>
                <button onClick={() => { setCurrentQ(p => Math.min((exam?.questions?.length || 1) - 1, p + 1)); setRunResult(null); setJudgeResult(null); }}
                  disabled={currentQ === (exam?.questions?.length || 1) - 1} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white font-bold py-2 px-6 rounded-lg text-sm">
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm border border-emerald-100">🏁</div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-4">Final Submission</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-10 px-4">{confirmModal.message}</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmModal(null)} className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all">Go Back</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 px-6 py-4 bg-[#1A5F53] hover:bg-[#134d42] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-900/20 transition-all">Submit Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-10 duration-500">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-md ${
            toast.type === 'error' ? 'bg-red-600/90 border-red-400 text-white' : 
            toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-400 text-white' : 
            'bg-gray-900/90 border-gray-700 text-white'
          }`}>
            <span className="font-bold text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="hover:opacity-70 transition-opacity font-bold">×</button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};