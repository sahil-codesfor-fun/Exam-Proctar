import axios from 'axios';
import { getPracticeIO } from '../sockets/practiceSocket.js';
import dotenv from 'dotenv';
import { runLocalCode } from '../services/compiler/localCompiler.service.js';
import prisma from '../config/prisma.js';
dotenv.config();

// ── Language Configuration ───────────────────────────────────────────────────
export const LANGUAGE_CONFIG = {
  javascript: { id: 93,  ext: 'js',    name: 'JavaScript (Node.js)', monacoLang: 'javascript' },
  python:     { id: 92,  ext: 'py',    name: 'Python 3',             monacoLang: 'python'     },
  java:       { id: 91,  ext: 'java',  name: 'Java 24',              monacoLang: 'java'       },
  c:          { id: 50,  ext: 'c',     name: 'C (GCC)',              monacoLang: 'c'          },
  cpp:        { id: 54,  ext: 'cpp',   name: 'C++ (G++)',            monacoLang: 'cpp'        },
};

// ── Starter code templates (Cross-platform optimized) ─────────────────────────
export const TEMPLATES = {
  javascript: `// JavaScript (Node.js)\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8');\nconst lines = input.trim().split('\\n');\n\n// Your solution here\nif (lines[0]) {\n    console.log(lines[0]);\n} else {\n    console.log("Hello World");\n}`,
  python:     `# Python 3\nimport sys\n\ndef solve():\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        print("Hello World")\n        return\n    # Your solution here\n    print(input_data[0])\n\nif __name__ == "__main__":\n    solve()`,
  java:       `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String line = sc.nextLine();\n            System.out.println(line);\n        } else {\n            System.out.println("Hello World");\n        }\n    }\n}`,
  c:          `#include <stdio.h>\n\nint main() {\n    char line[256];\n    if (scanf("%s", line) != EOF) {\n        printf("%s\\n", line);\n    } else {\n        printf("Hello World\\n");\n    }\n    return 0;\n}`,
  cpp:        `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    if (cin >> s) {\n        cout << s << endl;\n    } else {\n        cout << "Hello World" << endl;\n    }\n    return 0;\n}`,
};

// ── Judge0 Fallback Configuration ─────────────────────────────────────────────
const JUDGE0_BASE = process.env.JUDGE0_BASE_URL  || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_KEY  = process.env.JUDGE0_API_KEY   || '';
const JUDGE0_HOST = process.env.JUDGE0_API_HOST  || 'judge0-ce.p.rapidapi.com';
const USE_JUDGE0  = process.env.USE_JUDGE0 === 'true';

const judge0Headers = () => ({
  'content-type':    'application/json',
  'X-RapidAPI-Key':  JUDGE0_KEY,
  'X-RapidAPI-Host': JUDGE0_HOST,
});

function b64(str) { return Buffer.from(str || '').toString('base64'); }
function d64(str) { return str ? Buffer.from(str, 'base64').toString('utf-8') : ''; }

async function submitToJudge0(langId, code, stdin = '', timeSec = 5, memKb = 262144) {
  const { data } = await axios.post(
    `${JUDGE0_BASE}/submissions?base64_encoded=true&wait=false`,
    { language_id: langId, source_code: b64(code), stdin: b64(stdin),
      cpu_time_limit: timeSec, memory_limit: memKb },
    { headers: judge0Headers() }
  );
  return data.token;
}

async function pollJudge0(token, maxMs = 20000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const { data } = await axios.get(
      `${JUDGE0_BASE}/submissions/${token}?base64_encoded=true`,
      { headers: judge0Headers() }
    );
    if (data.status?.id > 2) return data;
    await new Promise(r => setTimeout(r, 800));
  }
  throw new Error('Judge0 timed out');
}

function mapJudgeResult(data) {
  const sid = data.status?.id;
  const out = d64(data.stdout);
  const err = d64(data.stderr) || d64(data.compile_output) || d64(data.message);
  const rt  = Math.round((parseFloat(data.time) || 0) * 1000);
  const mem = data.memory || 0;
  const verdicts = {
    3: 'accepted', 4: 'wrong_answer', 5: 'time_limit_exceeded',
    6: 'compilation_error', 7: 'runtime_error', 8: 'runtime_error',
  };
  return { 
    success: sid === 3,
    verdict: verdicts[sid] || 'runtime_error', 
    output: out, 
    error: err, 
    runtime: rt, 
    memory: mem 
  };
}

async function runCode(language, code, stdin = '', timeSec = 5, memKb = 262144) {
  console.log(`[Compiler] Running code for ${language}...`);
  
  if (LANGUAGE_CONFIG[language]) {
    try {
      const localResult = await runLocalCode(language, code, stdin, timeSec * 1000);
      return {
        verdict: localResult.success ? 'accepted' : (localResult.errorType.toLowerCase().replace(/ /g, '_')),
        output: localResult.output || '',
        error: localResult.stderr || '',
        runtime: localResult.runtime || 0,
        memory: localResult.memory || 0,
        success: localResult.success
      };
    } catch (err) {
      console.error(`[Compiler] Local execution failed for ${language}:`, err.message);
    }
  }

  if (USE_JUDGE0 && JUDGE0_KEY && JUDGE0_KEY !== 'your_rapidapi_key_here') {
    const cfg = LANGUAGE_CONFIG[language];
    if (!cfg) throw new Error(`Unsupported language: ${language}`);
    const token  = await submitToJudge0(cfg.id, code, stdin, timeSec, memKb);
    const result = await pollJudge0(token, (timeSec + 12) * 1000);
    return mapJudgeResult(result);
  }
  
  return { 
    verdict: 'internal_server_error', 
    output: '', 
    error: 'No execution engine available for this language.', 
    runtime: 0, 
    memory: 0,
    success: false 
  };
}

// ── Controllers ───────────────────────────────────────────────────────────────

export const executeCode = async (req, res) => {
  const { language, code, stdin = '' } = req.body;
  console.log("========================================");
  console.log("INCOMING EXECUTION REQUEST");
  console.log("LANGUAGE:", language);
  console.log("CODE PREVIEW:", code?.substring(0, 50) + "...");
  console.log("STDIN:", stdin);
  console.log("========================================");

  try {
    if (!language || !code) return res.status(400).json({ success: false, message: 'language and code required' });
    
    const result = await runCode(language, code, stdin);
    
    console.log("EXECUTION RESULT:", result.verdict);
    
    if (result.success) {
      res.json({
        success: true,
        output: result.output,
        executionTime: `${(result.runtime / 1000).toFixed(2)}s`
      });
    } else {
      res.json({
        success: false,
        errorType: result.verdict.replace(/_/g, ' ').toUpperCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
        stderr: result.error || 'Execution failed'
      });
    }
  } catch (err) {
    console.error("CONTROLLER ERROR:", err);
    res.status(500).json({ success: false, message: err.message, errorType: 'Internal Server Error' });
  }
};


export const judgeCode = async (req, res) => {
  const { language, code, questionId, practiceSheetId, timeLimitSec = 5 } = req.body;
  let testCases = req.body.testCases || [];
  const studentId = req.user?.id;

  console.log("========================================");
  console.log("INCOMING JUDGE REQUEST");
  console.log("LANGUAGE:", language);
  console.log("QUESTION ID:", questionId);
  console.log("========================================");

  try {
    if (!language || !code) return res.status(400).json({ success: false, message: 'language and code required' });
    if (!LANGUAGE_CONFIG[language]) return res.status(400).json({ success: false, message: `Unsupported: ${language}` });

    let question = null;

    if (questionId) {
      question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { testCases: true }
      });
      if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
      testCases = question.testCases;
    }

    if (testCases.length === 0) {
      return res.status(400).json({ success: false, message: 'No test cases provided or found for question.' });
    }

    const results = [];
    let passed = 0;
    let finalVerdict = 'accepted';
    let maxRuntime = 0;
    let maxMemory = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      console.log(`[Judge] Running Test Case ${i + 1}...`);
      
      const r = await runCode(language, code, tc.input || '', timeLimitSec);
      let v = r.verdict;
      
      if (v === 'accepted') {
        const actual = (r.output || '').trim();
        const expected = (tc.expectedOutput || '').trim();
        if (actual !== expected) {
          v = 'wrong_answer';
          console.log(`[Judge] TC ${i+1} FAILED (WA). Expected: "${expected}", Got: "${actual}"`);
        } else {
          console.log(`[Judge] TC ${i+1} PASSED.`);
        }
      } else {
        console.log(`[Judge] TC ${i+1} FAILED (${v}). Error: ${r.error}`);
      }

      const ok = v === 'accepted';
      if (ok) passed++;
      else if (finalVerdict === 'accepted') finalVerdict = v;

      if (r.runtime > maxRuntime) maxRuntime = r.runtime;
      if (r.memory > maxMemory) maxMemory = r.memory;

      results.push({
        index:    i + 1,
        passed:   ok,
        verdict:  v,
        input:    tc.isHidden ? '••••' : tc.input,
        expected: tc.isHidden ? '••••' : tc.expectedOutput,
        actual:   tc.isHidden ? (ok ? '✓' : '✗') : (r.error || r.output || '').trim(),
        runtime:  r.runtime,
        memory:   r.memory,
        hidden:   tc.isHidden || false,
      });
    }

    console.log("JUDGE COMPLETE:", finalVerdict, `(${passed}/${testCases.length} passed)`);

    // --- Record Submission in DB ---
    if (studentId && questionId) {
      const previousSubmissions = await prisma.practiceSubmission.count({
        where: { studentId, questionId }
      });
      const isFirstAttempt = previousSubmissions === 0;
      const attemptNumber = previousSubmissions + 1;

      const submission = await prisma.practiceSubmission.create({
        data: {
          studentId,
          questionId,
          practiceSheetId,
          language,
          code,
          verdict: finalVerdict,
          runtime: maxRuntime,
          memory: maxMemory,
          isFirstAttempt,
          attemptNumber,
          status: 'Accepted'
        },
        include: { student: { select: { name: true, studentId: true } } }
      });

      const io = getPracticeIO();
      if (io && practiceSheetId) {
        io.to(`sheet_${practiceSheetId}`).emit('new_submission', {
          submissionId: submission.id,
          studentId,
          studentName: submission.student.name,
          rollNo: submission.student.studentId,
          questionId,
          verdict: finalVerdict,
          attemptNumber,
          createdAt: submission.createdAt
        });
      }

      const todayStart = new Date();
      todayStart.setUTCHours(0,0,0,0);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
      
      const previousSubmissionsCount = await prisma.practiceSubmission.count({
        where: {
          studentId,
          createdAt: {
            gte: todayStart,
            lt: new Date(todayStart.getTime() + 86400000)
          },
          id: { not: submission.id }
        }
      });
      
      let streakUpdate = {};
      if (previousSubmissionsCount === 0) {
        const yesterdaySubmissionsCount = await prisma.practiceSubmission.count({
          where: {
            studentId,
            createdAt: {
              gte: yesterdayStart,
              lt: todayStart
            }
          }
        });
        
        if (yesterdaySubmissionsCount > 0) {
          streakUpdate = { currentStreak: { increment: 1 } };
        } else {
          streakUpdate = { currentStreak: 1 };
        }
      }

      const stats = await prisma.studentCodingStatistics.upsert({
        where: { studentId },
        create: {
          studentId,
          totalAttempts: 1,
          wrongAttempts: finalVerdict !== 'accepted' ? 1 : 0,
          solvedOnFirstAttempt: finalVerdict === 'accepted' ? 1 : 0,
          currentStreak: 1
        },
        update: {
          totalAttempts: { increment: 1 },
          wrongAttempts: finalVerdict !== 'accepted' ? { increment: 1 } : { increment: 0 },
          solvedOnFirstAttempt: (isFirstAttempt && finalVerdict === 'accepted') ? { increment: 1 } : { increment: 0 },
          ...streakUpdate
        }
      });

      if (finalVerdict === 'accepted') {
        const hasSolvedBefore = await prisma.practiceSubmission.findFirst({
          where: { studentId, questionId, verdict: 'accepted', isFirstAttempt: false }
        });

        if (!hasSolvedBefore || isFirstAttempt) {
          const diff = question.difficulty?.toLowerCase() || 'medium';
          await prisma.studentCodingProgress.upsert({
            where: { studentId },
            create: {
              studentId,
              totalSolved: 1,
              easySolved: diff === 'easy' ? 1 : 0,
              mediumSolved: diff === 'medium' ? 1 : 0,
              hardSolved: diff === 'hard' ? 1 : 0
            },
            update: {
              totalSolved: { increment: 1 },
              easySolved: diff === 'easy' ? { increment: 1 } : { increment: 0 },
              mediumSolved: diff === 'medium' ? { increment: 1 } : { increment: 0 },
              hardSolved: diff === 'hard' ? { increment: 1 } : { increment: 0 }
            }
          });

          if (question.topics) {
            const topicList = question.topics.split(',').map(t => t.trim()).filter(Boolean);
            for (const t of topicList) {
              await prisma.topicProgress.upsert({
                where: { studentId_topic: { studentId, topic: t } },
                create: { studentId, topic: t, solvedCount: 1 },
                update: { solvedCount: { increment: 1 } }
              });
            }
          }
        }
      }
    }

    res.json({ 
      success: true, 
      data: { 
        verdict: finalVerdict, 
        passed, 
        total: testCases.length, 
        results 
      } 
    });
  } catch (err) {
    console.error("JUDGE CONTROLLER ERROR:", err);
    res.status(500).json({ success: false, message: err.message, errorType: 'INTERNAL SERVER ERROR' });
  }
};

export const getLanguages = (_req, res) => {
  const data = Object.entries(LANGUAGE_CONFIG).map(([key, cfg]) => ({
    id: key, name: cfg.name, ext: cfg.ext, monacoLang: cfg.monacoLang, judge0Id: cfg.id,
  }));
  res.json({ success: true, data });
};

export const getTemplates = (_req, res) => {
  res.json({ success: true, data: TEMPLATES });
};

