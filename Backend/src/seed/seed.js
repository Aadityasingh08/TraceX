import pool from "../config/db.js";
import crypto from "crypto";
import { computeEntityScore } from "../services/scoringService.js";
import { explainAlert } from "../services/aiService.js";
import { createAuditLog } from "../models/AuditLog.js";

function hashOf(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function seed() {
  try {
    await pool.query(`
      TRUNCATE TABLE signal_candidates, trends, alerts, evidence, signals,
      relationships, entities, investigations RESTART IDENTITY CASCADE
    `);

    // ---------- INVESTIGATIONS ----------
    const investigationsData = [
      ["CASE-2026-014", "Operation Orion", "ACTIVE"],
      ["CASE-2026-021", "Operation Signal", "ACTIVE"],
      ["CASE-2026-009", "Project Velocity", "ACTIVE"],
      ["CASE-2025-088", "Case Horizon", "ARCHIVED"],
      ["CASE-2026-005", "Initiative Cascade", "ACTIVE"],
    ];
    const invIds = {};
    for (const [caseCode, title, status] of investigationsData) {
      const r = await pool.query(
        `INSERT INTO investigations (case_code, title, status) VALUES ($1,$2,$3) RETURNING id`,
        [caseCode, title, status]
      );
      invIds[title] = r.rows[0].id;
    }
    const invId = invIds["Operation Orion"]; // flagship investigation

    // ---------- ENTITIES (17 total; 7 core + 10 supporting) ----------
    const entitiesData = [
      ["ALPHA-17", "PERSON", "HIGH", ["SOURCE-07", "SOURCE-01", "Encrypted platform export", "Financial intercept"], "High-connectivity operator profile with recurring cross-source references across encrypted channels and a known marketplace."],
      ["BETA-04", "PERSON", "MEDIUM", ["SOURCE-07", "SOURCE-03"], "Recurring associate with temporal overlap and shared source context with ALPHA-17."],
      ["ORION-NODE-03", "CHANNEL", "HIGH", ["SOURCE-01", "SOURCE-07"], "Central relay channel connecting multiple otherwise-separate clusters."],
      ["MARKET-NODE-08", "MARKETPLACE", "HIGH", ["SOURCE-04", "SOURCE-06"], "Marketplace listing with elevated volume of correlated mentions."],
      ["SOURCE-07", "SOURCE", "MEDIUM", ["SOURCE-07"], "Synthetic source with strong overlap across entity and topic records."],
      ["NORTH-ROUTE-12", "LOCATION", "MEDIUM", ["SOURCE-03", "SOURCE-07"], "Recurring geographic corridor extracted from multiple records."],
      ["SILVER-THREAD", "TOPIC", "HIGH", ["SOURCE-01", "SOURCE-05"], "Fast-growing topic signal connecting several entities across the network."],
      ["DELTA-22", "PERSON", "MEDIUM", ["SOURCE-02"], "Secondary contact linked through repeated channel activity."],
      ["ECHO-11", "PERSON", "LOW", ["SOURCE-02", "SOURCE-05"], "Peripheral contact observed in shared channel traffic."],
      ["KAPPA-09", "CHANNEL", "MEDIUM", ["SOURCE-02"], "Secondary communication channel with moderate cross-source activity."],
      ["LIMA-02", "PERSON", "LOW", ["SOURCE-06"], "Low-activity contact linked to a secondary marketplace listing."],
      ["SOURCE-01", "SOURCE", "MEDIUM", ["SOURCE-01"], "Independent intelligence source with corroborating references."],
      ["SOURCE-02", "SOURCE", "LOW", ["SOURCE-02"], "Secondary source feeding the Kappa/Delta cluster."],
      ["RELAY-NODE-14", "CHANNEL", "MEDIUM", ["SOURCE-01", "SOURCE-02"], "Relay bridging the Orion and Kappa communities."],
      ["MARKET-NODE-11", "MARKETPLACE", "LOW", ["SOURCE-06"], "Secondary marketplace listing with lower confirmed volume."],
      ["EAST-EXCHANGE-04", "LOCATION", "LOW", ["SOURCE-03"], "Secondary geographic reference tied to route and marketplace activity."],
      ["TOPIC-CASCADE", "TOPIC", "LOW", ["SOURCE-02"], "Related but lower-confidence topic thread."],
    ];
    const entityIds = {};
    for (const [name, type, priority, sources, description] of entitiesData) {
      const r = await pool.query(
        `INSERT INTO entities (name, type, priority, investigation_id, aliases, sources, activity, description, first_observed, last_observed)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW() - INTERVAL '30 days', NOW())
         RETURNING id`,
        [name, type, priority, invId, JSON.stringify([name]), JSON.stringify(sources), Math.floor(Math.random() * 40) + 40, description]
      );
      entityIds[name] = r.rows[0].id;
    }

    // ---------- CROSS-INVESTIGATION DEMO ENTITY ----------
    // Lives in "Case Horizon" (archived), not Operation Orion. Its alias/type/source
    // overlap with DELTA-22 is close enough that the existing entity-resolution
    // algorithm (unchanged) surfaces it as DELTA-22's top potential match, demonstrating
    // cross-case identity resolution. DELTA-22 has no other match candidates, so this
    // stays its only (and therefore top) result.
    await pool.query(
      `INSERT INTO entities (name, type, priority, investigation_id, aliases, sources, activity, description, first_observed, last_observed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        "DELTA-22B",
        "PERSON",
        "MEDIUM",
        invIds["Case Horizon"],
        JSON.stringify(["DELTA-22B"]),
        JSON.stringify(["SOURCE-02"]),
        22,
        "Person profile observed in Case Horizon, alias pattern consistent with a contact tracked in Operation Orion.",
        "2025-11-10T10:00:00.000Z",
        "2025-12-02T16:45:00.000Z",
      ]
    );

    // ---------- DIGITAL IDENTIFIERS: WALLET + EMAIL ----------
    // Directly maps to PS-3's "cryptocurrency wallets, email addresses" requirement.
    const walletRes = await pool.query(
      `INSERT INTO entities (name, type, priority, investigation_id, aliases, sources, activity, description, first_observed, last_observed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        "bc1q4x9k2m8p3vw7z5j6h1n0s",
        "WALLET",
        "HIGH",
        invId,
        JSON.stringify(["bc1q4x9k2m8p3vw7z5j6h1n0s"]),
        JSON.stringify(["Financial intercept", "SOURCE-04"]),
        61,
        "Cryptocurrency wallet observed receiving payments tied to MARKET-NODE-08 listings.",
        "2026-08-10T00:00:00.000Z",
        "2026-09-02T00:00:00.000Z",
      ]
    );
    entityIds["WALLET-BC1Q4X9K"] = walletRes.rows[0].id;

    const emailRes = await pool.query(
      `INSERT INTO entities (name, type, priority, investigation_id, aliases, sources, activity, description, first_observed, last_observed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        "shadowdrop77@protonmail.com",
        "EMAIL",
        "MEDIUM",
        invId,
        JSON.stringify(["shadowdrop77@protonmail.com"]),
        JSON.stringify(["Encrypted platform export"]),
        38,
        "Contact email associated with ALPHA-17's marketplace registration.",
        "2026-08-06T00:00:00.000Z",
        "2026-09-01T00:00:00.000Z",
      ]
    );
    entityIds["EMAIL-SHADOWDROP77"] = emailRes.rows[0].id;

    // ---------- RELATIONSHIPS (32 total; 10 touch ALPHA-17 directly) ----------
    const relationshipsData = [
      ["ALPHA-17", "BETA-04", "COMMUNICATED_WITH", 0.91],
      ["ALPHA-17", "ORION-NODE-03", "MEMBER_OF", 0.88],
      ["ALPHA-17", "MARKET-NODE-08", "LISTED_ON", 0.87],
      ["ALPHA-17", "SOURCE-07", "MENTIONED_IN", 0.85],
      ["ALPHA-17", "NORTH-ROUTE-12", "ASSOCIATED_WITH", 0.79],
      ["ALPHA-17", "SILVER-THREAD", "RELATED_TO", 0.83],
      ["ALPHA-17", "DELTA-22", "COMMUNICATED_WITH", 0.74],
      ["ALPHA-17", "ECHO-11", "ASSOCIATED_WITH", 0.68],
      ["ALPHA-17", "RELAY-NODE-14", "CONNECTED_TO", 0.71],
      ["ALPHA-17", "SOURCE-01", "MENTIONED_IN", 0.77],
      ["BETA-04", "ORION-NODE-03", "MEMBER_OF", 0.81],
      ["BETA-04", "KAPPA-09", "CONNECTED_TO", 0.66],
      ["BETA-04", "SOURCE-07", "MENTIONED_IN", 0.71],
      ["ORION-NODE-03", "MARKET-NODE-08", "APPEARED_ON", 0.75],
      ["ORION-NODE-03", "SILVER-THREAD", "RELATED_TO", 0.72],
      ["MARKET-NODE-08", "SOURCE-07", "MENTIONED_IN", 0.7],
      ["MARKET-NODE-08", "NORTH-ROUTE-12", "ASSOCIATED_WITH", 0.69],
      ["MARKET-NODE-08", "MARKET-NODE-11", "ASSOCIATED_WITH", 0.6],
      ["SOURCE-07", "SILVER-THREAD", "RELATED_TO", 0.65],
      ["NORTH-ROUTE-12", "EAST-EXCHANGE-04", "ASSOCIATED_WITH", 0.58],
      ["SILVER-THREAD", "TOPIC-CASCADE", "RELATED_TO", 0.63],
      ["DELTA-22", "ECHO-11", "COMMUNICATED_WITH", 0.7],
      ["DELTA-22", "LIMA-02", "ASSOCIATED_WITH", 0.55],
      ["ECHO-11", "KAPPA-09", "CONNECTED_TO", 0.6],
      ["RELAY-NODE-14", "ORION-NODE-03", "CONNECTED_TO", 0.73],
      ["RELAY-NODE-14", "SOURCE-02", "MENTIONED_IN", 0.62],
      ["KAPPA-09", "SOURCE-02", "MENTIONED_IN", 0.58],
      ["LIMA-02", "MARKET-NODE-11", "LISTED_ON", 0.54],
      ["SOURCE-01", "ORION-NODE-03", "MENTIONED_IN", 0.67],
      ["SOURCE-02", "SILVER-THREAD", "RELATED_TO", 0.56],
      ["MARKET-NODE-08", "WALLET-BC1Q4X9K", "PAID_VIA", 0.81],
      ["ALPHA-17", "EMAIL-SHADOWDROP77", "REGISTERED_WITH", 0.76],
    ];
    for (const [a, b, type, conf] of relationshipsData) {
      await pool.query(
        `INSERT INTO relationships (source_id, target_id, type, confidence, investigation_id)
         VALUES ($1,$2,$3,$4,$5)`,
        [entityIds[a], entityIds[b], type, conf, invId]
      );
    }

    // ---------- SIGNALS (12) ----------
    const signalsData = [
      ["Cross-source correlation detected", "Repeated alias overlap for ALPHA-17 across two encrypted channels.", "Synthetic OSINT feed", "ALPHA-17", "network_activity", "correlation", 94],
      ["Marketplace listing observed", "New listing on MARKET-NODE-08 referencing known route NORTH-ROUTE-12.", "Encrypted platform export", "MARKET-NODE-08", "marketplace_activity", "listing", 88],
      ["Channel membership change", "ALPHA-17 joined ORION-NODE-03 following a BETA-04 referral.", "Synthetic OSINT feed", "ORION-NODE-03", "network_activity", "membership", 82],
      ["High-volume topic spike", "SILVER-THREAD mentions rose sharply across three sources in 48 hours.", "Cross-source aggregator", "SILVER-THREAD", "trend_signal", "spike", 91],
      ["Route reference repeated", "NORTH-ROUTE-12 referenced in three independent records this week.", "Synthetic OSINT feed", "NORTH-ROUTE-12", "location_signal", "recurrence", 76],
      ["Relay traffic anomaly", "RELAY-NODE-14 showing unusual bridging activity between clusters.", "Encrypted platform export", "RELAY-NODE-14", "network_activity", "anomaly", 79],
      ["Secondary contact activity", "DELTA-22 and ECHO-11 exchanged repeated messages referencing ALPHA-17.", "Synthetic OSINT feed", "DELTA-22", "communication", "exchange", 71],
      ["Financial intercept", "Payment reference intercepted, tentatively linked to a MARKET-NODE-08 listing.", "Financial intercept feed", "MARKET-NODE-08", "financial_signal", "intercept", 85],
      ["New marketplace node observed", "MARKET-NODE-11 appeared with shared source overlap to MARKET-NODE-08.", "Encrypted platform export", "MARKET-NODE-11", "marketplace_activity", "new_node", 63],
      ["Topic cascade detected", "TOPIC-CASCADE showing early correlation with SILVER-THREAD.", "Cross-source aggregator", "TOPIC-CASCADE", "trend_signal", "early_signal", 58],
      ["Cross-channel mention", "KAPPA-09 referenced alongside BETA-04 in an encrypted channel export.", "Encrypted platform export", "KAPPA-09", "network_activity", "mention", 67],
      ["Geographic corridor overlap", "EAST-EXCHANGE-04 and NORTH-ROUTE-12 co-referenced in the same record.", "Synthetic OSINT feed", "EAST-EXCHANGE-04", "location_signal", "overlap", 61],
    ];
    for (const [title, snippet, source, entityName, topic, type, confidence] of signalsData) {
      const sigId = crypto.randomUUID();
      const daysAgo = Math.floor(Math.random() * 13) + 1;
      await pool.query(
        `INSERT INTO signals (id, title, snippet, source, entity_id, investigation_id, topic, type, confidence, timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW() - ($10 || ' days')::interval)`,
        [sigId, title, snippet, source, entityIds[entityName] || null, invId, topic, type, confidence, daysAgo]
      );
    }

    // ---------- EVIDENCE (11) — hashes are real SHA-256 of the finding text ----------
    const evidenceData = [
      ["Encrypted platform export", 94, "VERIFIED", "Cross-referenced alias match confirms ALPHA-17/BETA-04 linkage"],
      ["Synthetic OSINT feed", 88, "VERIFIED", "Independent source records converge on MARKET-NODE-08 listing"],
      ["Financial intercept feed", 85, "VERIFIED", "Payment reference correlates with marketplace listing timing"],
      ["Encrypted platform export", 79, "PENDING", "Channel membership record for ORION-NODE-03"],
      ["Cross-source aggregator", 91, "VERIFIED", "SILVER-THREAD activity spike confirmed across three sources"],
      ["Synthetic OSINT feed", 76, "PENDING", "Recurring route reference for NORTH-ROUTE-12"],
      ["Encrypted platform export", 79, "VERIFIED", "Relay bridging anomaly for RELAY-NODE-14"],
      ["Synthetic OSINT feed", 71, "PENDING", "Secondary contact exchange referencing ALPHA-17"],
      ["Encrypted platform export", 63, "PENDING", "New marketplace node source overlap"],
      ["Cross-source aggregator", 58, "PENDING", "Early topic cascade correlation"],
      ["Encrypted platform export", 67, "PENDING", "Cross-channel mention linking KAPPA-09 and BETA-04"],
    ];
    const evidenceIds = [];
    for (let i = 0; i < evidenceData.length; i++) {
      const [source, confidence, status, finding] = evidenceData[i];
      const evId = `EVID-${(87 + i).toString().padStart(4, "0")}`;
      const r = await pool.query(
        `INSERT INTO evidence (evidence_id, source, sha256_hash, confidence, status, finding, investigation_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [evId, source, hashOf(finding + source), confidence, status, finding, invId]
      );
      evidenceIds.push(r.rows[0].id);
    }

    // ---------- FLAGSHIP ALERT — risk score computed live, not hardcoded ----------
    const flagshipEntityId = entityIds["ALPHA-17"];
    const flagshipEvidenceIds = evidenceIds.slice(0, 3);

    const draftAlert = await pool.query(
      `INSERT INTO alerts (title, severity, priority, confidence, status, investigation_id, entity_ids, evidence_ids, reason)
       VALUES ($1,'HIGH',1,50,'UNREVIEWED',$2,$3,$4,'{}')
       RETURNING id`,
      [
        "Cross-source correlation detected on ALPHA-17",
        invId,
        JSON.stringify([flagshipEntityId, entityIds["BETA-04"], entityIds["ORION-NODE-03"]]),
        JSON.stringify(flagshipEvidenceIds),
      ]
    );
    const flagshipAlertId = draftAlert.rows[0].id;

    // Real scoring engine call — this number is not typed in anywhere.
    const scoreData = await computeEntityScore(flagshipEntityId);

    const what = `ALPHA-17 crossed the analytical threshold (score ${scoreData.score}) following cross-source correlation with BETA-04 and ORION-NODE-03`;
    const why = scoreData.reasons.map((r) => `${r.label} (+${r.points})`).join("; ");

    let aiSummary = null;
    try {
      aiSummary = await explainAlert({ what, why });
    } catch (err) {
      console.error("AI explanation skipped during seed:", err.message);
    }

    await pool.query(
      `UPDATE alerts SET title = $1, confidence = $2, priority = $3, reason = $4, ai_summary = $5 WHERE id = $6`,
      [what, scoreData.score, scoreData.score >= 85 ? 1 : 2, JSON.stringify({ factors: scoreData.reasons }), aiSummary, flagshipAlertId]
    );

    // ---------- SECONDARY ALERTS (illustrative, narrative-consistent — not scoring-engine-derived) ----------
    const secondaryAlertsData = [
      ["Marketplace listing volume spike", "MEDIUM", 2, 78, "ACKNOWLEDGED", ["MARKET-NODE-08"]],
      ["Topic growth flagged for review", "MEDIUM", 2, 74, "UNREVIEWED", ["SILVER-THREAD"]],
      ["Relay bridging anomaly", "MEDIUM", 2, 71, "VERIFIED", ["RELAY-NODE-14"]],
      ["Secondary contact pattern", "LOW", 3, 62, "UNREVIEWED", ["DELTA-22", "ECHO-11"]],
      ["Route corridor recurrence", "LOW", 3, 58, "ACKNOWLEDGED", ["NORTH-ROUTE-12"]],
    ];
    const secondaryAlertIds = [];
    for (const [title, severity, priority, confidence, status, entNames] of secondaryAlertsData) {
      const r = await pool.query(
        `INSERT INTO alerts (title, severity, priority, confidence, status, investigation_id, entity_ids, evidence_ids, reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [
          title, severity, priority, confidence, status, invId,
          JSON.stringify(entNames.map((n) => entityIds[n])),
          JSON.stringify([]),
          JSON.stringify({ factors: [{ label: "Analytical pattern match", points: confidence >= 70 ? 20 : 10 }] }),
        ]
      );
      secondaryAlertIds.push({ id: r.rows[0].id, status });
    }

    // ---------- TRENDS ----------
    const trendsData = [
      ["Synthetic drug signal frequency", 42, 81, ["ALPHA-17", "MARKET-NODE-08"], "RISING", "red", "Marked increase in cross-source mentions over the past 7 days"],
      ["Cross-channel relay activity", 27, 74, ["RELAY-NODE-14", "ORION-NODE-03"], "RISING", "amber", "Growing bridging activity between previously separate clusters"],
    ];
    for (const [name, growth, confidence, entNames, status, color, description] of trendsData) {
      const tId = `TREND-${name.toUpperCase().replace(/\s+/g, "_")}`;
      await pool.query(
        `INSERT INTO trends (id, name, growth_percent, confidence, entities, status, color, description, investigation_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [tId, name, growth, confidence, JSON.stringify(entNames.map((n) => entityIds[n])), status, color, description, invId]
      );
    }

    // ---------- AUDIT EVENTS — real rows, written via the real model function ----------
    const adminRes = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    const adminId = adminRes.rows[0]?.id || null;
    if (adminId) {
      for (const a of secondaryAlertIds) {
        if (a.status === "ACKNOWLEDGED") {
          await createAuditLog({ userId: adminId, action: "ACKNOWLEDGE", resource: "alerts", resourceId: String(a.id), ipAddress: "seed-script" });
        } else if (a.status === "VERIFIED") {
          await createAuditLog({ userId: adminId, action: "VERIFY", resource: "alerts", resourceId: String(a.id), ipAddress: "seed-script" });
        }
      }
    }

    console.log("✅ Seed complete — Operation Orion demo network loaded");
    console.log(`   Entities: ${entitiesData.length + 3} (includes 1 cross-investigation demo entity, 1 wallet, 1 email)`);
    console.log(`   Relationships: ${relationshipsData.length}`);
    console.log(`   Signals: ${signalsData.length}`);
    console.log(`   Alerts: ${1 + secondaryAlertsData.length}`);
    console.log(`   Evidence: ${evidenceData.length}`);
    console.log(`   Investigations: ${investigationsData.length}`);
    console.log(`   Flagship investigation ID: ${invId}`);
    console.log(`   Flagship entity (ALPHA-17) ID: ${flagshipEntityId}`);
    console.log(`   Flagship alert ID: ${flagshipAlertId}`);
    console.log(`   REAL computed risk score: ${scoreData.score}`);
    console.log(`   Score breakdown:`, JSON.stringify(scoreData.reasons));
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    process.exit();
  }
}

seed();