import EventEmitter from 'events';

/**
 * High-Throughput Managed Compiler Queue
 * 
 * Features:
 * 1. Global Concurrency Limiter:
 *    - Judge0: Limits concurrent requests (default: 12) so Judge0 / RapidAPI never crashes or returns 429.
 *    - Local Compiler: Limits OS processes (default: 24) to protect CPU and RAM from OOM.
 * 2. Two-tier Priority Scheduling:
 *    - 'high': Interactive "Compile & Test" runs in the student editor (immediate feedback).
 *    - 'normal': Final "Submit Code" & "Submit Exam" batch evaluations.
 * 3. Starvation Protection & Auto-Timeout:
 *    - Jobs that wait too long or hang are safely timed out so worker slots are never leaked.
 */

class CompilerQueue extends EventEmitter {
  constructor() {
    super();
    this.highPriorityQueue = [];
    this.normalPriorityQueue = [];

    // Max concurrent executions in flight
    this.maxJudge0Concurrency = parseInt(process.env.MAX_JUDGE0_CONCURRENCY || '12', 10);
    this.maxLocalConcurrency = parseInt(process.env.MAX_COMPILER_CONCURRENCY || '24', 10);

    this.activeJudge0Jobs = 0;
    this.activeLocalJobs = 0;
  }

  /**
   * Enqueue a compilation/execution task.
   * @param {Function} task - Async function returning execution result
   * @param {Object} options - { isJudge0: boolean, priority: 'high' | 'normal', timeoutMs: number }
   */
  enqueue(task, options = {}) {
    const { isJudge0 = false, priority = 'normal', timeoutMs = 25000 } = options;

    return new Promise((resolve, reject) => {
      const item = {
        task,
        isJudge0,
        priority,
        resolve,
        reject,
        enqueuedAt: Date.now(),
        timeoutMs
      };

      if (priority === 'high') {
        this.highPriorityQueue.push(item);
      } else {
        this.normalPriorityQueue.push(item);
      }

      this._dispatchNext();
    });
  }

  _hasSlot(isJudge0) {
    if (isJudge0) {
      return this.activeJudge0Jobs < this.maxJudge0Concurrency;
    }
    return this.activeLocalJobs < this.maxLocalConcurrency;
  }

  _getNextItem() {
    // 1. Try high priority first
    for (let i = 0; i < this.highPriorityQueue.length; i++) {
      const item = this.highPriorityQueue[i];
      if (this._hasSlot(item.isJudge0)) {
        return this.highPriorityQueue.splice(i, 1)[0];
      }
    }

    // 2. Try normal priority
    for (let i = 0; i < this.normalPriorityQueue.length; i++) {
      const item = this.normalPriorityQueue[i];
      if (this._hasSlot(item.isJudge0)) {
        return this.normalPriorityQueue.splice(i, 1)[0];
      }
    }

    return null;
  }

  _dispatchNext() {
    let item = this._getNextItem();
    while (item) {
      this._runJob(item);
      item = this._getNextItem();
    }
  }

  async _runJob(item) {
    const { task, isJudge0, resolve, reject, timeoutMs } = item;

    if (isJudge0) {
      this.activeJudge0Jobs++;
    } else {
      this.activeLocalJobs++;
    }

    let completed = false;
    const timeoutHandle = setTimeout(() => {
      if (!completed) {
        completed = true;
        this._releaseSlot(isJudge0);
        reject(new Error(`Compilation request timed out in queue after ${timeoutMs}ms`));
        this._dispatchNext();
      }
    }, timeoutMs);

    try {
      const result = await task();
      if (!completed) {
        completed = true;
        clearTimeout(timeoutHandle);
        this._releaseSlot(isJudge0);
        resolve(result);
        this._dispatchNext();
      }
    } catch (err) {
      if (!completed) {
        completed = true;
        clearTimeout(timeoutHandle);
        this._releaseSlot(isJudge0);
        reject(err);
        this._dispatchNext();
      }
    }
  }

  _releaseSlot(isJudge0) {
    if (isJudge0) {
      this.activeJudge0Jobs = Math.max(0, this.activeJudge0Jobs - 1);
    } else {
      this.activeLocalJobs = Math.max(0, this.activeLocalJobs - 1);
    }
  }

  getStats() {
    return {
      highQueueLength: this.highPriorityQueue.length,
      normalQueueLength: this.normalPriorityQueue.length,
      activeJudge0: this.activeJudge0Jobs,
      activeLocal: this.activeLocalJobs,
      maxJudge0: this.maxJudge0Concurrency,
      maxLocal: this.maxLocalConcurrency
    };
  }
}

export const compilerQueue = new CompilerQueue();
export default compilerQueue;
