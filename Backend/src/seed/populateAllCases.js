import pool from "../config/db.js";
import crypto from "crypto";

function hashOf(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function populateDistinctCases() {
  console.log("--> Populating distinct per-case data for all active & archived investigations...");

  const casesConfig = [
    {
      id: 2,
      caseCode: "CASE-2026-021",
      title: "Operation Signal",
      status: "ACTIVE",
      description: "Carrier-level telecom monitoring and encrypted relay handshake intercept operation.",
      entityPrefix: "SIG",
      entityCount: 14,
      relCount: 26,
      signalCount: 85,
      alertCount: 4,
      categories: ["telecom_intelligence", "network_bridging"],
    },
    {
      id: 3,
      caseCode: "CASE-2026-009",
      title: "Project Velocity",
      status: "ACTIVE",
      description: "High-velocity privacy coin layering and multi-hop exchange mixer tracking.",
      entityPrefix: "VEL",
      entityCount: 18,
      relCount: 38,
      signalCount: 120,
      alertCount: 5,
      categories: ["crypto_laundering", "c2_infrastructure"],
    },
    {
      id: 4,
      caseCode: "CASE-2025-088",
      title: "Case Horizon",
      status: "ARCHIVED",
      description: "Archived darknet forum and cross-border identity resolution investigation dossier.",
      entityPrefix: "HOR",
      entityCount: 12,
      relCount: 19,
      signalCount: 45,
      alertCount: 2,
      categories: ["identity_evasion", "darknet_relays"],
    },
    {
      id: 5,
      caseCode: "CASE-2026-005",
      title: "Initiative Cascade",
      status: "ACTIVE",
      description: "Multi-modal logistics corridor surveillance and contraband transit tracking.",
      entityPrefix: "CAS",
      entityCount: 16,
      relCount: 28,
      signalCount: 95,
      alertCount: 4,
      categories: ["trafficking_routes", "transit_surveillance"],
    },
  ];

  for (const c of casesConfig) {
    // 1. Ensure investigation exists with correct title & case_code
    await pool.query(`
      INSERT INTO investigations (id, case_code, title, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, case_code = EXCLUDED.case_code, status = EXCLUDED.status
    `, [c.id, c.caseCode, c.title, c.status]);

    // 2. Clean previous data for this specific case (leaves Orion ID 1 and Large ID 6 untouched)
    await pool.query(`DELETE FROM signals WHERE investigation_id = $1`, [c.id]);
    await pool.query(`DELETE FROM relationships WHERE investigation_id = $1`, [c.id]);
    await pool.query(`DELETE FROM entities WHERE investigation_id = $1 AND name != 'DELTA-22B'`, [c.id]);
    await pool.query(`DELETE FROM alerts WHERE investigation_id = $1`, [c.id]);
    await pool.query(`DELETE FROM evidence WHERE investigation_id = $1`, [c.id]);

    // 3. Create entities for this case
    const createdEntityIds = [];
    const types = ["PERSON", "CHANNEL", "LOCATION", "WALLET", "DOMAIN", "C2_SERVER"];

    for (let i = 1; i <= c.entityCount; i++) {
      const entName = `${c.entityPrefix}-NODE-${i.toString().padStart(2, "0")}`;
      const type = types[i % types.length];
      const priority = i % 4 === 0 ? "HIGH" : i % 3 === 0 ? "MEDIUM" : "LOW";
      const activity = 40 + ((i * 7) % 55);

      const r = await pool.query(`
        INSERT INTO entities (name, type, priority, investigation_id, aliases, sources, activity, description, first_observed, last_observed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '45 days', NOW())
        RETURNING id
      `, [
        entName,
        type,
        priority,
        c.id,
        JSON.stringify([entName, `Alias-${c.entityPrefix}-${i}`]),
        JSON.stringify([`Source-${c.entityPrefix}`, "SIGINT-Stream"]),
        activity,
        `Operational subject identified in ${c.title} dataset.`
      ]);
      createdEntityIds.push(r.rows[0].id);
    }

    // 4. Create relationships
    for (let r = 0; r < c.relCount; r++) {
      const src = createdEntityIds[r % createdEntityIds.length];
      const tgt = createdEntityIds[(r + 1 + (r % 3)) % createdEntityIds.length];
      if (src !== tgt) {
        await pool.query(`
          INSERT INTO relationships (source_id, target_id, type, confidence, investigation_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          src,
          tgt,
          r % 3 === 0 ? "COMMUNICATED_WITH" : r % 2 === 0 ? "TRANSFERRED_FUNDS" : "ASSOCIATED_WITH",
          65 + (r % 30),
          c.id
        ]);
      }
    }

    // 5. Create signals
    for (let s = 1; s <= c.signalCount; s++) {
      const sigId = crypto.randomUUID();
      const entId = createdEntityIds[s % createdEntityIds.length];
      const daysAgo = Math.floor(Math.random() * 25) + 1;
      await pool.query(`
        INSERT INTO signals (id, title, snippet, source, entity_id, investigation_id, topic, type, confidence, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - ($10 || ' days')::interval)
      `, [
        sigId,
        `${c.title} - Operational Intercept #${s}`,
        `Intercepted telemetry for ${c.title} on channel ${c.entityPrefix}-Link. Operative node ID: ${entId}. Activity correlated across transit feeds.`,
        `${c.entityPrefix}-SIGINT-Feed`,
        entId,
        c.id,
        c.categories[s % c.categories.length],
        s % 2 === 0 ? "network_activity" : "telecom_signal",
        70 + (s % 25),
        daysAgo
      ]);
    }

    // 6. Create Alerts & Evidence
    for (let a = 1; a <= c.alertCount; a++) {
      const entId = createdEntityIds[a % createdEntityIds.length];
      const isHigh = a === 1;
      const evId = `EVID-${c.entityPrefix}-${a.toString().padStart(3, "0")}`;
      const finding = `Corroborated analytical finding in ${c.title} for node ${entId}`;
      const sha = hashOf(finding + c.caseCode);

      const ev = await pool.query(`
        INSERT INTO evidence (evidence_id, source, sha256_hash, confidence, status, finding, investigation_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [evId, `${c.entityPrefix}-Evidence-Feed`, sha, isHigh ? 92 : 75, "VERIFIED", finding, c.id]);

      await pool.query(`
        INSERT INTO alerts (title, severity, priority, confidence, status, investigation_id, entity_ids, evidence_ids, reason, ai_summary)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        `${c.title} Threshold Signal #${a}`,
        isHigh ? "HIGH" : "MEDIUM",
        isHigh ? 1 : 2,
        isHigh ? 90 : 74,
        "UNREVIEWED",
        c.id,
        JSON.stringify([entId]),
        JSON.stringify([ev.rows[0].id]),
        JSON.stringify({ factors: [{ label: "Multi-source correlation", points: isHigh ? 30 : 20 }] }),
        `Automated priority alert dispatched under ${c.title}.`
      ]);
    }
  }

  console.log("✅ All investigations updated with genuine, distinct, realistic numbers!");
}

if (process.argv[1]?.endsWith("populateAllCases.js")) {
  populateDistinctCases().then(() => pool.end());
}
