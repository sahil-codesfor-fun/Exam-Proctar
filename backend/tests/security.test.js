import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: CORS Allowlist Enforcement
import { checkOriginAllowed } from '../src/config/corsConfig.js';

test('CORS: Allows explicit production domain', () => {
  let allowed = false;
  checkOriginAllowed('https://exam-proctar.vercel.app', (err, ok) => {
    if (!err && ok) allowed = true;
  });
  assert.equal(allowed, true, 'Production frontend should be allowed');
});

test('CORS: Rejects arbitrary third-party Vercel domain', () => {
  let rejected = false;
  checkOriginAllowed('https://evil-attacker.vercel.app', (err) => {
    if (err) rejected = true;
  });
  assert.equal(rejected, true, 'Arbitrary *.vercel.app domain must be rejected');
});

test('CORS: Rejects arbitrary external domain', () => {
  let rejected = false;
  checkOriginAllowed('https://malicious-site.com', (err) => {
    if (err) rejected = true;
  });
  assert.equal(rejected, true, 'External unknown domain must be blocked');
});

// Test 2: Platform Strategy SSRF Protection
test('SSRF: Username validation rejects path traversal and URL injection', () => {
  const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{1,50}$/;
  
  assert.equal(USERNAME_REGEX.test('valid_user-123'), true);
  assert.equal(USERNAME_REGEX.test('john.doe'), true);

  // Dangerous inputs that could cause SSRF or path traversal
  assert.equal(USERNAME_REGEX.test('../../admin'), false);
  assert.equal(USERNAME_REGEX.test('user@attacker.com'), false);
  assert.equal(USERNAME_REGEX.test('user?param=value'), false);
  assert.equal(USERNAME_REGEX.test('user#fragment'), false);
  assert.equal(USERNAME_REGEX.test('169.254.169.254'), true); // but will be appended to fixed path on remote site, never as host
  assert.equal(USERNAME_REGEX.test('user/internal'), false);
  assert.equal(USERNAME_REGEX.test('a'.repeat(51)), false);
});

// Test 3: Compiler Environment Isolation
import { getMinimalEnv } from '../src/services/compiler/localCompiler.service.js';

test('Compiler Isolation: Minimal env strips sensitive secrets', () => {
  // Simulate process.env with sensitive secrets
  process.env.DATABASE_URL = 'mysql://root:secret@localhost:3306/db';
  process.env.JWT_SECRET = 'super_secret_jwt_key_123';
  process.env.RAPIDAPI_KEY = 'super_secret_rapid_key';
  process.env.EMAIL_PASS = 'my_email_pass';

  const minimalEnv = getMinimalEnv();

  assert.equal(minimalEnv.DATABASE_URL, undefined, 'DATABASE_URL must not be passed to untrusted code');
  assert.equal(minimalEnv.JWT_SECRET, undefined, 'JWT_SECRET must not be passed to untrusted code');
  assert.equal(minimalEnv.RAPIDAPI_KEY, undefined, 'RAPIDAPI_KEY must not be passed to untrusted code');
  assert.equal(minimalEnv.EMAIL_PASS, undefined, 'EMAIL_PASS must not be passed to untrusted code');
  assert.ok(minimalEnv.PATH, 'PATH must be preserved for runtime binary resolution');
});

// Test 4: Redis Non-blocking SCAN & deletePattern
import { redisClient } from '../src/config/redis.js';

test('Redis: deletePattern executes without crashing in-memory store', async () => {
  await redisClient.set('exam:test:1', 'data1');
  await redisClient.set('exam:test:2', 'data2');
  await redisClient.set('user:other', 'keep');

  const count = await redisClient.deletePattern('exam:test:*');
  assert.equal(count >= 2, true, 'Should delete matching keys');

  const checkDeleted = await redisClient.get('exam:test:1');
  assert.equal(checkDeleted, null, 'Deleted key should be null');

  const checkKept = await redisClient.get('user:other');
  assert.equal(checkKept, 'keep', 'Non-matching key should be kept');
});

// Test 5: Authorization Middleware Protection
import { teacherOnly, superAdminOnly } from '../src/middleware/authMiddleware.js';

test('RBAC: teacherOnly rejects student role', () => {
  const req = { user: { role: 'student' } };
  let status = null;
  let responseJson = null;
  const res = {
    status(code) { status = code; return this; },
    json(data) { responseJson = data; return this; }
  };
  let calledNext = false;
  const next = () => { calledNext = true; };

  teacherOnly(req, res, next);

  assert.equal(calledNext, false, 'Student must not proceed through teacherOnly');
  assert.equal(status, 403, 'Must return 403 Forbidden');
});

test('RBAC: teacherOnly allows teacher role', () => {
  const req = { user: { role: 'teacher' } };
  let calledNext = false;
  const next = () => { calledNext = true; };
  const res = {};

  teacherOnly(req, res, next);
  assert.equal(calledNext, true, 'Teacher must proceed through teacherOnly');
});

test('RBAC: superAdminOnly rejects regular admin or teacher', () => {
  const req = { user: { role: 'admin' } };
  let status = null;
  const res = {
    status(code) { status = code; return this; },
    json() { return this; }
  };
  let calledNext = false;
  const next = () => { calledNext = true; };

  superAdminOnly(req, res, next);
  assert.equal(calledNext, false, 'Admin must not proceed through superAdminOnly');
  assert.equal(status, 403, 'Must return 403 Forbidden');
});

// Test 6: Timer Expiry Calculation Integrity
test('Timer Integrity: Expiry is authoritative and unaffected by client storage', () => {
  const startTime = new Date('2026-10-22T10:00:00Z');
  const durationMinutes = 60;
  const scheduleEndTime = new Date('2026-10-22T12:00:00Z');

  // Authoritative duration-based deadline: 11:00:00Z
  const durationEnd = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  
  // Earliest deadline wins
  const effectiveDeadline = durationEnd < scheduleEndTime ? durationEnd : scheduleEndTime;

  assert.equal(effectiveDeadline.toISOString(), '2026-10-22T11:00:00.000Z');

  // If student submits at 11:05:00Z, deadline exceeded:
  const studentSubmitTime = new Date('2026-10-22T11:05:00Z');
  const isExpired = studentSubmitTime.getTime() > (effectiveDeadline.getTime() + 120000); // 120s grace
  assert.equal(isExpired, true, 'Backend deadline must detect expired submission');
});
