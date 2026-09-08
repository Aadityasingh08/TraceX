import pool from "../config/db.js";

/**
 * Community Detection using Label Propagation Algorithm (LPA) over the PostgreSQL relationship graph.
 * Assigns each entity to a genuinely computed cluster/community based on graph connectivity.
 */
export async function computeGraphCommunities(investigationId = null) {
  let entityQuery = `SELECT id, name, type FROM entities`;
  let relQuery = `SELECT source_id, target_id, confidence FROM relationships`;
  const params = [];

  if (investigationId) {
    entityQuery += ` WHERE investigation_id = $1`;
    relQuery += ` WHERE investigation_id = $1`;
    params.push(Number(investigationId));
  }

  const entitiesRes = await pool.query(entityQuery, params);
  const relsRes = await pool.query(relQuery, params);

  const entities = entitiesRes.rows;
  const rels = relsRes.rows;

  if (entities.length === 0) return { communities: 0, updated: 0 };

  // Build Adjacency List
  const adj = new Map();
  const labels = new Map();

  entities.forEach((e, idx) => {
    adj.set(e.id, []);
    labels.set(e.id, e.id); // Initial label = own id
  });

  rels.forEach(r => {
    if (adj.has(r.source_id) && adj.has(r.target_id)) {
      adj.get(r.source_id).push({ neighbor: r.target_id, weight: Number(r.confidence) || 1 });
      adj.get(r.target_id).push({ neighbor: r.source_id, weight: Number(r.confidence) || 1 });
    }
  });

  // Label Propagation Iterations (max 10 iterations)
  const nodeIds = entities.map(e => e.id);
  let changed = true;
  let iter = 0;

  while (changed && iter < 10) {
    changed = false;
    iter++;

    // Shuffle node processing order
    const shuffled = [...nodeIds].sort(() => Math.random() - 0.5);

    for (const nodeId of shuffled) {
      const neighbors = adj.get(nodeId);
      if (!neighbors || neighbors.length === 0) continue;

      // Count weighted label frequencies among neighbors
      const labelWeights = new Map();
      for (const { neighbor, weight } of neighbors) {
        const neighborLabel = labels.get(neighbor);
        labelWeights.set(neighborLabel, (labelWeights.get(neighborLabel) || 0) + weight);
      }

      // Find label with highest weight
      let maxWeight = -1;
      let bestLabel = labels.get(nodeId);

      for (const [label, weight] of labelWeights.entries()) {
        if (weight > maxWeight) {
          maxWeight = weight;
          bestLabel = label;
        }
      }

      if (bestLabel !== labels.get(nodeId)) {
        labels.set(nodeId, bestLabel);
        changed = true;
      }
    }
  }

  // Map raw labels to distinct cluster names
  const clusterMap = new Map();
  let clusterIndex = 1;

  for (const nodeId of nodeIds) {
    const rawLabel = labels.get(nodeId);
    if (!clusterMap.has(rawLabel)) {
      clusterMap.set(rawLabel, `Cluster ${clusterIndex.toString().padStart(2, "0")}`);
      clusterIndex++;
    }
  }

  // Batch update entities with computed community labels
  let updatedCount = 0;
  for (const nodeId of nodeIds) {
    const communityName = clusterMap.get(labels.get(nodeId));
    await pool.query(
      `UPDATE entities SET community = $1 WHERE id = $2`,
      [communityName, nodeId]
    );
    updatedCount++;
  }

  return {
    communities: clusterMap.size,
    totalNodes: entities.length,
    updated: updatedCount,
    iterations: iter
  };
}
