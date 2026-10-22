import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execPromise = promisify(exec);

const TEMP_DIR = path.join(os.tmpdir(), 'nexus-compiler');

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const LANGUAGE_CONFIGS = {
    javascript: {
        extension: 'js',
        command: 'node',
        args: (dir, file) => [path.join(dir, file)],
        isCompiled: false
    },
    python: {
        extension: 'py',
        command: 'python',
        args: (dir, file) => [path.join(dir, file)],
        isCompiled: false
    },
    c: {
        extension: 'c',
        compileCommand: (filePath, executablePath) => `gcc "${filePath}" -o "${executablePath}"`,
        command: (executablePath) => executablePath,
        args: () => [],
        isCompiled: true
    },
    cpp: {
        extension: 'cpp',
        compileCommand: (filePath, executablePath) => `g++ "${filePath}" -o "${executablePath}"`,
        command: (executablePath) => executablePath,
        args: () => [],
        isCompiled: true
    },
    java: {
        extension: 'java',
        compileCommand: (filePath) => `javac "${filePath}"`,
        command: () => `java`,
        args: (dirPath, fileName) => ['-cp', dirPath, 'Main'],
        isCompiled: true
    }
};

// ── Concurrency Throttling Semaphore ──────────────────────────────────────────
// Limits parallel compilations on the host/DGX (default: 24 parallel runs)
const MAX_CONCURRENT_COMPILATIONS = parseInt(process.env.MAX_COMPILER_CONCURRENCY || '24', 10);
let activeCompilations = 0;
const compilationQueue = [];

const acquireSlot = () => {
    return new Promise((resolve) => {
        if (activeCompilations < MAX_CONCURRENT_COMPILATIONS) {
            activeCompilations++;
            resolve();
        } else {
            compilationQueue.push(resolve);
        }
    });
};

const releaseSlot = () => {
    activeCompilations--;
    if (compilationQueue.length > 0) {
        const next = compilationQueue.shift();
        activeCompilations++;
        next();
    }
};

export const runLocalCode = async (language, code, stdin = '', timeout = 5000) => {
    await acquireSlot();
    try {
        return await executeCodeInternal(language, code, stdin, timeout);
    } finally {
        releaseSlot();
    }
};

export const getMinimalEnv = (customTemp = '') => ({
    PATH: process.env.PATH || '',
    SystemRoot: process.env.SystemRoot || '',
    WINDIR: process.env.WINDIR || '',
    TEMP: customTemp || os.tmpdir(),
    TMP: customTemp || os.tmpdir(),
    NODE_ENV: 'production'
});

const executeCodeInternal = async (language, code, stdin = '', timeout = 5000) => {
    const config = LANGUAGE_CONFIGS[language];
    if (!config) {
        throw new Error(`Unsupported language: ${language}`);
    }

    const sessionId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const sessionDir = path.join(TEMP_DIR, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    const fileName = language === 'java' ? 'Main.java' : `solution.${config.extension}`;
    const filePath = path.join(sessionDir, fileName);
    const executablePath = path.join(sessionDir, os.platform() === 'win32' ? 'solution.exe' : 'solution');

    console.log("------------------------------------------");
    console.log("EXECUTION START:", sessionId);
    console.log("LANGUAGE:", language);
    console.log("SOURCE FILE:", filePath);

    try {
        fs.writeFileSync(filePath, code);

        const killProcessTree = (child) => {
            if (!child || !child.pid) return;
            try {
                if (os.platform() === 'win32') {
                    exec(`taskkill /pid ${child.pid} /T /F`, () => {});
                } else {
                    child.kill('SIGKILL');
                }
            } catch (e) {
                try { child.kill(); } catch (err) {}
            }
        };

        const MAX_OUTPUT_BYTES = 64 * 1024;

        if (config.isCompiled) {
            const compileCmd = typeof config.compileCommand === 'function' 
                ? config.compileCommand(filePath, executablePath) 
                : config.compileCommand;
            
            console.log("COMPILE CMD:", compileCmd);
            try {
                const { stderr } = await execPromise(compileCmd, { 
                    timeout: 10000,
                    env: getMinimalEnv()
                });
                if (stderr) {
                    console.log("COMPILE STDERR (Non-fatal):", stderr);
                }
            } catch (err) {
                console.log("COMPILATION ERROR:", err.stderr || err.message);
                return {
                    success: false,
                    errorType: "Compilation Error",
                    stderr: err.stderr || err.message,
                    runtime: 0,
                    memory: 0
                };
            }
        }

        const runCmd = typeof config.command === 'function' ? config.command(executablePath || sessionDir) : config.command;
        const runArgs = config.args(sessionDir, fileName);

        console.log("RUN CMD:", runCmd, runArgs.join(' '));

        return new Promise((resolve) => {
            const start = Date.now();
            console.log(`[Spawn] Starting process: ${runCmd} ${runArgs.join(' ')} in ${sessionDir}`);
            
            const child = spawn(runCmd, runArgs, {
                cwd: sessionDir,
                shell: os.platform() === 'win32',
                env: getMinimalEnv()
            });

            let stdout = '';
            let stderr = '';
            let killedByTimeout = false;
            let outputExceeded = false;

            const timer = setTimeout(() => {
                killedByTimeout = true;
                console.log(`[Spawn] Process timed out after ${timeout}ms, killing process tree...`);
                killProcessTree(child);
            }, Math.min(Math.max(1000, timeout), 15000));

            if (stdin) {
                child.stdin.write(stdin.slice(0, 100000));
            }
            child.stdin.end();

            child.stdout.on('data', (data) => {
                if (stdout.length < MAX_OUTPUT_BYTES) {
                    stdout += data.toString();
                } else if (!outputExceeded) {
                    outputExceeded = true;
                    stdout += '\n[Output truncated: exceeded 64KB limit]';
                    killProcessTree(child);
                }
            });

            child.stderr.on('data', (data) => {
                if (stderr.length < MAX_OUTPUT_BYTES) {
                    stderr += data.toString();
                }
            });

            child.on('error', (err) => {
                clearTimeout(timer);
                killProcessTree(child);
                console.log("EXECUTION ERROR:", err.message);
                resolve({
                    success: false,
                    errorType: "Runtime Error",
                    stderr: err.message,
                    runtime: Date.now() - start,
                    memory: 0
                });
            });

            child.on('close', (code) => {
                clearTimeout(timer);
                const runtime = Date.now() - start;
                
                console.log("EXIT CODE:", code);

                if (killedByTimeout) {
                    resolve({
                        success: false,
                        errorType: "Time Limit Exceeded",
                        stderr: "Execution timed out",
                        runtime,
                        memory: 0
                    });
                } else if (code !== 0) {
                    resolve({
                        success: false,
                        errorType: "Runtime Error",
                        stderr: stderr || `Exit code ${code}`,
                        runtime,
                        memory: 0
                    });
                } else {
                    resolve({
                        success: true,
                        output: stdout,
                        runtime,
                        memory: 0
                    });
                }
            });
        });

    } catch (err) {
        console.log("INTERNAL ERROR:", err.message);
        return {
            success: false,
            errorType: "Internal Server Error",
            stderr: err.message,
            runtime: 0,
            memory: 0
        };
    } finally {
        setTimeout(() => {
            try {
                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    console.log("CLEANUP DONE:", sessionDir);
                }
            } catch (e) {
                console.error("CLEANUP FAILED:", e.message);
            }
        }, 1000);
    }
};
