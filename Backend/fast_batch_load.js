import pool from "./src/config/db.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

async function fastDbBatchLoad() {
  try {
    const jsonPath = path.resolve("..", "tracex_15000_dataset.json");
    if (!fs.existsSync(jsonPath)) {
      console.error("[!] Dataset file not found at:", jsonPath);
      return;
    }

    console.log("[*] Reading 15,000 dataset file...");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const records = JSON.parse(raw);

    console.log(`[*] Preparing ${records.length} records for high-speed PostgreSQL batch insert...`);

    const batchSize = 500;
    let inserted = 0;
    const startTime = Date.now();

    for (let i = 0; i < records.length; i += batchSize) {
      const chunk = records.slice(i, i + batchSize);
      
      const values = [];
      const params = [];
      let pIdx = 1;

      for (const item of chunk) {
        const id = crypto.randomUUID();
        const title = `Intel Record #${item.id} - ${item.name} (${item.location.split(",")[0]})`;
        const snippet = item.snippet;
        const timestamp = item.date;
        const source = `TransitFeed / ${item.source_channel}`;
        const type = "bulk_intel";

        values.push(`($${pIdx}, NULL, NULL, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, 0.85, 'surveillance')`);
        params.push(id, source, type, title, snippet, timestamp);
        pIdx += 6;
      }

      const query = `
        INSERT INTO signals (id, entity_id, source_id, source, type, title, snippet, timestamp, confidence, topic)
        VALUES ${values.join(", ")}
      `;

      await pool.query(query, params);
      inserted += chunk.length;
      process.stdout.write(`\r[+] Ingested ${inserted}/${records.length} records... (${((Date.now() - startTime)/1000).toFixed(1)}s)`);
    }

    console.log(`\n\n[SUCCESS] Loaded ${inserted} records directly into PostgreSQL database in ${((Date.now() - startTime)/1000).toFixed(2)} seconds!`);

  } catch (err) {
    console.error("\n[!] DB Batch Load Error:", err.message);
  } finally {
    process.exit();
  }
}

fastDbBatchLoad();
