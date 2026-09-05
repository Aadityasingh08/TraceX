import Parser from "rss-parser";
import crypto from "crypto";
import pool from "../config/db.js";
import { analyzeSignal } from "./signalDetectionService.js";
import logger from "../utils/logger.js";

const parser = new Parser();

/**
 * Fetches every enabled feed source, stores each new item as a real signal
 * (not demo JSON), and immediately runs entity extraction on it.
 *
 * This is the "Fragment" + "Extract" stages of the pipeline running on live,
 * publicly-sourced text — news wires and public safety bulletins today, the
 * same code path a case-management export or a partner feed would use later.
 * Dedupes on (source, title) so re-running doesn't create duplicate signals.
 */
export async function runIngestionCycle() {
  const sourcesRes = await pool.query(`SELECT * FROM feed_sources WHERE enabled = true`);
  const results = [];

  for (const source of sourcesRes.rows) {
    try {
      const feed = await parser.parseURL(source.url);

      for (const item of feed.items.slice(0, 20)) {
        const existing = await pool.query(
          `SELECT id FROM signals WHERE source_id = $1 AND title = $2`,
          [source.id, item.title]
        );
        if (existing.rows.length > 0) continue;

        const signalId = crypto.randomUUID();
        const snippet = (item.contentSnippet || item.content || item.title || "").slice(0, 2000);

        await pool.query(
          `INSERT INTO signals (id, entity_id, source_id, type, title, snippet, timestamp, confidence, topic)
           VALUES ($1, NULL, $2, 'news', $3, $4, $5, NULL, $6)`,
          [signalId, source.id, item.title, snippet, item.pubDate || new Date().toISOString(), source.category]
        );

        const candidates = await analyzeSignal(signalId, snippet);
        results.push({
          signalId,
          title: item.title,
          source: source.name,
          candidateCount: candidates.length,
        });
      }

      await pool.query(`UPDATE feed_sources SET last_fetched_at = now() WHERE id = $1`, [source.id]);
    } catch (err) {
      logger.error(`Ingestion failed for source "${source.name}": ${err.message}`);
    }
  }

  return results;
}