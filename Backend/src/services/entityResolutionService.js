import pool from "../config/db.js";

// Lightweight Levenshtein distance, no external dependency needed.
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function similarity(a, b) {
  if (!a || !b) return 0;
  const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
}

/**
 * Finds other entities that are plausibly the same real-world actor as `entityId`,
 * based on alias similarity, shared sources, and entity type. Every match returns
 * the exact reasons behind its score — this is what feeds the explainability panel,
 * so an analyst never sees a bare "87% match" with no way to check it.
 *
 * Deliberately searches across ALL entities, not just the current investigation —
 * this is what lets TRACE-X surface the same alias appearing in a different case
 * entirely, which is a real cross-unit intelligence gap in most investigations.
 */
export async function findPotentialMatches(entityId) {
  const targetRes = await pool.query(`SELECT * FROM entities WHERE id = $1`, [entityId]);
  const target = targetRes.rows[0];
  if (!target) return [];

  const othersRes = await pool.query(
    `SELECT e.*, i.title AS investigation_title
     FROM entities e
     LEFT JOIN investigations i ON i.id = e.investigation_id
     WHERE e.id != $1`,
    [entityId]
  );

  const matches = [];
  for (const candidate of othersRes.rows) {
    const reasons = [];
    let score = 0;

    const targetAliases = target.aliases || [];
    const candidateAliases = candidate.aliases || [];
    let bestAliasSim = 0;
    let bestAliasPair = null;
    for (const a of targetAliases) {
      for (const b of candidateAliases) {
        const sim = similarity(a, b);
        if (sim > bestAliasSim) { bestAliasSim = sim; bestAliasPair = [a, b]; }
      }
    }
    if (bestAliasSim >= 0.7) {
      const points = Math.round(bestAliasSim * 50);
      score += points;
      reasons.push({
        label: `Alias similarity: "${bestAliasPair[0]}" ~ "${bestAliasPair[1]}" (${Math.round(bestAliasSim * 100)}%)`,
        points,
      });
    }

    const sharedSources = (target.sources || []).filter((s) => (candidate.sources || []).includes(s));
    if (sharedSources.length > 0) {
      const points = Math.min(25, sharedSources.length * 10);
      score += points;
      reasons.push({ label: `Shared sources: ${sharedSources.join(", ")}`, points });
    }

    if (target.type && target.type === candidate.type) {
      score += 5;
      reasons.push({ label: `Same entity type (${target.type})`, points: 5 });
    }

    if (score >= 30) {
      matches.push({
        entityId: candidate.id,
        aliases: candidate.aliases,
        confidence: Math.min(100, score),
        reasons,
        investigationId: candidate.investigation_id,
        investigationTitle: candidate.investigation_title,
        isCrossInvestigation: candidate.investigation_id !== target.investigation_id,
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}