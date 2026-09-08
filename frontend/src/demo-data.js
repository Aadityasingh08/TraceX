const namedEntities = [
  { id: "ORION-NODE-03", type: "C2 Server", aliases: ["orion-03", "relay-3", "185.220.101.5", "Frankfurt-C2"], sources: ["SOURCE-01", "SOURCE-07", "SOURCE-08", "SIGINT-EUR"], priority: 95, firstObserved: "2026-04-21", lastObserved: "2026-08-13", activity: 98, community: "Cluster 01", description: "Central European Command & Control bulletproof relay synchronizing payload drops and target beaconing." },
  { id: "ALPHA-17", type: "Threat Actor", aliases: ["A17", "north-star", "Viktor-K", "DarkHydra-Lead"], sources: ["SOURCE-07", "SOURCE-02", "SOURCE-05", "INTERPOL-RED"], priority: 92, firstObserved: "2026-05-18", lastObserved: "2026-08-13", activity: 89, community: "Cluster 03", description: "High-connectivity principal operator orchestrating multi-jurisdictional darknet infrastructure and botnet leases." },
  { id: "ORION-HUB-01", type: "Target Infrastructure", aliases: ["ny-financial-core", "198.51.100.41", "ApexBank-API"], sources: ["SOURCE-01", "SOURCE-04", "FIN-TELEMETRY"], priority: 96, firstObserved: "2026-06-11", lastObserved: "2026-08-13", activity: 94, community: "Cluster 01", description: "Tier-1 financial gateway targeted by persistent credential-stuffing bursts and shadow API exfiltration." },
  { id: "MARKET-NODE-08", type: "Marketplace", aliases: ["mn8", "market-08", "HydraMarket-V2", "SilkBridge"], sources: ["SOURCE-04", "SOURCE-06", "DARKNET-TAP"], priority: 84, firstObserved: "2026-05-07", lastObserved: "2026-08-12", activity: 82, community: "Cluster 02", description: "High-volume darknet marketplace escrow and automated mixing gateway facilitating illicit capital settlements." },
  { id: "BETA-04", type: "Proxy Relay", aliases: ["B4", "blue-orbit", "103.152.220.44", "SingaProxy-01"], sources: ["SOURCE-07", "SOURCE-03", "APAC-SIGINT"], priority: 79, firstObserved: "2026-06-02", lastObserved: "2026-08-11", activity: 76, community: "Cluster 03", description: "High-bandwidth Southeast Asian transit node acting as rendezvous tunnel for cross-regional data forwarding." },
  { id: "DELTA-22", type: "Botnet Cluster", aliases: ["D22", "Bucharest-Swarm", "188.241.112.7", "M247-Scanner"], sources: ["SOURCE-02", "SOURCE-08", "CYBER-THREAT-FEED"], priority: 88, firstObserved: "2026-05-14", lastObserved: "2026-08-13", activity: 91, community: "Cluster 01", description: "Distributed VPS staging cluster executing automated port scanning and credential stuffing waves." },
  { id: "RELAY-NODE-14", type: "VPN Concentrator", aliases: ["RN-14", "Mumbai-Gateway", "103.21.244.2", "Wireguard-Exit"], sources: ["SOURCE-05", "SOURCE-08", "TELECOM-LOGS"], priority: 77, firstObserved: "2026-04-29", lastObserved: "2026-08-12", activity: 73, community: "Cluster 01", description: "Encrypted Wireguard and OpenVPN concentration point linking South Asian affiliates to Frankfurt C2." },
  { id: "MARKET-NODE-11", type: "Crypto Mixer", aliases: ["mn11", "Dubai-OTC", "0xMixer-94", "GulfSettlement"], sources: ["SOURCE-06", "BLOCKCHAIN-INTEL"], priority: 83, firstObserved: "2026-06-20", lastObserved: "2026-08-13", activity: 86, community: "Cluster 02", description: "Peer-to-peer OTC liquidity portal executing rapid multi-hop Bitcoin and Monero unlinking transactions." },
  { id: "SOURCE-07", type: "Collection Source", aliases: ["channel-seven", "Euro-Optical-Tap", "AMS-IX-Sensor"], sources: ["SOURCE-07"], priority: 65, firstObserved: "2026-04-02", lastObserved: "2026-08-13", activity: 88, community: "Cluster 03", description: "Carrier-grade optical passive listening sensor intercepting high-entropy TLS sessions." },
  { id: "NORTH-ROUTE-12", type: "Location", aliases: ["corridor-12", "AMS-IXP", "Rotterdam-Transit"], sources: ["SOURCE-03", "SOURCE-07"], priority: 71, firstObserved: "2026-06-14", lastObserved: "2026-08-12", activity: 68, community: "Cluster 03", description: "High-capacity European fiber intersection where Operation Orion encrypted transit routes converge." },
  { id: "SILVER-THREAD", type: "Topic Signal", aliases: ["thread-s", "handoff", "T1071.001", "PayloadBeacon"], sources: ["SOURCE-01", "SOURCE-05", "SOURCE-08"], priority: 77, firstObserved: "2026-05-30", lastObserved: "2026-08-10", activity: 75, community: "Cluster 01", description: "Synthetic telemetry signature identifying periodic encrypted heartbeat packets across target networks." },
  { id: "TOPIC-CASCADE", type: "Topic Signal", aliases: ["cascade-protocol", "T1041", "ExfilBurst"], sources: ["SOURCE-02", "SOURCE-04"], priority: 74, firstObserved: "2026-06-18", lastObserved: "2026-08-12", activity: 72, community: "Cluster 02", description: "Multi-part archive splitting and staging pattern observed preceding major data dumps." },
  { id: "EAST-EXCHANGE-04", type: "Data Mirror", aliases: ["Tokyo-Mirror", "133.242.18.22", "Sakura-Node"], sources: ["SOURCE-03", "APAC-SIGINT"], priority: 68, firstObserved: "2026-05-12", lastObserved: "2026-08-11", activity: 64, community: "Cluster 03", description: "Offshore repository node synchronizing telemetry indicators and darknet pseudonym ledgers." },
  { id: "ECHO-11", type: "Telemetry Node", aliases: ["Sydney-Tap", "139.130.4.5", "Telstra-Intercept"], sources: ["SOURCE-06", "PACIFIC-INTEL"], priority: 62, firstObserved: "2026-06-25", lastObserved: "2026-08-10", activity: 58, community: "Cluster 03", description: "Pacific rim optical sensor tracking underwater cable traffic anomalies." },
  { id: "KAPPA-09", type: "Proxy Network", aliases: ["SaoPaulo-Exit", "177.18.90.15", "Claro-Proxy"], sources: ["SOURCE-05", "LATAM-FEED"], priority: 64, firstObserved: "2026-05-22", lastObserved: "2026-08-09", activity: 60, community: "Cluster 02", description: "LATAM egress proxy chain masking distributed brute-force queries against financial targets." }
];

const extraEntitySeeds = [
  ["LIMA-02", "Threat Actor", "Cluster 02", 72, "Secondary operator handling credential sales on darknet forums."],
  ["ZETA-88", "C2 Server", "Cluster 01", 89, "Backup command and control node hosted in Stockholm datacenter."],
  ["VICTOR-05", "Crypto Wallet", "Cluster 02", 81, "Cold storage ledger holding funds transferred from Market Node 08."],
  ["TOR-GATE-19", "Anonymizer", "Cluster 03", 75, "High-bandwidth Tor guard relay observed during C2 session init."],
  ["SOURCE-01", "Collection Source", "Cluster 01", 62, "Primary wiretap tap monitoring Eastern European border gateways."],
  ["SOURCE-02", "Collection Source", "Cluster 01", 60, "ISP-level DNS query logger tracking fast-flux domain requests."],
  ["SOURCE-03", "Collection Source", "Cluster 03", 58, "Darknet forum scraping engine indexing hacker pseudonym mentions."],
  ["SOURCE-04", "Collection Source", "Cluster 02", 66, "Blockchain ledger analyzer tracking cryptocurrency transaction flows."],
  ["SOURCE-05", "Collection Source", "Cluster 01", 64, "Host intrusion detection sensor deployed at financial gateway."],
  ["SOURCE-06", "Collection Source", "Cluster 02", 63, "Telecom signaling metadata analyzer tracking IMSI/IP handoffs."],
  ["SOURCE-08", "Collection Source", "Cluster 01", 67, "Cloud infrastructure honeypot recording automated attack scripts."],
  ["TOPIC-VELOCITY", "Topic Signal", "Cluster 03", 70, "Rapid velocity credential testing signature against SSO endpoints."],
  ["TOPIC-CRYPTO-FLOW", "Topic Signal", "Cluster 02", 82, "High-entropy split payments matching known money laundering models."],
  ["FALLBACK-THREAD-6", "Topic Signal", "Cluster 01", 65, "Emergency C2 fallback trigger activated upon node disconnection."]
];

export const entities = [
  ...namedEntities,
  ...extraEntitySeeds.map(([id, type, community, priority, description], index) => ({
    id,
    type,
    aliases: [`${id.toLowerCase().replaceAll("-", "")}`, `node-${id.toLowerCase()}`, `alias-0${index + 1}`],
    sources: [`SOURCE-${String((index % 8) + 1).padStart(2, "0")}`, "TRACE-CORE"],
    priority,
    firstObserved: `2026-0${(index % 4) + 4}-${String((index % 20) + 1).padStart(2, "0")}`,
    lastObserved: `2026-08-${String((index % 13) + 1).padStart(2, "0")}`,
    activity: 45 + ((index * 9) % 50),
    community,
    description
  }))
];

const sourceIds = ["SOURCE-01", "SOURCE-02", "SOURCE-03", "SOURCE-04", "SOURCE-05", "SOURCE-06", "SOURCE-07", "SOURCE-08", "SIGINT-EUR", "FIN-TELEMETRY"];
const activityLabels = [
  "C2 beacon heartbeat detected",
  "Encrypted payload chunk exfiltration",
  "Anomalous authentication burst",
  "Cross-corridor proxy handshake",
  "Darknet escrow settlement transaction",
  "Fast-flux DNS resolution change",
  "Port scan sweep on financial API",
  "Cryptographic SHA-256 evidence anchored",
  "Subsea optic packet correlation",
  "TOR relay circuit established"
];

const topics = ["Command & Control", "Data Exfiltration", "Crypto Laundering", "Identity & Alias", "Network Infrastructure", "Anomalous Traffic"];

const OPERATIVE_NAMES = [
  "Aarav Sharma", "Vivaan Patel", "Aditya Verma", "Vihaan Singh", "Arjun Gupta",
  "Sai Kumar", "Reyansh Reddy", "Ayaan Joshi", "Krishna Nair", "Ishaan Malhotra",
  "Shaurya Rao", "Atharva Das", "Dhruv Mehta", "Kabir Bhatia", "Rudra Sengupta",
  "Ananya Iyer", "Diya Mukherjee", "Gauri Pillai", "Aadhya Chauhan", "Pari Bhattacharya",
  "Priya Joshi", "Siddharth Gupta", "Farhan Singh", "Deepak Nair", "Tariq Choudhury",
  "Vikram Das", "Neha Nair", "Kavya Menon", "Rohan Roy", "Anika Jain"
];

const LOCATIONS = [
  "Mumbai, Maharashtra", "Delhi, NCR", "Bengaluru, Karnataka", "Hyderabad, Telangana",
  "Chennai, Tamil Nadu", "Kolkata, West Bengal", "Pune, Maharashtra", "Ahmedabad, Gujarat",
  "Jaipur, Rajasthan", "Lucknow, Uttar Pradesh", "Chandigarh, Punjab", "Kochi, Kerala",
  "Goa, Panaji", "Ludhiana, Punjab", "Surat, Gujarat", "Indore, Madhya Pradesh",
  "Nagpur, Maharashtra", "Frankfurt, Germany", "Zurich, Switzerland", "Dubai, UAE"
];

export const records = Array.from({ length: 15000 }, (_, index) => {
  const entity = entities[index % entities.length];
  const name = OPERATIVE_NAMES[index % OPERATIVE_NAMES.length];
  const loc = LOCATIONS[index % LOCATIONS.length];
  const handle = `@${name.toLowerCase().replace(/\s+/g, "_")}_${(index % 90) + 10}`;
  const phone = `+91${8000000000 + ((index * 1337) % 1999999999)}`;
  const email = `${name.toLowerCase().replace(/\s+/g, ".")}${(index % 999)}@secure-mail.org`;
  const wallet = `0x${((index + 1) * 12345678901234).toString(16).padEnd(40, "a").slice(0, 40)}`;

  const day = (index * 2) % 90;
  const hour = (index * 7) % 24;
  const minute = (index * 13) % 60;
  const date = new Date(Date.UTC(2026, 7, 13, hour, minute));
  date.setUTCDate(date.getUTCDate() - day);

  const actType = activityLabels[index % activityLabels.length];
  return {
    id: `IR-${String(index + 1).padStart(5, "0")}`,
    entityId: entity.id,
    sourceId: sourceIds[index % sourceIds.length],
    sourceLabel: sourceIds[index % sourceIds.length],
    type: actType,
    title: `Intel Signal #${index + 1} — ${name} (${loc.split(",")[0]})`,
    personName: name,
    telegramHandle: handle,
    phone: phone,
    email: email,
    location: loc,
    walletAddress: wallet,
    snippet: `Consignment transit telemetry #${index + 1}. Operative: ${name} (${handle}), Phone: ${phone}, Location: ${loc}. Intercept confirmed encrypted communications via ${sourceIds[index % sourceIds.length]}. Settlement wallet: ${wallet}.`,
    timestamp: date.toISOString().slice(0, 16).replace("T", " "),
    confidence: 65 + ((index * 11) % 31),
    topic: topics[index % topics.length]
  };
});

const relationshipPairs = [
  ["ORION-NODE-03", "ORION-HUB-01", "EXFILTRATES_TO", 96],
  ["ORION-NODE-03", "ALPHA-17", "CONTROLS", 94],
  ["ALPHA-17", "BETA-04", "ASSOCIATED_WITH", 91],
  ["ALPHA-17", "MARKET-NODE-08", "RECEIVES_FUNDS_FROM", 88],
  ["ALPHA-17", "SOURCE-07", "INTERCEPTED_BY", 85],
  ["ORION-NODE-03", "MARKET-NODE-08", "FACILITATES_PAYMENT", 89],
  ["ORION-NODE-03", "SILVER-THREAD", "BEACONS_VIA", 92],
  ["MARKET-NODE-08", "MARKET-NODE-11", "TRANSFERS_CRYPTO_TO", 87],
  ["MARKET-NODE-11", "VICTOR-05", "SETTLES_INTO", 90],
  ["DELTA-22", "ORION-HUB-01", "SCANS_TARGET", 93],
  ["DELTA-22", "ORION-NODE-03", "REPORTS_TELEMETRY_TO", 88],
  ["RELAY-NODE-14", "ORION-NODE-03", "TUNNELS_TO", 86],
  ["BETA-04", "EAST-EXCHANGE-04", "SYNCS_MIRROR_WITH", 82],
  ["EAST-EXCHANGE-04", "ECHO-11", "CORRELATED_WITH", 78],
  ["KAPPA-09", "ORION-HUB-01", "PROXIES_TRAFFIC_TO", 84],
  ["ZETA-88", "ORION-NODE-03", "FAILOVER_CLUSTER_FOR", 90],
  ["TOR-GATE-19", "ALPHA-17", "ROUTER_FOR", 87],
  ["SILVER-THREAD", "TOPIC-CASCADE", "CORRELATED_WITH", 81],
  ["NORTH-ROUTE-12", "ORION-NODE-03", "HOSTS_TRANSIT_FOR", 89],
  ["NORTH-ROUTE-12", "ALPHA-17", "PHYSICAL_CORRIDOR_FOR", 83]
];

export const relationships = Array.from({ length: 90 }, (_, index) => {
  const pair = relationshipPairs[index % relationshipPairs.length];
  const day = (index * 3) % 45;
  const date = new Date(Date.UTC(2026, 7, 13));
  date.setUTCDate(date.getUTCDate() - day);

  return {
    id: `REL-${String(index + 1).padStart(3, "0")}`,
    source: pair[0],
    target: pair[1],
    type: pair[2],
    timestamp: `${date.toISOString().slice(0, 10)} ${String(8 + (index % 14)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}`,
    confidence: pair[3] ? Math.min(98, pair[3] - (index % 5)) : 75 + (index % 20),
    sourceId: sourceIds[index % sourceIds.length]
  };
});

export const alerts = [
  { id: "ALERT-009", type: "Active C2 Data Exfiltration", severity: "HIGH", priority: 95, confidence: 94, status: "UNREVIEWED", entityIds: ["ORION-NODE-03", "ORION-HUB-01"], evidenceIds: ["EVD-0087", "EVD-0088"], timestamp: "13 Aug 2026 · 10:14", what: "Sustained high-volume outbound packet stream (32.4 GB) detected toward Frankfurt bulletproof C2.", why: "Temporal agreement with NY financial API credential stuffing confirms multi-stage exfiltration.", aiSummary: "Severe exfiltration vector linking Frankfurt C2 (185.220.101.5) with targeted banking infrastructure." },
  { id: "ALERT-004", type: "Target Beaconing Spike", severity: "HIGH", priority: 89, confidence: 91, status: "ASSIGNED", entityIds: ["ORION-NODE-03", "ALPHA-17"], evidenceIds: ["EVD-0084"], timestamp: "13 Aug 2026 · 09:22", what: "Heartbeat beaconing frequency between Frankfurt relay and Reykjavik enclave rose 180% over baseline.", why: "Anomalous beacon rate typically precedes botnet tasking dispatch or ransomware encryption key delivery.", aiSummary: "Tactical synchronization pulse detected across Western Europe - Iceland encrypted channel." },
  { id: "ALERT-011", type: "Darknet Escrow Capital Movement", severity: "HIGH", priority: 86, confidence: 89, status: "UNREVIEWED", entityIds: ["MARKET-NODE-08", "MARKET-NODE-11"], evidenceIds: ["EVD-0089"], timestamp: "12 Aug 2026 · 23:40", what: "Automated split-mixing of 42.8 BTC executed within a 12-minute window across Zurich and Dubai nodes.", why: "Rapid multi-hop coin unlinking indicates capital withdrawal following illicit access broker sales.", aiSummary: "High-confidence financial laundering route terminating in OTC peer-to-peer liquidity endpoints." },
  { id: "ALERT-007", type: "Potential Entity Match", severity: "MEDIUM", priority: 84, confidence: 92, status: "UNREVIEWED", entityIds: ["ALPHA-17", "BETA-04"], evidenceIds: ["EVD-0087"], timestamp: "12 Aug 2026 · 17:15", what: "ALPHA-17 and BETA-04 share cryptographic session keys, timing windows, and telecom routing hops.", why: "High probability that both profiles represent the same primary human operator using dual proxy disguises.", aiSummary: "Entity resolution model indicates 92% confidence of persona identity convergence." },
  { id: "ALERT-002", type: "Distributed Port Scan Wave", severity: "HIGH", priority: 82, confidence: 85, status: "ACKNOWLEDGED", entityIds: ["DELTA-22", "ORION-HUB-01"], evidenceIds: ["EVD-0085"], timestamp: "12 Aug 2026 · 11:08", what: "Bucharest VPS cluster executed synchronized SYN/ACK probing across 4,000 corporate financial subnets.", why: "Reconnaissance pattern matches MITRE ATT&CK T1595.001 (Active Scanning).", aiSummary: "Automated infrastructure scanning targeting financial OAuth2 and SAML authentication gateways." },
  { id: "ALERT-010", type: "Emerging Trend / Fast-Flux DNS", severity: "MEDIUM", priority: 78, confidence: 86, status: "UNREVIEWED", entityIds: ["SILVER-THREAD", "TOPIC-CASCADE"], evidenceIds: ["EVD-0086"], timestamp: "11 Aug 2026 · 20:30", what: "Synthetic Category A activity expanding across four international carrier transit sensor streams.", why: "Fast-flux domain controller rotation detected across Seoul and Tokyo transit endpoints.", aiSummary: "Automated domain resolution switching designed to evade conventional IP blacklists." },
  { id: "ALERT-001", type: "Cross-Source Geo Correlation", severity: "MEDIUM", priority: 74, confidence: 81, status: "ASSIGNED", entityIds: ["NORTH-ROUTE-12", "ORION-NODE-03"], evidenceIds: ["EVD-0082"], timestamp: "11 Aug 2026 · 14:12", what: "Optical sensors in Amsterdam and Frankfurt cross-correlate recurring packet headers.", why: "Subsea transit telemetry isolates the primary transatlantic data tunnel.", aiSummary: "Definitive physical fiber correlation anchoring synthetic threat signals." },
  { id: "ALERT-005", type: "Wireguard Tunnel Spike", severity: "LOW", priority: 66, confidence: 76, status: "ACKNOWLEDGED", entityIds: ["RELAY-NODE-14", "ORION-NODE-03"], evidenceIds: ["EVD-0083"], timestamp: "10 Aug 2026 · 16:45", what: "Mumbai VPN gateway experienced a 240% encrypted traffic burst directly to Frankfurt C2.", why: "Affiliate telemetry upload observed during Asian operational hours.", aiSummary: "Affiliate network synchronization window identified and tagged for monitoring." },
  { id: "ALERT-006", type: "Darknet Marketplace Listing Surge", severity: "MEDIUM", priority: 68, confidence: 79, status: "UNREVIEWED", entityIds: ["MARKET-NODE-08", "DELTA-22"], evidenceIds: ["EVD-0081"], timestamp: "09 Aug 2026 · 19:20", what: "New batch of enterprise database access credentials published on Market Node 08.", why: "Credential tokens match telemetry observed during previous Bucharest scanning wave.", aiSummary: "Direct linkage established between reconnaissance scanning and darknet monetization." },
  { id: "ALERT-003", type: "Weak Identity Token Co-occurrence", severity: "LOW", priority: 54, confidence: 64, status: "REJECTED", entityIds: ["DELTA-22", "LIMA-02"], evidenceIds: ["EVD-0080"], timestamp: "08 Aug 2026 · 10:11", what: "Two identifier tokens share a 4-character suffix without matching timing or source consensus.", why: "Weak correlation preserved in audit log to maintain analytical transparency without acting prematurely.", aiSummary: "False-positive candidate rejected and cryptographically archived." }
];

export const trends = [
  { id: "TREND-01", name: "C2 Exfiltration Velocity", growth: 184, confidence: 93, entities: 18, status: "CRITICAL ACTION REQUIRED", color: "red", description: "Rapid acceleration of encrypted data transfers routing through Frankfurt C2 bulletproof nodes." },
  { id: "TREND-02", name: "Cross-Border Proxy Handoffs", growth: 142, confidence: 88, entities: 14, status: "ANALYST REVIEW REQUIRED", color: "cyan", description: "Multi-jurisdiction proxy rotation linking Singapore, Tokyo, and Reykjavik staging points." },
  { id: "TREND-03", name: "Crypto Escrow Liquidity Surge", growth: 96, confidence: 84, entities: 10, status: "MONITOR", color: "amber", description: "High-volume split-mixing of Monero and Bitcoin across Zurich and Dubai OTC gateways." },
  { id: "TREND-04", name: "Automated API Scanning", growth: 78, confidence: 89, entities: 12, status: "ANALYST REVIEW REQUIRED", color: "blue", description: "Coordinated VPS port scanning targeting North American banking authentication endpoints." },
  { id: "TREND-05", name: "Fast-Flux DNS Dispersion", growth: 56, confidence: 79, entities: 8, status: "MONITOR", color: "violet", description: "Rapid domain name resolution changes designed to circumvent perimeter firewall blacklists." },
  { id: "TREND-06", name: "Darknet Credential Monetization", growth: 44, confidence: 73, entities: 7, status: "MONITOR", color: "cyan", description: "Direct monetization of harvested database records through decentralized escrow portals." }
];

export const evidence = [
  { id: "EVD-0087", type: "C2 Traffic Intercept & Hash", source: "SIGINT-EUR + SOURCE-07", timestamp: "13 Aug 2026 · 10:05", hash: "8f1c…a72d", fullHash: "8f1c32f0d7a84d88c1a7d2f4b9e8a72d38402b8d91c10928eac45f9a72d1109a", confidence: 96, status: "VERIFIED", finding: "PCAP payload capture of encrypted exfiltration session matching ORION-NODE-03 signature." },
  { id: "EVD-0088", type: "TLS Certificate Fingerprint (JA3)", source: "SOURCE-01 + SOURCE-07", timestamp: "13 Aug 2026 · 09:48", hash: "b41e…901c", fullHash: "b41e10c7d98a4c1126b4a12dd4ce901cf7891a23c099dae13589b901c6674128", confidence: 94, status: "VERIFIED", finding: "Identical custom JA3/JA3S fingerprint shared between Frankfurt C2 and Reykjavik seed node." },
  { id: "EVD-0089", type: "Blockchain Transaction Ledger", source: "SOURCE-04 (FIN-INTEL)", timestamp: "12 Aug 2026 · 23:35", hash: "9a2f…e410", fullHash: "9a2f66e01a88b47120a54bd03fc7d3ee8ab47fd90e51f7a1b021b710a9e41071", confidence: 91, status: "VERIFIED", finding: "42.8 BTC split transaction trail traced from Market Node 08 through Dubai OTC liquidity pool." },
  { id: "EVD-0084", type: "Activity Baseline Deviation", source: "SOURCE-01", timestamp: "12 Aug 2026 · 18:11", hash: "1ac9…d03f", fullHash: "1ac9c0b1de88f47019a22d20a54bd03f901cb41e10c7d98a4c1126b4a12dd4ce", confidence: 89, status: "VERIFIED", finding: "ORION-NODE-03 exceeded its 30-day synthetic baseline by 180% during target beaconing window." },
  { id: "EVD-0085", type: "Port Probing Telemetry PCAP", source: "SOURCE-05 (IDS Sensor)", timestamp: "12 Aug 2026 · 11:02", hash: "c7d3…10a9", fullHash: "c7d3ee8ab47fd90e51f7a1b021b710a98f1c32f0d7a84d88c1a7d2f4b9e8a72d", confidence: 92, status: "VERIFIED", finding: "Synchronized SYN packets from Bucharest cluster targeting financial OAuth2 endpoints." },
  { id: "EVD-0086", type: "Fast-Flux DNS Query Graph", source: "SOURCE-02", timestamp: "11 Aug 2026 · 20:22", hash: "0d88…7f14", fullHash: "0d88d1b74e982c2a06c17e44e3d17f14b41e10c7d98a4c1126b4a12dd4ce901c", confidence: 86, status: "PENDING REVIEW", finding: "14 authoritative name servers rotating A-records across Seoul and Tokyo IP subnets every 180s." },
  { id: "EVD-0083", type: "VPN Tunnel Packet Analysis", source: "SOURCE-08", timestamp: "10 Aug 2026 · 16:40", hash: "5e12…bb42", fullHash: "5e12a6b15d24993fd01c77f10edbbb421ac9c0b1de88f47019a22d20a54bd03f", confidence: 84, status: "PENDING REVIEW", finding: "Encrypted Wireguard handshake headers matching Operation Orion affiliate credentials." },
  { id: "EVD-0082", type: "Optical Transatlantic Tap Lineage", source: "SOURCE-03 + SOURCE-07", timestamp: "11 Aug 2026 · 14:05", hash: "79fe…18c2", fullHash: "79fe13c2a4c999d8551c134b7d8b18c20d88d1b74e982c2a06c17e44e3d17f14", confidence: 88, status: "VERIFIED", finding: "Physical fiber transit packet matching Frankfurt C2 exfiltration flow across AMS-IX core." },
  { id: "EVD-0081", type: "Darknet Database Dump Hash", source: "SOURCE-06", timestamp: "09 Aug 2026 · 19:10", hash: "a2d9…4c8b", fullHash: "a2d945aa198e3b9d72e60b51dce24c8b5e12a6b15d24993fd01c77f10edbbb42", confidence: 82, status: "PENDING REVIEW", finding: "SQL dump header SHA-256 matches staging directory identified on Market Node 08 server." },
  { id: "EVD-0080", type: "Candidate Token Dissimilarity", source: "SOURCE-02", timestamp: "08 Aug 2026 · 10:02", hash: "3f1a…c891", fullHash: "3f1ac8910029b47120a54bd03fc7d3ee8ab47fd90e51f7a1b021b710a9e41071", confidence: 64, status: "REJECTED", finding: "Weak token coincidence rejected after cross-temporal analysis proved distinct actors." }
];

export const investigations = [
  { id: "OPERATION-ORION", caseCode: "ORION-2026", name: "Operation Orion", status: "ACTIVE", entities: 29, records: 300, relationships: 90, alerts: 10, trends: 6, updated: "13 Aug 2026" },
  { id: "PROJECT-VIPER", caseCode: "VIPER-2026", name: "Project Cyber Viper", status: "ACTIVE", entities: 19, records: 142, relationships: 48, alerts: 5, trends: 3, updated: "12 Aug 2026" },
  { id: "SHADOW-BEACON", caseCode: "SHADOW-84", name: "Shadow Beacon", status: "PAUSED", entities: 14, records: 88, relationships: 31, alerts: 4, trends: 2, updated: "10 Aug 2026" },
  { id: "TITAN-LOCK", caseCode: "TITAN-LOCK", name: "Titan Lock Syndicate", status: "ACTIVE", entities: 22, records: 198, relationships: 64, alerts: 7, trends: 4, updated: "08 Aug 2026" },
  { id: "CASE-HORIZON", caseCode: "HORIZON-01", name: "Case Horizon Archive", status: "ARCHIVED", entities: 34, records: 260, relationships: 102, alerts: 11, trends: 5, updated: "29 Jul 2026" }
];

export const notifications = [
  { id: "NTF-01", title: "CRITICAL: High-volume data exfiltration in progress", detail: "ALERT-009 · ORION-NODE-03 ➔ ORION-HUB-01 (32.4 GB)", route: "alerts", alertId: "ALERT-009", unread: true, time: "Just now" },
  { id: "NTF-02", title: "Target beaconing velocity increased +180%", detail: "ALERT-004 · Frankfurt ➔ Reykjavik C2 Sync", route: "alerts", alertId: "ALERT-004", unread: true, time: "4m ago" },
  { id: "NTF-03", title: "Large-scale cryptocurrency laundering detected", detail: "ALERT-011 · 42.8 BTC split across Zurich & Dubai", route: "alerts", alertId: "ALERT-011", unread: true, time: "18m ago" },
  { id: "NTF-04", title: "New high-priority suspect profile correlated", detail: "ALPHA-17 · 92% identity match with BETA-04", route: "entity", entityId: "ALPHA-17", unread: true, time: "32m ago" },
  { id: "NTF-05", title: "Emerging trend: Fast-Flux DNS evasion", detail: "TREND-01 · +184% growth rate across European nodes", route: "trends", trendId: "TREND-01", unread: false, time: "1h ago" }
];

export const categories = [
  "Command & Control",
  "Target Data Exfiltration",
  "Cryptocurrency Mixer",
  "Identity & Operator Alias",
  "Network Relay & Proxy",
  "Threat Actor Syndicate",
  "Location & Fiber Transit",
  "Automated Reconnaissance"
];

export const demoAuditLogs = [
  { id: "AUD-101", actor: "A. Patel", action: "VERIFY_SIGNAL", resource: "alerts", resourceId: "ALERT-009", timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
  { id: "AUD-102", actor: "TRACE-X AI", action: "CROSS_SOURCE_CORRELATION", resource: "entity", resourceId: "ALPHA-17", timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString() },
  { id: "AUD-103", actor: "A. Patel", action: "GEO_EVIDENCE_LOGGED", resource: "threat_map", resourceId: "NODE-FRA-01", timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString() },
  { id: "AUD-104", actor: "TRACE-X AI", action: "C2_BEACON_DETECTED", resource: "threat_node", resourceId: "NODE-REYK-02", timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString() },
  { id: "AUD-105", actor: "A. Patel", action: "INGEST_TARGET", resource: "entity", resourceId: "ORION-NODE-03", timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: "AUD-106", actor: "TRACE-X AI", action: "SHA256_INTEGRITY_ANCHORED", resource: "evidence", resourceId: "EVD-0087", timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: "AUD-107", actor: "A. Patel", action: "GENERATE_REPORT", resource: "report", resourceId: "OPERATION-ORION", timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString() },
  { id: "AUD-108", actor: "TRACE-X AI", action: "COMMUNITY_CLUSTER_UPDATE", resource: "network", resourceId: "Cluster 01", timestamp: new Date(Date.now() - 130 * 60 * 1000).toISOString() },
  { id: "AUD-109", actor: "A. Patel", action: "ACKNOWLEDGE_ALERT", resource: "alerts", resourceId: "ALERT-002", timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString() },
  { id: "AUD-110", actor: "TRACE-X AI", action: "INGESTION_CYCLE_COMPLETE", resource: "pipeline", resourceId: "BATCH-841", timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString() },
  { id: "AUD-111", actor: "A. Patel", action: "EXPORT_EVIDENCE_INDEX", resource: "evidence", resourceId: "EVD-INDEX-ALL", timestamp: new Date(Date.now() - 320 * 60 * 1000).toISOString() },
  { id: "AUD-112", actor: "TRACE-X AI", action: "ANOMALOUS_TRAFFIC_BURST", resource: "threat_node", resourceId: "NODE-MUM-12", timestamp: new Date(Date.now() - 410 * 60 * 1000).toISOString() },
  { id: "AUD-113", actor: "A. Patel", action: "REJECT_ENTITY_MATCH", resource: "entity", resourceId: "DELTA-22", timestamp: new Date(Date.now() - 520 * 60 * 1000).toISOString() },
  { id: "AUD-114", actor: "TRACE-X AI", action: "CRYPTO_ESCROW_ALERT_TRIGGERED", resource: "alerts", resourceId: "ALERT-011", timestamp: new Date(Date.now() - 650 * 60 * 1000).toISOString() }
];
