import dotenv from "dotenv";
dotenv.config();

import { explainAlert, summarizeInvestigation, summarizeReport } from "../services/aiService.js";

async function run() {
  console.log("--- Testing explainAlert ---");
  try {
    const result = await explainAlert({
      what: "Entity 9 crossed the analytical threshold (score 91)",
      why: "Network centrality (2 relationships) (+6); Cross-source correlation (2 sources) (+5)",
    });
    console.log("RESULT:", result);
  } catch (err) {
    console.error("FAILED:", err.message);
  }

  console.log("\n--- Testing summarizeReport ---");
  try {
    const result = await summarizeReport({
      investigation: "OPERATION-ORION",
      stats: { entities: 9, records: 5, relationships: 4, evidence: 3, alerts: 1 },
    });
    console.log("RESULT:", result);
  } catch (err) {
    console.error("FAILED:", err.message);
  }

  console.log("\n--- Testing summarizeInvestigation ---");
  try {
    const result = await summarizeInvestigation({
      title: "Operation Orion",
      entities: 9,
      relationships: 4,
      alerts: 1,
    });
    console.log("RESULT:", result);
  } catch (err) {
    console.error("FAILED:", err.message);
  }

  process.exit();
}

run();