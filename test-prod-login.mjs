/**
 * Load Test Script: Production Login Concurrency & Throughput
 * Target: https://exam-proctar.onrender.com/api/auth/login
 */

const CONFIG = {
  url: 'https://exam-proctar.onrender.com/api/auth/login',
  credentials: {
    email: '2401301059@geetauniversity.edu.in',
    password: '123456789',
    role: 'student'
  },
  concurrentUsers: 15,
  testDurationSec: 60,
  requestTimeoutMs: 20000 // 20 seconds timeout per request
};

async function sendLoginRequest() {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);

  try {
    const res = await fetch(CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CodeNexus-LoadTest/1.0'
      },
      body: JSON.stringify(CONFIG.credentials),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - start;
    let data = null;
    try {
      data = await res.json();
    } catch {
      // Body was not JSON
    }

    return {
      success: res.ok && data?.success === true,
      status: res.status,
      tokenReceived: !!data?.token,
      errorMessage: data?.message || (!res.ok ? `HTTP ${res.status}` : null),
      latency
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const latency = Date.now() - start;
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      status: isTimeout ? 'TIMEOUT' : (err.code || 'NETWORK_ERR'),
      tokenReceived: false,
      errorMessage: isTimeout ? `Timeout after ${CONFIG.requestTimeoutMs}ms` : err.message,
      latency
    };
  }
}

async function runTest() {
  console.log('===============================================================');
  console.log('🌐 CODE NEXUS - PRODUCTION LOGIN CONCURRENCY TEST');
  console.log('===============================================================');
  console.log(`🎯 Target URL        : ${CONFIG.url}`);
  console.log(`👤 Target User       : ${CONFIG.credentials.email}`);
  console.log(`👥 Concurrent Users  : ${CONFIG.concurrentUsers}`);
  console.log(`⏱️ Duration          : ${CONFIG.testDurationSec} seconds (1 minute)`);
  console.log('───────────────────────────────────────────────────────────────');

  // Phase 1: Pre-flight check & warm up
  console.log('⏳ Step 1: Waking up Render server & verifying credentials...');
  const warmupStart = Date.now();
  const warmup = await sendLoginRequest();
  const warmupDuration = Date.now() - warmupStart;

  if (warmup.success) {
    console.log(`✅ Warm-up successful! Server responded in ${warmupDuration}ms (HTTP 200, JWT token acquired).`);
  } else {
    console.warn(`⚠️ Warning during pre-flight check: Status [${warmup.status}] - ${warmup.errorMessage}`);
    console.log('Proceeding with load test to evaluate behavior under load...\n');
  }

  console.log('───────────────────────────────────────────────────────────────');
  console.log(`🚀 Step 2: Launching ${CONFIG.concurrentUsers} concurrent workers for ${CONFIG.testDurationSec} seconds...`);
  console.log('───────────────────────────────────────────────────────────────');

  const results = [];
  const statusCodes = {};
  const errorDetails = {};
  const startTime = Date.now();
  const endTime = startTime + (CONFIG.testDurationSec * 1000);

  // Status reporter ticker (every 10 seconds)
  const ticker = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const currentCompleted = results.length;
    const currentSuccess = results.filter(r => r.success).length;
    const currentFailed = currentCompleted - currentSuccess;
    const recentLatencies = results.slice(-50).map(r => r.latency);
    const recentAvg = recentLatencies.length ? Math.round(recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length) : 0;
    console.log(`⏱️ [${String(elapsed).padStart(2, '0')}s / ${CONFIG.testDurationSec}s] Completed: ${currentCompleted} | ✅ ${currentSuccess} OK | ❌ ${currentFailed} Failed | Current Latency: ~${recentAvg}ms`);
  }, 10000);

  // Worker task: keeps sending requests in parallel until test duration expires
  async function worker(workerId) {
    while (Date.now() < endTime) {
      const res = await sendLoginRequest();
      results.push(res);

      // Track status codes
      statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;

      // Track error messages
      if (!res.success) {
        const errKey = `${res.status}: ${res.errorMessage}`;
        errorDetails[errKey] = (errorDetails[errKey] || 0) + 1;
      }
    }
  }

  // Launch all concurrent workers simultaneously
  const workers = Array.from({ length: CONFIG.concurrentUsers }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  clearInterval(ticker);

  const totalTimeTakenSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // Phase 3: Analytics & Reporting
  const total = results.length;
  const successes = results.filter(r => r.success).length;
  const failures = total - successes;
  const successRate = total > 0 ? ((successes / total) * 100).toFixed(2) : '0';

  const latencies = results.map(r => r.latency).sort((a, b) => a - b);
  const minLatency = latencies.length ? latencies[0] : 0;
  const maxLatency = latencies.length ? latencies[latencies.length - 1] : 0;
  const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / total) : 0;
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.90)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  const rps = (total / totalTimeTakenSec).toFixed(2);
  const successRps = (successes / totalTimeTakenSec).toFixed(2);
  const rpm = Math.round(successRps * 60);

  console.log('\n===============================================================');
  console.log('📊 FINAL TEST RESULTS & CAPACITY REPORT');
  console.log('===============================================================');
  console.log(`⏱️ Total Test Duration   : ${totalTimeTakenSec} seconds`);
  console.log(`👥 Concurrent Users (VUs): ${CONFIG.concurrentUsers}`);
  console.log(`📨 Total Logins Attempted: ${total}`);
  console.log(`✅ Successful Logins     : ${successes} (${successRate}%)`);
  console.log(`❌ Failed Logins         : ${failures}`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`⚡ Throughput (All reqs) : ${rps} req/sec`);
  console.log(`🔥 Successful Logins/Sec : ${successRps} logins/sec`);
  console.log(`📈 Logins Per Minute(RPM): ~${rpm} users/minute`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log('⏱️ RESPONSE LATENCY BREAKDOWN:');
  console.log(`   - Fastest Request     : ${minLatency} ms`);
  console.log(`   - Average Latency     : ${avgLatency} ms`);
  console.log(`   - Median (p50)        : ${p50} ms`);
  console.log(`   - 90th Percentile(p90): ${p90} ms`);
  console.log(`   - 95th Percentile(p95): ${p95} ms`);
  console.log(`   - 99th Percentile(p99): ${p99} ms`);
  console.log(`   - Slowest Request     : ${maxLatency} ms`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log('📋 STATUS CODES RECEIVED:');
  for (const [code, count] of Object.entries(statusCodes)) {
    console.log(`   - HTTP/Status ${code}: ${count} requests (${((count / total) * 100).toFixed(1)}%)`);
  }

  if (Object.keys(errorDetails).length > 0) {
    console.log('───────────────────────────────────────────────────────────────');
    console.log('⚠️ ERROR DETAILS:');
    for (const [err, count] of Object.entries(errorDetails)) {
      console.log(`   - [${count}x] ${err}`);
    }
  }
  console.log('===============================================================\n');
}

runTest().catch(err => {
  console.error('Fatal test error:', err);
});
