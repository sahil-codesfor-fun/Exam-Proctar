import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// ── Judge0 CE Language IDs ────────────────────────────────────────────────────
export const LANGUAGE_CONFIG = {
  javascript: { id: 93,  ext: 'js',    name: 'JavaScript (Node.js 18)', monacoLang: 'javascript' },
  typescript: { id: 94,  ext: 'ts',    name: 'TypeScript 5',            monacoLang: 'typescript' },
  python:     { id: 92,  ext: 'py',    name: 'Python 3.11',             monacoLang: 'python'     },
  java:       { id: 91,  ext: 'java',  name: 'Java 17',                 monacoLang: 'java'       },
  c:          { id: 50,  ext: 'c',     name: 'C (GCC 9.2)',             monacoLang: 'c'          },
  cpp:        { id: 54,  ext: 'cpp',   name: 'C++ 17',                  monacoLang: 'cpp'        },
  csharp:     { id: 51,  ext: 'cs',    name: 'C# (Mono 6.6)',           monacoLang: 'csharp'     },
  go:         { id: 60,  ext: 'go',    name: 'Go 1.18',                 monacoLang: 'go'         },
  rust:       { id: 73,  ext: 'rs',    name: 'Rust 1.67',               monacoLang: 'rust'       },
  php:        { id: 68,  ext: 'php',   name: 'PHP 8.1',                 monacoLang: 'php'        },
  ruby:       { id: 72,  ext: 'rb',    name: 'Ruby 2.7',                monacoLang: 'ruby'       },
  kotlin:     { id: 78,  ext: 'kt',    name: 'Kotlin 1.8',              monacoLang: 'kotlin'     },
  swift:      { id: 83,  ext: 'swift', name: 'Swift 5.8',               monacoLang: 'swift'      },
  perl:       { id: 85,  ext: 'pl',    name: 'Perl 5.28',               monacoLang: 'perl'       },
  bash:       { id: 46,  ext: 'sh',    name: 'Bash 5.0',                monacoLang: 'shell'      },
  r:          { id: 80,  ext: 'r',     name: 'R 4.2',                   monacoLang: 'r'          },
  sql:        { id: 82,  ext: 'sql',   name: 'SQL (SQLite 3.36)',       monacoLang: 'sql'        },
  scala:      { id: 81,  ext: 'scala', name: 'Scala 3.2',               monacoLang: 'scala'      },
  haskell:    { id: 61,  ext: 'hs',    name: 'Haskell GHC 8.8',        monacoLang: 'haskell'    },
  lua:        { id: 64,  ext: 'lua',   name: 'Lua 5.3',                 monacoLang: 'lua'        },
  dart:       { id: 90,  ext: 'dart',  name: 'Dart 2.19',               monacoLang: 'dart'       },
  elixir:     { id: 57,  ext: 'ex',    name: 'Elixir 1.9',              monacoLang: 'elixir'     },
};

// ── Starter code templates ────────────────────────────────────────────────────
export const TEMPLATES = {
  javascript: `// JavaScript (Node.js)\nconst lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\n// Your solution here\nconsole.log(lines[0]);`,
  typescript: `// TypeScript\nimport * as fs from 'fs';\nconst lines = fs.readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconsole.log(lines[0]);`,
  python:     `# Python 3\nimport sys\ndata = sys.stdin.read().split()\n# Your solution here\nprint(data[0])`,
  java:       `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your solution here\n        System.out.println(sc.nextLine());\n    }\n}`,
  c:          `#include <stdio.h>\nint main() {\n    char line[256];\n    scanf("%s", line);\n    printf("%s\\n", line);\n    return 0;\n}`,
  cpp:        `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s; cin >> s;\n    cout << s << "\\n";\n    return 0;\n}`,
  csharp:     `using System;\nclass Main {\n    static void Main() {\n        string line = Console.ReadLine();\n        Console.WriteLine(line);\n    }\n}`,
  go:         `package main\nimport ("bufio";"fmt";"os")\nfunc main() {\n    r := bufio.NewReader(os.Stdin)\n    var s string\n    fmt.Fscan(r, &s)\n    fmt.Println(s)\n}`,
  rust:       `use std::io::{self, BufRead};\nfn main() {\n    let stdin = io::stdin();\n    if let Some(Ok(line)) = stdin.lock().lines().next() {\n        println!("{}", line);\n    }\n}`,
  php:        `<?php\n$line = trim(fgets(STDIN));\necho $line . "\\n";`,
  ruby:       `line = gets.chomp\nputs line`,
  kotlin:     `import java.util.Scanner\nfun main() {\n    val sc = Scanner(System.\`in\`)\n    println(sc.nextLine())\n}`,
  swift:      `import Foundation\nif let line = readLine() { print(line) }`,
  perl:       `my $line = <STDIN>; chomp $line;\nprint "$line\\n";`,
  bash:       `#!/bin/bash\nread line\necho "$line"`,
  r:          `line <- readLines(file("stdin"), n=1)\ncat(line, "\\n")`,
  sql:        `-- SQLite\nSELECT 'Hello, World!';`,
  scala:      `import scala.io.StdIn\nobject Main extends App { println(StdIn.readLine()) }`,
  haskell:    `main :: IO ()\nmain = do { line <- getLine; putStrLn line }`,
  lua:        `local line = io.read()\nprint(line)`,
  dart:       `import 'dart:io';\nvoid main() { print(stdin.readLineSync()); }`,
  elixir:     `line = IO.gets("") |> String.trim()\nIO.puts(line)`,
};

// ── Judge0 helpers ────────────────────────────────────────────────────────────
const JUDGE0_BASE = process.env.JUDGE0_BASE_URL  || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_KEY  = process.env.JUDGE0_API_KEY   || '';
const JUDGE0_HOST = process.env.JUDGE0_API_HOST  || 'judge0-ce.p.rapidapi.com';
const USE_JUDGE0  = process.env.USE_JUDGE0 !== 'false';

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
  return { verdict: verdicts[sid] || 'runtime_error', output: out, error: err, runtime: rt, memory: mem };
}

async function runCode(language, code, stdin = '', timeSec = 5, memKb = 262144) {
  const cfg = LANGUAGE_CONFIG[language];
  if (!cfg) throw new Error(`Unsupported language: ${language}`);

  if (USE_JUDGE0 && JUDGE0_KEY && JUDGE0_KEY !== 'your_rapidapi_key_here') {
    const token  = await submitToJudge0(cfg.id, code, stdin, timeSec, memKb);
    const result = await pollJudge0(token, (timeSec + 12) * 1000);
    return mapJudgeResult(result);
  }
  return { verdict: 'runtime_error', output: '', error: 'Judge0 API key not configured. Set JUDGE0_API_KEY in .env', runtime: 0, memory: 0 };
}

// ── Controllers ───────────────────────────────────────────────────────────────

/** POST /api/compiler/execute */
export const executeCode = async (req, res) => {
  try {
    const { language, code, stdin = '' } = req.body;
    if (!language || !code) return res.status(400).json({ success: false, message: 'language and code required' });
    const result = await runCode(language, code, stdin);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /api/compiler/judge — run against multiple test cases */
export const judgeCode = async (req, res) => {
  try {
    const { language, code, testCases = [], timeLimitSec = 5 } = req.body;
    if (!language || !code) return res.status(400).json({ success: false, message: 'language and code required' });
    if (!LANGUAGE_CONFIG[language]) return res.status(400).json({ success: false, message: `Unsupported: ${language}` });

    const results = [];
    let passed = 0;
    let verdict = 'accepted';

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const r  = await runCode(language, code, tc.input || '', timeLimitSec);
      let v = r.verdict;
      if (v === 'accepted') {
        if ((r.output || '').trim() !== (tc.expectedOutput || '').trim()) v = 'wrong_answer';
      }
      const ok = v === 'accepted';
      if (ok) passed++;
      else if (verdict === 'accepted') verdict = v;
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

    res.json({ success: true, data: { verdict, passed, total: testCases.length, results } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/compiler/languages */
export const getLanguages = (_req, res) => {
  const data = Object.entries(LANGUAGE_CONFIG).map(([key, cfg]) => ({
    id: key, name: cfg.name, ext: cfg.ext, monacoLang: cfg.monacoLang, judge0Id: cfg.id,
  }));
  res.json({ success: true, data });
};

/** GET /api/compiler/templates */
export const getTemplates = (_req, res) => {
  res.json({ success: true, data: TEMPLATES });
};
