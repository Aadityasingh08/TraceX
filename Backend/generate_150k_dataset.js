import pool from "./src/config/db.js";
import crypto from "crypto";

async function generateAndLoad150kDataset() {
  console.log("===================================================================");
  console.log("       TRACE-X HIGH-SPEED 150,000 RECORD GENERATOR & INGESTOR       ");
  console.log("===================================================================\n");

  const startTime = Date.now();

  // 1. Ensure target large-scale investigation exists
  console.log("--> [1/4] Ensuring Investigation Target for Scale...");
  let invRes = await pool.query(`SELECT id FROM investigations WHERE case_code = 'CASE-2026-LARGE'`);
  let targetInvId = 6;
  if (invRes.rows.length === 0) {
    const newInv = await pool.query(`
      INSERT INTO investigations (case_code, title, status)
      VALUES ('CASE-2026-LARGE', 'Bulk Intelligence Simulation (Large Scale 150k)', 'ACTIVE')
      RETURNING id
    `);
    targetInvId = newInv.rows[0].id;
  } else {
    targetInvId = invRes.rows[0].id;
  }

  // 2. Vocabulary & Data Pools for Realistic Cyber Intelligence
  const firstNames = [
    "Aarav", "Priya", "Rahul", "Ananya", "Rohan", "Siddharth", "Neha", "Vikram",
    "Tariq", "Karan", "Deepak", "Farhan", "Aditya", "Meera", "Zoya", "Kavita",
    "Sanjay", "Alok", "Dev", "Ishan", "Manish", "Nikhil", "Pooja", "Rajesh",
    "Sameer", "Tanvi", "Varun", "Yash", "Kabir", "Arjun", "Zara", "Ayesha"
  ];
  const lastNames = [
    "Sharma", "Verma", "Patel", "Khan", "Singh", "Gupta", "Joshi", "Bhatia",
    "Malhotra", "Mehta", "Reddy", "Nair", "Das", "Rao", "Deshmukh", "Choudhury",
    "Kapoor", "Saxena", "Chawla", "Iyer", "Banerjee", "Menon", "Dubey", "Agarwal"
  ];

  const locationsPool = [
    "Mumbai, Maharashtra", "Delhi, NCR", "Bengaluru, Karnataka", "Hyderabad, Telangana",
    "Chennai, Tamil Nadu", "Kolkata, West Bengal", "Pune, Maharashtra", "Ahmedabad, Gujarat",
    "Jaipur, Rajasthan", "Lucknow, Uttar Pradesh", "Chandigarh, Punjab", "Kochi, Kerala",
    "Goa, Panaji", "Frankfurt, Germany", "Reykjavik, Iceland", "Zurich, Switzerland",
    "London, UK", "Dubai, UAE", "Bangkok, Thailand", "Singapore, SG", "Istanbul, Turkey"
  ];

  const sourcesPool = [
    "Telegram / @dark_escrow_alpha", "Telegram / @hydra_direct_bot", "Darknet Forum / SilkNet_v3",
    "Burner SMS Gateway / +91-Transit", "ProtonMail Intercept", "Blockchain Ledger / Mempool",
    "Hawala Settlement Log / Courier-9", "Encrypted Signal Node / Cluster-4", "TOR Gateway / Onion-Mirror",
    "Transit Cargo Surveillance / Nhava Sheva", "FinCEN Suspicious Activity Feed / CTR-88"
  ];

  const topicsPool = [
    "narcotics_trafficking", "crypto_laundering", "hawala_settlement", "dead_drop_logistics",
    "mule_banking", "encrypted_comms", "synthetic_opioids", "border_smuggling", "counterfeit_courier"
  ];

  const typesPool = ["intercept", "transaction", "logistics_record", "surveillance", "forum_dump", "ledger_entry"];

  const snippetsTemplates = [
    (n, h, p, w, l, code) => `Operative: ${n} (${h}) intercepted on ${l}. Phone: ${p}. Wallet transfer: ${w}. Hash: ${code}. Batch settlement confirmed via encrypted relay.`,
    (n, h, p, w, l, code) => `Transit log flagged at ${l}. Contact: ${n}, Handle: ${h}, Burner: ${p}. Escrow address: ${w}. Package drop ref #${code}.`,
    (n, h, p, w, l, code) => `Darknet order #${code} escrow locked. Buyer: ${h} (${n}, ${l}). Payout routed through ${w}. SMS confirmation sent to ${p}.`,
    (n, h, p, w, l, code) => `Mule account settlement identified in ${l}. Primary handler ${n} reached via ${p}. Cold wallet destination: ${w}. Ledger code: ${code}.`,
    (n, h, p, w, l, code) => `Encrypted channel intercept. Operative: ${n}, Signal: ${h}. Dispatch point: ${l}. Wallet: ${w}. Direct carrier phone: ${p}. Log reference: ${code}.`
  ];

  // 3. Check existing count
  const countBefore = await pool.query(`SELECT COUNT(*) FROM signals`);
  const currentCount = parseInt(countBefore.rows[0].count, 10);
  console.log(`--> Current signals in DB: ${currentCount}`);

  const TARGET_TOTAL = 150000;
  const TO_INSERT = Math.max(0, TARGET_TOTAL - currentCount);

  if (TO_INSERT === 0) {
    console.log(`[✓] Already have ${currentCount} records (>= 150,000).`);
  } else {
    console.log(`--> [2/4] Generating and ingesting ${TO_INSERT} records in high-speed batches...`);

    const BATCH_SIZE = 1000;
    let totalInserted = 0;
    const baseTimestamp = new Date("2026-03-01T00:00:00Z").getTime();

    for (let batchStart = 0; batchStart < TO_INSERT; batchStart += BATCH_SIZE) {
      const currentBatchSize = Math.min(BATCH_SIZE, TO_INSERT - batchStart);
      const values = [];
      const params = [];
      let pIdx = 1;

      for (let j = 0; j < currentBatchSize; j++) {
        const globalIndex = currentCount + batchStart + j + 1;
        const id = crypto.randomUUID();
        const fn = firstNames[globalIndex % firstNames.length];
        const ln = lastNames[(globalIndex + 5) % lastNames.length];
        const personName = `${fn} ${ln}`;
        const handle = `@${fn.toLowerCase()}_${ln.toLowerCase()}_${(globalIndex % 990) + 10}`;
        const phone = `+91${9000000000 + ((globalIndex * 43) % 999999999)}`;
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${(globalIndex % 999) + 1}@protonmail.com`;
        const location = locationsPool[globalIndex % locationsPool.length];
        const hex = crypto.createHash("sha256").update(`wallet_${globalIndex}`).digest("hex");
        const wallet = `0x${hex.slice(0, 40)}`;
        const topic = topicsPool[globalIndex % topicsPool.length];
        const type = typesPool[globalIndex % typesPool.length];
        const source = sourcesPool[globalIndex % sourcesPool.length];
        const confidence = (0.75 + ((globalIndex % 25) / 100)).toFixed(2);
        const code = `TX-${globalIndex.toString().padStart(6, "0")}`;
        const templateFn = snippetsTemplates[globalIndex % snippetsTemplates.length];
        const snippet = templateFn(personName, handle, phone, wallet, location, code);
        const title = `Intel Record #${globalIndex} - ${personName} (${location.split(",")[0]})`;
        
        // Random date within last 90 days
        const recordTime = new Date(baseTimestamp - (globalIndex % 7776000000)).toISOString();

        values.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, $${pIdx+8}, $${pIdx+9}, $${pIdx+10}, $${pIdx+11}, $${pIdx+12}, $${pIdx+13}, $${pIdx+14}, 'VERIFIED')`);
        params.push(
          id,
          title,
          snippet,
          source,
          targetInvId,
          topic,
          type,
          confidence,
          recordTime,
          personName,
          location,
          phone,
          email,
          handle,
          wallet
        );
        pIdx += 15;
      }

      const insertSql = `
        INSERT INTO signals (
          id, title, snippet, source, investigation_id, topic, type, confidence,
          timestamp, person_name, location, phone, email, telegram_handle, wallet_address,
          verification_status
        ) VALUES ${values.join(", ")}
      `;

      await pool.query(insertSql, params);
      totalInserted += currentBatchSize;

      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (totalInserted / (Date.now() - startTime) * 1000).toFixed(0);
      process.stdout.write(`\r[+] Ingested ${totalInserted}/${TO_INSERT} records (${((totalInserted/TO_INSERT)*100).toFixed(1)}%) | Rate: ${rate} rec/s | Elapsed: ${elapsedSec}s`);
    }
  }

  // 4. Optimize Indexes & Statistics
  console.log("\n\n--> [3/4] Ensuring all structured indexes & analyzing database statistics...");
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_signals_wallet ON signals(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_signals_inv_time ON signals(investigation_id, timestamp DESC);
    ANALYZE signals;
    ANALYZE entities;
    ANALYZE relationships;
  `);

  // 5. Final Count Verification
  console.log("--> [4/4] Verifying final dataset counts...");
  const finalCount = await pool.query(`SELECT COUNT(*) FROM signals`);
  console.log("\n===================================================================");
  console.log(`[SUCCESS] Database Total Signals: ${finalCount.rows[0].count} records!`);
  console.log(`Total Execution Time: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`);
  console.log("===================================================================\n");

  process.exit();
}

generateAndLoad150kDataset().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
