import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import useProctoring from '../hooks/useProctoring';
import Editor from '@monaco-editor/react';
import useAIVision from '../hooks/useAIVision';

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

  const camCheckRef = useRef(null);
  const examCamRef = useRef(null);

  const [proctorReady, setProctorReady] = useState(false);
  useEffect(() => {
    if (phase === 'exam') {
      const timer = setTimeout(() => setProctorReady(true), 3000);
      return () => clearTimeout(timer);
    }
    setProctorReady(false);
  }, [phase]);

  const handleRestricted = useCallback((msg) => { setPhase('restricted'); setError(msg); }, []);
  const handleAutoSubmit = useCallback((reason) => { doSubmit(true, reason); }, []);
  
  const proctoring = useProctoring({
    examId, 
    enabled: ['exam', 'fullscreen'].includes(phase) && proctorReady && !submittedRef.current,
    maxViolations: exam?.proctoring?.maxViolations || 3,
    onRestricted: handleRestricted, 
    onAutoSubmit: handleAutoSubmit,
  });

  const aiVision = useAIVision({
    enabled: ['exam', 'camera_check', 'fullscreen'].includes(phase) && !submittedRef.current,
    onViolation: proctoring.logViolation
  });

  const stopCamera = useCallback(() => {
    if (aiVision.videoRef?.current?.srcObject) {
      aiVision.videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      aiVision.videoRef.current.srcObject = null;
    }
  }, [aiVision.videoRef]);

  useEffect(() => {
    if (['submitted', 'error', 'restricted'].includes(phase)) {
      stopCamera();
    }
  }, [phase, stopCamera]);

  // ── FIX: Robust Camera Stream Mirroring ──
  // Continuously checks and ensures the visible videos have the stream
  useEffect(() => {
    const mirrorInterval = setInterval(() => {
      const src = aiVision.videoRef?.current?.srcObject;
      if (src) {
        if (camCheckRef.current && camCheckRef.current.srcObject !== src) {
          camCheckRef.current.srcObject = src;
        }
        if (examCamRef.current && examCamRef.current.srcObject !== src) {
          examCamRef.current.srcObject = src;
        }
      }
    }, 500);
    return () => clearInterval(mirrorInterval);
  }, []);

  // ── Security & Lockdown ──
  useEffect(() => {
    const preventBack = () => window.history.forward();
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', preventBack);

    const handleBeforeUnload = (e) => {
      if ((phase === 'exam' || phase === 'fullscreen') && !submittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleFullscreenChange = () => {
      if (phase === 'exam' && exam?.proctoring?.requireFullscreen && !document.fullscreenElement && !submittedRef.current) {
        
        // ── FIX: Explicitly log the violation BEFORE locking the screen ──
        if (proctoring && proctoring.logViolation) {
          proctoring.logViolation('fullscreen_exit', 'Student exited fullscreen mode');
        }
        
        setPhase('fullscreen');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('popstate', preventBack);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [phase, exam, proctoring]);

  // ── Init exam ──
  useEffect(() => {
    (async () => {
      try {
        const examRes = await api.get(`/exams/${examId}`);
        let e = examRes.data.data;

        if (e.status !== 'active' && e.startTime && new Date(e.startTime) <= new Date()) {
          try {
            await api.patch(`/exams/${examId}/status`, { status: 'active' });
            e.status = 'active'; 
          } catch (patchErr) {
            console.warn("Could not auto-activate.", patchErr);
          }
        }

        const subRes = await api.post(`/submissions/start/${examId}`);
        const s = subRes.data.data;
        
        setExam(e);
        setSubmission(s);
        setTimeLeft(e.durationMinutes * 60);

        if (subRes.data.resumed && s.answers?.length) {
          setAnswers(s.answers);
        } else {
          setAnswers(e.questions.map(q => ({
            questionId: q._id, questionType: q.type,
            selectedOption: -1, code: '', language: 'python', textAnswer: '',
            score: 0, maxScore: q.points,
          })));
        }

        const socket = connectSocket();
        socket.emit('join_exam', { examId, studentId: user?._id, studentName: user?.name });

        socket.on('force_submit', (data) => {
          alert(`Your exam was terminated by the proctor. Reason: ${data.reason}`);
          doSubmit(true, data.reason);
        });

        setPhase(e.proctoring?.enableWebcam !== false ? 'camera_check' : (e.proctoring?.requireFullscreen ? 'fullscreen' : 'exam'));
      } catch (err) {
        let msg = err.response?.data?.message || err.message || 'Failed to load exam';
        setError(msg);
        setPhase('error');
      }
    })();
    return () => { 
      const socket = getSocket();
      if (socket) socket.off('force_submit');
      disconnectSocket(); 
      if (timerRef.current) clearInterval(timerRef.current); 
    };
  }, [examId, user]);

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'exam') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { doSubmit(true, 'Time expired'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ── Auto-save every 30s ──
  useEffect(() => {
    if (phase !== 'exam' || !submission) return;
    const iv = setInterval(() => {
      api.put(`/submissions/${submission._id}/save`, { answers }).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, [phase, answers, submission]);

  // ── Live Monitoring Broadcaster ──
  useEffect(() => {
    if (phase !== 'exam' && phase !== 'fullscreen') return;
    const interval = setInterval(() => {
      const socket = getSocket();
      if (socket && window.examCameraStream) { // Use the global stream to verify active camera
        const frame = aiVision.captureScreenshot ? aiVision.captureScreenshot() : null;
        if (frame) socket.emit('live_frame', { frame });
      }
    }, 1500); // 1.5 FPS keeps bandwidth extremely low while still providing live visuals
    return () => clearInterval(interval);
  }, [phase, aiVision.captureScreenshot]);

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
    if (!auto && !confirm('Submit this exam? This cannot be undone.')) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await api.put(`/submissions/${submission._id}/submit`, { answers, autoSubmit: auto, reason });
      document.exitFullscreen?.().catch(() => {});
      stopCamera(); 
      setPhase('submitted');
    } catch (err) {
      alert('Submit failed: ' + (err.response?.data?.message || err.message));
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
        runRes = {
          output: resData.output,
          error: null,
          executionTime: resData.executionTime,
          success: true
        };
      } else {
        runRes = {
          error: resData.stderr,
          output: '',
          errorType: resData.errorType,
          success: false
        };
      }

      // Automatically run tests if they exist
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
        
        // Update global answer state for score tracking
        const score = d.verdict === 'accepted' ? q.points : Math.round((d.passed / d.total) * q.points);
        updateAnswer(ans.questionId, 'score', score);
        updateAnswer(ans.questionId, 'verdict', d.verdict);
        updateAnswer(ans.questionId, 'passedTests', d.passed);
        updateAnswer(ans.questionId, 'totalTests', d.total);
      }

      setRunResult(runRes);
    } catch (e) { 
      setRunResult({ error: e.response?.data?.message || e.message || 'Execution failed', output: '' }); 
    }
    finally { setRunning(false); }
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
      setJudgeResult(null); 
    }
    finally { setJudging(false); }
  };


  const fmtTime = (s) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const isLow = timeLeft < 300;

  const totalSeconds = (exam?.durationMinutes || 0) * 60;
  const elapsedSeconds = totalSeconds - timeLeft;
  const isHalfTimePassed = totalSeconds > 0 ? elapsedSeconds >= (totalSeconds / 2) : true;

  const q = exam?.questions?.[currentQ];
  const ans = q ? (answers.find(a => a.questionId === q._id) || {}) : {};

  return (
    <React.Fragment>
      {/* PERSISTENT HIDDEN AI CAMERA */}
      <video ref={aiVision.videoRef} className="hidden" playsInline muted autoPlay />

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

      {phase === 'camera_check' && (
        <div className="h-screen flex items-center justify-center bg-gray-950 text-white p-4">
          <div className="text-center max-w-2xl w-full p-8 bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl">
            <div className="text-5xl mb-4">📷</div>
            <h2 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Environment Verification</h2>
            <p className="text-gray-400 mb-8 text-sm">Please ensure your face is clearly visible and your environment is clear of prohibited items.</p>
            
            <div className="bg-black rounded-2xl overflow-hidden mb-8 mx-auto w-full max-w-md h-72 border border-gray-700 relative shadow-inner">
              <video ref={camCheckRef} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} autoPlay muted playsInline />
            </div>

            <button 
              onClick={async () => {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                  alert("Camera API not supported");
                  return;
                }

                try {
                  console.log("Requesting webcam permission...");

                  const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                  });

                  console.log("Camera permission granted");

                  window.examCameraStream = stream;

                  if (aiVision.videoRef.current) {
                    aiVision.videoRef.current.srcObject = stream;
                    await aiVision.videoRef.current.play();
                  }
                  if (camCheckRef.current) {
                    camCheckRef.current.srcObject = stream;
                    await camCheckRef.current.play();
                  }

                  console.log("Camera stream active");

                  if (exam?.proctoring?.requireFullscreen) {
                    await document.documentElement.requestFullscreen();
                  }

                  setPhase('exam');
                } catch (err) {
                  console.error("Camera permission error:", err);
                  alert("Camera access is required to start the exam.");
                }
              }} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 rounded-xl w-full max-w-md mx-auto transition-all transform active:scale-[0.98] shadow-lg shadow-emerald-500/20"
            >
              Start Exam
            </button>
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
        <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden select-none" style={{ fontFamily: "'Inter', sans-serif" }}>

          {/* ── Top Bar ── */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold">🛡️ {exam?.title || 'Exam Terminal'}</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-lg ${proctoring?.violationCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                Violations: {proctoring?.violationCount || 0}/{exam?.proctoring?.maxViolations || 3}
              </span>
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

          {/* ── Main Content ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* Left Sidebar — Question Navigator */}
            <div className="w-56 flex-shrink-0 bg-gray-900/50 border-r border-gray-800 flex flex-col overflow-y-auto p-4">
              
              {/* AI Webcam Preview Mirrored here */}
              <div className="mb-4 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 relative h-32 flex-shrink-0">
                <video ref={examCamRef} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} playsInline muted autoPlay />
                
                {!aiVision.streamActive && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">Connecting Camera…</div>
                )}
                {aiVision.streamActive && !aiVision.modelsLoaded && (
                  <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-[10px] text-center text-emerald-400 rounded p-1 font-bold animate-pulse">
                    Loading AI Models…
                  </div>
                )}
                {aiVision.modelsLoaded && (
                  <div className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                )}
              </div>

              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Questions ({exam?.questions?.length || 0})</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {exam?.questions?.map((qq, idx) => {
                  const a = answers.find(x => x.questionId === qq._id);
                  const done = a && (a.selectedOption >= 0 || (a.code && a.code.length > 10) || a.textAnswer);
                  return (
                    <button key={qq._id} onClick={() => { setCurrentQ(idx); setRunResult(null); setJudgeResult(null); }}
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

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {q.type === 'mcq' ? (
                /* ── MCQ View ── */
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
                      {q.options?.map((opt, oi) => (
                        <label key={oi} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          ans.selectedOption === oi ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}>
                          <input type="radio" name={`q-${q._id}`} className="w-5 h-5 accent-blue-500"
                            checked={ans.selectedOption === oi}
                            onChange={() => updateAnswer(q._id, 'selectedOption', oi)} />
                          <span className="text-gray-200">{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : q.type === 'coding' ? (
                /* ── Coding View — LeetCode-style split ── */
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
                      <select value={ans.language || 'python'} onChange={e => updateAnswer(q._id, 'language', e.target.value)}
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
                        onChange={v => updateAnswer(q._id, 'code', v || '')}
                        options={{ fontSize: 14, fontFamily: "'JetBrains Mono',monospace", minimap: { enabled: false },
                          scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 12 },
                          lineNumbers: 'on', wordWrap: 'on', tabSize: 2, cursorBlinking: 'smooth', smoothScrolling: true }} />
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
                /* ── Subjective View ── */
                <div className="flex-1 overflow-auto p-8">
                  <div className="max-w-3xl mx-auto">
                    <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-lg">Q{currentQ + 1} • {q.points} pts</span>
                    <h2 className="text-xl font-bold mt-3 mb-2">{q.title}</h2>
                    <p className="text-gray-400 mb-6 whitespace-pre-wrap">{q.description}</p>
                    <textarea value={ans.textAnswer || ''} onChange={e => updateAnswer(q._id, 'textAnswer', e.target.value)}
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
    </React.Fragment>
  );
};