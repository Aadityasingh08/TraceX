import pool from "./src/config/db.js";
import crypto from "crypto";

const KEYWORDS = [
  // 1. Narcotics & Contraband Products
  { term: "meth", canonical_term: "Methamphetamine", category: "narcotics_product", weight: 0.95 },
  { term: "crystal meth", canonical_term: "Methamphetamine", category: "narcotics_product", weight: 0.96 },
  { term: "MDMA", canonical_term: "MDMA / Ecstasy", category: "narcotics_product", weight: 0.92 },
  { term: "ecstasy", canonical_term: "MDMA / Ecstasy", category: "narcotics_product", weight: 0.90 },
  { term: "heroin", canonical_term: "Heroin / Diamorphine", category: "narcotics_product", weight: 0.98 },
  { term: "cocaine", canonical_term: "Cocaine Hydrochloride", category: "narcotics_product", weight: 0.95 },
  { term: "fentanyl", canonical_term: "Fentanyl Citrate", category: "narcotics_product", weight: 0.99 },
  { term: "ephedrine", canonical_term: "Ephedrine Precursor", category: "narcotics_product", weight: 0.88 },
  { term: "tramadol", canonical_term: "Tramadol Hydrochloride", category: "narcotics_product", weight: 0.85 },
  { term: "hashish", canonical_term: "Cannabis Resin / Hashish", category: "narcotics_product", weight: 0.82 },
  { term: "synthetic opioid", canonical_term: "Synthetic Opioid Class", category: "narcotics_product", weight: 0.94 },
  { term: "precursor chemicals", canonical_term: "Precursor Chemical Compound", category: "narcotics_product", weight: 0.91 },
  { term: "ketamine", canonical_term: "Ketamine Hydrochloride", category: "narcotics_product", weight: 0.89 },
  { term: "mephedrone", canonical_term: "Mephedrone / 4-MMC", category: "narcotics_product", weight: 0.93 },
  { term: "consignment", canonical_term: "Contraband Consignment Batch", category: "narcotics_product", weight: 0.86 },
  { term: "batch purity", canonical_term: "Chemical Assay Purity", category: "narcotics_product", weight: 0.87 },
  { term: "high purity", canonical_term: "Chemical Assay Purity", category: "narcotics_product", weight: 0.85 },

  // 2. Contact & Delivery Methods
  { term: "dead drop", canonical_term: "Dead Drop Location", category: "contact_method", weight: 0.94 },
  { term: "drop point", canonical_term: "Dead Drop Location", category: "contact_method", weight: 0.92 },
  { term: "middleman", canonical_term: "Broker / Intermediary Node", category: "contact_method", weight: 0.88 },
  { term: "courier", canonical_term: "Transit Courier Operative", category: "contact_method", weight: 0.87 },
  { term: "darknet market", canonical_term: "Tor Hidden Market Vendor", category: "contact_method", weight: 0.95 },
  { term: "escrow", canonical_term: "Anonymous Escrow Protocol", category: "contact_method", weight: 0.90 },
  { term: "encrypted chat", canonical_term: "End-to-End Encrypted Session", category: "contact_method", weight: 0.82 },
  { term: "burner phone", canonical_term: "Burner SIM / Hardware", category: "contact_method", weight: 0.89 },
  { term: "PGP key", canonical_term: "PGP Encrypted Payload", category: "contact_method", weight: 0.91 },
  { term: "telegram channel", canonical_term: "Encrypted Broadcast Channel", category: "contact_method", weight: 0.84 },
  { term: "dead-drop coordinates", canonical_term: "Geolocated Drop Coordinates", category: "contact_method", weight: 0.96 },

  // 3. Logistics & Transit Locations
  { term: "transit corridor", canonical_term: "Interstate Transit Corridor", category: "location", weight: 0.88 },
  { term: "handoff point", canonical_term: "Physical Handoff Point", category: "location", weight: 0.91 },
  { term: "safehouse", canonical_term: "Syndicate Safehouse Facility", category: "location", weight: 0.93 },
  { term: "coastal transit", canonical_term: "Maritime Infiltration Route", category: "location", weight: 0.90 },
  { term: "border hub", canonical_term: "Border Checkpoint Cross-Transit", category: "location", weight: 0.92 },
  { term: "warehouse checkpoint", canonical_term: "Logistics Stash Warehouse", category: "location", weight: 0.89 },
  { term: "stash location", canonical_term: "Hidden Inventory Stash", category: "location", weight: 0.93 },
  { term: "supply route", canonical_term: "Supply Chain Transit Line", category: "location", weight: 0.85 },

  // 4. Financial & Settlement Methods
  { term: "advance payment", canonical_term: "Escrow Deposit / Advance", category: "financial", weight: 0.86 },
  { term: "crypto payment", canonical_term: "Cryptocurrency Settlement", category: "financial", weight: 0.94 },
  { term: "wallet transfer", canonical_term: "On-Chain Asset Transfer", category: "financial", weight: 0.92 },
  { term: "hawala", canonical_term: "Informal Hawala Channel", category: "financial", weight: 0.95 },
  { term: "cash delivery", canonical_term: "Physical Currency Handover", category: "financial", weight: 0.87 },
  { term: "mixer deposit", canonical_term: "Crypto Tumbler / Mixer Deposit", category: "financial", weight: 0.96 },
  { term: "escrow release", canonical_term: "Multi-Sig Escrow Settlement", category: "financial", weight: 0.93 },
  { term: "USDT settlement", canonical_term: "Tether Stablecoin Settlement", category: "financial", weight: 0.94 },
  { term: "mule account", canonical_term: "Beneficiary Mule Bank Account", category: "financial", weight: 0.91 },
  { term: "cold wallet payout", canonical_term: "Hardware Vault Liquidation", category: "financial", weight: 0.95 },
];

async function populateKeywordDictionary() {
  console.log("===================================================================");
  console.log("     POPULATING KEYWORD DICTIONARY & WEAVING REALISTIC TERMS       ");
  console.log("===================================================================\n");

  // 1. Ensure table structure & unique index
  console.log("--> [1/4] Ensuring keyword_dictionary table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS keyword_dictionary (
      id SERIAL PRIMARY KEY,
      term TEXT NOT NULL,
      canonical_term TEXT,
      category TEXT NOT NULL,
      weight NUMERIC DEFAULT 0.85,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_dictionary_term ON keyword_dictionary(term);
  `);

  // 2. Insert or update terms
  console.log("--> [2/4] Inserting 40+ professional drug/contraband intelligence terms...");
  let insertedCount = 0;
  for (const kw of KEYWORDS) {
    await pool.query(
      `INSERT INTO keyword_dictionary (term, canonical_term, category, weight)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (term) DO UPDATE SET
         canonical_term = EXCLUDED.canonical_term,
         category = EXCLUDED.category,
         weight = EXCLUDED.weight`,
      [kw.term, kw.canonical_term, kw.category, kw.weight]
    );
    insertedCount++;
  }
  console.log(`    Successfully seeded ${insertedCount} keyword dictionary terms.`);

  // 3. Weave terms into ~20% of 15,000 signals to provide realistic matches
  console.log("\n--> [3/4] Weaving drug intelligence terms into dataset snippets (target ~20%)...");
  const signalsRes = await pool.query(`SELECT id, title, snippet FROM signals WHERE investigation_id != 1`);
  console.log(`    Found ${signalsRes.rows.length} large dataset signals to inspect...`);

  let updatedSnippets = 0;
  for (let i = 0; i < signalsRes.rows.length; i++) {
    // Weave terms into approximately 1 in 5 signals (20%)
    if (i % 5 === 0) {
      const sig = signalsRes.rows[i];
      const kw1 = KEYWORDS[i % KEYWORDS.length];
      const kw2 = KEYWORDS[(i * 7) % KEYWORDS.length];
      
      // Ensure snippet contains these keywords
      let newSnippet = sig.snippet;
      if (!newSnippet.toLowerCase().includes(kw1.term.toLowerCase())) {
        newSnippet += ` Intercept confirmed illicit ${kw1.term} (${kw1.canonical_term}) via ${kw2.term}.`;
      }
      
      await pool.query(`UPDATE signals SET snippet = $1 WHERE id = $2`, [newSnippet, sig.id]);
      updatedSnippets++;
    }
  }
  console.log(`    Enriched ${updatedSnippets} signals with drug intelligence keywords.`);

  // 4. Run dictionary extraction on sample of enriched signals to populate signal_candidates
  console.log("\n--> [4/4] Generating explainable keyword candidate records...");
  const sampleEnriched = await pool.query(
    `SELECT id, snippet FROM signals WHERE investigation_id != 1 ORDER BY id LIMIT 3000`
  );

  let newCandidatesCount = 0;
  for (const sig of sampleEnriched.rows) {
    const lower = sig.snippet.toLowerCase();
    for (const kw of KEYWORDS) {
      const termLower = kw.term.toLowerCase();
      const escaped = termLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`\\b${escaped}\\b`, "i").test(lower)) {
        const candId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO signal_candidates (id, signal_id, type, value, canonical_value, confidence, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_REVIEW')
           ON CONFLICT DO NOTHING`,
          [candId, sig.id, "keyword", kw.term, kw.canonical_term, kw.weight]
        );
        newCandidatesCount++;
      }
    }
  }
  console.log(`    Generated ${newCandidatesCount} explainable keyword candidates in signal_candidates table.`);

  // 5. Verify sample
  const sampleTest = await pool.query(`
    SELECT sc.value, sc.canonical_value, sc.confidence, s.title, s.snippet
    FROM signal_candidates sc
    JOIN signals s ON sc.signal_id = s.id
    WHERE sc.type = 'keyword'
    LIMIT 3
  `);
  console.log("\n    Sample Extracted Keyword Candidates:");
  console.table(sampleTest.rows.map(r => ({
    term: r.value,
    canonical: r.canonical_value,
    confidence: r.confidence,
    snippetExcerpt: r.snippet.slice(0, 75) + "..."
  })));

  console.log("\n===================================================================");
  console.log("            FIX 8 KEYWORD DICTIONARY POPULATION COMPLETE           ");
  console.log("===================================================================");
  process.exit(0);
}

populateKeywordDictionary().catch((err) => {
  console.error("Error populating keyword dictionary:", err);
  process.exit(1);
});
