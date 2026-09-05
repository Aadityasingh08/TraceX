<div align="center">

# 🛡️ TRACE-X

### **Next-Gen Intelligence Fusion & Cyber Investigation Platform**
*From Fragmented Multi-Source Signals to Verified, Actionable Investigative Leads*

---

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![AI Copilot](https://img.shields.io/badge/AI_Engine-TRACE--X_Copilot-8A2BE2?style=for-the-badge&logo=openai&logoColor=white)](#-ai-intelligence-copilot)
[![Security](https://img.shields.io/badge/Security-JWT%20%7C%20SHA--256-brightgreen?style=for-the-badge&logo=shield&logoColor=white)](#-security--chain-of-custody)
[![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](LICENSE)

[Explore Features](#-key-features) • [System Architecture](#-system-architecture) • [Webpage Modules](#-webpage--module-breakdown) • [Quick Start](#-quick-start-guide) • [API Reference](#-api-endpoints)

---

</div>

## 📌 Overview

During modern cyber crime, financial fraud, and counter-threat operations, investigative intelligence is scattered across disconnected, high-volume data streams (IP traffic, dark-web intercepts, cryptocurrency ledgers, phone records, and communication logs). 

**TRACE-X** bridges this gap by fusing multi-source raw signals into a centralized intelligence pipeline. Utilizing **Entity Resolution algorithms**, **Force-Directed Graph Link Analysis**, **Geospatial Threat Telemetry**, and a **Dual-Engine AI Intelligence Copilot**, TRACE-X uncovers hidden syndicates, bridge nodes, and priority targets with 100% evidentiary integrity.

---

## 🚀 Key Features

<table>
  <tr>
    <td width="50%">
      <h3>🤖 AI Intelligence Copilot (Dual-Engine)</h3>
      Autonomous case analyst accessible via <code>⌘ J</code>. Synthesizes executive briefings for active operations (e.g. <em>Operation Orion</em>), calculates highest-risk targets, and assists with real-time entity interrogation.
    </td>
    <td width="50%">
      <h3>🌍 Global Geospatial Threat Map</h3>
      Interactive Canvas-based world map tracking Command & Control (C2) servers, money laundering routes, and data exfiltration trajectories in real-time with an integrated telemetry inspector.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🕸️ Interactive Graph Link Analysis</h3>
      Force-directed physics graph visualizer uncovering multi-hop connections, intermediary money mules, cluster formations, and hidden relationships between suspects.
    </td>
    <td width="50%">
      <h3>🎯 Automated Entity Resolution</h3>
      Cross-matches disparate indicators of compromise (IOCs) such as aliases, crypto wallets, hardware MACs, emails, and IP subnets into unified target dossiers.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>⏳ Chronological Signal Timeline</h3>
      Step-by-step temporal analysis sequencing cyber incident milestones, attack progression, and multi-suspect coordination overlays.
    </td>
    <td width="50%">
      <h3>🛡️ Tamper-Proof Evidence Locker</h3>
      Forensic artifact custody management secured by SHA-256 cryptographic integrity hashes, ensuring admissibility in legal proceedings.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>⚡ Multi-Source Ingestion & Fusion</h3>
      Streamlined ingestion pipeline supporting CSV, JSON, network PCAP metadata, threat intelligence feeds, and manual IOC submissions.
    </td>
    <td width="50%">
      <h3>📑 Structured Intelligence Reports</h3>
      One-click dossier builder compiling executive summaries, suspect link matrices, timeline breakdowns, and automated print-ready PDF export.
    </td>
  </tr>
</table>

---

## 🏛️ System Architecture

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      RAW DATA INGESTION SOURCES                        │
 │   Network PCAP  │  Crypto Ledgers  │  OSINT Feeds  │  Log Streams      │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                    INTELLIGENCE FUSION LAYER                           │
 │        Data Normalization  │  Deduplication  │  IOC Parsing            │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                ENTITY RESOLUTION & GRAPH ENGINE                        │
 │     Alias Association  │  Multi-Hop Linking  │  Bridge Node Scoring    │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                     TRACE-X INVESTIGATION SUITE                        │
 │  Executive Dashboard  │  Threat Map  │  Graph Analytics  │  AI Copilot │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Webpage & Module Breakdown

TRACE-X includes **14 dedicated operational views and modules**:

| Route / Module | Primary Purpose | Key Components |
| :--- | :--- | :--- |
| **`#login` / `#signup`** | Security Clearance & Auth | Role-based clearance, bcrypt hashing, JWT session bearer tokens. |
| **`#dashboard`** | Executive Mission Control | Threat posture gauge, priority lead rankings, KPI telemetry cards. |
| **`#investigations`** | Case Management Board | Multi-agency cases (e.g. Operation Orion), lead investigator tracking. |
| **`#map`** | Global Threat Map | Canvas geospatial map, animated exfiltration arcs, target node inspector. |
| **`#entities` / `#entity`** | Entity Registry & Profiles | Deep target dossiers, risk scoring (0-100%), IOC matrix & known aliases. |
| **`#network`** | Link Analysis Graph | Force-directed physics network, multi-hop discovery, cluster tagging. |
| **`#timeline`** | Signal Chronology | Temporal event sequencing, attack progression, suspect time overlays. |
| **`#fusion`** | Multi-Source Ingestion | Structured/unstructured log ingestion, real-time validation stream. |
| **`#trends`** | Anomaly Analytics | Attack frequency spikes, volume trends, vulnerability distribution. |
| **`#alerts`** | Real-Time Triage Center | Severity classification (Critical/High/Medium/Low), case escalation. |
| **`#evidence`** | Digital Evidence Vault | Artifact custody tracking, SHA-256 checksums, chain-of-custody log. |
| **`#reports`** | Intelligence Dossiers | Executive report builder, evidentiary matrix, export to PDF & JSON. |
| **`#audit`** | Compliance & Governance | Immutable user action logs, forensic access history, compliance trails. |
| **`AI Copilot (⌘ J)`** | Intelligent Virtual Analyst | Natural language query assistant, automated briefing & lead ranking. |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript/JavaScript, Tailwind CSS, HTML5 Canvas, SVG Graphing, Lucide Icons.
- **Backend API**: Node.js, Express.js REST API, Helmet, CORS, JWT Auth, Bcrypt.
- **Database**: PostgreSQL with Relational Schema (`database/schema.sql`).
- **Machine Learning**: Statistical Anomaly Detection & Dual-Engine Copilot (`ml/pipelines`).
- **Documentation**: High-resolution print-ready guide [`TRACE_X_Complete_Explanation_Guide.pdf`](./TRACE_X_Complete_Explanation_Guide.pdf).

---

## ⚡ Quick Start Guide

### Option 1: One-Click Startup (Windows)
Double-click **`start-tracex.bat`** in the root directory. This automatically launches both the Backend API and Frontend Dev server in parallel terminals!

### Option 2: Manual Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Aadityasingh08/TraceX.git
cd TraceX
```

#### 2. Start the Backend API
```bash
cd Backend
npm install
npm run dev
# Backend running on http://localhost:5000
```

#### 3. Start the Frontend
```bash
cd ../frontend
npm install
npm run dev
# Frontend running on http://localhost:5173
```

#### 4. Open in Browser
Visit **`http://localhost:5173`** to access the TRACE-X Intelligence Suite.

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Authenticates investigator credentials & issues JWT token. |
| `/api/entities` | `GET` / `POST` | Fetches target registry or ingests a new suspect/IOC. |
| `/api/relationships` | `GET` | Returns graph edge connections and relationship weights. |
| `/api/signals` | `GET` / `POST` | Manages raw telemetry signals & data feeds. |
| `/api/investigations`| `GET` / `POST` | Creates and tracks active operations and cases. |
| `/api/evidence` | `GET` / `POST` | Manages digital forensic artifacts & chain of custody. |
| `/api/alerts` | `GET` / `PUT` | Retrieves real-time alerts & updates triage status. |
| `/api/ai/query` | `POST` | Queries the AI Copilot for intelligence synthesis. |
| `/api/reports` | `GET` / `POST` | Compiles structured case dossiers and intelligence reports. |
| `/api/audit` | `GET` | Retrieves compliance audit trails & security logs. |

---

## 📚 Complete Project Documentation

A comprehensive, print-ready technical dossier with in-depth webpage explanations, data schemas, and architecture diagrams is included in this repository:
- 📄 **[TRACE_X_Complete_Explanation_Guide.pdf](./TRACE_X_Complete_Explanation_Guide.pdf)**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<div align="center">

**Built for Modern Intelligence Fusion & Cyber Defense**  
*TRACE-X Intelligence Platform · All Rights Reserved*

</div>
