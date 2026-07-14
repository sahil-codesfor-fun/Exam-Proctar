import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript',  monacoLang: 'javascript' },
  { id: 'typescript', name: 'TypeScript',  monacoLang: 'typescript' },
  { id: 'python',     name: 'Python',      monacoLang: 'python'     },
  { id: 'java',       name: 'Java',        monacoLang: 'java'       },
  { id: 'c',          name: 'C',           monacoLang: 'c'          },
  { id: 'cpp',        name: 'C++',         monacoLang: 'cpp'        },
  { id: 'csharp',     name: 'C#',          monacoLang: 'csharp'     },
  { id: 'go',         name: 'Go',          monacoLang: 'go'         },
  { id: 'rust',       name: 'Rust',        monacoLang: 'rust'       },
  { id: 'php',        name: 'PHP',         monacoLang: 'php'        },
  { id: 'ruby',       name: 'Ruby',        monacoLang: 'ruby'       },
  { id: 'kotlin',     name: 'Kotlin',      monacoLang: 'kotlin'     },
  { id: 'swift',      name: 'Swift',       monacoLang: 'swift'      },
  { id: 'perl',       name: 'Perl',        monacoLang: 'perl'       },
  { id: 'bash',       name: 'Bash',        monacoLang: 'shell'      },
  { id: 'r',          name: 'R',           monacoLang: 'r'          },
  { id: 'sql',        name: 'SQL',         monacoLang: 'sql'        },
  { id: 'scala',      name: 'Scala',       monacoLang: 'scala'      },
  { id: 'haskell',    name: 'Haskell',     monacoLang: 'haskell'    },
  { id: 'lua',        name: 'Lua',         monacoLang: 'lua'        },
  { id: 'dart',       name: 'Dart',        monacoLang: 'dart'       },
  { id: 'elixir',     name: 'Elixir',      monacoLang: 'elixir'     },
];

const TEMPLATES = {
  javascript: `// JavaScript (Node.js 18)\nconst lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconsole.log(lines[0]);`,
  typescript: `// TypeScript 5\nimport * as fs from 'fs';\nconst lines = fs.readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconsole.log(lines[0]);`,
  python:     `# Python 3.11\nimport sys\ndata = sys.stdin.read().split()\nprint(data[0] if data else '')`,
  java:       `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(sc.nextLine());\n    }\n}`,
  c:          `#include <stdio.h>\nint main() {\n    char s[256]; scanf("%s", s);\n    printf("%s\\n", s);\n    return 0;\n}`,
  cpp:        `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    ios_base::sync_with_stdio(false); cin.tie(NULL);\n    string s; cin >> s;\n    cout << s << "\\n";\n    return 0;\n}`,
  csharp:     `using System;\nclass Main {\n    static void Main() { Console.WriteLine(Console.ReadLine()); }\n}`,
  go:         `package main\nimport ("bufio";"fmt";"os")\nfunc main() {\n    r := bufio.NewReader(os.Stdin)\n    var s string; fmt.Fscan(r, &s)\n    fmt.Println(s)\n}`,
  rust:       `use std::io::{self,BufRead};\nfn main() {\n    let stdin=io::stdin();\n    if let Some(Ok(l))=stdin.lock().lines().next(){println!("{}",l);}\n}`,
  php:        `<?php\n$line = trim(fgets(STDIN));\necho $line . "\\n";`,
  ruby:       `puts gets.chomp`,
  kotlin:     `import java.util.Scanner\nfun main() { val sc=Scanner(System.\`in\`); println(sc.nextLine()) }`,
  swift:      `if let line = readLine() { print(line) }`,
  perl:       `my $l = <STDIN>; chomp $l; print "$l\\n";`,
  bash:       `#!/bin/bash\nread line\necho "$line"`,
  r:          `cat(readLines(file("stdin"),n=1), "\\n")`,
  sql:        `-- SQLite\nSELECT 'Hello, World!';`,
  scala:      `import scala.io.StdIn\nobject Main extends App { println(StdIn.readLine()) }`,
  haskell:    `main :: IO ()\nmain = getLine >>= putStrLn`,
  lua:        `print(io.read())`,
  dart:       `import 'dart:io';\nvoid main() { print(stdin.readLineSync()); }`,
  elixir:     `IO.puts IO.gets("") |> String.trim()`,
};

const VERDICT_COLORS = {
  accepted:            { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  wrong_answer:        { bg: 'bg-red-500/15',     border: 'border-red-500/40',     text: 'text-red-400',     dot: 'bg-red-400'     },
  runtime_error:       { bg: 'bg-orange-500/15',  border: 'border-orange-500/40',  text: 'text-orange-400',  dot: 'bg-orange-400'  },
  compilation_error:   { bg: 'bg-red-500/15',     border: 'border-red-500/40',     text: 'text-red-400',     dot: 'bg-red-400'     },
  time_limit_exceeded: { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-400',   dot: 'bg-amber-400'   },
};

function VerdictBadge({ verdict }) {
  const c = VERDICT_COLORS[verdict] || VERDICT_COLORS.runtime_error;
  const labels = { accepted:'Accepted', wrong_answer:'Wrong Answer', runtime_error:'Runtime Error', compilation_error:'Compilation Error', time_limit_exceeded:'Time Limit Exceeded' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-black border ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {labels[verdict] || verdict}
    </span>
  );
}

export function CompilerPage() {
  const { user } = useAuth();
  const [lang, setLang]         = useState('python');
  const [code, setCode]         = useState('');
  const [stdin, setStdin]       = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const tab = searchParams.get('tab') || 'output';
  const setTab = (newTab) => {
    setSearchParams(prev => { prev.set('tab', newTab); return prev; });
  };
  
  const [running, setRunning]   = useState(false);
  const [judging, setJudging]   = useState(false);
  const [runResult, setRunResult]   = useState(null);
  const [judgeResult, setJudgeResult] = useState(null);
  
  const [backendLangs, setBackendLangs] = useState([]);
  const [backendTemplates, setBackendTemplates] = useState({});

  const questionId = searchParams.get('questionId');
  const [question, setQuestion] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [questionStatuses, setQuestionStatuses] = useState([]);
  const [socket, setSocket] = useState(null);
  
  // 🚀 NUEVO: Array to hold ALL sheets!
  const [practiceSheets, setPracticeSheets] = useState([]);

  // ── ANTI-CHEAT RESTRICTIONS ──
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // 1. Disable Right Click
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // 2. Disable Copy/Paste/Cut/Drag
    const handleCopyPaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    // Use capture phase (true) to intercept before Monaco gets it
    document.addEventListener('copy', handleCopyPaste, true);
    document.addEventListener('paste', handleCopyPaste, true);
    document.addEventListener('cut', handleCopyPaste, true);
    document.addEventListener('dragstart', handleCopyPaste, true);
    document.addEventListener('drop', handleCopyPaste, true);

    // 3. Track Fullscreen
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // 4. Disable Text Selection (except in editor)
    const handleSelectStart = (e) => {
      if (!e.target.closest('.monaco-editor')) {
        e.preventDefault();
      }
    };
    document.addEventListener('selectstart', handleSelectStart);
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    // Set initial state in case already fullscreen
    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste, true);
      document.removeEventListener('paste', handleCopyPaste, true);
      document.removeEventListener('cut', handleCopyPaste, true);
      document.removeEventListener('dragstart', handleCopyPaste, true);
      document.removeEventListener('drop', handleCopyPaste, true);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    }
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log(err));
    }
    const moduleId = searchParams.get('moduleId');
    if (user?.role === 'student') {
      if (moduleId) {
        navigate(`/student-dashboard/courses/module/${moduleId}`);
      } else {
        navigate('/student-dashboard/coding-progress');
      }
    }
    else navigate('/teacher-dashboard/practice-manager');
  };
  
  useEffect(() => {
    const newSocket = io('http://localhost:5002/practice');
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const currentLang = backendLangs.find(l => l.id === lang) || LANGUAGES.find(l => l.id === lang) || LANGUAGES[2];

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const [langRes, tempRes] = await Promise.all([
          api.get('/compiler/languages'),
          api.get('/compiler/templates')
        ]);
        setBackendLangs(langRes.data.data || []);
        setBackendTemplates(tempRes.data.data || {});
        
        if (!code && tempRes.data.data?.python) {
          setCode(tempRes.data.data.python);
        }
      } catch (err) { console.error("Failed to fetch configs:", err); }
    };
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (questionId) {
      const fetchQuestion = async () => {
        setLoadingQuestion(true);
        try {
          const res = await api.get(`/practice/question/${questionId}`);
          if (res.data.success) {
            setQuestion(res.data.question);
          }
        } catch (err) { console.error("Failed to fetch question:", err); } 
        finally { setLoadingQuestion(false); }
      };
      fetchQuestion();
    }
  }, [questionId]);
  const moduleId = searchParams.get('moduleId');
  
  // 🚀 Fetch practice sheets or the specific module!
  useEffect(() => {
    const fetchSheets = async () => {
      try {
        if (moduleId) {
          const res = await api.get(`/hub/modules/${moduleId}`);
          if (res.data.success && res.data.module) {
            const mod = res.data.module;
            // Format module to look like a practice sheet for the sidebar
            const formattedSheet = {
              id: mod.id,
              title: mod.title,
              questions: mod.questions.map((q, idx) => ({
                questionId: q.id,
                order: idx,
                question: q
              }))
            };
            setPracticeSheets([formattedSheet]);
            
            // Map the isSolved flag into questionStatuses format
            const mappedStatuses = mod.questions.map(q => ({
              questionId: q.id,
              status: q.isSolved ? 'Accepted' : 'Not Started',
              draft: null
            }));
            setQuestionStatuses(mappedStatuses);
          }
        } else {
          const res = await api.get('/practice');
          if (res.data.success) {
            const sheets = res.data.sheets || res.data.data || [];
            setPracticeSheets(sheets);
            if (res.data.questionStatuses) setQuestionStatuses(res.data.questionStatuses);

            // If no question is selected, default to the first question of the first sheet
            if (!questionId && sheets.length > 0 && sheets[0].questions?.length > 0) {
              setSearchParams(prev => { prev.set('questionId', sheets[0].questions[0].questionId); return prev; });
            }
          }
        }
      } catch (err) { console.error("Failed to fetch:", err); }
    };
    fetchSheets();
  }, [moduleId]);

  // Compute the active sheet based on the current question
  const activeSheet = practiceSheets.find(s => s.questions?.some(q => q.questionId === questionId)) || practiceSheets[0];

  useEffect(() => {
    if (socket && activeSheet?.id) {
      socket.emit('join_sheet', { sheetId: activeSheet.id, role: 'student' });
    }
  }, [socket, activeSheet]);

  useEffect(() => {
    if (!questionId || !code) return;
    const saveDraft = setTimeout(async () => {
      try { await api.post('/practice/draft', { questionId, practiceSheetId: activeSheet?.id, language: lang, code }); } 
      catch (err) {}
    }, 10000);
    return () => clearTimeout(saveDraft);
  }, [code, lang, questionId, activeSheet]);

  const activeKeyRef = useRef(null);
  const lastLoadedDraftRef = useRef(null);

  useEffect(() => {
    const key = `${questionId}_${lang}`;
    const qs = questionStatuses.find(q => q.questionId === questionId);
    const draftCode = (qs && qs.draft && qs.draft.language === lang) ? qs.draft.code : null;
    
    // Did we just switch question or language?
    if (activeKeyRef.current !== key) {
      setRunResult(null);
      setJudgeResult(null);
      activeKeyRef.current = key;
      lastLoadedDraftRef.current = null; // reset draft tracker for new context
      
      if (draftCode) {
        setCode(draftCode);
        lastLoadedDraftRef.current = `${key}_has_draft`;
      } else {
        const template = backendTemplates[lang] || TEMPLATES[lang] || '// Start coding here';
        setCode(template);
      }
    } 
    // We are in the same context, but a draft just arrived from a delayed API fetch
    else if (draftCode && lastLoadedDraftRef.current !== `${key}_has_draft`) {
      setCode(draftCode);
      lastLoadedDraftRef.current = `${key}_has_draft`;
    }
  }, [questionId, lang, questionStatuses, backendTemplates]);

  const handleRun = async () => {
    setRunning(true); setRunResult(null); setTab('output');
    try {
      const r = await api.post('/compiler/execute', { language: lang, code, stdin });
      const resData = r.data;
      if (resData.success) {
        setRunResult({ verdict: 'accepted', output: resData.output, runtime: parseFloat(resData.executionTime) * 1000, error: null });
      } else {
        setRunResult({ verdict: (resData.errorType || 'runtime_error').toLowerCase().replace(/ /g, '_'), error: resData.stderr, output: '', runtime: 0 });
      }
    } catch (e) {
      setRunResult({ verdict: 'runtime_error', error: e.response?.data?.message || e.message || 'Execution failed', output: '', runtime: 0 });
    } finally { setRunning(false); }
  };

  const handleJudge = async () => {
    setJudging(true); setJudgeResult(null); setTab('judge');
    try {
      const payload = { language: lang, code };
      if (questionId) { payload.questionId = questionId; payload.practiceSheetId = activeSheet?.id; }
      
      const r = await api.post('/compiler/judge', payload);
      setJudgeResult(r.data.data);
      
      if (questionId) {
        setQuestionStatuses(prev => {
          const newStatuses = [...prev];
          const idx = newStatuses.findIndex(q => q.questionId === questionId);
          if (idx !== -1) newStatuses[idx].status = r.data.data.verdict === 'accepted' ? 'Accepted' : 'Attempted';
          return newStatuses;
        });
      }
    } catch (e) {
      setJudgeResult({ 
        verdict: 'error', 
        passed: 0, 
        total: 0, 
        results: [],
        message: e.response?.data?.message || e.message || 'Judge failed' 
      });
    } finally { setJudging(false); }
  };

  // 🚀 NUEVO: Flatten all questions so 'Next' navigates across sheets seamlessly!
  const allQuestions = practiceSheets.flatMap(s => s.questions || []);
  const currentQuestionGlobalIdx = allQuestions.findIndex(q => q.questionId === questionId);

  const handleNavigate = (direction) => {
    const nextIdx = currentQuestionGlobalIdx + direction;
    if (nextIdx >= 0 && nextIdx < allQuestions.length) {
      setSearchParams(prev => { 
          prev.set('questionId', allQuestions[nextIdx].questionId); 
          return prev; 
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-950 text-white font-sans overflow-hidden">
      
      {/* ── FULLSCREEN OVERLAY ── */}
      {!isFullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/95 backdrop-blur-md">
          <div className="text-center p-8 bg-gray-900 border border-red-500/50 rounded-2xl shadow-2xl max-w-md mx-4">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">Anti-Cheat Active</h2>
            <p className="text-gray-300 mb-6 font-medium">To maintain the integrity of this coding session, you must use the playground in fullscreen mode. Copy, paste, and right-click are strictly disabled.</p>
            <div className="flex gap-4 justify-center mt-2">
              <button 
                onClick={enterFullscreen}
                className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-[0_0_25px_rgba(220,38,38,0.7)]"
              >
                Enter Fullscreen
              </button>
              <button 
                onClick={handleExit}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-colors border border-gray-700"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={handleExit}
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
              ← Exit
            </button>
            <span className="text-lg font-bold flex items-center gap-2">
                <span className="text-2xl">🛡️</span> {activeSheet?.title || 'Practice Terminal'}
            </span>
        </div>

        <div className="flex gap-3 items-center">
            <select value={fontSize} onChange={e => setFontSize(+e.target.value)}
                className="bg-gray-800 text-white text-sm border border-gray-700 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
                {[12,13,14,15,16,18,20].map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
            <button onClick={() => setCode(TEMPLATES[lang] || '')}
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-colors border border-gray-700">
                ↺ Reset
            </button>
        </div>
      </div>

      {/* ── Main Layout (3 Columns) ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* 1. Left Sidebar: Navigator (Shows ALL Sheets!) */}
        {practiceSheets.length > 0 && (
          <div className="w-full md:w-64 flex-shrink-0 bg-gray-900/50 border-r border-gray-800 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full pb-8">
              {practiceSheets.map((sheet, sheetIdx) => (
                  <div key={sheet.id || sheetIdx} className="mb-6">
                      {/* Sticky Sheet Header */}
                      <div className="px-4 py-3 sticky top-0 bg-gray-900/95 backdrop-blur z-10 border-b border-gray-800 shadow-sm mb-3">
                          <h3 className="text-[11px] font-black text-gray-300 uppercase tracking-widest truncate" title={sheet.title}>{sheet.title}</h3>
                          <div className="flex justify-between items-center mt-2">
                              <span className="text-[9px] font-bold text-gray-500 uppercase">{sheet.questions?.length || 0} Questions</span>
                          </div>
                      </div>
                      
                      {/* Grid of Questions for this Sheet */}
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2 px-4">
                          {sheet.questions?.map((q, idx) => {
                              const qs = questionStatuses.find(status => status.questionId === q.questionId);
                              const isSolved = qs?.status === 'Accepted';
                              const isAttempted = qs && qs.status !== 'Not Started' && !isSolved;
                              const isActive = questionId === q.questionId;
  
                              return (
                                  <button key={q.questionId} 
                                      onClick={() => setSearchParams(prev => { prev.set('questionId', q.questionId); return prev; })}
                                      className={`w-full aspect-square flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${
                                          isActive ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' :
                                          isSolved ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                                          isAttempted ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' :
                                          'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-700'
                                      }`}>
                                      {idx + 1}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              ))}
          </div>
        )}

        {/* 2. Middle Column: Description */}
        <div className="w-2/5 border-r border-gray-800 overflow-y-auto p-6 bg-gray-900/30 flex flex-col [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            {loadingQuestion ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 font-bold animate-pulse">Loading Question...</div>
            ) : question ? (
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-lg">
                          Q{(activeSheet?.questions?.findIndex(q => q.questionId === questionId) ?? 0) + 1}
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-lg">{question.points || 10} pts</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                          question.difficulty?.toLowerCase() === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                          question.difficulty?.toLowerCase() === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {question.difficulty ? question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1).toLowerCase() : 'Medium'}
                        </span>
                    </div>
                    
                    <h2 className="text-xl font-bold mb-3 text-white">{question.title}</h2>
                    <p className="text-gray-400 whitespace-pre-wrap mb-6 leading-relaxed font-medium">{question.description}</p>
                    
                    {question.constraints && (
                        <div className="mb-4">
                            <h4 className="text-sm font-bold text-white mb-2">Constraints</h4>
                            <pre className="bg-gray-800 border border-gray-700 p-3 rounded-lg text-blue-300 font-mono text-sm shadow-inner whitespace-pre-wrap">
                                {question.constraints}
                            </pre>
                        </div>
                    )}
                    
                    {question.testCases?.filter(tc => !tc.isHidden).length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-white mb-3">Examples</h4>
                            {question.testCases.filter(tc => !tc.isHidden).map((tc, i) => (
                                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden mb-3">
                                    <div className="bg-gray-900 px-3 py-1.5 text-xs font-bold text-gray-400 border-b border-gray-700">Example {i + 1}</div>
                                    <div className="p-3 grid grid-cols-2 gap-4 text-sm">
                                        <div><div className="text-[10px] text-gray-500 uppercase mb-1 font-bold">Input</div><pre className="font-mono text-gray-300">{tc.input}</pre></div>
                                        <div><div className="text-[10px] text-gray-500 uppercase mb-1 font-bold">Output</div><pre className="font-mono text-emerald-400">{tc.expectedOutput}</pre></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-auto pt-6 flex justify-between items-center">
                        <button onClick={() => handleNavigate(-1)} disabled={currentQuestionGlobalIdx <= 0}
                            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors border border-gray-700">
                            ← Previous
                        </button>
                        <button onClick={() => handleNavigate(1)} disabled={currentQuestionGlobalIdx === -1 || currentQuestionGlobalIdx >= allQuestions.length - 1}
                            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors border border-gray-700">
                            Next →
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">Select a question to begin.</div>
            )}
        </div>

        {/* 3. Right Column: Editor & Terminal */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
          
          {/* Editor Header */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0">
            <select value={lang} onChange={e => setLang(e.target.value)}
                className="bg-gray-800 text-white text-sm border border-gray-700 rounded-lg px-3 py-1.5 outline-none cursor-pointer font-semibold">
                {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <div className="ml-auto flex gap-2">
                <button onClick={handleRun} disabled={running || judging}
                    className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition-colors">
                    {running ? '⏳…' : '▶ Compile'}
                </button>
                <button onClick={handleJudge} disabled={running || judging}
                    className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition-colors">
                    {judging ? '⏳…' : '⚖️ Submit Code'}
                </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={currentLang.monacoLang}
              value={code}
              theme="vs-dark"
              onChange={v => setCode(v || '')}
              onMount={(editor, monaco) => {
                editor.onKeyDown((e) => {
                  // Block Ctrl+C, Ctrl+V, Ctrl+X, Cmd+C, Cmd+V, Cmd+X
                  if ((e.ctrlKey || e.metaKey) && (e.keyCode === monaco.KeyCode.KeyC || e.keyCode === monaco.KeyCode.KeyV || e.keyCode === monaco.KeyCode.KeyX)) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                });
              }}
              options={{ 
                  fontSize, 
                  fontFamily: "'JetBrains Mono','Fira Code',monospace", 
                  minimap: { enabled: false }, 
                  scrollBeyondLastLine: false, 
                  automaticLayout: true, 
                  padding: { top: 12, bottom: 12 }, 
                  lineNumbers: 'on', 
                  wordWrap: 'on', 
                  tabSize: 2, 
                  renderLineHighlight: 'all', 
                  cursorBlinking: 'smooth', 
                  smoothScrolling: true, 
                  suggest: { showKeywords: true },
                  contextmenu: false
              }}
            />
          </div>

          {/* Bottom Terminal Pane */}
          <div className="h-64 border-t border-gray-800 bg-[#0d1117] flex flex-col flex-shrink-0">
              
              {/* Terminal Tabs */}
              <div className="flex items-center px-4 bg-gray-900 border-b border-gray-800">
                <button onClick={() => setTab('output')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${tab === 'output' ? 'text-blue-400 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
                    📤 Console
                </button>
                <button onClick={() => setTab('judge')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${tab === 'judge' ? 'text-blue-400 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
                    ⚖️ Judge Results
                </button>
              </div>

              {/* Terminal Body */}
              <div className="flex-1 overflow-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                  
                  {/* CONSOLE TAB */}
                  {tab === 'output' && (
                    <div className="flex flex-col h-full gap-4">
                        <div className="flex items-center gap-2 shrink-0">
                            <input value={stdin} onChange={e => setStdin(e.target.value)}
                                className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-gray-300 font-mono outline-none focus:border-gray-500 transition-colors"
                                placeholder="Custom stdin input…" spellCheck={false} />
                        </div>

                        <div className="flex-1">
                            {running ? (
                                <p className="text-gray-500 text-xs font-mono animate-pulse">⏳ Compiling & Running...</p>
                            ) : runResult ? (
                                <div className="flex flex-col gap-2 animate-in fade-in duration-300">
                                    <pre className={`font-mono text-[12px] whitespace-pre-wrap p-4 rounded-xl border shadow-inner ${runResult.error ? 'text-red-400 bg-red-950/20 border-red-500/20' : 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20'}`}>
                                        {runResult.error || runResult.output || '(No output provided by program)'}
                                    </pre>
                                </div>
                            ) : (
                                <p className="text-gray-600 text-xs font-bold uppercase tracking-widest text-center mt-10">
                                    Run code to view output
                                </p>
                            )}
                        </div>
                    </div>
                  )}

                  {/* JUDGE TAB */}
                  {tab === 'judge' && (
                    <div className="flex flex-col h-full">
                        {judging ? (
                            <p className="text-gray-500 text-xs font-mono animate-pulse mt-2">⚖️ Judging against hidden test cases...</p>
                        ) : judgeResult ? (
                            <div className="animate-in slide-in-from-bottom-2 duration-300">
                                <div className={`text-sm font-bold mb-3 pb-2 border-b ${judgeResult.verdict === 'accepted' ? 'text-emerald-400 border-emerald-500/20' : 'text-red-400 border-red-500/20'}`}>
                                    {judgeResult.verdict === 'error' ? '❌ ' + (judgeResult.message || 'Judge Failed') :
                                     judgeResult.verdict === 'accepted' ? '✅ All Test Cases Passed Successfully' : `❌ Passed ${judgeResult.passed} out of ${judgeResult.total} Test Cases`}
                                </div>
                                
                                {judgeResult.results?.length > 0 && (
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                      {judgeResult.results.map((r, i) => (
                                      <div key={i} className={`p-3 border rounded-xl flex-1 ${r.passed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                          <div className={`text-xs font-black tracking-wider uppercase flex items-center justify-between ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                              <span>{r.hidden ? `Secret TC ${i + 1}` : `Public TC ${i + 1}`}</span>
                                              <span>{r.passed ? '✓' : '✗'}</span>
                                          </div>
                                      </div>
                                      ))}
                                  </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest text-center mt-10">
                                Submit code for evaluation
                            </p>
                        )}
                    </div>
                  )}

              </div>
          </div>
        </div>

      </div>
    </div>
  );
}