import pool from "./src/config/db.js";

async function verifyPerCaseStats() {
  console.log("===================================================================");
  console.log("            TRACE-X PER-CASE DISTINCT STATISTICS AUDIT            ");
  console.log("===================================================================");

  const inv = await pool.query(`
    SELECT i.id, i.case_code AS "caseCode", i.title AS name, i.status,
           (SELECT COUNT(*)::int FROM signals s WHERE s.investigation_id = i.id) AS "recordsCount",
           (SELECT COUNT(*)::int FROM entities e WHERE e.investigation_id = i.id) AS "entitiesCount",
           (SELECT COUNT(*)::int FROM relationships r WHERE r.investigation_id = i.id) AS "relationshipsCount",
           (SELECT COUNT(*)::int FROM alerts a WHERE a.investigation_id = i.id) AS "alertsCount"
    FROM investigations i
    ORDER BY i.id ASC
  `);

  console.table(inv.rows);

  const totalInv = await pool.query(`SELECT COUNT(*)::int AS c FROM investigations`);
  const totalEnt = await pool.query(`SELECT COUNT(*)::int AS c FROM entities`);
  const totalRel = await pool.query(`SELECT COUNT(*)::int AS c FROM relationships`);
  const totalSig = await pool.query(`SELECT COUNT(*)::int AS c FROM signals`);
  const totalCand = await pool.query(`SELECT COUNT(*)::int AS c FROM signal_candidates`);
  const totalAlt = await pool.query(`SELECT COUNT(*)::int AS c FROM alerts`);
  const highAlt = await pool.query(`SELECT COUNT(*)::int AS c FROM alerts WHERE severity = 'HIGH'`);
  const totalEv = await pool.query(`SELECT COUNT(*)::int AS c FROM evidence`);
  const totalTrn = await pool.query(`SELECT COUNT(*)::int AS c FROM trends`);

  console.log("\n===================================================================");
  console.log("             TRACE-X DASHBOARD METRICS (LIVE DATABASE)             ");
  console.log("===================================================================");
  console.log(`  Active Investigations      : ${totalInv.rows[0].c}`);
  console.log(`  Intelligence Records       : ${totalSig.rows[0].c.toLocaleString()}`);
  console.log(`  Identified Entities        : ${totalEnt.rows[0].c.toLocaleString()}`);
  console.log(`  Discovered Relationships   : ${totalRel.rows[0].c.toLocaleString()}`);
  console.log(`  Signal Candidates Extracted: ${totalCand.rows[0].c.toLocaleString()}`);
  console.log(`  Network Alerts (Total)     : ${totalAlt.rows[0].c}`);
  console.log(`  High-Priority Signals      : ${highAlt.rows[0].c}`);
  console.log(`  Emerging Trends on Radar   : ${totalTrn.rows[0].c}`);
  console.log(`  Evidence Vault Records     : ${totalEv.rows[0].c}`);
  console.log("===================================================================\n");

  await pool.end();
}

verifyPerCaseStats();
