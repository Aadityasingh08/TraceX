import os
import subprocess
import tempfile

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TRACE-X | Complete System Architecture & Webpage Documentation Guide</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @page {
    size: A4;
    margin: 15mm 15mm 15mm 15mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 13px;
    line-height: 1.6;
  }

  /* COVER PAGE */
  .cover-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 50px 40px 40px 40px;
    background: linear-gradient(135deg, #090d16 0%, #171c2f 50%, #0c1020 100%);
    color: #ffffff;
    border-radius: 12px;
    page-break-after: always;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .cover-top {
    border-left: 4px solid #6366f1;
    padding-left: 24px;
  }

  .cover-tag {
    display: inline-block;
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    border: 1px solid rgba(165, 180, 252, 0.35);
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 24px;
  }

  .cover-title {
    font-size: 46px;
    font-weight: 800;
    letter-spacing: -1.5px;
    line-height: 1.1;
    background: linear-gradient(90deg, #ffffff 0%, #cbd5e1 60%, #818cf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 14px;
  }

  .cover-subtitle {
    font-size: 17px;
    color: #94a3b8;
    font-weight: 400;
    max-width: 620px;
    line-height: 1.5;
  }

  .cover-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 30px;
  }

  .badge-item {
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #e2e8f0;
  }

  .cover-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 24px;
  }

  .cover-meta h4 {
    font-size: 12px;
    color: #818cf8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .cover-meta p {
    font-size: 12px;
    color: #cbd5e1;
  }

  /* HEADINGS */
  h1 {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
    margin-top: 32px;
    margin-bottom: 16px;
    page-break-after: avoid;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  h2 {
    font-size: 16px;
    font-weight: 700;
    margin-top: 20px;
    margin-bottom: 10px;
    color: #1e293b;
    page-break-after: avoid;
  }

  h3 {
    font-size: 14px;
    font-weight: 700;
    margin-top: 14px;
    margin-bottom: 6px;
    color: #334155;
    page-break-after: avoid;
  }

  p {
    margin-bottom: 10px;
    color: #334155;
    text-align: justify;
  }

  .lead-p {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
    line-height: 1.6;
    margin-bottom: 14px;
  }

  /* CALLOUTS */
  .callout {
    background: #f8fafc;
    border-left: 4px solid #6366f1;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 14px 0;
    font-size: 12.5px;
  }

  .callout.info {
    border-left-color: #3b82f6;
    background: #eff6ff;
  }

  .callout.success {
    border-left-color: #10b981;
    background: #f0fdf4;
  }

  .callout.warning {
    border-left-color: #f59e0b;
    background: #fffbeb;
  }

  .callout.hindi {
    border-left-color: #8b5cf6;
    background: #faf5ff;
  }

  .callout-title {
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }

  /* GRID */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 12px 0;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin: 12px 0;
  }

  .card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .card-title {
    font-size: 13.5px;
    font-weight: 700;
    color: #0f172a;
  }

  .badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-purple { background: #ede9fe; color: #6d28d9; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-red { background: #fee2e2; color: #b91c1c; }
  .badge-amber { background: #fef3c7; color: #b45309; }
  .badge-green { background: #dcfce7; color: #15803d; }
  .badge-slate { background: #f1f5f9; color: #475569; }

  /* TABLES */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 12px;
  }

  th, td {
    border: 1px solid #e2e8f0;
    padding: 7px 10px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #f1f5f9;
    font-weight: 700;
    color: #1e293b;
  }

  tr:nth-child(even) {
    background: #f8fafc;
  }

  /* CODE BLOCKS */
  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    background: #f1f5f9;
    padding: 2px 5px;
    border-radius: 4px;
    color: #4338ca;
    font-weight: 500;
  }

  pre {
    background: #0f172a;
    color: #e2e8f0;
    padding: 12px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    line-height: 1.45;
    margin: 12px 0;
    overflow-x: auto;
  }

  .page-break {
    page-break-after: always;
  }

  /* MODULE / WEBPAGE EXPLANATION BOX */
  .webpage-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-left: 5px solid #6366f1;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  .webpage-card h3 {
    font-size: 14.5px;
    color: #0f172a;
    margin-top: 0;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .webpage-card p {
    font-size: 12.5px;
    margin-bottom: 6px;
  }

  .webpage-card ul {
    margin-left: 20px;
    font-size: 12px;
    color: #334155;
  }

  .webpage-card li {
    margin-bottom: 4px;
  }

  .hindi-text {
    color: #581c87;
    font-size: 12px;
    background: #faf5ff;
    padding: 4px 8px;
    border-radius: 4px;
    margin-top: 6px;
    display: block;
    border: 1px solid #f3e8ff;
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover-page">
  <div class="cover-top">
    <div class="cover-tag">INTELLIGENCE FUSION & INVESTIGATION PLATFORM</div>
    <div class="cover-title">TRACE-X</div>
    <div class="cover-subtitle">
      Comprehensive System Architecture, Module Breakdown & Complete Webpage Operational Guide
    </div>
    <div class="cover-badges">
      <div class="badge-item">🛡️ Multi-Source Intelligence Fusion</div>
      <div class="badge-item">🕸️ Entity Resolution & Graph Analysis</div>
      <div class="badge-item">🌍 Global Threat Telemetry</div>
      <div class="badge-item">🤖 Dual-Engine AI Copilot</div>
    </div>
  </div>

  <div class="cover-footer">
    <div class="cover-meta">
      <h4>Full Technical Dossier</h4>
      <p>Project: TRACE-X Intelligence Fusion Engine</p>
      <p>Scope: Complete Webpage-by-Webpage Explanation & Backend Design</p>
    </div>
    <div class="cover-meta" style="text-align: right;">
      <h4>Platform Specifications</h4>
      <p>Architecture: Node.js + Express + React 18 + PostgreSQL</p>
      <p>Release: Enterprise Edition v2.4 (Verified)</p>
    </div>
  </div>
</div>

<!-- SECTION 1: EXECUTIVE OVERVIEW -->
<h1>1. Executive Summary & Project Purpose</h1>

<p class="lead-p">
  <strong>TRACE-X</strong> is a next-generation <em>Intelligence-Fusion and Cyber-Investigation Suite</em> designed to convert fragmented, high-volume raw signals (network logs, financial wire transfers, dark-web intercepts, domain registrations, crypto ledgers, and communication records) into verified, prioritized investigative leads.
</p>

<div class="callout hindi">
  <div class="callout-title">💡 Hindi / Hinglish Summary (TRACE-X Kya Hai Aur Kyon Banaya Gaya Hai?)</div>
  Jab bhi koi large cyber attack, financial scam, ya organised crime ki investigation hoti hai, to sara data alag-alag format aur sources me bikhra hota hai (jaise IP logs, Bitcoin wallet hashes, encrypted aliases, phone numbers). Investigator ke liye in lakho dots ko manually connect karna lagbhag asambhav hota hai.<br><br>
  <strong>TRACE-X ka kaam hai:</strong> In sabhi disconnected signals ko ek central intelligence engine me fuse karna, entity resolution algorithm se suspects ke hidden aliases ko match karna, force-directed graph se relationships visualize karna, aur AI Copilot ki madad se accurate lead ranking provide karna taaki case jaldi solve ho sake with 100% legal evidence traceability.
</div>

<h2>Core Investigative Workflow</h2>
<pre>
 [ Raw Data Ingestion ] ---> [ Signal Normalization ] ---> [ Entity Resolution Engine ]
          |
          v
 [ Relationship Graph ] ---> [ Anomaly & Threat ML ]  ---> [ Prioritized Leads & Case Board ]
          |
          v
 [ Dual-Engine AI Copilot ] + [ Interactive Threat Map ] + [ Legal Evidence & Exported Reports ]
</pre>

<div class="grid-3">
  <div class="card">
    <div class="card-header">
      <span class="card-title">Entity Resolution</span>
      <span class="badge badge-purple">Automated Matching</span>
    </div>
    <p style="font-size: 11.5px; color: #475569;">
      Alag-alag emails, crypto wallets, hardware MAC IDs aur aliases ko ek single verified suspect entity profile se link karta hai.
    </p>
  </div>
  <div class="card">
    <div class="card-header">
      <span class="card-title">Graph Link Analysis</span>
      <span class="badge badge-blue">Multi-Hop Links</span>
    </div>
    <p style="font-size: 11.5px; color: #475569;">
      Hidden networks, intermediary bridge nodes, money mules aur shell companies ke connections ko visual node graph me dikhata hai.
    </p>
  </div>
  <div class="card">
    <div class="card-header">
      <span class="card-title">AI Analyst Copilot</span>
      <span class="badge badge-green">Natural Language</span>
    </div>
    <p style="font-size: 11.5px; color: #475569;">
      Case summaries generate karta hai, highest risk nodes calculate karta hai, aur real-time telemetry queries answer karta hai.
    </p>
  </div>
</div>

<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

<!-- SECTION 2: SYSTEM ARCHITECTURE -->
<h1>2. Full-Stack Technology Architecture</h1>

<table>
  <thead>
    <tr>
      <th>Layer / Component</th>
      <th>Stack & Libraries</th>
      <th>Core Technical Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Frontend UI & Visualization</strong></td>
      <td>React 18, Vite, Vanilla JS/TS, Tailwind CSS, HTML5 Canvas, SVG Graphing, Lucide Icons</td>
      <td>High-speed SPA router, cyber-themed dark mode, interactive canvas threat map, force-directed graph renderer, real-time alert ticker.</td>
    </tr>
    <tr>
      <td><strong>Backend API Server</strong></td>
      <td>Node.js, Express.js REST API, Helmet, CORS, JWT Auth, Bcrypt, Dotenv</td>
      <td>Business rules, authentication gatekeeper, scoring algorithms, ingestion pipeline handlers, evidence hashing, query routers.</td>
    </tr>
    <tr>
      <td><strong>Data Storage Layer</strong></td>
      <td>PostgreSQL Relational DB, Sequelize / pg Schema</td>
      <td>Structured relational models: Entities, Relationships, Signals, Investigations, Evidence, Alerts, Users & Audit Logs.</td>
    </tr>
    <tr>
      <td><strong>Intelligence & Copilot Engine</strong></td>
      <td>Dual-Engine TRACE-X AI Assistant, Statistical ML Heuristics</td>
      <td>Contextual case synthesis, automated bridge-node scoring, risk classification, query search & dossier extraction.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<!-- SECTION 3: WEBPAGE BY WEBPAGE DETAILED EXPLANATION -->
<h1>3. Complete Webpage-by-Webpage & Module Guide</h1>
<p class="lead-p">
  TRACE-X platform ke total <strong>14 core pages aur components</strong> ka comprehensive breakdown neeche diya gaya hai:
</p>

<!-- 3.1 AUTH -->
<div class="webpage-card">
  <h3>
    <span>3.1. Authentication & Security Clearance (<code>#login</code> / <code>#signup</code>)</span>
    <span class="badge badge-purple">Access Control</span>
  </h3>
  <p><strong>Purpose:</strong> System ko unauthorized access se secure rakhna aur investigator clearance level verify karna.</p>
  <ul>
    <li><strong>UI Components:</strong> Cyber-styled login form, Security Clearance status banner, Demo Quick-Login shortcut button, Registration view.</li>
    <li><strong>Security Measures:</strong> Passwords bcrypt hashing ke sath store hote hain, aur session JWT (JSON Web Token) bearer token ke through manage hota hai.</li>
    <li><strong>Data Flow:</strong> User credentials enter karta hai -> Backend <code>/api/auth/login</code> verify karta hai -> Signed JWT return hota hai -> Local state initialize hoti hai -> Main investigation dashboard load hota hai.</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Ye application ka gatekeeper hai. Investigators yaha se secure login karte hain aur demo testing ke liye single-click credentials provide kiye gaye hain.
  </span>
</div>

<!-- 3.2 DASHBOARD -->
<div class="webpage-card">
  <h3>
    <span>3.2. Executive Dashboard (<code>#dashboard</code>)</span>
    <span class="badge badge-blue">Mission Control</span>
  </h3>
  <p><strong>Purpose:</strong> Overall intelligence posture, prioritized leads, critical threat indicators aur live operational stats ka centralized overview.</p>
  <ul>
    <li><strong>Metric KPI Cards:</strong> Total Targets Tracked, Active Operations (e.g. Operation Orion), High-Risk Alerts, Raw Signals Ingested.</li>
    <li><strong>Threat Posture Meter:</strong> Real-time calculated threat severity level (Low, Moderate, Elevated, Critical).</li>
    <li><strong>Lead Prioritization Feed:</strong> Highest risk suspect nodes jinpar immediate investigation action required hai.</li>
    <li><strong>Fast Actions:</strong> One-click navigation to Network Analysis, Threat Map, or Report Generation.</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Ye main control room hai jaha officer ko ek nazar me pata chalta hai ki kitne active threats hain aur kis suspect par pehle focus karna hai.
  </span>
</div>

<!-- 3.3 INVESTIGATIONS -->
<div class="webpage-card">
  <h3>
    <span>3.3. Investigation & Case Management (<code>#investigations</code>)</span>
    <span class="badge badge-amber">Case Operations</span>
  </h3>
  <p><strong>Purpose:</strong> Complex forensic investigations aur multi-agency operations ko track aur organize karna.</p>
  <ul>
    <li><strong>Case Board:</strong> Har case ka Title (e.g. Operation Orion), Assigned Lead Investigator, Priority Level, Status (Open, In Progress, Under Review, Closed).</li>
    <li><strong>Case Actions:</strong> "Create New Investigation", "Export Case Brief", "Link Additional Evidence / IOCs".</li>
    <li><strong>Cross-Entity Tagging:</strong> Ek case me multiple suspect entities, compromised servers aur financial records ko link kiya ja sakta hai.</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Yaha alag-alag criminal cases bante hain. Har case me kaun sa officer assigned hai aur case ki kya progress hai, sab track hota hai.
  </span>
</div>

<!-- 3.4 GLOBAL THREAT MAP -->
<div class="webpage-card">
  <h3>
    <span>3.4. Global Threat Map & Geospatial Telemetry (<code>#map</code>)</span>
    <span class="badge badge-red">Geospatial Intelligence</span>
  </h3>
  <p><strong>Purpose:</strong> International cyber infrastructure, command & control (C2) servers, money laundering routes aur target locations ko world map par track karna.</p>
  <ul>
    <li><strong>Interactive Canvas Map:</strong> High-performance canvas-based world map with dynamic zoom, panning, aur coordinate plotting.</li>
    <li><strong>Animated Trajectory Arcs:</strong> Data exfiltration ya suspicious cross-border financial transactions ko pulsing arcs ke roop me dikhata hai.</li>
    <li><strong>Node Inspector Card:</strong> Kisi bhi location marker par click karne par IP Address, ASN, Hosting Provider, Threat Score aur linked suspect info pop-up hoti hai.</li>
    <li><strong>Geospatial Filters:</strong> Country-wise filter, Severity filter, Node-type filter (C2 Server, Proxy, Mule Account, Exit Node).</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Ye live world map hai jisme dikhta hai ki cyber attacks ya funds kis country se kis country me travel kar rahe hain.
  </span>
</div>

<!-- 3.5 ENTITY REGISTRY & PROFILE -->
<div class="webpage-card">
  <h3>
    <span>3.5. Entity Intelligence Registry & Deep Profile (<code>#entities</code> & <code>#entity</code>)</span>
    <span class="badge badge-green">Target Registry</span>
  </h3>
  <p><strong>Purpose:</strong> Sabhi identified targets (individuals, hacker groups, crypto wallets, server infrastructure) ka master catalog.</p>
  <ul>
    <li><strong>Instant Search & Filter:</strong> Target ID (e.g. ALPHA-17), Alias, Type ya Confidence level se real-time search.</li>
    <li><strong>Entity Profile Overview:</strong>
      <ul style="margin-top: 4px;">
        <li><strong>Threat Score Gauge:</strong> Calculated risk rating (0 - 100%).</li>
        <li><strong>IOC Matrix:</strong> Linked IP addresses, Crypto addresses (BTC/ETH/USDT), Domains, Phone numbers.</li>
        <li><strong>Known Aliases:</strong> Resolved identities across different platforms (Dark web handles, Telegram IDs).</li>
        <li><strong>Ingest IOC Action:</strong> Naye indicators of compromise directly add karne ka workflow.</li>
      </ul>
    </li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Ye suspects ki kundli / profile directory hai jisme unke sabhi fake names, IP addresses, phone aur crypto wallets ek jagah dikhte hain.
  </span>
</div>

<div class="page-break"></div>

<!-- 3.6 NETWORK GRAPH -->
<div class="webpage-card">
  <h3>
    <span>3.6. Interactive Network Graph & Link Analysis (<code>#network</code>)</span>
    <span class="badge badge-purple">Graph Visualizer</span>
  </h3>
  <p><strong>Purpose:</strong> Complex hidden relationships, communication loops aur financial syndicates ko visual force-directed graph me reveal karna.</p>
  <ul>
    <li><strong>Interactive Canvas / SVG Graph:</strong> Real-time physics-based nodes and edges simulation (zoom, drag, node selection).</li>
    <li><strong>Multi-Hop Discovery:</strong> 1-Hop, 2-Hop ya N-Hop relationship expansion to expose hidden intermediaries.</li>
    <li><strong>Bridge Node Detection:</strong> Jo key operators alag-alag cyber criminal gangs ko connect karte hain unhe automatically flag karta hai.</li>
    <li><strong>Relationship Weight:</strong> Edges par transaction volume, communication frequency ya confidence score display hota hai.</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Ye visual web / connection graph hai. Kaun kiske sath baat kar raha hai ya paise bhej raha hai, ye visually connect karke dikhata hai.
  </span>
</div>

<!-- 3.7 TIMELINE -->
<div class="webpage-card">
  <h3>
    <span>3.7. Chronological Signal Timeline (<code>#timeline</code>)</span>
    <span class="badge badge-blue">Temporal Analytics</span>
  </h3>
  <p><strong>Purpose:</strong> Attack progression ya fraud sequence ko chronological order me step-by-step reconstruct karna.</p>
  <ul>
    <li><strong>Time-Sequenced Events:</strong> Har signal ka exact timestamp, involved suspect, activity type aur severity rating.</li>
    <li><strong>Temporal Filtering:</strong> Filter by date ranges, specific targets, ya event categories (e.g. Unauthorized Login, C2 Beacon, Wire Transfer).</li>
    <li><strong>Multi-Entity Overlay:</strong> Ek sath do alag targets ke simultaneous actions ko compare karke coordination detect karna.</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Ye incident ki time-machine hai jo batati hai ki pehle kya hua, fir hacker ne kya kiya aur kab fraud execute hua.
  </span>
</div>

<!-- 3.8 FUSION -->
<div class="webpage-card">
  <h3>
    <span>3.8. Multi-Source Intelligence Fusion (<code>#fusion</code>)</span>
    <span class="badge badge-amber">Data Ingestion</span>
  </h3>
  <p><strong>Purpose:</strong> Raw unstructured aur structured data feeds ko ingest karke standardized intelligence me convert karna.</p>
  <ul>
    <li><strong>Supported Ingestion:</strong> CSV/JSON logs, PCAP network metadata, threat feeds, manual evidence submissions.</li>
    <li><strong>Automated Pipeline:</strong> Ingestion -> Data Cleaning -> Deduplication -> Entity Matching -> Graph Association.</li>
    <li><strong>Real-Time Stream Feed:</strong> Live stream of ingested intelligence signals with validation flags.</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Yaha alag-alag files aur logs upload hote hain jinhe system automatically analyze karke connect kar deta hai.
  </span>
</div>

<!-- 3.9 TRENDS -->
<div class="webpage-card">
  <h3>
    <span>3.9. Threat Trends & Anomaly Analytics (<code>#trends</code>)</span>
    <span class="badge badge-red">Statistical Engine</span>
  </h3>
  <p><strong>Purpose:</strong> Large-scale trends, attack spikes aur anomalous patterns ko identify karna.</p>
  <ul>
    <li><strong>Trend Visualizations:</strong> Daily signal volumes, high-severity anomaly bursts, target vulnerability distributions.</li>
    <li><strong>Pattern Recognition:</strong> Coordinated botnet activity ya abnormal money transfer spikes ko auto-detect karta hai.</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Ye graphical graphs aur charts dikhata hai ki threats kab badh rahe hain aur kaun sa pattern abnormal hai.
  </span>
</div>

<!-- 3.10 ALERTS -->
<div class="webpage-card">
  <h3>
    <span>3.10. Real-Time Threat Alert Center (<code>#alerts</code>)</span>
    <span class="badge badge-red">Active Triaging</span>
  </h3>
  <p><strong>Purpose:</strong> Machine learning aur rule-based triggers se generate hone wale critical alerts ka triage console.</p>
  <ul>
    <li><strong>Severity Levels:</strong> Critical (Red), High (Orange), Medium (Yellow), Low (Blue).</li>
    <li><strong>Triage Workflow:</strong> Acknowledge Alert, Escalate to New Case, Link to Existing Investigation, Dismiss False Positive.</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Ye emergency warning center hai. Jaise hi koi high-risk event hota hai, yaha turant notification aati hai.
  </span>
</div>

<!-- 3.11 EVIDENCE -->
<div class="webpage-card">
  <h3>
    <span>3.11. Evidence Locker & Chain of Custody (<code>#evidence</code>)</span>
    <span class="badge badge-green">Forensic Integrity</span>
  </h3>
  <p><strong>Purpose:</strong> Digital evidence items ko tamper-proof record aur cryptographic SHA-256 integrity ke sath manage karna.</p>
  <ul>
    <li><strong>Evidence Vault:</strong> PCAP captures, server logs, financial ledgers, email headers with secure cryptographic checksums.</li>
    <li><strong>Chain of Custody Tracking:</strong> Kis investigator ne kab evidence upload kiya, view kiya ya export kiya ka permanent log.</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Court me pesh karne layak digital sabuto ka locker jaha saboot ka hash aur timestamp safe rehta hai.
  </span>
</div>

<!-- 3.12 REPORTS -->
<div class="webpage-card">
  <h3>
    <span>3.12. Structured Intelligence Reporting (<code>#reports</code>)</span>
    <span class="badge badge-purple">Dossier Builder</span>
  </h3>
  <p><strong>Purpose:</strong> Validated findings ko standard law enforcement aur executive intelligence dossiers me compile karna.</p>
  <ul>
    <li><strong>Dossier Generator:</strong> Executive Summary, Suspect Matrix, Timeline Breakdown, Evidence Proof, aur Recommended Actions automatically compile karta hai.</li>
    <li><strong>Exporting:</strong> Print-ready PDF report generation aur structured JSON export.</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Pure case ki formal report aur PDF export karne ka module.
  </span>
</div>

<!-- 3.13 AUDIT & 3.14 COPILOT -->
<div class="webpage-card">
  <h3>
    <span>3.13. Audit Trails (<code>#audit</code>) & 3.14. TRACE-X AI Copilot Analyst</span>
    <span class="badge badge-blue">Compliance & Dual AI</span>
  </h3>
  <p><strong>Audit Trails:</strong> Har user action, query, edit aur login ka tamper-evident log maintain karta hai legal compliance ke liye.</p>
  <p><strong>TRACE-X AI Copilot (Shortcut: <code>⌘ J</code> ya Floating Icon):</strong></p>
  <ul>
    <li><strong>Executive Briefing:</strong> "Summarize Operation Orion" prompt se instant case summary deta hai.</li>
    <li><strong>Threat Scoring:</strong> Highest risk targets aur bridge nodes identify karta hai.</li>
    <li><strong>Natural Language Query:</strong> Database ke kisi bhi target ya IOC ke bare me conversational analysis provide karta hai.</li>
  </ul>
  <span class="hindi-text">
    <strong>💡 Saral Bhasha Me:</strong> Audit logs har activity ka hisaab rakhte hain, aur AI Copilot ek smart personal assistant hai jo case solve karne me madad karta hai.
  </span>
</div>

<div class="page-break"></div>

<!-- SECTION 4: BACKEND REST APIS -->
<h1>4. Backend REST API Architecture & Endpoints</h1>

<p class="lead-p">
  Backend Express.js server clean REST API architecture follow karta hai. Niche sabhi main endpoints ki details hain:
</p>

<table>
  <thead>
    <tr>
      <th>Endpoint Route</th>
      <th>HTTP Method</th>
      <th>Controller / Responsibility</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/api/auth/login</code></td>
      <td>POST</td>
      <td>Investigator credentials verify karke JWT access token return karta hai.</td>
    </tr>
    <tr>
      <td><code>/api/auth/signup</code></td>
      <td>POST</td>
      <td>Naya investigator account register karta hai with hashed password.</td>
    </tr>
    <tr>
      <td><code>/api/entities</code></td>
      <td>GET / POST</td>
      <td>Tracked entities ki list fetch karta hai ya naya suspect/IOC add karta hai.</td>
    </tr>
    <tr>
      <td><code>/api/entities/:id</code></td>
      <td>GET / PUT</td>
      <td>Specific target ka deep profile data, aliases aur threat score return karta hai.</td>
    </tr>
    <tr>
      <td><code>/api/relationships</code></td>
      <td>GET / POST</td>
      <td>Network link graph ke liye source-to-target connections & edge types provide karta hai.</td>
    </tr>
    <tr>
      <td><code>/api/signals</code></td>
      <td>GET / POST</td>
      <td>Multi-source telemetry signals fetch karta hai ya naye logs ingest karta hai.</td>
    </tr>
    <tr>
      <td><code>/api/investigations</code></td>
      <td>GET / POST</td>
      <td>Active cases aur operations create aur track karta hai.</td>
    </tr>
    <tr>
      <td><code>/api/evidence</code></td>
      <td>GET / POST</td>
      <td>Cryptographic hashes ke sath forensic artifacts aur chain-of-custody manage karta hai.</td>
    </tr>
    <tr>
      <td><code>/api/alerts</code></td>
      <td>GET / PUT</td>
      <td>Real-time threat notifications fetch karta hai aur triage status update karta hai.</td>
    </tr>
    <tr>
      <td><code>/api/ai/query</code></td>
      <td>POST</td>
      <td>AI Copilot queries process karke dynamic intelligence responses formulate karta hai.</td>
    </tr>
    <tr>
      <td><code>/api/reports</code></td>
      <td>GET / POST</td>
      <td>Formal investigation reports generate aur retrieve karta hai.</td>
    </tr>
    <tr>
      <td><code>/api/audit</code></td>
      <td>GET</td>
      <td>System compliance aur user activity audit logs provide karta hai.</td>
    </tr>
  </tbody>
</table>

<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

<!-- SECTION 5: HOW TO RUN -->
<h1>5. Step-by-Step Local Setup & Execution</h1>

<div class="callout success">
  <div class="callout-title">⚡ Quickest Method: Use <code>start-tracex.bat</code></div>
  Project directory me bani <code>start-tracex.bat</code> script par double-click karein. Ye automatically Backend aur Frontend dono ko parallel terminal me start kar degi!
</div>

<h3>Manual Terminal Instructions:</h3>
<div class="grid-2">
  <div class="card">
    <div class="card-title">1. Backend Setup</div>
    <pre>cd Backend
npm install
npm run dev</pre>
    <p style="font-size: 11.5px; color: #475569;">
      Server <code>http://localhost:5000</code> par chalega with REST endpoints ready.
    </p>
  </div>
  <div class="card">
    <div class="card-title">2. Frontend Setup</div>
    <pre>cd frontend
npm install
npm run dev</pre>
    <p style="font-size: 11.5px; color: #475569;">
      Vite dev server <code>http://localhost:5173</code> par launch ho jayega.
    </p>
  </div>
</div>

<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

<!-- SECTION 6: VIVA / PRESENTATION TALKING POINTS -->
<h1>6. Key Viva & Presentation Talking Points</h1>

<div class="grid-2">
  <div class="card" style="border-left: 4px solid #10b981;">
    <div class="card-title">Q: TRACE-X traditional security tools se alag kaise hai?</div>
    <p style="font-size: 11.5px; margin-top: 6px;">
      Traditional tools isolated logs dikhate hain. TRACE-X multi-source signals ko fuse karke entity resolution, graph link analysis aur automated lead prioritization provide karta hai.
    </p>
  </div>
  <div class="card" style="border-left: 4px solid #6366f1;">
    <div class="card-title">Q: Force-Directed Graph ka kya fayda hai?</div>
    <p style="font-size: 11.5px; margin-top: 6px;">
      Complex fraud syndicates me intermediary bridge operators hote hain jo directly connect nahi dikhte. Multi-hop graph analysis unhe instantly expose kar deta hai.
    </p>
  </div>
  <div class="card" style="border-left: 4px solid #3b82f6;">
    <div class="card-title">Q: Evidence Locker ki kya importance hai?</div>
    <p style="font-size: 11.5px; margin-top: 6px;">
      Forensic chain-of-custody aur SHA-256 cryptographic hashes ensure karte hain ki court of law me digital evidence tamper-proof aur legally valid rahe.
    </p>
  </div>
  <div class="card" style="border-left: 4px solid #8b5cf6;">
    <div class="card-title">Q: AI Copilot kaise assist karta hai?</div>
    <p style="font-size: 11.5px; margin-top: 6px;">
      Investigator ko manually hazaro logs padhne ki zaroorat nahi padti. AI Copilot instant case briefings, threat rankings aur pattern anomalies summarize kar deta hai.
    </p>
  </div>
</div>

<div style="margin-top: 25px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
  TRACE-X Intelligence Platform Complete Documentation · Generated for Technical Presentation & Project Submission
</div>

</body>
</html>
"""

html_path = os.path.abspath("tracex_doc_temp.html")
pdf_path = os.path.abspath("TRACE_X_Complete_Explanation_Guide.pdf")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

user_data_dir = os.path.join(tempfile.gettempdir(), "chrome_pdf_profile")
os.makedirs(user_data_dir, exist_ok=True)

chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
browser = chrome_exe if os.path.exists(chrome_exe) else edge_exe

cmd = [
    browser,
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    f"--user-data-dir={user_data_dir}",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Executing PDF compilation...")
res = subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(pdf_path):
    print(f"SUCCESS: PDF generated at: {pdf_path} (Size: {os.path.getsize(pdf_path)} bytes)")
else:
    print("FAILED:", res.stderr)
