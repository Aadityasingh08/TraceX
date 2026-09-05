const namedEntities = [
  { id: "ALPHA-17", type: "Entity", aliases: ["A17", "north-star"], sources: ["SOURCE-07", "SOURCE-02", "SOURCE-05"], priority: 82, firstObserved: "2026-05-18", lastObserved: "2026-08-13", activity: 78, community: "Cluster 03", description: "High-connectivity operator profile with recurring cross-source references." },
  { id: "BETA-04", type: "Entity", aliases: ["B4", "blue-orbit"], sources: ["SOURCE-07", "SOURCE-03"], priority: 74, firstObserved: "2026-06-02", lastObserved: "2026-08-11", activity: 66, community: "Cluster 03", description: "Potentially related profile with temporal overlap and shared source context." },
  { id: "ORION-NODE-03", type: "Entity", aliases: ["orion-03", "relay-3"], sources: ["SOURCE-01", "SOURCE-07", "SOURCE-08"], priority: 91, firstObserved: "2026-04-21", lastObserved: "2026-08-13", activity: 94, community: "Cluster 01", description: "Central relay node connecting multiple otherwise separate intelligence clusters." },
  { id: "MARKET-NODE-08", type: "Marketplace", aliases: ["mn8", "market-08"], sources: ["SOURCE-04", "SOURCE-06"], priority: 69, firstObserved: "2026-05-07", lastObserved: "2026-08-09", activity: 71, community: "Cluster 02", description: "Synthetic marketplace reference with an elevated volume of correlated mentions." },
  { id: "SOURCE-07", type: "Source", aliases: ["channel-seven"], sources: ["SOURCE-07"], priority: 58, firstObserved: "2026-04-02", lastObserved: "2026-08-13", activity: 82, community: "Cluster 03", description: "Synthetic source with strong overlap across entity and topic records." },
  { id: "NORTH-ROUTE-12", type: "Location", aliases: ["corridor-12"], sources: ["SOURCE-03", "SOURCE-07"], priority: 63, firstObserved: "2026-06-14", lastObserved: "2026-08-12", activity: 61, community: "Cluster 03", description: "Recurring geographic label extracted from multiple records." },
  { id: "SILVER-THREAD", type: "Topic", aliases: ["thread-s", "handoff"], sources: ["SOURCE-01", "SOURCE-05", "SOURCE-08"], priority: 77, firstObserved: "2026-05-30", lastObserved: "2026-08-10", activity: 73, community: "Cluster 01", description: "Synthetic topic signal with rapid growth and several connected entities." }
];

const extraEntitySeeds = [
  ["DELTA-22", "Entity"], ["ECHO-11", "Entity"], ["KAPPA-09", "Entity"], ["LIMA-02", "Entity"],
  ["SOURCE-01", "Source"], ["SOURCE-02", "Source"], ["SOURCE-03", "Source"], ["SOURCE-04", "Source"],
  ["SOURCE-05", "Source"], ["SOURCE-06", "Source"], ["SOURCE-08", "Source"], ["TOPIC-CASCADE", "Topic"],
  ["TOPIC-VELOCITY", "Topic"], ["EAST-EXCHANGE-04", "Location"], ["RELAY-NODE-14", "Entity"], ["MARKET-NODE-11", "Marketplace"], ["ORION-HUB-01", "Investigation"], ["FALLBACK-THREAD-6", "Topic"]
];

export const entities = [...namedEntities, ...extraEntitySeeds.map(([id, type], index) => ({
  id, type, aliases: [`${id.toLowerCase().replaceAll("-", "")}`, `synthetic-${index + 1}`],
  sources: [`SOURCE-${String((index % 8) + 1).padStart(2, "0")}`], priority: 42 + ((index * 7) % 38),
  firstObserved: `2026-0${(index % 4) + 4}-${String((index % 20) + 1).padStart(2, "0")}`,
  lastObserved: `2026-08-${String((index % 13) + 1).padStart(2, "0")}`,
  activity: 34 + ((index * 11) % 61), community: `Cluster ${String((index % 4) + 1).padStart(2, "0")}`,
  description: "Synthetic entity extracted from the Operation Orion intelligence corpus."
}))];

const sourceIds = ["SOURCE-01", "SOURCE-02", "SOURCE-03", "SOURCE-04", "SOURCE-05", "SOURCE-06", "SOURCE-07", "SOURCE-08"];
const activityLabels = ["mention", "alias reference", "relationship update", "topic extraction", "marketplace reference", "location signal"];

export const records = Array.from({ length: 150 }, (_, index) => {
  const entity = entities[index % entities.length];
  const day = (index * 3) % 90;
  const date = new Date(Date.UTC(2026, 7, 13));
  date.setUTCDate(date.getUTCDate() - day);
  return {
    id: `IR-${String(index + 1).padStart(4, "0")}`,
    entityId: entity.id,
    sourceId: sourceIds[index % sourceIds.length],
    type: activityLabels[index % activityLabels.length],
    title: `${entity.id} ${activityLabels[index % activityLabels.length]}`,
    snippet: `Synthetic intelligence record ${index + 1} connects ${entity.id} with an Operation Orion signal cluster.`,
    timestamp: date.toISOString().slice(0, 16).replace("T", " "),
    confidence: 62 + ((index * 13) % 34),
    topic: ["Synthetic Category A", "Synthetic Category B", "Relay behavior", "Identity overlap"][index % 4]
  };
});

const relationshipPairs = [
  ["ALPHA-17", "BETA-04", "ASSOCIATED_WITH"], ["ALPHA-17", "ORION-NODE-03", "CONNECTED_TO"], ["ALPHA-17", "SOURCE-07", "MENTIONED_IN"],
  ["BETA-04", "SOURCE-07", "MENTIONED_IN"], ["ORION-NODE-03", "MARKET-NODE-08", "APPEARED_ON"], ["ORION-NODE-03", "SILVER-THREAD", "RELATED_TO"],
  ["MARKET-NODE-08", "SOURCE-04", "MENTIONED_IN"], ["SILVER-THREAD", "TOPIC-CASCADE", "RELATED_TO"], ["NORTH-ROUTE-12", "ALPHA-17", "ASSOCIATED_WITH"],
  ["RELAY-NODE-14", "ORION-NODE-03", "CONNECTED_TO"], ["MARKET-NODE-11", "SOURCE-06", "MENTIONED_IN"], ["ECHO-11", "TOPIC-VELOCITY", "RELATED_TO"]
];

export const relationships = Array.from({ length: 60 }, (_, index) => {
  const pair = relationshipPairs[index % relationshipPairs.length];
  return {
    id: `REL-${String(index + 1).padStart(3, "0")}`,
    source: pair[0], target: pair[1], type: pair[2],
    timestamp: `2026-08-${String((index % 13) + 1).padStart(2, "0")} ${String(8 + (index % 10)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}`,
    confidence: 68 + ((index * 9) % 29), sourceId: sourceIds[index % sourceIds.length]
  };
});

export const alerts = [
  { id: "ALERT-009", type: "Cross-source correlation", severity: "HIGH", priority: 92, confidence: 88, status: "UNREVIEWED", entityIds: ["ALPHA-17", "BETA-04"], evidenceIds: ["EVD-0087", "EVD-0088"], timestamp: "13 Aug 2026 · 09:42", what: "Two independent source streams converge on the same identifier pattern.", why: "Cross-source agreement increases the value of the signal for analyst review." },
  { id: "ALERT-004", type: "Activity spike", severity: "HIGH", priority: 87, confidence: 84, status: "ASSIGNED", entityIds: ["ORION-NODE-03"], evidenceIds: ["EVD-0084"], timestamp: "12 Aug 2026 · 18:15", what: "Activity around ORION-NODE-03 rose 138% over the previous baseline.", why: "The change may indicate a shift in network behavior or collection conditions." },
  { id: "ALERT-007", type: "Potential entity match", severity: "MEDIUM", priority: 82, confidence: 91, status: "UNREVIEWED", entityIds: ["ALPHA-17", "BETA-04"], evidenceIds: ["EVD-0087"], timestamp: "12 Aug 2026 · 15:08", what: "ALPHA-17 and BETA-04 share aliases, timing, and source overlap.", why: "The profiles may represent the same underlying entity, but require verification." },
  { id: "ALERT-002", type: "Network cluster", severity: "HIGH", priority: 80, confidence: 79, status: "ACKNOWLEDGED", entityIds: ["ORION-NODE-03", "MARKET-NODE-08"], evidenceIds: ["EVD-0085"], timestamp: "11 Aug 2026 · 11:22", what: "A compact cluster connects three sources and two topic signals.", why: "A connected cluster can reveal where otherwise fragmented signals intersect." },
  { id: "ALERT-010", type: "Emerging trend", severity: "MEDIUM", priority: 76, confidence: 84, status: "UNREVIEWED", entityIds: ["SILVER-THREAD", "TOPIC-CASCADE"], evidenceIds: ["EVD-0086"], timestamp: "10 Aug 2026 · 21:31", what: "Synthetic Category A activity is expanding across four source groups.", why: "The trend is a lead for collection planning, not a conclusion about conduct." },
  { id: "ALERT-001", type: "Cross-source correlation", severity: "MEDIUM", priority: 71, confidence: 76, status: "ASSIGNED", entityIds: ["NORTH-ROUTE-12"], evidenceIds: ["EVD-0082"], timestamp: "09 Aug 2026 · 08:40", what: "A recurring location label appears in three source contexts.", why: "Repeated context can help analysts decide where to focus manual review." },
  { id: "ALERT-005", type: "Activity spike", severity: "LOW", priority: 64, confidence: 73, status: "ACKNOWLEDGED", entityIds: ["MARKET-NODE-08"], evidenceIds: ["EVD-0083"], timestamp: "08 Aug 2026 · 13:09", what: "Marketplace references increased above the synthetic baseline.", why: "Baseline deviations are useful for triage when combined with other signals." },
  { id: "ALERT-006", type: "Network cluster", severity: "MEDIUM", priority: 62, confidence: 78, status: "UNREVIEWED", entityIds: ["RELAY-NODE-14", "ORION-NODE-03"], evidenceIds: ["EVD-0081"], timestamp: "07 Aug 2026 · 17:19", what: "A relay node bridges two previously separate communities.", why: "Bridging behavior can guide collection without implying intent." },
  { id: "ALERT-003", type: "Potential entity match", severity: "LOW", priority: 56, confidence: 69, status: "REJECTED", entityIds: ["DELTA-22", "LIMA-02"], evidenceIds: ["EVD-0080"], timestamp: "05 Aug 2026 · 10:26", what: "Two identifiers share a short token but lack shared timing.", why: "The weak match is preserved for audit and should not be acted on." },
  { id: "ALERT-008", type: "Emerging trend", severity: "LOW", priority: 51, confidence: 67, status: "NEEDS MORE EVIDENCE", entityIds: ["TOPIC-VELOCITY"], evidenceIds: ["EVD-0079"], timestamp: "03 Aug 2026 · 14:02", what: "A low-volume topic signal is recurring in two source groups.", why: "Additional observations are needed before it becomes a useful lead." }
];

export const trends = [
  { id: "TREND-01", name: "Synthetic Category A", growth: 138, confidence: 84, entities: 14, status: "ANALYST REVIEW REQUIRED", color: "cyan", description: "Cross-source activity growth around a synthetic topic cluster." },
  { id: "TREND-02", name: "Relay behavior", growth: 92, confidence: 79, entities: 9, status: "MONITOR", color: "blue", description: "Recurring handoff language linking two network communities." },
  { id: "TREND-03", name: "Identity overlap", growth: 64, confidence: 91, entities: 6, status: "ANALYST REVIEW REQUIRED", color: "amber", description: "Aliases and timing windows increasingly overlap across records." },
  { id: "TREND-04", name: "Synthetic Category B", growth: 41, confidence: 72, entities: 11, status: "MONITOR", color: "violet", description: "Moderate growth with lower confidence and limited source diversity." }
];

export const evidence = [
  { id: "EVD-0087", type: "Entity resolution", source: "SOURCE-07", timestamp: "13 Aug 2026 · 09:36", hash: "8f1c…a72d", fullHash: "8f1c32f0d7a84d88c1a7d2f4b9e8a72d", confidence: 91, status: "VERIFIED", finding: "ALPHA-17 and BETA-04 share alias and temporal signals." },
  { id: "EVD-0088", type: "Source correlation", source: "SOURCE-02 + SOURCE-07", timestamp: "13 Aug 2026 · 09:39", hash: "b41e…901c", fullHash: "b41e10c7d98a4c1126b4a12dd4ce901c", confidence: 88, status: "PENDING REVIEW", finding: "Independent source records converge on the same topic reference." },
  { id: "EVD-0084", type: "Activity baseline", source: "SOURCE-01", timestamp: "12 Aug 2026 · 18:11", hash: "1ac9…d03f", fullHash: "1ac9c0b1de88f47019a22d20a54bd03f", confidence: 84, status: "VERIFIED", finding: "ORION-NODE-03 exceeded its 30-day synthetic activity baseline." },
  { id: "EVD-0085", type: "Network analysis", source: "SOURCE-04 + SOURCE-06", timestamp: "11 Aug 2026 · 11:18", hash: "c7d3…10a9", fullHash: "c7d3ee8ab47fd90e51f7a1b021b710a9", confidence: 79, status: "VERIFIED", finding: "A compact cluster links three sources and two topic nodes." },
  { id: "EVD-0086", type: "Trend detection", source: "SOURCE-01 + SOURCE-05", timestamp: "10 Aug 2026 · 21:27", hash: "0d88…7f14", fullHash: "0d88d1b74e982c2a06c17e44e3d17f14", confidence: 84, status: "PENDING REVIEW", finding: "Synthetic Category A is expanding across source groups." },
  { id: "EVD-0083", type: "Baseline deviation", source: "SOURCE-04", timestamp: "08 Aug 2026 · 13:05", hash: "5e12…bb42", fullHash: "5e12a6b15d24993fd01c77f10edbbb42", confidence: 73, status: "PENDING REVIEW", finding: "Marketplace references increased above synthetic baseline." },
  { id: "EVD-0082", type: "Location extraction", source: "SOURCE-03", timestamp: "09 Aug 2026 · 08:36", hash: "79fe…18c2", fullHash: "79fe13c2a4c999d8551c134b7d8b18c2", confidence: 76, status: "VERIFIED", finding: "NORTH-ROUTE-12 recurs in three distinct source contexts." },
  { id: "EVD-0081", type: "Community detection", source: "SOURCE-08", timestamp: "07 Aug 2026 · 17:15", hash: "a2d9…4c8b", fullHash: "a2d945aa198e3b9d72e60b51dce24c8b", confidence: 78, status: "PENDING REVIEW", finding: "RELAY-NODE-14 bridges Cluster 01 and Cluster 03." }
];

export const investigations = [
  { id: "OPERATION-ORION", name: "Operation Orion", status: "ACTIVE", entities: 25, records: 150, relationships: 60, alerts: 10, trends: 4, updated: "13 Aug 2026" },
  { id: "OPERATION-SIGNAL", name: "Operation Signal", status: "PAUSED", entities: 18, records: 84, relationships: 33, alerts: 4, trends: 2, updated: "10 Aug 2026" },
  { id: "PROJECT-VELOCITY", name: "Project Velocity", status: "ACTIVE", entities: 12, records: 62, relationships: 21, alerts: 3, trends: 1, updated: "08 Aug 2026" },
  { id: "CASE-HORIZON", name: "Case Horizon", status: "ARCHIVED", entities: 31, records: 192, relationships: 77, alerts: 8, trends: 3, updated: "29 Jul 2026" },
  { id: "INITIATIVE-CASCADE", name: "Initiative Cascade", status: "ACTIVE", entities: 9, records: 41, relationships: 18, alerts: 2, trends: 1, updated: "02 Aug 2026" }
];

export const notifications = [
  { id: "NTF-01", title: "New priority signal detected", detail: "ALERT-009 · Cross-source correlation", route: "alerts", alertId: "ALERT-009", unread: true, time: "2m ago" },
  { id: "NTF-02", title: "Entity relationship updated", detail: "ALPHA-17 · 2 new connections", route: "entity", entityId: "ALPHA-17", unread: true, time: "18m ago" },
  { id: "NTF-03", title: "Emerging trend requires review", detail: "Synthetic Category A · 84% confidence", route: "trends", trendId: "TREND-01", unread: false, time: "43m ago" }
];

export const categories = ["Identity & Alias", "Network Relation", "Activity Pattern", "Topic Signal", "Location Reference", "Marketplace Reference"];
