import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript',  icon: '🟨', monacoLang: 'javascript' },
  { id: 'typescript', name: 'TypeScript',  icon: '🔷', monacoLang: 'typescript' },
  { id: 'python',     name: 'Python',      icon: '🐍', monacoLang: 'python'     },
  { id: 'java',       name: 'Java',        icon: '☕', monacoLang: 'java'       },
  { id: 'c',          name: 'C',           icon: '⚙️', monacoLang: 'c'          },
  { id: 'cpp',        name: 'C++',         icon: '🔧', monacoLang: 'cpp'        },
  { id: 'csharp',     name: 'C#',          icon: '💜', monacoLang: 'csharp'     },
  { id: 'go',         name: 'Go',          icon: '🐹', monacoLang: 'go'         },
  { id: 'rust',       name: 'Rust',        icon: '🦀', monacoLang: 'rust'       },
  { id: 'php',        name: 'PHP',         icon: '🐘', monacoLang: 'php'        },
  { id: 'ruby',       name: 'Ruby',        icon: '💎', monacoLang: 'ruby'       },
  { id: 'kotlin',     name: 'Kotlin',      icon: '🎯', monacoLang: 'kotlin'     },
  { id: 'swift',      name: 'Swift',       icon: '🐦', monacoLang: 'swift'      },
  { id: 'perl',       name: 'Perl',        icon: '🔮', monacoLang: 'perl'       },
  { id: 'bash',       name: 'Bash',        icon: '🐚', monacoLang: 'shell'      },
  { id: 'r',          name: 'R',           icon: '📊', monacoLang: 'r'          },
  { id: 'sql',        name: 'SQL',         icon: '🗄️', monacoLang: 'sql'        },
  { id: 'scala',      name: 'Scala',       icon: '🔴', monacoLang: 'scala'      },
  { id: 'haskell',    name: 'Haskell',     icon: '🟣', monacoLang: 'haskell'    },
  { id: 'lua',        name: 'Lua',         icon: '🌙', monacoLang: 'lua'        },
  { id: 'dart',       name: 'Dart',        icon: '🎯', monacoLang: 'dart'       },
  { id: 'elixir',     name: 'Elixir',      icon: '💧', monacoLang: 'elixir'     },
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

const DEFAULT_TEST_CASES = [
  { input: 'hello', expectedOutput: 'hello', isHidden: false },
  { input: 'world', expectedOutput: 'world', isHidden: false },
];

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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.border} ${c.text}`}>
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
    setSearchParams(prev => {
      prev.set('tab', newTab);
      return prev;
    });
  };
  const [running, setRunning]   = useState(false);
  const [judging, setJudging]   = useState(false);
  const [runResult, setRunResult]   = useState(null);
  const [judgeResult, setJudgeResult] = useState(null);
  const [testCases, setTestCases]   = useState(DEFAULT_TEST_CASES);
  const [tcResults, setTcResults]   = useState([]);
  const [selectedTc, setSelectedTc] = useState(0);
  const [langOpen, setLangOpen]     = useState(false);
  const [backendLangs, setBackendLangs] = useState([]);
  const [backendTemplates, setBackendTemplates] = useState({});
  const langRef = useRef(null);

  const questionId = searchParams.get('questionId');
  const practiceSheetId = searchParams.get('practiceSheetId');
  const [question, setQuestion] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [questionStatuses, setQuestionStatuses] = useState([]);
  const [socket, setSocket] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  
  // Initialize WebSocket
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
        
        // Update code if it was empty
        if (!code && tempRes.data.data?.python) {
          setCode(tempRes.data.data.python);
        }
      } catch (err) {
        console.error("Failed to fetch compiler configs:", err);
      }
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
            if (res.data.question.testCases && res.data.question.testCases.length > 0) {
              setTestCases(res.data.question.testCases);
            }
          }
        } catch (err) {
          console.error("Failed to fetch question:", err);
        } finally {
          setLoadingQuestion(false);
        }
      };
      fetchQuestion();
    }
  }, [questionId]);

  const [practiceSheet, setPracticeSheet] = useState(null);
  
  useEffect(() => {
    const fetchSheet = async () => {
      try {
        let res;
        if (practiceSheetId) {
          res = await api.get(`/practice/${practiceSheetId}`);
        } else {
          // Auto-fetch current active sheet
          res = await api.get(`/practice/current`);
        }
        
        if (res.data.success) {
          const sheet = res.data.sheet;
          setPracticeSheet(sheet);
          
          if (res.data.questionStatuses) {
            setQuestionStatuses(res.data.questionStatuses);
          }

          if (!practiceSheetId) {
            setSearchParams(prev => {
              prev.set('practiceSheetId', sheet.id);
              return prev;
            });
          }

          if (!questionId && sheet.questions && sheet.questions.length > 0) {
            setSearchParams(prev => {
              prev.set('questionId', sheet.questions[0].questionId);
              return prev;
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch practice sheet:", err);
      }
    };
    fetchSheet();
  }, [practiceSheetId]);

  // Join Socket Room when sheet loads
  useEffect(() => {
    if (socket && practiceSheet?.id) {
      socket.emit('join_sheet', { sheetId: practiceSheet.id, role: 'student' });
    }
  }, [socket, practiceSheet]);

  // Auto-Save Draft
  useEffect(() => {
    if (!questionId || !code) return;
    const saveDraft = setTimeout(async () => {
      try {
        await api.post('/practice/draft', {
          questionId,
          practiceSheetId: practiceSheet?.id,
          language: lang,
          code
        });
        // Fetch fresh submissions
      if (questionId) {
        const fetchHistory = async () => {
          try {
            const res = await api.get(`/practice/submissions/${questionId}`);
            if (res.data.success) setSubmissions(res.data.submissions);
          } catch (err) {}
        };
        fetchHistory();
      }
    } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(saveDraft);
  }, [code, lang, questionId, practiceSheet]);

  // Fetch submissions and drafts on question load
  useEffect(() => {
    if (questionId) {
      const fetchHistory = async () => {
        try {
          const res = await api.get(`/practice/submissions/${questionId}`);
          if (res.data.success) setSubmissions(res.data.submissions);
        } catch (err) {
          console.error("Failed to fetch submissions:", err);
        }
      };
      fetchHistory();

      // Check if we have a draft in questionStatuses
      const qs = questionStatuses.find(q => q.questionId === questionId);
      if (qs && qs.draft && qs.draft.language === lang) {
        setCode(qs.draft.code);
      }
    }
  }, [questionId, questionStatuses, lang]);

  useEffect(() => {
    const template = backendTemplates[lang] || TEMPLATES[lang] || '// Start coding here';
    setCode(template);
    setRunResult(null); setJudgeResult(null); setTcResults([]);
  }, [lang, backendTemplates]);

  useEffect(() => {
    const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRun = async () => {
    setRunning(true); setRunResult(null); setTab('output');
    try {
      // 1. Run with custom stdin
      const r = await api.post('/compiler/execute', { language: lang, code, stdin });
      const resData = r.data;
      let runRes = null;
      
      if (resData.success) {
        runRes = {
          verdict: 'accepted',
          output: resData.output,
          runtime: parseFloat(resData.executionTime) * 1000,
          error: null
        };
      } else {
        runRes = {
          verdict: (resData.errorType || 'runtime_error').toLowerCase().replace(/ /g, '_'),
          error: resData.stderr,
          output: '',
          runtime: 0
        };
      }

      // 2. Automatically run test cases if they exist
      if (testCases.length > 0) {
        const tr = await api.post('/compiler/judge', { language: lang, code, testCases });
        const judgeData = tr.data.data;
        setTcResults(judgeData.results || []);
        runRes.testSummary = `Passed ${judgeData.passed} / ${judgeData.total} test cases`;
        runRes.passedCount = judgeData.passed;
        runRes.totalCount = judgeData.total;
      }
      
      setRunResult(runRes);
    } catch (e) {
      setRunResult({ 
        verdict: 'runtime_error', 
        error: e.response?.data?.message || e.message || 'Execution failed', 
        output: '', 
        runtime: 0 
      });
    } finally { setRunning(false); }
  };


  const handleRunTests = async () => {
    setRunning(true); setTcResults([]); setTab('testcases');
    try {
      const payload = { language: lang, code, testCases };
      if (questionId) {
        payload.questionId = questionId;
        payload.practiceSheetId = practiceSheetId;
      }
      const r = await api.post('/compiler/judge', payload);
      // Judge API returns { success: true, data: { verdict, passed, total, results } }
      setTcResults(r.data.data.results || []);
    } catch (e) {
      console.error("Run tests failed:", e);
      setTcResults([]);
    } finally { setRunning(false); }
  };

  const handleJudge = async () => {
    setJudging(true); setJudgeResult(null); setTab('judge');
    try {
      const payload = { language: lang, code, testCases };
      if (questionId) {
        payload.questionId = questionId;
        payload.practiceSheetId = practiceSheetId;
      }
      const r = await api.post('/compiler/judge', payload);
      setJudgeResult(r.data.data);
      
      // Update local question status and fetch submissions
      if (questionId) {
        setQuestionStatuses(prev => {
          const newStatuses = [...prev];
          const idx = newStatuses.findIndex(q => q.questionId === questionId);
          if (idx !== -1) {
            newStatuses[idx].status = r.data.data.verdict === 'accepted' ? 'Accepted' : 'Attempted';
          }
          return newStatuses;
        });

        api.get(`/practice/submissions/${questionId}`).then(res => {
          if (res.data.success) setSubmissions(res.data.submissions);
        });
      }
    } catch (e) {
      console.error("Judge failed:", e);
      setJudgeResult({ verdict: 'runtime_error', passed: 0, total: testCases.length, results: [] });
    } finally { setJudging(false); }
  };


  const addTestCase = () => setTestCases(prev => [...prev, { input: '', expectedOutput: '', isHidden: false }]);
  const updateTc = (i, field, val) => setTestCases(prev => prev.map((tc, idx) => idx === i ? { ...tc, [field]: val } : tc));
  const removeTc = (i) => setTestCases(prev => prev.filter((_, idx) => idx !== i));

  const handleAction = async (action) => {
    if (!questionId) return;
    try {
      const res = await api.post('/practice/action', { questionId, action });
      if (res.data.success) {
        setQuestionStatuses(prev => {
          const newStatuses = [...prev];
          const idx = newStatuses.findIndex(q => q.questionId === questionId);
          if (idx !== -1) {
            newStatuses[idx].status = res.data.status;
          } else {
            newStatuses.push({ questionId, status: res.data.status, draft: null });
          }
          return newStatuses;
        });
      }
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  const currentQuestionIdx = practiceSheet?.questions?.findIndex(q => q.questionId === questionId) ?? -1;
  const handleNavigate = (direction) => {
    if (currentQuestionIdx === -1 || !practiceSheet?.questions) return;
    let nextIdx = currentQuestionIdx + direction;
    if (nextIdx >= 0 && nextIdx < practiceSheet.questions.length) {
      setSearchParams(prev => {
        prev.set('questionId', practiceSheet.questions[nextIdx].questionId);
        return prev;
      });
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 64px)', background: '#0d1117', color: '#e6edf3', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-[#161b22] border-b border-[#30363d] shrink-0">
        {/* Exit Button */}
        <button onClick={() => {
            if (user?.role === 'student') navigate('/student-dashboard/coding-progress');
            else navigate('/teacher-dashboard/practice-manager');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent', border: '1px solid #30363d', borderRadius: 8, color: '#8b949e', fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
          onMouseOver={e => { e.currentTarget.style.color = '#c9d1d9'; e.currentTarget.style.borderColor = '#8b949e'; }}
          onMouseOut={e => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.borderColor = '#30363d'; }}>
          <span>← Exit</span>
        </button>

        {/* Language picker */}
        <div ref={langRef} className="relative">
          <button onClick={() => setLangOpen(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#21262d', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', fontSize: 13, cursor: 'pointer', minWidth: 160 }}>
            <span>{currentLang.icon}</span>
            <span style={{ fontWeight: 600 }}>{currentLang.name}</span>
            <span style={{ marginLeft: 'auto', opacity: 0.5 }}>▾</span>
          </button>
          {langOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#161b22', border: '1px solid #30363d', borderRadius: 10, zIndex: 100, width: 220, maxHeight: 360, overflowY: 'auto', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
              {LANGUAGES.map(l => (
                <button key={l.id} onClick={() => { setLang(l.id); setLangOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px', background: l.id === lang ? '#21262d' : 'transparent', border: 'none', color: l.id === lang ? '#58a6ff' : '#c9d1d9', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                  <span>{l.icon}</span><span>{l.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font size */}
        <select value={fontSize} onChange={e => setFontSize(+e.target.value)}
          style={{ padding: '5px 8px', background: '#21262d', border: '1px solid #30363d', borderRadius: 8, color: '#8b949e', fontSize: 12, cursor: 'pointer' }}>
          {[12,13,14,15,16,18,20].map(s => <option key={s} value={s}>{s}px</option>)}
        </select>

        {/* Reset */}
        <button onClick={() => setCode(TEMPLATES[lang] || '')}
          style={{ padding: '5px 10px', background: '#21262d', border: '1px solid #30363d', borderRadius: 8, color: '#8b949e', fontSize: 12, cursor: 'pointer' }}>
          ↺ Reset
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={handleRunTests} disabled={running || judging}
            style={{ padding: '7px 16px', background: '#21262d', border: '1px solid #30363d', borderRadius: 8, color: '#c9d1d9', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: running || judging ? 0.5 : 1 }}>
            🧪 Run Tests
          </button>
          <button onClick={handleRun} disabled={running || judging}
            style={{ padding: '7px 18px', background: '#238636', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: running || judging ? 0.5 : 1 }}>
            {running ? '⏳ Running…' : '▶ Compile'}
          </button>
          <button onClick={handleJudge} disabled={running || judging}
            style={{ padding: '7px 18px', background: '#1f6feb', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: running || judging ? 0.5 : 1 }}>
            {judging ? '⏳ Judging…' : 'Submit '}
          </button>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Left Panel: Questions List & Description */}
        {(questionId || practiceSheetId) && (
          <div className="w-full md:w-[380px] lg:w-[450px] flex flex-col bg-[#0d1117] border-b md:border-b-0 md:border-r border-[#30363d] overflow-y-auto min-h-[30vh] md:min-h-0">
            {/* If Practice Sheet, show question list at top */}
            {practiceSheet && (
                <div className="flex flex-col border-b border-[#30363d] max-h-[40%] overflow-y-auto overflow-x-hidden shrink-0 bg-[#161b22] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#30363d] [&::-webkit-scrollbar-thumb]:rounded-full">
                  <div className="px-4 py-2 bg-[#21262d] text-xs font-bold text-[#c9d1d9] uppercase tracking-widest sticky top-0 border-b border-[#30363d] z-10 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span>{practiceSheet.title}</span>
                      <span className="text-[#8b949e]">{practiceSheet.questions?.length || 0} Qs</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[#0d1117] rounded-full h-1.5 border border-[#30363d] overflow-hidden">
                      <div className="bg-[#238636] h-1.5" style={{ width: `${(questionStatuses.filter(q => q.status === 'Accepted').length / (practiceSheet.questions?.length || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {practiceSheet.questions?.map((q, idx) => {
                      const qs = questionStatuses.find(status => status.questionId === q.questionId);
                      const isSolved = qs?.status === 'Accepted';
                      const isAttempted = qs && qs.status !== 'Not Started' && !isSolved;
                      const isBookmarked = qs?.status === 'Bookmarked';
                      const isReviewed = qs?.status === 'Reviewed';

                      return (
                        <button 
                          key={q.questionId}
                          onClick={() => setSearchParams(prev => { prev.set('questionId', q.questionId); return prev; })}
                          className={`flex items-center justify-between px-4 py-3 text-left border-b border-[#30363d] hover:bg-[#21262d] transition-colors ${questionId === q.questionId ? 'bg-[#21262d] border-l-4 border-l-[#58a6ff]' : 'border-l-4 border-l-transparent'}`}
                        >
                          <div>
                            <div className={`text-sm font-bold flex items-center gap-2 ${questionId === q.questionId ? 'text-[#58a6ff]' : 'text-[#e6edf3]'}`}>
                              {isSolved && <span className="text-[#3fb950]" title="Solved">✓</span>}
                              {isAttempted && <span className="text-[#d29922]" title="Attempted">◐</span>}
                              {(!isSolved && !isAttempted) && <span className="text-[#8b949e]" title="Not Started">○</span>}
                              {idx + 1}. {q.question?.title || 'Untitled'}
                            </div>
                            <div className="flex gap-2 mt-1 pl-5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${q.question?.difficulty?.toLowerCase() === 'easy' ? 'bg-[#2ea04315] text-[#3fb950]' : q.question?.difficulty?.toLowerCase() === 'medium' ? 'bg-[#d2992215] text-[#d29922]' : 'bg-[#f8514915] text-[#f85149]'}`}>{q.question?.difficulty || 'Medium'}</span>
                              {q.question?.topic && <span className="text-[9px] px-1.5 py-0.5 bg-[#30363d] text-[#8b949e] rounded font-bold uppercase tracking-wider">{q.question.topic}</span>}
                              {isBookmarked && <span className="text-[9px] px-1.5 py-0.5 bg-[#58a6ff15] text-[#58a6ff] rounded font-bold uppercase tracking-wider">Bookmarked</span>}
                              {isReviewed && <span className="text-[9px] px-1.5 py-0.5 bg-[#d2992215] text-[#d29922] rounded font-bold uppercase tracking-wider">Reviewed</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
            )}

            <div className="flex shrink-0 border-b border-[#30363d] justify-between items-center pr-2 py-1 flex-wrap gap-2">
               <button className="px-4 py-2 text-sm font-bold text-[#58a6ff] border-b-2 border-[#58a6ff]">Description</button>
               <div className="flex gap-2">
                 {(() => {
                   const qs = questionStatuses.find(status => status.questionId === questionId);
                   const isBookmarked = qs?.status === 'Bookmarked';
                   const isReviewed = qs?.status === 'Reviewed';
                   return (
                     <>
                       <button onClick={() => handleAction('Bookmarked')} className={`text-xs px-2 py-1 border rounded transition-all ${isBookmarked ? 'bg-[#58a6ff15] border-[#58a6ff] text-[#58a6ff]' : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:bg-[#21262d]'}`}>
                         🔖 {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                       </button>
                       <button onClick={() => handleAction('Reviewed')} className={`text-xs px-2 py-1 border rounded transition-all ${isReviewed ? 'bg-[#d2992215] border-[#d29922] text-[#d29922]' : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:bg-[#21262d]'}`}>
                         ⭐ {isReviewed ? 'Reviewed' : 'Review'}
                       </button>
                     </>
                   );
                 })()}
               </div>
            </div>
            
            {loadingQuestion ? (
              <div className="flex-1 flex items-center justify-center text-[#8b949e]">Loading Problem...</div>
            ) : question ? (
              <div className="p-5 space-y-6 flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#30363d] [&::-webkit-scrollbar-thumb]:rounded-full">
                <div>
                  <h1 className="text-xl font-bold text-[#e6edf3] mb-2">{question.title}</h1>
                  <div className="flex gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${question.difficulty?.toLowerCase() === 'easy' ? 'bg-[#2ea04315] text-[#3fb950]' : question.difficulty?.toLowerCase() === 'medium' ? 'bg-[#d2992215] text-[#d29922]' : 'bg-[#f8514915] text-[#f85149]'}`}>{question.difficulty || 'Medium'}</span>
                    {question.topic && <span className="text-[10px] px-2 py-0.5 bg-[#30363d] text-[#c9d1d9] rounded-full font-bold uppercase tracking-wider">{question.topic}</span>}
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none text-sm text-[#c9d1d9] leading-relaxed">
                  <p className="whitespace-pre-wrap">{question.description}</p>
                </div>

                {question.constraints && (
                  <div className="mt-8">
                    <h3 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-3">Constraints</h3>
                    <pre className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] text-[#e6edf3] text-xs whitespace-pre-wrap font-mono">
                      {question.constraints}
                    </pre>
                  </div>
                )}
                
                {/* Navigation Buttons */}
                {practiceSheet && (
                  <div className="flex justify-between items-center pt-8 mt-8 border-t border-[#30363d]">
                    <button 
                      onClick={() => handleNavigate(-1)}
                      disabled={currentQuestionIdx <= 0}
                      className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] text-sm disabled:opacity-50 hover:bg-[#30363d]"
                    >
                      ← Previous
                    </button>
                    <button 
                      onClick={() => handleNavigate(1)}
                      disabled={currentQuestionIdx === -1 || currentQuestionIdx >= (practiceSheet.questions?.length - 1)}
                      className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] text-sm disabled:opacity-50 hover:bg-[#30363d]"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#8b949e]">
                {practiceSheetId ? "Select a question from the list above." : "No problem selected."}
              </div>
            )}
          </div>
        )}

        {/* Middle/Left — Editor */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-[#30363d] min-h-[50vh] md:min-h-0">
          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language={currentLang.monacoLang}
              value={code}
              theme="vs-dark"
              onChange={v => setCode(v || '')}
              options={{ fontSize, fontFamily: "'JetBrains Mono','Fira Code',monospace", minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 12 }, lineNumbers: 'on', folding: true, wordWrap: 'on', tabSize: 2, renderLineHighlight: 'all', cursorBlinking: 'smooth', smoothScrolling: true, suggest: { showKeywords: true } }}
            />
          </div>
        </div>

        {/* Right — Panels */}
        <div className="w-full md:w-[420px] flex flex-col bg-[#0d1117] min-h-[50vh] md:min-h-0">

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
            {[['output','📤 Output'],['testcases','🧪 Test Cases'],['judge','⚖️ Judge'],['submissions','🕒 Submissions']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ flex: 1, padding: '10px 8px', background: tab === id ? '#161b22' : 'transparent', borderBottom: tab === id ? '2px solid #58a6ff' : '2px solid transparent', border: 'none', color: tab === id ? '#58a6ff' : '#8b949e', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>

            {/* ── OUTPUT TAB ── */}
            {tab === 'output' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Stdin */}
                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Input (stdin)</label>
                  <textarea value={stdin} onChange={e => setStdin(e.target.value)}
                    style={{ width: '100%', height: 72, background: '#161b22', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', fontFamily: 'monospace', fontSize: 12, padding: '8px 10px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Enter input here…" spellCheck={false} />
                </div>

                {/* Result */}
                {running && <div style={{ color: '#8b949e', fontSize: 13 }}>⏳ Executing your code…</div>}
                {!running && runResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <VerdictBadge verdict={runResult.verdict || (runResult.error ? 'runtime_error' : 'accepted')} />
                      {runResult.runtime > 0 && <span style={{ fontSize: 11, color: '#8b949e' }}>⏱ {runResult.runtime}ms</span>}
                      {runResult.testSummary && (
                        <span style={{ 
                          marginLeft: 'auto', 
                          fontSize: 12, 
                          fontWeight: 'bold', 
                          color: runResult.passedCount === runResult.totalCount ? '#3fb950' : '#f85149',
                          background: runResult.passedCount === runResult.totalCount ? 'rgba(63, 185, 80, 0.1)' : 'rgba(248, 81, 73, 0.1)',
                          padding: '2px 8px',
                          borderRadius: 6,
                          border: '1px solid currentColor'
                        }}>
                          {runResult.testSummary}
                        </span>
                      )}
                    </div>
                    {runResult.testSummary && (
                      <div style={{ width: '100%', height: 4, background: '#30363d', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${(runResult.passedCount / runResult.totalCount) * 100}%`, 
                          height: '100%', 
                          background: runResult.passedCount === runResult.totalCount ? '#238636' : '#da3633',
                          transition: 'width 0.5s ease-out'
                        }} />
                      </div>
                    )}

                    {runResult.error && (
                      <pre style={{ background: '#1a0000', border: '1px solid #5c1a1a', borderRadius: 8, padding: 10, color: '#f85149', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{runResult.error}</pre>
                    )}
                    {runResult.output && (
                      <pre style={{ background: '#011502', border: '1px solid #1a4d1a', borderRadius: 8, padding: 10, color: '#3fb950', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{runResult.output}</pre>
                    )}
                    {!runResult.error && !runResult.output && (
                      <span style={{ color: '#8b949e', fontSize: 12 }}>(no output)</span>
                    )}
                  </div>
                )}
                {!running && !runResult && (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#30363d' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>▶</div>
                    <p style={{ fontSize: 13 }}>Click Run to execute your code</p>
                  </div>
                )}
              </div>
            )}

            {/* ── TEST CASES TAB ── */}
            {tab === 'testcases' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {testCases.map((tc, i) => {
                  const res = tcResults[i];
                  return (
                    <div key={i} style={{ background: '#161b22', border: `1px solid ${res ? (res.passed ? '#2ea043' : '#da3633') : '#30363d'}`, borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#21262d' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#c9d1d9' }}>
                          {res ? (res.passed ? '✅' : '❌') : '🔲'} Case {i + 1}
                        </span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <label style={{ fontSize: 11, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input type="checkbox" checked={tc.isHidden} onChange={e => updateTc(i, 'isHidden', e.target.checked)} /> Hidden
                          </label>
                          <button onClick={() => removeTc(i)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>✕</button>
                        </div>
                      </div>
                      <div style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 10, color: '#8b949e', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Input</label>
                          <textarea value={tc.input} onChange={e => updateTc(i, 'input', e.target.value)}
                            style={{ width: '100%', height: 56, background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontFamily: 'monospace', fontSize: 11, padding: 6, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: '#8b949e', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Expected</label>
                          <textarea value={tc.expectedOutput} onChange={e => updateTc(i, 'expectedOutput', e.target.value)}
                            style={{ width: '100%', height: 56, background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontFamily: 'monospace', fontSize: 11, padding: 6, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                      {res && !res.passed && (
                        <div style={{ padding: '0 10px 10px' }}>
                          <label style={{ fontSize: 10, color: '#8b949e', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Your Output</label>
                          <pre style={{ background: '#1a0505', border: '1px solid #5c1a1a', borderRadius: 6, padding: 6, color: '#f85149', fontSize: 11, whiteSpace: 'pre-wrap', margin: 0 }}>{res.actual || res.error || '(no output)'}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button onClick={addTestCase}
                  style={{ padding: '8px 14px', background: 'transparent', border: '1px dashed #30363d', borderRadius: 8, color: '#8b949e', fontSize: 12, cursor: 'pointer', width: '100%' }}>
                  + Add Test Case
                </button>
                {tcResults.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#161b22', borderRadius: 8, border: '1px solid #30363d' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>
                      {tcResults.filter(r => r.passed).length} / {tcResults.length} passed
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── JUDGE TAB ── */}
            {tab === 'judge' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {judging && (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#8b949e' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>⚖️</div>
                    <p style={{ fontSize: 13 }}>Judging against all test cases…</p>
                  </div>
                )}
                {!judging && judgeResult && (
                  <>
                    {/* Overall verdict */}
                    <div style={{ padding: '14px 16px', background: judgeResult.verdict === 'accepted' ? '#011502' : '#1a0000', border: `1px solid ${judgeResult.verdict === 'accepted' ? '#2ea043' : '#da3633'}`, borderRadius: 10 }}>
                      <VerdictBadge verdict={judgeResult.verdict} />
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#8b949e' }}>
                        {judgeResult.passed} / {judgeResult.total} test cases passed
                      </p>
                    </div>
                    {/* Per-case results */}
                    {judgeResult.results?.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#161b22', border: `1px solid ${r.passed ? '#2ea04340' : '#da363340'}`, borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{r.passed ? '✅' : '❌'}</span>
                          <span style={{ fontSize: 12, color: '#c9d1d9', fontWeight: 600 }}>
                            {r.hidden ? `Hidden Test ${i + 1}` : `Test Case ${i + 1}`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {r.runtime > 0 && <span style={{ fontSize: 11, color: '#8b949e' }}>{r.runtime}ms</span>}
                          <VerdictBadge verdict={r.verdict} />
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {!judging && !judgeResult && (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#30363d' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>⚖️</div>
                    <p style={{ fontSize: 13 }}>Click "Judge All" to run against all test cases</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
