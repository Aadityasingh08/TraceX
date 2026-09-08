import pool from "../config/db.js";
import crypto from "crypto";

/**
 * TraceX Large Scale Dataset Seeder (Task 1)
 * ==========================================
 * Generates and batch-inserts a synthetic benchmark dataset into an isolated
 * investigation ('CASE-2026-LARGE') without touching the flagship Operation Orion demo data.
 *
 * Dataset Scale:
 *   - 1 Investigation: 'CASE-2026-LARGE — Bulk Intelligence Simulation (Synthetic)'
 *   - 1,000 Synthetic Entities (PERSON, CHANNEL, LOCATION, MARKETPLACE, WALLET, TOPIC, ORGANIZATION)
 *   - 2,500 Synthetic Relationships with confidence scores and timestamps
 *   - 15,000 Synthetic Signals with entity links, phone/wallet/handle snippets, and temporal spread
 *
 * Architecture:
 *   - Uses parameterized multi-row batch inserts (500 rows/batch) for high speed (<5s).
 *   - Measures and prints exact execution duration.
 */

const FIRST_NAMES = [
  "Aarav", "Vikram", "Rohan", "Kabir", "Sameer", "Aditya", "Rahul", "Arjun", "Siddharth",
  "Farhan", "Imran", "Karan", "Dev", "Manish", "Nikhil", "Pooja", "Neha", "Ananya", "Priya",
  "Riya", "Sneha", "Meera", "Kavita", "Sunita", "Tanvi", "Tariq", "Zubair", "Deepak", "Amit", "Rajesh"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Singh", "Patel", "Khan", "Gupta", "Malhotra", "Reddy", "Chopra",
  "Kapoor", "Mehta", "Joshi", "Bose", "Nair", "Deshmukh", "Yadav", "Rao", "Bhatia", "Saxena", "Chawla"
];

const CITIES = [
  "Mumbai, Maharashtra", "Delhi, NCR", "Bengaluru, Karnataka", "Hyderabad, Telangana",
  "Ahmedabad, Gujarat", "Chennai, Tamil Nadu", "Kolkata, West Bengal", "Pune, Maharashtra",
  "Jaipur, Rajasthan", "Surat, Gujarat", "Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh",
  "Nagpur, Maharashtra", "Indore, Madhya Pradesh", "Thane, Maharashtra", "Bhopal, Madhya Pradesh",
  "Visakhapatnam, Andhra Pradesh", "Patna, Bihar", "Vadodara, Gujarat", "Ghaziabad, Uttar Pradesh",
  "Ludhiana, Punjab", "Agra, Uttar Pradesh", "Nashik, Maharashtra", "Faridabad, Haryana",
  "Meerut, Uttar Pradesh", "Rajkot, Gujarat", "Varanasi, Uttar Pradesh", "Srinagar, J&K",
  "Amritsar, Punjab", "Ranchi, Jharkhand", "Coimbatore, Tamil Nadu", "Chandigarh, Punjab"
];

const REL_TYPES = [
  "COMMUNICATED_WITH", "TRANSACTED_WITH", "ASSOCIATED_WITH", "ROUTED_THROUGH",
  "MEMBER_OF", "LINKED_TO", "COORDINATES_WITH", "ESCROW_PAID"
];

const COMMUNITIES = [
  "Cluster-Alpha-Transit", "Cluster-Beta-Fintech", "Cluster-Gamma-Logistics",
  "Cluster-Delta-Relay", "Financial-Mules", "Encrypted-Comms-Ring", "Synthetic-Hub"
];

const SOURCES = [
  "TransitFeed-Monitor", "Telegram-Relay-Capture", "Financial-Intercept-Stream",
  "Public-Safety-Feed", "Darknet-Mirror-Index", "Surveillance-Corridor-Telemetry"
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seedLargeDataset(options = {}) {
  const targetSignalCount = options.signalCount || 15000;
  const targetEntityCount = options.entityCount || 1000;
  const targetRelCount = options.relCount || 2500;

  console.log("===============================================================");
  console.log("🚀 TRACE-X LARGE SCALE DATASET SEEDER (Task 1)");
  console.log(`Target Scale: ${targetEntityCount} Entities | ${targetRelCount} Relationships | ${targetSignalCount} Signals`);
  console.log("===============================================================\n");

  const startTime = Date.now();

  // 1. Create or retrieve the Large Scale Investigation
  console.log("[1/4] Initializing isolated investigation container...");
  const caseCode = "CASE-2026-LARGE";
  const caseTitle = "Bulk Intelligence Simulation (Synthetic Large Scale)";

  // Clean up previous run of CASE-2026-LARGE only (keeping Operation Orion untouched)
  const existingInv = await pool.query("SELECT id FROM investigations WHERE case_code = $1", [caseCode]);
  let largeInvId;

  if (existingInv.rows.length > 0) {
    largeInvId = existingInv.rows[0].id;
    console.log(`  -> Found existing ${caseCode} (ID: ${largeInvId}). Cleaning previous simulation items...`);
    await pool.query("DELETE FROM signals WHERE investigation_id = $1", [largeInvId]);
    await pool.query("DELETE FROM relationships WHERE investigation_id = $1", [largeInvId]);
    await pool.query("DELETE FROM entities WHERE investigation_id = $1", [largeInvId]);
  } else {
    const invRes = await pool.query(
      `INSERT INTO investigations (case_code, title, status, created_at)
       VALUES ($1, $2, 'ACTIVE', NOW())
       RETURNING id`,
      [caseCode, caseTitle]
    );
    largeInvId = invRes.rows[0].id;
    console.log(`  -> Created new investigation ${caseCode} (ID: ${largeInvId})`);
  }

  // 2. Generate and Batch Insert Entities
  console.log(`\n[2/4] Generating and batch-inserting ${targetEntityCount} synthetic entities...`);
  const entityTypes = ["PERSON", "PERSON", "PERSON", "CHANNEL", "LOCATION", "MARKETPLACE", "WALLET", "TOPIC", "ORGANIZATION"];
  const createdEntityIds = [];
  const entityBatchSize = 250;

  for (let i = 0; i < targetEntityCount; i += entityBatchSize) {
    const batchCount = Math.min(entityBatchSize, targetEntityCount - i);
    const values = [];
    const params = [];
    let pIdx = 1;

    for (let j = 0; j < batchCount; j++) {
      const idx = i + j + 1;
      const type = randomChoice(entityTypes);
      const fname = randomChoice(FIRST_NAMES);
      const lname = randomChoice(LAST_NAMES);
      const name = type === "PERSON"
        ? `SYNTH-${fname.toUpperCase()}-${lname.toUpperCase()}-${idx}`
        : type === "CHANNEL"
        ? `SYNTH-CHANNEL-NODE-${idx}`
        : type === "LOCATION"
        ? `SYNTH-ROUTE-${idx}`
        : type === "WALLET"
        ? `SYNTH-WALLET-${idx}`
        : `SYNTH-${type}-${idx}`;

      const priority = idx % 5 === 0 ? "HIGH" : idx % 3 === 0 ? "MEDIUM" : "LOW";
      const aliasList = [
        `@${fname.toLowerCase()}_${lname.toLowerCase()}_${idx}`,
        `+91${randomInt(6000000000, 9999999999)}`,
        `ALT-${idx}`
      ];
      const sourceList = [randomChoice(SOURCES), randomChoice(SOURCES)];
      const activity = randomInt(15, 95);
      const community = randomChoice(COMMUNITIES);
      const desc = `Synthetic benchmark entity #${idx} generated for large-scale stress testing (${type} node in ${community}).`;

      values.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}::jsonb, $${pIdx+5}::jsonb, $${pIdx+6}, $${pIdx+7}, NOW() - INTERVAL '${randomInt(10, 180)} days', NOW(), NOW())`);
      params.push(
        name,
        type,
        priority,
        largeInvId,
        JSON.stringify(aliasList),
        JSON.stringify(sourceList),
        desc,
        activity
      );
      pIdx += 8;
    }

    const insertQuery = `
      INSERT INTO entities (name, type, priority, investigation_id, aliases, sources, description, activity, first_observed, last_observed, created_at)
      VALUES ${values.join(", ")}
      RETURNING id
    `;
    const res = await pool.query(insertQuery, params);
    for (const r of res.rows) {
      createdEntityIds.push(r.id);
    }
  }
  console.log(`  -> Successfully inserted ${createdEntityIds.length} entities into PostgreSQL!`);

  // 3. Generate and Batch Insert Relationships
  console.log(`\n[3/4] Generating and batch-inserting ${targetRelCount} relationships...`);
  const relBatchSize = 500;
  let insertedRels = 0;

  for (let i = 0; i < targetRelCount; i += relBatchSize) {
    const batchCount = Math.min(relBatchSize, targetRelCount - i);
    const values = [];
    const params = [];
    let pIdx = 1;

    for (let j = 0; j < batchCount; j++) {
      const srcId = randomChoice(createdEntityIds);
      let tgtId = randomChoice(createdEntityIds);
      while (tgtId === srcId) {
        tgtId = randomChoice(createdEntityIds);
      }
      const type = randomChoice(REL_TYPES);
      const conf = (randomInt(60, 99) / 100).toFixed(2);
      const daysAgo = randomInt(1, 150);

      values.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, NOW() - INTERVAL '${daysAgo} days')`);
      params.push(srcId, tgtId, type, conf, largeInvId);
      pIdx += 5;
    }

    const relQuery = `
      INSERT INTO relationships (source_id, target_id, type, confidence, investigation_id, created_at)
      VALUES ${values.join(", ")}
    `;
    await pool.query(relQuery, params);
    insertedRels += batchCount;
  }
  console.log(`  -> Successfully inserted ${insertedRels} relationships into PostgreSQL!`);

  // 4. Generate and Batch Insert 15,000 Signals
  console.log(`\n[4/4] Generating and batch-inserting ${targetSignalCount} signals...`);
  const signalBatchSize = 500;
  let insertedSignals = 0;

  for (let i = 0; i < targetSignalCount; i += signalBatchSize) {
    const batchCount = Math.min(signalBatchSize, targetSignalCount - i);
    const values = [];
    const params = [];
    let pIdx = 1;

    for (let j = 0; j < batchCount; j++) {
      const sigNum = i + j + 1;
      const linkedEntityId = randomChoice(createdEntityIds);
      const signalId = crypto.randomUUID();
      const fname = randomChoice(FIRST_NAMES);
      const lname = randomChoice(LAST_NAMES);
      const city = randomChoice(CITIES);
      const phone = `+91${randomInt(6000000000, 9999999999)}`;
      const handle = `@${fname.toLowerCase()}_${lname.toLowerCase()}_${randomInt(10, 99)}`;
      const wallet = `0x${crypto.randomBytes(20).toString("hex")}`;
      const amount = randomChoice([25000, 50000, 75000, 120000, 250000, 500000, 850000, 1500000]);
      const source = randomChoice(SOURCES);
      const title = `Intel Signal #${sigNum} — ${fname} ${lname} (${city.split(",")[0]})`;
      const snippet = `Synthetic Intelligence Intercept #${sigNum}. Operative: ${fname} ${lname} (${handle}), Contact: ${phone}, Location: ${city}. Escrow settlement wallet: ${wallet}. Transaction Valuation: INR ${amount.toLocaleString()}. Monitored on channel: ${source}.`;
      const conf = (randomInt(70, 98) / 100).toFixed(2);
      const daysAgo = randomInt(1, 365);

      values.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, NOW() - INTERVAL '${daysAgo} days', 'synthetic_large')`);
      params.push(signalId, linkedEntityId, largeInvId, source, "synthetic_intercept", title, snippet, conf);
      pIdx += 8;
    }

    const sigQuery = `
      INSERT INTO signals (id, entity_id, investigation_id, source, type, title, snippet, confidence, timestamp, topic)
      VALUES ${values.join(", ")}
    `;
    await pool.query(sigQuery, params);
    insertedSignals += batchCount;

    if (insertedSignals % 2500 === 0 || insertedSignals === targetSignalCount) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`  -> Progress: ${insertedSignals}/${targetSignalCount} signals inserted... (${elapsed}s elapsed)`);
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n===============================================================");
  console.log(`✅ LARGE SCALE SEED COMPLETE in ${totalDuration} seconds!`);
  console.log("===============================================================");
  console.log(`  - Investigation ID: ${largeInvId} (${caseCode})`);
  console.log(`  - Entities Created: ${createdEntityIds.length}`);
  console.log(`  - Relationships Created: ${insertedRels}`);
  console.log(`  - Signals Created: ${insertedSignals}`);
  console.log(`  - Operation Orion demo data untouched.`);
  console.log("===============================================================\n");

  return {
    investigationId: largeInvId,
    entitiesCount: createdEntityIds.length,
    relationshipsCount: insertedRels,
    signalsCount: insertedSignals,
    durationSeconds: totalDuration
  };
}

// Allow direct CLI execution: node src/seed/seedLarge.js
if (process.argv[1] && process.argv[1].includes("seedLarge")) {
  seedLargeDataset()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[!] Fatal Seeder Error:", err);
      process.exit(1);
    });
}
