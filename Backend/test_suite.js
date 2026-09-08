import pool from './src/config/db.js';

async function runComprehensiveVerification() {
  console.log('=====================================================');
  console.log('       TRACE-X SYSTEM VERIFICATION & AUDIT SUITE     ');
  console.log('=====================================================\n');

  // 1. Database Row Counts
  console.log('--- [1] DATABASE ROW COUNTS (Live SELECT COUNT(*)) ---');
  const tables = ['investigations', 'entities', 'relationships', 'signals', 'alerts', 'evidence', 'audit_logs'];
  for (const table of tables) {
    try {
      const res = await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);
      console.log(`  Table [${table.padEnd(15)}]: ${res.rows[0].count} rows`);
    } catch (e) {
      console.log(`  Table [${table.padEnd(15)}]: Error -> ${e.message}`);
    }
  }

  // 2. Dataset Isolation Check
  console.log('\n--- [2] DATASET ISOLATION PROOF ---');
  const invCounts = await pool.query(`
    SELECT i.id, i.title, i.status,
           (SELECT COUNT(*) FROM entities e WHERE e.investigation_id = i.id) AS entity_count,
           (SELECT COUNT(*) FROM relationships r WHERE r.investigation_id = i.id) AS rel_count,
           (SELECT COUNT(*) FROM signals s WHERE s.investigation_id = i.id) AS signal_count
    FROM investigations i
    ORDER BY i.id ASC
  `);
  console.table(invCounts.rows);

  // 3. PostgreSQL Performance Indexes
  console.log('\n--- [3] POSTGRESQL INDEXES (Live pg_indexes query) ---');
  const indexQuery = await pool.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND (
      indexname LIKE 'idx_%' OR indexname LIKE '%_pkey'
    )
    ORDER BY tablename, indexname
  `);
  for (const row of indexQuery.rows) {
    console.log(`  [${row.tablename}] -> ${row.indexname}`);
  }

  // 4. API Rate Limiting & Validation Tests (Using fetch)
  console.log('\n--- [4] SECURITY & VALIDATION LIVE HTTP TESTS ---');
  const BASE_URL = 'http://localhost:5000';

  // Test 4.1: Request Body Validation (Invalid Login)
  try {
    const invalidLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }) // missing password and bad email
    });
    const invalidLoginData = await invalidLoginRes.json();
    console.log(`  Test 4.1: POST /api/auth/login (Invalid payload) -> Status ${invalidLoginRes.status} (Expected 400): ${JSON.stringify(invalidLoginData)}`);
  } catch (err) {
    console.log(`  Test 4.1: Skipped/Failed (Server might not be running on 5000: ${err.message})`);
  }

  // Test 4.2: Request Body Validation (Invalid Entity Creation)
  try {
    const invalidEntityRes = await fetch(`${BASE_URL}/api/entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }) // missing name/type
    });
    const invalidEntityData = await invalidEntityRes.json();
    console.log(`  Test 4.2: POST /api/entities (Empty name) -> Status ${invalidEntityRes.status} (Expected 400): ${JSON.stringify(invalidEntityData)}`);
  } catch (err) {
    console.log(`  Test 4.2: Skipped/Failed (${err.message})`);
  }

  // Test 4.3: Request Body Validation (Invalid Relationship Creation)
  try {
    const invalidRelRes = await fetch(`${BASE_URL}/api/relationships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId: 'abc' }) // missing targetId and not numeric
    });
    const invalidRelData = await invalidRelRes.json();
    console.log(`  Test 4.3: POST /api/relationships (Invalid IDs) -> Status ${invalidRelRes.status} (Expected 400): ${JSON.stringify(invalidRelData)}`);
  } catch (err) {
    console.log(`  Test 4.3: Skipped/Failed (${err.message})`);
  }

  // Test 4.4: Pagination and Filtering (/api/records)
  try {
    const recordsLimitRes = await fetch(`${BASE_URL}/api/records?limit=5&offset=0&investigationId=6`);
    const recordsLimitData = await recordsLimitRes.json();
    console.log(`  Test 4.4: GET /api/records?limit=5&investigationId=6 -> Fetched ${recordsLimitData.length} records. First record ID: ${recordsLimitData[0]?.id}`);
  } catch (err) {
    console.log(`  Test 4.4: Skipped/Failed (${err.message})`);
  }

  // Test 4.5: Rate Limiter on /api/auth/login
  console.log('\n--- [5] RATE LIMITER STRESS TEST (POST /api/auth/login) ---');
  try {
    let rateLimited = false;
    let hitCount = 0;
    for (let i = 1; i <= 35; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `test${i}@domain.com`, password: 'somepassword123' })
      });
      hitCount++;
      if (res.status === 429) {
        const data = await res.json();
        console.log(`  Rate limit triggered successfully at request #${hitCount}! Status: 429, Message: ${JSON.stringify(data)}`);
        rateLimited = true;
        break;
      }
    }
    if (!rateLimited) {
      console.log(`  Rate limit not triggered within ${hitCount} requests.`);
    }
  } catch (err) {
    console.log(`  Rate limiter test error: ${err.message}`);
  }

  await pool.end();
  console.log('\n=====================================================');
  console.log('       ALL VERIFICATION CHECKS COMPLETE              ');
  console.log('=====================================================');
}

runComprehensiveVerification();
