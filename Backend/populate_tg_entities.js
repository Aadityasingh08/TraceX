import pool from "./src/config/db.js";

async function populateTelegramEntities() {
  try {
    console.log("[*] Populating Telegram Intelligence into Entities & Threat Map...");

    const invRes = await pool.query(`SELECT id FROM investigations WHERE title = 'Operation Orion' LIMIT 1`);
    const invId = invRes.rows[0]?.id || 1;

    const telegramEntities = [
      {
        name: "TG-GHOST-COURIER-99",
        type: "PERSON",
        priority: "HIGH",
        aliases: ["@ghost_courier_99", "+919876501234", "Krypton Dispatch"],
        sources: ["Telegram / GhostNet & Syndicate Alpha"],
        description: "Primary logistics coordinator for Northern transit synthetic narcotics consignments identified via Telegram dump.",
        activity: 88,
        community: "Syndicate-Alpha"
      },
      {
        name: "TG-ALPHA-NEXUS",
        type: "PERSON",
        priority: "HIGH",
        aliases: ["@alpha_nexus_operator", "+919122334455", "Orion Dispatcher"],
        sources: ["Telegram / GhostNet & Syndicate Alpha"],
        description: "Emergency route coordinator and bypass dispatcher for contraband parcels.",
        activity: 76,
        community: "Syndicate-Alpha"
      },
      {
        name: "TG-HAWALA-ESCROW",
        type: "SOURCE",
        priority: "HIGH",
        aliases: ["0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", "₹850k Escrow", "@tracex_relay_01"],
        sources: ["Telegram / GhostNet & Syndicate Alpha"],
        description: "High-value laundering wallet used to settle narcotics transactions across Telegram channels.",
        activity: 92,
        community: "Financial-Mules"
      },
      {
        name: "TG-SHADOW-MULE",
        type: "PERSON",
        priority: "MEDIUM",
        aliases: ["@shadow_mule_in", "Sector 12 Mule Handler"],
        sources: ["Telegram / GhostNet & Syndicate Alpha"],
        description: "Local cash pickup operative linked to coordinates 28.6139° N, 77.2090° E.",
        activity: 65,
        community: "Ground-Network"
      }
    ];

    const entityIdMap = {};

    for (const e of telegramEntities) {
      const existing = await pool.query(`SELECT id FROM entities WHERE name = $1`, [e.name]);
      if (existing.rows.length > 0) {
        entityIdMap[e.name] = existing.rows[0].id;
        console.log(`[i] Entity exists: ${e.name} (ID: ${existing.rows[0].id})`);
      } else {
        const r = await pool.query(
          `INSERT INTO entities (name, type, priority, investigation_id, aliases, sources, activity, description, community, first_observed, last_observed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '3 days', NOW())
           RETURNING id`,
          [
            e.name, e.type, e.priority, invId,
            JSON.stringify(e.aliases), JSON.stringify(e.sources),
            e.activity, e.description, e.community
          ]
        );
        entityIdMap[e.name] = r.rows[0].id;
        console.log(`[+] Entity created: ${e.name} (ID: ${r.rows[0].id})`);
      }
    }

    // Get an existing anchor entity like ALPHA-17 or ORION-NODE-03 to connect to
    const alpha17Res = await pool.query(`SELECT id FROM entities WHERE name = 'ALPHA-17' LIMIT 1`);
    const alpha17Id = alpha17Res.rows[0]?.id;

    // Link relationships
    const relationships = [
      ["TG-GHOST-COURIER-99", "TG-ALPHA-NEXUS", "COMMUNICATES_WITH", 0.90],
      ["TG-GHOST-COURIER-99", "TG-HAWALA-ESCROW", "FINANCIAL_TRANSACTION", 0.95],
      ["TG-SHADOW-MULE", "TG-GHOST-COURIER-99", "CASH_PICKUP", 0.80]
    ];

    if (alpha17Id && entityIdMap["TG-ALPHA-NEXUS"]) {
      relationships.push(["TG-ALPHA-NEXUS", "ALPHA-17", "COORDINATED_ROUTE", 0.85]);
      entityIdMap["ALPHA-17"] = alpha17Id;
    }

    for (const [srcName, tgtName, relType, conf] of relationships) {
      const srcId = entityIdMap[srcName];
      const tgtId = entityIdMap[tgtName];
      if (srcId && tgtId) {
        const relCheck = await pool.query(
          `SELECT id FROM relationships WHERE source_id = $1 AND target_id = $2`,
          [srcId, tgtId]
        );
        if (relCheck.rows.length === 0) {
          await pool.query(
            `INSERT INTO relationships (source_id, target_id, type, confidence, investigation_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [srcId, tgtId, relType, conf, invId]
          );
          console.log(`[+] Relationship created: ${srcName} -> ${tgtName}`);
        }
      }
    }

    console.log("[SUCCESS] Telegram entities & graph links populated!");

  } catch (err) {
    console.error("[!] Error:", err.message);
  } finally {
    process.exit();
  }
}

populateTelegramEntities();
