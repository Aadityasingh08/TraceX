# 🛡️ TRACE-X: Judge Pitch Script, Feature Breakdown & Raw Data Guide

---

## 📌 PART 1: Code Ke Saare Features & Wo Kaise Kaam Kar Rahe Hain

TraceX ek **Next-Gen Cyber Intelligence Fusion & Investigation Platform** hai jo alag-alag sources (Crypto wallets, IP logs, Chat intercepts, Darknet feeds) ke raw data ko ek jagah fuse karke criminal networks ko expose karta hai.

### 1. ⚡ Multi-Source Ingestion & Fusion Layer (`#fusion` & `Alt + N`)
* **Kaise kaam karta hai:**
  - Public threat feeds (RSS, News feeds, OSINT), forensic logs, aur manual IOC (Indicators of Compromise) ko ingest karta hai.
  - Backend ka `ingestionService.js` raw text se regex aur keyword dictionaries ke through **entities (emails, Bitcoin/Crypto wallets, IP addresses, handles)** extract karta hai.
  - Data ko deduplicate aur normalize karta hai.

### 2. 🎯 Automated Entity Resolution Engine (`#entities`)
* **Kaise kaam karta hai:**
  - Agar do alag-alag case files ya sources me ek hi suspect ka alag alias, email ya crypto wallet mila ho, to ye algorithm unke common attributes match karke **0–100% Identity Match Score** nikalta hai.
  - Investigators ko cross-case suspects ko merge karne ya unka link confirm karne me madad karta hai.

### 3. 🕸️ Interactive Force-Directed Graph Link Analysis (`#network`)
* **Kaise kaam karta hai:**
  - HTML5 Canvas & Physics Engine use karke targets, sources, topics aur financial nodes ka interactive network graph banata hai.
  - **Bridge Nodes & Multi-Hop Connections** identify karta hai (jaise *ALPHA-17* aur *ORION-NODE-03* ke beech hidden money mules ya relays).
  - Degree Centrality aur Connection Density calculate karke high-priority operators ko highlight karta hai.

### 4. 🌍 Global Geospatial Threat Map (`#map`)
* **Kaise kaam karta hai:**
  - Real-time Canvas telemetry map jo Command & Control (C2) servers, money laundering routes aur cross-border data exfiltration trajectories ko live animated arcs ke roop me dikhata hai.
  - Hotspot nodes par click karte hi us location se jude suspects ki details samne aa jati hain.

### 5. 🤖 AI Intelligence Copilot (`⌘ J` / `Ctrl + J`)
* **Kaise kaam karta hai:**
  - `copilot.js` aur backend `aiService.js` ke dual-engine par chalta hai.
  - Natural language me investigation summaries banata hai (e.g. *"Summarize Operation Orion"*), critical threat level detect karta hai, aur unreviewed leads ko triage karta hai.

### 6. ⏳ Chronological Signal Timeline (`#timeline`)
* **Kaise kaam karta hai:**
  - Har signal, intercept aur transaction ko time-series order me sequence karta hai taaki incident kab shuru hua aur attack kaise aage badha, step-by-step dikhe.

### 7. 🛡️ Tamper-Proof Evidence Locker (`#evidence`)
* **Kaise kaam karta hai:**
  - Har uploaded file/artifact ka **SHA-256 cryptographic hash** generate karta hai.
  - Legal court proceedings ke liye Chain-of-Custody maintain karta hai taaki evidence ke sath koi tampering na kar sake.

### 8. 🚨 Real-Time Alerts & Case Management (`#alerts` & `#investigations`)
* **Kaise kaam karta hai:**
  - Threat score ke basis par Critical/High/Medium alerts auto-generate karta hai.
  - Alag-alag operations (jaise *Operation Orion*, *Project Velocity*) ko lead investigators ke assign karta hai.

### 9. 📑 Automated Intelligence Dossiers & PDF Export (`#reports`)
* **Kaise kaam karta hai:**
  - Ek click me suspect link matrix, evidence hash, aur executive summary ka court/senior officials ke liye print-ready intelligence report generate karta hai.

### 10. 🔒 Immutable Audit Logs (`#audit`)
* **Kaise kaam karta hai:**
  - System me kis officer ne kab kaunsa target dekha ya modify kiya, uska immutable audit log banta hai compliance ke liye.

---

## 📂 PART 2: Raw Data Kahan Aur Kaise Daalna Hai?

Raw data daalne ke **4 alag methods** hain:

### Method 1: Live UI se Direct Ingest Karna (Best for Live Demo)
1. Frontend me top-right bar par **`+ INGEST TARGET / IOC`** button par click karein ya **`Alt + N`** press karein.
2. Modal open hoga jahan aap enter kar sakte hain:
   - **Target / Identifier Name:** (e.g., `SUSPECT-WALLET-09` ya `John_DarkNet`)
   - **Entity Type:** `PERSON`, `WALLET`, `CHANNEL`, `LOCATION`, `IP_SUBNET`
   - **Priority Level:** `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
   - **Known Aliases & Digital IOCs:** (e.g., Bitcoin address `bc1q...`, Email `dark@proton.me`, Phone)
   - **Intelligence Sources:** (e.g., `SIGINT, Wiretap, Crypto Ledger`)
   - **Connect to Existing Node:** (e.g., kis suspect se iska connection mila hai)
3. **"Ingest Target into Database"** click karein. Ye turant PostgreSQL database me save hoga aur Network Graph me live plot ho jayega.

---

### Method 2: Public OSINT / RSS Live Feeds se Ingestion (Automated)
1. Route: `#fusion` par jayein ya backend API endpoint hit karein:
   - `POST /api/ingestion/sources` me naye RSS URLs ya threat feeds add karein.
   - `POST /api/ingestion/run` trigger karke live public web feeds se signals ingest karein.
2. Background pipeline automatically keywords, targets aur relations extract karegi.

---

### Method 3: Seed Script / Batch Raw Data daalna (Permanent DB Setup)
Agar aapke paas bulk dataset hai:
1. File open karein: `Backend/src/seed/seed.js`
2. `entitiesData`, `investigationsData`, ya `signals` arrays me apna naya raw dataset add karein:
   ```javascript
   ["TARGET-NAME", "TYPE", "PRIORITY", ["SOURCE-1"], "Description of target / IOC"]
   ```
3. Terminal me `Backend` directory ke andar run karein:
   ```powershell
   npm run seed
   ```
   Ye PostgreSQL tables (`signals`, `entities`, `relationships`, `evidence`) me data load kar dega.

---

### Method 4: Frontend Demo Data (Bina Backend/Offline ke liye)
- Agar backend DB active nahi hai aur sirf frontend mock data chalana hai:
- File: `frontend/src/demo-data.js`
- Yahan `demoEntities`, `demoRelationships`, aur `demoSignals` me data directly add kar sakte hain.

---

## 🎤 PART 3: Judges Ke Saamne Kaise Explain Karna Hai (Winning Pitch Script)

Jab judges ke samne presentation/demo dena ho, to ye **3-Minute Flow** follow karein:

### ⏱️ Minute 1: The Problem & Pitch Hook
> *"Respected Judges, modern cyber crime aur financial syndicates me sabse badi challenge ye hoti hai ki data fragmented hota hai — Bitcoin ledgers, encrypted chats, IP logs, aur darknet forums alag-alag bikhre hote hain. Investigators ko manual correlation me hafto lag jaate hain.*
> 
> *Hamara solution hai **TRACE-X** — ek AI-powered Intelligence Fusion platform jo disconnected raw signals ko realtime me action-ready leads aur visual networks me convert karta hai."*

### ⏱️ Minute 2: Live Demo (Problem-to-Resolution Flow)
1. **Show Executive Dashboard (`#dashboard`)**:
   - *"Ye hamara Mission Control hai jahan live threat level, priority leads, aur cross-source signals monitor ho rahe hain."*
2. **Demonstrate Live Ingestion (`Alt + N`)**:
   - *"Jaise hi hume koi naya raw IOC milta hai (e.g. ek crypto wallet ya alias), hum use direct ingest karte hain."*
3. **Show Network Graph (`#network`)**:
   - *"TRACE-X ka Graph Engine instantly multi-hop connections reveal karta hai. Aap dekh sakte hain kaise ALPHA-17 ek bridge node ke through multiple clusters se linked hai."*
4. **Show Global Threat Map (`#map`)**:
   - *"Ye geospatial view cross-border cash flow aur C2 infrastructure ki physical locations dikhata hai."*
5. **Open AI Copilot (`Ctrl + J` / `⌘ J`)**:
   - *"Investigator ko queries type karne par AI Copilot instantly case executive briefing aur high-risk target prioritization provide karta hai."*

### ⏱️ Minute 3: Security, Evidentiary Integrity & Impact
> *"Court admissibility ke liye humne har digital evidence par **SHA-256 cryptographic hashing** lagaya hai, jisse Chain-of-Custody 100% tamper-proof rehti hai.*
> 
> *In summary, TRACE-X reduces investigation time from days to seconds, empowering law enforcement and cyber intelligence teams with verified leads."*

---

### 💡 Quick Tips for the Presentation:
* **Shortcuts to remember:** 
  - `Alt + N` : Target & IOC Ingestion
  - `Ctrl + J` (or `⌘ J`) : AI Copilot Drawer
  - `Ctrl + K` : Instant Intelligence Search
