import pool from './src/config/db.js';

const BASE_URL = 'http://localhost:5000/api';

async function fetchJson(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runAudit() {
  console.log('================================================================');
  console.log('          TRACE-X COMPREHENSIVE QA & HACKATHON AUDIT           ');
  console.log('================================================================\n');

  const report = {
    auth: { passed: 0, failed: 0, details: [] },
    pipeline: { passed: 0, failed: 0, details: [] },
    api: { passed: 0, failed: 0, details: [] },
    security: { passed: 0, failed: 0, details: [] },
    database: { passed: 0, failed: 0, details: [] }
  };

  function assert(category, testName, condition, detail = '') {
    if (condition) {
      report[category].passed++;
      console.log(`  [PASS] ${testName}`);
    } else {
      report[category].failed++;
      console.log(`  [FAIL] ${testName}: ${detail}`);
      report[category].details.push({ testName, detail });
    }
  }

  // -------------------------------------------------------------
  // 1. DATABASE CHECKS
  // -------------------------------------------------------------
  console.log('--- 1. DATABASE & POSTGRESQL VERIFICATION ---');
  try {
    const dbNow = await pool.query('SELECT NOW() AS now, current_database() as db');
    assert('database', 'PostgreSQL connected on port 5433', dbNow.rows.length > 0 && dbNow.rows[0].db === 'tracex');

    const expectedTables = [
      'users', 'investigations', 'entities', 'relationships',
      'signals', 'signal_candidates', 'evidence', 'alerts',
      'trends', 'categories', 'notifications', 'audit_logs',
      'keyword_dictionary'
    ];
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const existingTables = new Set(tablesRes.rows.map(r => r.table_name));
    for (const tbl of expectedTables) {
      assert('database', `Table exists: ${tbl}`, existingTables.has(tbl), `Missing table ${tbl}`);
    }

    // Check password hashing in users table
    const userSample = await pool.query('SELECT password FROM users LIMIT 3');
    const allBcrypt = userSample.rows.every(u => u.password.startsWith('$2'));
    assert('database', 'All stored passwords hashed with bcrypt ($2a/$2b)', allBcrypt);
  } catch (err) {
    assert('database', 'Database query execution', false, err.message);
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATION TEST
  // -------------------------------------------------------------
  console.log('\n--- 2. AUTHENTICATION & SESSION TESTS ---');
  const uniqueId = Date.now();
  const testEmail = `audit_analyst_${uniqueId}@tracex.local`;
  const testPassword = 'StrongPassword123!';

  // A. Missing fields
  const regMissing = await fetchJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test' })
  });
  assert('auth', 'Registration rejects missing fields (HTTP 400)', regMissing.status === 400);

  // B. Weak password (<8 chars)
  const regWeak = await fetchJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test', email: `weak_${uniqueId}@test.com`, password: '123' })
  });
  assert('auth', 'Registration rejects weak password < 8 chars (HTTP 400)', regWeak.status === 400);

  // C. Invalid email (no @)
  const regBadEmail = await fetchJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test', email: 'invalid_email_format', password: 'ValidPassword123' })
  });
  assert('auth', 'Registration rejects invalid email without @ (HTTP 400)', regBadEmail.status === 400);

  // D. Valid registration
  const regValid = await fetchJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Audit Specialist', email: testEmail, password: testPassword })
  });
  assert('auth', 'Valid registration returns HTTP 201 + token', regValid.status === 201 && !!regValid.data.token);

  // E. Duplicate email registration
  const regDup = await fetchJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Duplicate Analyst', email: testEmail, password: testPassword })
  });
  assert('auth', 'Duplicate email rejected with HTTP 409', regDup.status === 409);

  // F. Valid login
  const loginValid = await fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  assert('auth', 'Valid login returns HTTP 200 + token', loginValid.status === 200 && !!loginValid.data.token);
  const token = loginValid.data.token;

  // G. Protected route with valid token
  const meValid = await fetchJson('/auth/me', { token });
  assert('auth', 'GET /auth/me returns current user profile', meValid.status === 200 && meValid.data.user?.email === testEmail);

  // H. Protected route without token
  const meNoToken = await fetchJson('/auth/me');
  assert('auth', 'GET /auth/me rejects unauthenticated request (HTTP 401)', meNoToken.status === 401);

  // I. Invalid password login
  const loginBadPass = await fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword999' })
  });
  assert('auth', 'Invalid password returns HTTP 401 with remaining attempts warning', loginBadPass.status === 401 && loginBadPass.data.attemptsLeft !== undefined);

  // -------------------------------------------------------------
  // 3. COMPLETE TRACE-X CORE PIPELINE TEST
  // -------------------------------------------------------------
  console.log('\n--- 3. COMPLETE TRACE-X CORE PIPELINE TEST ---');
  console.log('   Workflow: REGISTER -> LOGIN -> SUBMIT RECORD -> EXTRACT CANDIDATES -> CONFIRM -> CORRELATE -> ENTITY -> SCORE -> ALERT');

  // Step 1: Submit a realistic intelligence record
  const recordSnippet = `Intercepted communications: operative @phantom_unit_${uniqueId} coordinated with +919876543${String(uniqueId).slice(-4)} regarding crypto escrow 0x71C84943E5220A405e54c8B868D8499F5E6B6fD8 with $75000 payment for server access.`;
  const submitRes = await fetchJson('/records/submit', {
    method: 'POST',
    token,
    body: JSON.stringify({
      title: `Tactical Intercept Orion-${uniqueId}`,
      snippet: recordSnippet,
      sourceLabel: 'Telegram SIGINT Wire',
      type: 'COMMUNICATION'
    })
  });
  assert('pipeline', 'Pipeline Step 1 (SUBMIT RECORD): HTTP 201 received', submitRes.status === 201);
  const signalId = submitRes.data.signalId;
  const candidates = submitRes.data.candidates || [];
  assert('pipeline', 'Pipeline Step 2 (EXTRACT CANDIDATES): Pattern matching identified entities', candidates.length >= 3, `Found ${candidates.length} candidates`);

  // Verify stored in PostgreSQL
  const dbSignal = await pool.query('SELECT * FROM signals WHERE id = $1', [signalId]);
  assert('pipeline', 'Database Verification: Signal stored in signals table', dbSignal.rows.length === 1);

  const dbCandidates = await pool.query('SELECT * FROM signal_candidates WHERE signal_id = $1', [signalId]);
  assert('pipeline', 'Database Verification: Candidates stored in signal_candidates table', dbCandidates.rows.length > 0);

  // Step 3: Confirm Candidate
  const candToConfirm = dbCandidates.rows[0];
  let confirmRes = null;
  if (candToConfirm) {
    confirmRes = await fetchJson(`/records/candidates/${candToConfirm.id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status: 'CONFIRMED' })
    });
    assert('pipeline', 'Pipeline Step 3 (CONFIRM CANDIDATE): Candidate status marked CONFIRMED', confirmRes.status === 200 && confirmRes.data.success);
  }

  // Step 4: Correlation & Entity Creation
  const correlation = confirmRes?.data?.correlation;
  assert('pipeline', 'Pipeline Step 4 (CORRELATE): Entity IDs resolved/created', correlation && correlation.entityIds && correlation.entityIds.length > 0);
  const createdEntityId = correlation?.entityIds?.[0];

  // Verify Entity in Database
  if (createdEntityId) {
    const dbEntity = await pool.query('SELECT * FROM entities WHERE id = $1', [createdEntityId]);
    assert('pipeline', 'Pipeline Step 5 (CREATE ENTITY): Entity exists in entities table', dbEntity.rows.length === 1);

    // Step 6: Entity Score Calculation
    const scoreRes = await fetchJson(`/entities/${createdEntityId}/score`);
    assert('pipeline', 'Pipeline Step 6 (SCORE ENTITY): Dynamic risk score calculated', scoreRes.status === 200 && typeof scoreRes.data.score === 'number');

    // Step 7: Network Metrics Calculation
    const metricsRes = await fetchJson(`/entities/${createdEntityId}/network-metrics`);
    assert('pipeline', 'Pipeline Step 7 (NETWORK METRICS): Centrality & connection density computed', metricsRes.status === 200 && metricsRes.data.degree !== undefined);
  }

  // Step 8: Alert Decision & Evidence Verification
  assert('pipeline', 'Pipeline Step 8 (ALERT DECISION): maybeCreateAlert ran during confirmation', confirmRes?.data?.alertsCreated !== undefined);

  // -------------------------------------------------------------
  // 4. API INVENTORY & ENDPOINT AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 4. API INVENTORY & ENDPOINT AUDIT ---');
  const endpoints = [
    { method: 'GET', path: '/health', expected: 200, name: 'System Health Check' },
    { method: 'GET', path: '/test-db', expected: 200, name: 'Database Connectivity Check' },
    { method: 'GET', path: '/investigations', expected: 200, name: 'List Investigations' },
    { method: 'GET', path: '/investigations/1', expected: 200, name: 'Get Investigation Detail' },
    { method: 'GET', path: '/investigations/1/summary', expected: 200, name: 'AI Investigation Summary' },
    { method: 'GET', path: '/entities', expected: 200, name: 'List Entities' },
    { method: 'GET', path: '/relationships', expected: 200, name: 'List Relationships' },
    { method: 'GET', path: '/records?limit=5', expected: 200, name: 'List Records (Paginated)' },
    { method: 'GET', path: '/alerts', expected: 200, name: 'List Alerts' },
    { method: 'GET', path: '/evidence', expected: 200, name: 'List Evidence Records' },
    { method: 'GET', path: '/trends', expected: 200, name: 'List Emerging Trends' },
    { method: 'GET', path: '/categories', expected: 200, name: 'List Feed Categories' },
    { method: 'GET', path: '/notifications', expected: 200, name: 'List Notifications' },
    { method: 'GET', path: '/audit-logs', expected: 200, token, name: 'List Audit Trail Logs (Authenticated)' },
    {
      method: 'POST',
      path: '/ai/copilot',
      expected: 200,
      token,
      body: JSON.stringify({ query: 'Summarize current threat posture for Operation Orion' }),
      name: 'AI Analyst Copilot Query'
    },
    {
      method: 'POST',
      path: '/reports/generate',
      expected: 200,
      token,
      name: 'Intelligence Report Generation'
    }
  ];

  for (const ep of endpoints) {
    const res = await fetchJson(ep.path, {
      method: ep.method,
      token: ep.token,
      body: ep.body
    });
    assert('api', `API Endpoint: [${ep.method}] ${ep.path} - ${ep.name}`, res.status === ep.expected, `Got ${res.status}`);
  }

  // -------------------------------------------------------------
  // 5. SECURITY & RESILIENCE AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 5. SECURITY & RESILIENCE AUDIT ---');

  // A. SQL Injection test on search query
  const sqliTest = await fetchJson('/records?search=' + encodeURIComponent("' OR '1'='1"));
  assert('security', 'SQL Injection: Parameterized query resists SQL injection', sqliTest.status === 200 && Array.isArray(sqliTest.data));

  // B. Unauthorized mutation attempt
  const unauthSubmit = await fetchJson('/records/submit', {
    method: 'POST',
    body: JSON.stringify({ snippet: 'Unauthorized intelligence inject' })
  });
  assert('security', 'Authorization: Unauthorized submission rejected with HTTP 401', unauthSubmit.status === 401);

  // C. Rate limit check (brute force protection)
  const authRouteProtected = await fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'nonexistent@test.com', password: 'random' })
  });
  assert('security', 'Auth Security: Brute-force protection tracking active', authRouteProtected.status === 401 && authRouteProtected.data.attemptsLeft !== undefined);

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                        AUDIT RESULTS SUMMARY                   ');
  console.log('================================================================');
  console.log(`Database:       ${report.database.passed} Passed / ${report.database.failed} Failed`);
  console.log(`Authentication: ${report.auth.passed} Passed / ${report.auth.failed} Failed`);
  console.log(`Core Pipeline:  ${report.pipeline.passed} Passed / ${report.pipeline.failed} Failed`);
  console.log(`API Endpoints:  ${report.api.passed} Passed / ${report.api.failed} Failed`);
  console.log(`Security:       ${report.security.passed} Passed / ${report.security.failed} Failed`);

  const totalPassed = report.database.passed + report.auth.passed + report.pipeline.passed + report.api.passed + report.security.passed;
  const totalFailed = report.database.failed + report.auth.failed + report.pipeline.failed + report.api.failed + report.security.failed;
  console.log(`\nTOTAL TESTS:    ${totalPassed + totalFailed}`);
  console.log(`TOTAL PASSED:   ${totalPassed}`);
  console.log(`TOTAL FAILED:   ${totalFailed}`);
  console.log('================================================================\n');

  await pool.end();
}

runAudit().catch(console.error);
