import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createIcons, icons } from "lucide";
import { icon, escapeHtml, priorityBadge } from "./ui.js";
import { pushToast, selectEntity } from "./state.js";
import { navigate } from "./router.js";
import { recordAuditEvent } from "./api.js";

function refreshMapIcons() {
  createIcons({ icons, attrs: { "stroke-width": 1.8 } });
}

export const threatNodes = [
  {
    id: "NODE-FRA-01",
    city: "Frankfurt",
    country: "Germany",
    countryCode: "DE",
    flag: "🇩🇪",
    lat: 50.1109,
    lng: 8.6821,
    type: "C2 Bulletproof Relay",
    ip: "185.220.101.5",
    asn: "AS206499 (Flokinet DE)",
    severity: "CRITICAL",
    riskScore: 94,
    entityId: "ORION-NODE-03",
    status: "ACTIVE EXFILTRATION",
    bandwidth: "14.8 GB / 24h",
    description: "Primary Command & Control hub transmitting high-volume encrypted payloads into Eastern European staging servers. Strong temporal correlation with Operation Orion.",
    connections: ["NODE-NYC-06", "NODE-REYK-02", "NODE-AMS-14"]
  },
  {
    id: "NODE-REYK-02",
    city: "Reykjavik",
    country: "Iceland",
    countryCode: "IS",
    flag: "🇮🇸",
    lat: 64.1466,
    lng: -21.9426,
    type: "Bulletproof Seed Node",
    ip: "193.105.134.9",
    asn: "AS61138 (1984 ehf)",
    severity: "CRITICAL",
    riskScore: 91,
    entityId: "ALPHA-17",
    status: "MONITORED",
    bandwidth: "8.2 GB / 24h",
    description: "Offshore hosting enclave maintaining mirrors of darknet transaction ledgers and pseudonym databases.",
    connections: ["NODE-FRA-01"]
  },
  {
    id: "NODE-ZUR-03",
    city: "Zurich",
    country: "Switzerland",
    countryCode: "CH",
    flag: "🇨🇭",
    lat: 47.3769,
    lng: 8.5417,
    type: "Escrow Mixing Gateway",
    ip: "194.26.29.11",
    asn: "AS49392 (InterNoc)",
    severity: "HIGH",
    riskScore: 86,
    entityId: "MARKET-NODE-08",
    status: "SUSPICIOUS TRANSIT",
    bandwidth: "3.4 GB / 24h",
    description: "Automated crypto mixing point routing multi-hop privacy coin settlements from Market Node 08.",
    connections: ["NODE-DXB-08"]
  },
  {
    id: "NODE-SIN-04",
    city: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    flag: "🇸🇬",
    lat: 1.3521,
    lng: 103.8198,
    type: "APAC Routing Proxy",
    ip: "103.152.220.44",
    asn: "AS13335 (Cloudflare SG)",
    severity: "HIGH",
    riskScore: 79,
    entityId: "BETA-04",
    status: "ACTIVE INTERCEPT",
    bandwidth: "19.1 GB / 24h",
    description: "High-throughput transit proxy used as a secondary rendezvous server for Operation Orion communication bursts.",
    connections: ["NODE-TYO-05", "NODE-DXB-08"]
  },
  {
    id: "NODE-TYO-05",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    flag: "🇯🇵",
    lat: 35.6762,
    lng: 139.6503,
    type: "Encrypted Data Mirror",
    ip: "133.242.18.22",
    asn: "AS9370 (SAKURA Internet)",
    severity: "MEDIUM",
    riskScore: 68,
    entityId: "EAST-EXCHANGE-04",
    status: "PASSIVE LISTENING",
    bandwidth: "6.5 GB / 24h",
    description: "Encrypted optical tap synchronizing regional threat indicators and financial transaction logs.",
    connections: ["NODE-SIN-04"]
  },
  {
    id: "NODE-NYC-06",
    city: "New York",
    country: "United States",
    countryCode: "US",
    flag: "🇺🇸",
    lat: 40.7128,
    lng: -74.006,
    type: "Financial Sector Target",
    ip: "198.51.100.41",
    asn: "AS15169 (NYC Financial Core)",
    severity: "CRITICAL",
    riskScore: 96,
    entityId: "ORION-HUB-01",
    status: "TARGET BEACON DETECTED",
    bandwidth: "32.4 GB / 24h",
    description: "Key corporate network targeted by distributed credential stuffing and API exfiltration probes from Frankfurt C2.",
    connections: ["NODE-FRA-01", "NODE-SAO-10"]
  },
  {
    id: "NODE-LON-07",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    flag: "🇬🇧",
    lat: 51.5074,
    lng: -0.1278,
    type: "Telecom Intercept Tap",
    ip: "185.190.140.12",
    asn: "AS20857 (London IX)",
    severity: "MEDIUM",
    riskScore: 64,
    entityId: "SOURCE-07",
    status: "COLLECTION ACTIVE",
    bandwidth: "4.1 GB / 24h",
    description: "Carrier-level optical tap recording recurring pseudonym exchanges and encrypted handshakes.",
    connections: ["NODE-AMS-14"]
  },
  {
    id: "NODE-DXB-08",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    flag: "🇦🇪",
    lat: 25.2048,
    lng: 55.2708,
    type: "Offshore OTC Settlement",
    ip: "94.200.12.89",
    asn: "AS5384 (Emirates Telecommunications)",
    severity: "HIGH",
    riskScore: 83,
    entityId: "MARKET-NODE-11",
    status: "FINANCIAL MONITOR",
    bandwidth: "11.2 GB / 24h",
    description: "Peer-to-peer liquidity provider observed receiving rapid split transactions from darknet marketplaces.",
    connections: ["NODE-ZUR-03"]
  },
  {
    id: "NODE-BUC-09",
    city: "Bucharest",
    country: "Romania",
    countryCode: "RO",
    flag: "🇷🇴",
    lat: 44.4268,
    lng: 26.1025,
    type: "Botnet Staging Cluster",
    ip: "188.241.112.7",
    asn: "AS9009 (M247 Europe)",
    severity: "HIGH",
    riskScore: 88,
    entityId: "DELTA-22",
    status: "ACTIVE SCANNING",
    bandwidth: "21.6 GB / 24h",
    description: "High-density VPS cluster scanning financial gateway ports across Western European IP ranges.",
    connections: ["NODE-AMS-14"]
  },
  {
    id: "NODE-SAO-10",
    city: "Sao Paulo",
    country: "Brazil",
    countryCode: "BR",
    flag: "🇧🇷",
    lat: -23.5505,
    lng: -46.6333,
    type: "LATAM Proxy Network",
    ip: "177.18.90.15",
    asn: "AS28573 (Claro Brasil)",
    severity: "MEDIUM",
    riskScore: 62,
    entityId: "KAPPA-09",
    status: "FORWARDING ACTIVE",
    bandwidth: "5.8 GB / 24h",
    description: "Proxy exit chain routing obscured network reconnaissance probes into North American targets.",
    connections: ["NODE-NYC-06"]
  },
  {
    id: "NODE-SYD-11",
    city: "Sydney",
    country: "Australia",
    countryCode: "AU",
    flag: "🇦🇺",
    lat: -33.8688,
    lng: 151.2093,
    type: "Pacific Rim Telemetry",
    ip: "139.130.4.5",
    asn: "AS1221 (Telstra AU)",
    severity: "MEDIUM",
    riskScore: 59,
    entityId: "ECHO-11",
    status: "MONITORED",
    bandwidth: "3.7 GB / 24h",
    description: "Subsea cable telemetry monitoring node identifying recurring encrypted beacon patterns.",
    connections: ["NODE-SIN-04"]
  },
  {
    id: "NODE-MUM-12",
    city: "Mumbai",
    country: "India",
    countryCode: "IN",
    flag: "🇮🇳",
    lat: 19.076,
    lng: 72.8777,
    type: "VPN Concentration Hub",
    ip: "103.21.244.2",
    asn: "AS55836 (Reliance Jio)",
    severity: "HIGH",
    riskScore: 77,
    entityId: "RELAY-NODE-14",
    status: "TRAFFIC BURST",
    bandwidth: "16.4 GB / 24h",
    description: "Commercial VPN concentration gateway with high-frequency encrypted tunnel connections to Frankfurt relay.",
    connections: ["NODE-FRA-01"]
  },
  {
    id: "NODE-SEO-13",
    city: "Seoul",
    country: "South Korea",
    countryCode: "KR",
    flag: "🇰🇷",
    lat: 37.5665,
    lng: 126.978,
    type: "APT Staging Controller",
    ip: "211.233.77.10",
    asn: "AS9318 (SK Broadband)",
    severity: "CRITICAL",
    riskScore: 92,
    entityId: "ALPHA-17",
    status: "ACTIVE C2 DISPATCH",
    bandwidth: "12.7 GB / 24h",
    description: "Fast-flux domain controller orchestrating automated credential stuffing tasks across East Asian endpoints.",
    connections: ["NODE-TYO-05"]
  },
  {
    id: "NODE-AMS-14",
    city: "Amsterdam",
    country: "Netherlands",
    countryCode: "NL",
    flag: "🇳🇱",
    lat: 52.3676,
    lng: 4.9041,
    type: "IXP Optical Convergence",
    ip: "195.69.144.1",
    asn: "AS1200 (AMS-IX Core)",
    severity: "HIGH",
    riskScore: 81,
    entityId: "NORTH-ROUTE-12",
    status: "CONVERGENCE NODE",
    bandwidth: "27.5 GB / 24h",
    description: "Major European internet exchange intersection where Operation Orion North Route packets converge.",
    connections: ["NODE-FRA-01"]
  },
  {
    id: "NODE-STK-15",
    city: "Stockholm",
    country: "Sweden",
    countryCode: "SE",
    flag: "🇸🇪",
    lat: 59.3293,
    lng: 18.0686,
    type: "Failover C2 Cluster",
    ip: "193.180.119.4",
    asn: "AS8473 (Bahnhof AB)",
    severity: "HIGH",
    riskScore: 87,
    entityId: "ZETA-88",
    status: "STANDBY SYNC",
    bandwidth: "9.6 GB / 24h",
    description: "Secondary bunker-hosted server maintaining synchronized mirrors of exfiltration databases.",
    connections: ["NODE-FRA-01", "NODE-REYK-02"]
  },
  {
    id: "NODE-TOR-16",
    city: "Toronto",
    country: "Canada",
    countryCode: "CA",
    flag: "🇨🇦",
    lat: 43.6532,
    lng: -79.3832,
    type: "Shadow API Gateway",
    ip: "199.19.224.50",
    asn: "AS812 (Rogers Telecom)",
    severity: "HIGH",
    riskScore: 82,
    entityId: "ORION-HUB-01",
    status: "TARGET PROBE DETECTED",
    bandwidth: "18.3 GB / 24h",
    description: "Secondary financial API gateway receiving coordinated token replay payloads.",
    connections: ["NODE-NYC-06"]
  },
  {
    id: "NODE-HKG-17",
    city: "Hong Kong",
    country: "Hong Kong",
    countryCode: "HK",
    flag: "🇭🇰",
    lat: 22.3193,
    lng: 114.1694,
    type: "Dark Pool Escrow Relay",
    ip: "103.243.24.18",
    asn: "AS135377 (HKIX)",
    severity: "CRITICAL",
    riskScore: 93,
    entityId: "MARKET-NODE-08",
    status: "HIGH-VELOCITY SETTLEMENT",
    bandwidth: "24.1 GB / 24h",
    description: "High-frequency crypto arbitrage tunnel executing automated Monero obfuscation cycles.",
    connections: ["NODE-SIN-04", "NODE-DXB-08"]
  },
  {
    id: "NODE-TLV-18",
    city: "Tel Aviv",
    country: "Israel",
    countryCode: "IL",
    flag: "🇮🇱",
    lat: 32.0853,
    lng: 34.7818,
    type: "Threat Telemetry Sensor",
    ip: "185.190.140.99",
    asn: "AS12849 (Hot Telecom)",
    severity: "MEDIUM",
    riskScore: 66,
    entityId: "SOURCE-05",
    status: "PASSIVE INTERCEPT",
    bandwidth: "5.1 GB / 24h",
    description: "Regional threat intelligence probe detecting automated exploitation attempts against banking protocols.",
    connections: ["NODE-FRA-01"]
  },
  {
    id: "NODE-JNB-19",
    city: "Johannesburg",
    country: "South Africa",
    countryCode: "ZA",
    flag: "🇿🇦",
    lat: -26.2041,
    lng: 28.0473,
    type: "Subsea Transit Point",
    ip: "196.25.1.1",
    asn: "AS37457 (Liquid Intelligent)",
    severity: "MEDIUM",
    riskScore: 57,
    entityId: "KAPPA-09",
    status: "MONITORED",
    bandwidth: "4.4 GB / 24h",
    description: "African undersea transit sensor correlating long-distance encrypted session flows.",
    connections: ["NODE-LON-07"]
  },
  {
    id: "NODE-MAD-20",
    city: "Madrid",
    country: "Spain",
    countryCode: "ES",
    flag: "🇪🇸",
    lat: 40.4168,
    lng: -3.7038,
    type: "Iberian Relay Tap",
    ip: "195.53.12.8",
    asn: "AS12479 (Telefonica ES)",
    severity: "MEDIUM",
    riskScore: 63,
    entityId: "SOURCE-07",
    status: "PACKET LOGGING",
    bandwidth: "7.8 GB / 24h",
    description: "Southern European fiber tap intercepting secondary fast-flux proxy traffic.",
    connections: ["NODE-AMS-14"]
  }
];

export const threatTrajectories = [
  { from: "NODE-REYK-02", to: "NODE-FRA-01", type: "ENCRYPTED C2 SYNC", color: "#ec746e", speed: 2800 },
  { from: "NODE-FRA-01", to: "NODE-NYC-06", type: "DATA EXFILTRATION STREAM", color: "#ec746e", speed: 2200 },
  { from: "NODE-SEO-13", to: "NODE-TYO-05", type: "APT BEACONING PULSE", color: "#ec746e", speed: 2500 },
  { from: "NODE-TYO-05", to: "NODE-SIN-04", type: "RELAYED SESSION TUNNEL", color: "#5dd9db", speed: 3000 },
  { from: "NODE-SIN-04", to: "NODE-HKG-17", type: "ESCROW SETTLEMENT VECTOR", color: "#e7b86b", speed: 2700 },
  { from: "NODE-HKG-17", to: "NODE-DXB-08", type: "LAUNDERING ROUTE", color: "#e7b86b", speed: 3200 },
  { from: "NODE-DXB-08", to: "NODE-ZUR-03", type: "CAPITAL UNLINKING", color: "#e7b86b", speed: 3100 },
  { from: "NODE-BUC-09", to: "NODE-AMS-14", type: "BOTNET SCAN SWEEP", color: "#ec746e", speed: 2400 },
  { from: "NODE-MUM-12", to: "NODE-FRA-01", type: "VPN TUNNEL HANDSHAKE", color: "#5dd9db", speed: 2900 },
  { from: "NODE-SAO-10", to: "NODE-NYC-06", type: "CREDENTIAL STUFFING RELAY", color: "#906ff0", speed: 3600 },
  { from: "NODE-STK-15", to: "NODE-FRA-01", type: "FAILOVER C2 MIRROR", color: "#5dd9db", speed: 2600 },
  { from: "NODE-NYC-06", to: "NODE-TOR-16", type: "CROSS-BORDER PROBE", color: "#ec746e", speed: 2300 },
  { from: "NODE-MAD-20", to: "NODE-AMS-14", type: "TRANSIT CONVERGENCE", color: "#5dd9db", speed: 2800 },
  { from: "NODE-JNB-19", to: "NODE-LON-07", type: "SUBSEA OPTIC BEACON", color: "#906ff0", speed: 3500 }
];

export const TILE_PROVIDERS = {
  "google-hybrid": {
    name: "Google Satellite Hybrid",
    badge: "GOOGLE DIRECT / NO KEY NEEDED",
    url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: "0123",
    maxZoom: 20,
    requiresKey: false,
    description: "High-resolution Google Satellite imagery fused with road and city boundary vectors."
  },
  "google-roadmap": {
    name: "Google Maps Tactical Roadmap",
    badge: "GOOGLE DIRECT / NO KEY NEEDED",
    url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: "0123",
    maxZoom: 20,
    requiresKey: false,
    description: "Standard Google Maps road infrastructure and high-density location telemetry."
  },
  "google-terrain": {
    name: "Google Shaded Terrain",
    badge: "GOOGLE DIRECT / NO KEY NEEDED",
    url: "https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    subdomains: "0123",
    maxZoom: 20,
    requiresKey: false,
    description: "3D topographical contours and elevation relief by Google Maps."
  },
  "carto-light": {
    name: "CARTO Positron Light",
    badge: "TACTICAL LIGHT / NO KEY NEEDED",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    maxZoom: 19,
    requiresKey: false,
    description: "Crisp, clean high-contrast light cartography optimized for light workspace mode."
  },
  "carto-dark": {
    name: "CARTO Dark Matter",
    badge: "TACTICAL DARK / NO KEY NEEDED",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    maxZoom: 19,
    requiresKey: false,
    description: "High-contrast tactical dark canvas optimized for low-latency visual intelligence."
  },
  "esri-dark": {
    name: "Esri World Dark Gray Canvas",
    badge: "FAILSAFE / NO KEY NEEDED",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    subdomains: "",
    maxZoom: 16,
    requiresKey: false,
    description: "Enterprise GIS defense layer with guaranteed uptime and zero rate-limiting."
  },
  "osm-standard": {
    name: "OpenStreetMap (Standard)",
    badge: "OPEN COMMUNITY",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    maxZoom: 19,
    requiresKey: false,
    description: "Global open-source topographic and street network map."
  },
  "mapbox-dark": {
    name: "Mapbox Dark v11",
    badge: "MAPBOX PUBLIC",
    url: "https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token={API_KEY}",
    subdomains: "",
    maxZoom: 20,
    requiresKey: true,
    keyPlaceholder: "pk.eyJ1Ijo...",
    description: "Ultra-high-definition vector dark navigation and tactical styling from Mapbox."
  },
  "maptiler-dark": {
    name: "MapTiler Dataviz Dark",
    badge: "MAPTILER CLOUD",
    url: "https://api.maptiler.com/maps/dataviz-dark/256/{z}/{x}/{y}.png?key={API_KEY}",
    subdomains: "",
    maxZoom: 20,
    requiresKey: true,
    keyPlaceholder: "e.g. your_maptiler_key",
    description: "Tailored intelligence visualization tiles from MapTiler Cloud."
  },
  "custom": {
    name: "Custom TMS / Tile Server",
    badge: "ENTERPRISE PROXY",
    url: "{CUSTOM_URL}",
    subdomains: "abc",
    maxZoom: 20,
    requiresKey: false,
    description: "Internal GIS server or proxy with custom {z}/{x}/{y} URL template."
  }
};

let mapInstance = null;
let currentTileLayer = null;
let markersLayer = null;
let arcsLayer = null;
let animationFrameId = null;
let telemetryTimer = null;
let currentFilterSeverity = "ALL";
let activeSelectedNodeId = "NODE-FRA-01";
let isSimulationPlaying = true;

export function applyTileLayer(providerKey, apiKey = "", customUrl = "") {
  if (!mapInstance) return;

  const defaultKey = (document.documentElement.getAttribute("data-theme") === "light") ? "carto-light" : "carto-dark";
  const keyToUse = providerKey || localStorage.getItem("tracex_map_provider") || defaultKey;
  const provider = TILE_PROVIDERS[keyToUse] || TILE_PROVIDERS[defaultKey] || TILE_PROVIDERS["carto-light"];

  if (currentTileLayer) {
    try {
      mapInstance.removeLayer(currentTileLayer);
    } catch (e) {
      console.warn("Could not remove existing tile layer", e);
    }
    currentTileLayer = null;
  }

  let finalUrl = provider.url;
  if (keyToUse === "custom") {
    finalUrl = customUrl || localStorage.getItem("tracex_map_custom_url") || TILE_PROVIDERS["carto-dark"].url;
  } else if (provider.requiresKey) {
    const key = apiKey || localStorage.getItem("tracex_map_api_key") || "";
    if (!key) {
      pushToast(`API Key required for ${provider.name}. Switched to failsafe Esri Dark layer.`, "error");
      applyTileLayer("esri-dark");
      return;
    }
    finalUrl = finalUrl.replace("{API_KEY}", encodeURIComponent(key));
  }

  const options = {
    maxZoom: provider.maxZoom || 19,
    detectRetina: true
  };
  if (provider.subdomains) {
    options.subdomains = provider.subdomains;
  }

  currentTileLayer = L.tileLayer(finalUrl, options);

  // Attach failsafe auto-fallback handler
  currentTileLayer.on("tileerror", () => {
    if (keyToUse !== "esri-dark") {
      console.warn(`Tile load failure on ${provider.name}. Reverting to failsafe Esri Dark Canvas.`);
      applyTileLayer("esri-dark");
    }
  });

  currentTileLayer.addTo(mapInstance);
}

export function openMapSettingsModal() {
  const currentProvider = localStorage.getItem("tracex_map_provider") || "carto-dark";
  const currentApiKey = localStorage.getItem("tracex_map_api_key") || "";
  const currentCustomUrl = localStorage.getItem("tracex_map_custom_url") || "";

  const providersHtml = Object.entries(TILE_PROVIDERS).map(([key, p]) => `
    <div class="tile-provider-card ${key === currentProvider ? "active" : ""}" data-provider-key="${key}">
      <div class="provider-card-top">
        <span class="provider-name">${escapeHtml(p.name)}</span>
        <span class="provider-badge ${p.requiresKey ? "key" : "free"}">${p.badge}</span>
      </div>
      <p class="provider-desc">${escapeHtml(p.description)}</p>
    </div>
  `).join("");

  const content = `
    <div class="modal-header">
      <div>
        <span class="eyebrow"><i class="active-pulse cyan" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#5dd9db;box-shadow:0 0 8px #5dd9db;margin-right:6px;"></i>GEO-SPATIAL MAP ENGINE CONFIGURATION</span>
        <h2>Map Tile Providers & API Key Manager</h2>
      </div>
      <button class="icon-button" id="btnCloseMapOverlay" aria-label="Close modal">${icon("x")}</button>
    </div>

    <div class="map-config-modal-body">
      <div class="map-config-banner">
        ${icon("shield-check")}
        <div>
          <strong>Tactical Tile Engine:</strong> Zero-key defense dark tiles (<strong>CARTO Dark Matter</strong> & <strong>Esri Dark Canvas</strong>) are active out-of-the-box with zero configuration required. If you wish to use <strong>Mapbox</strong>, <strong>MapTiler</strong>, or <strong>Stadia Maps</strong>, enter your custom API key below to unlock vector satellite and dark navigation layers.
        </div>
      </div>

      <div class="tile-providers-grid" id="tileProvidersGrid">
        ${providersHtml}
      </div>

      <div class="api-key-input-box">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
          <span class="form-label" style="margin-bottom:0;">${icon("key")} MAP SERVICE API KEY / ACCESS TOKEN</span>
          <span style="font-size:10px;color:var(--cyan);font-family:var(--mono);">
            Free key links: 
            <a href="https://account.mapbox.com/auth/signup/" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;margin-right:6px;">Mapbox</a>
            <a href="https://cloud.maptiler.com/auth/signup/" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">MapTiler</a>
          </span>
        </div>
        <input type="text" id="mapApiKeyInput" class="form-input code-font" placeholder="e.g. pk.eyJ1IjoiYWRtaW4iLC..." value="${escapeHtml(currentApiKey)}" />
        <span class="form-hint">Tip: <strong>CARTO Dark Matter</strong> and <strong>Esri Dark Canvas</strong> require <u>NO API KEY</u> and work 100% free right now.</span>

        <label class="form-group full" id="mapCustomUrlGroup" style="margin-top:10px; display:${currentProvider === "custom" ? "flex" : "none"};">
          <span class="form-label">${icon("globe")} CUSTOM TILE SERVER URL TEMPLATE</span>
          <input type="text" id="mapCustomUrlInput" class="form-input code-font" placeholder="https://{s}.tiles.yourserver.com/{z}/{x}/{y}.png" value="${escapeHtml(currentCustomUrl)}" />
          <span class="form-hint">Standard TMS format with {z}, {x}, {y} placeholders.</span>
        </label>
      </div>

      <div class="modal-actions" style="margin-top:16px;padding:0;">
        <button type="button" class="button button-secondary" id="btnCancelMapConfig">Cancel</button>
        <button type="button" class="button button-glow" id="btnSaveMapConfig">
          ${icon("check-circle-2")} Save & Apply Map Layer
        </button>
      </div>
    </div>
  `;

  const root = document.getElementById("overlay-root");
  if (!root) return;
  root.innerHTML = `<div class="overlay-backdrop" id="mapOverlayBackdrop"><div class="overlay-card modal-overlay map-config-modal is-open" role="dialog" aria-modal="true" data-overlay-card>${content}</div></div>`;
  refreshMapIcons();

  let selectedKey = currentProvider;

  // Handle provider selection
  const grid = document.getElementById("tileProvidersGrid");
  if (grid) {
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".tile-provider-card");
      if (!card) return;
      grid.querySelectorAll(".tile-provider-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      selectedKey = card.dataset.providerKey;

      const customGroup = document.getElementById("mapCustomUrlGroup");
      if (customGroup) {
        customGroup.style.display = selectedKey === "custom" ? "flex" : "none";
      }

      const p = TILE_PROVIDERS[selectedKey];
      const keyInput = document.getElementById("mapApiKeyInput");
      if (keyInput && p.keyPlaceholder) {
        keyInput.placeholder = p.keyPlaceholder;
      }
    });
  }

  // Handle Close
  const closeBtn = document.getElementById("btnCloseMapOverlay");
  const cancelBtn = document.getElementById("btnCancelMapConfig");
  const backdrop = document.getElementById("mapOverlayBackdrop");
  const close = () => { root.innerHTML = ""; };
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (cancelBtn) cancelBtn.addEventListener("click", close);
  if (backdrop) backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  // Handle Save
  const saveBtn = document.getElementById("btnSaveMapConfig");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const apiKeyVal = document.getElementById("mapApiKeyInput")?.value.trim() || "";
      const customUrlVal = document.getElementById("mapCustomUrlInput")?.value.trim() || "";

      localStorage.setItem("tracex_map_provider", selectedKey);
      if (apiKeyVal) localStorage.setItem("tracex_map_api_key", apiKeyVal);
      if (customUrlVal) localStorage.setItem("tracex_map_custom_url", customUrlVal);

      applyTileLayer(selectedKey, apiKeyVal, customUrlVal);
      close();
      pushToast(`Map tile layer updated to ${TILE_PROVIDERS[selectedKey]?.name || selectedKey}!`, "success");
    });
  }
}

export function renderThreatMapPage() {
  const criticalCount = threatNodes.filter((n) => n.severity === "CRITICAL").length;
  const highCount = threatNodes.filter((n) => n.severity === "HIGH").length;
  const totalBw = threatNodes.reduce((acc, n) => acc + parseFloat(n.bandwidth), 0).toFixed(1);

  return `
    <div class="threat-map-layout">
      <!-- HUD Top Bar -->
      <header class="map-hud-bar">
        <div class="hud-brand">
          <span class="hud-radar-pulse"></span>
          <div>
            <div class="hud-eyebrow">TACTICAL GEO-SPATIAL INTELLIGENCE</div>
            <h2>GLOBAL THREAT RADAR <span class="badge-live-pulse">LIVE TRACKING</span></h2>
          </div>
        </div>

        <div class="hud-metrics">
          <div class="hud-metric-box">
            <span class="hud-label">MONITORED HUBS</span>
            <strong class="hud-val hud-cyan">${threatNodes.length}</strong>
            <small>12 Countries</small>
          </div>
          <div class="hud-metric-box">
            <span class="hud-label">CRITICAL ATTACK VECTORS</span>
            <strong class="hud-val hud-red">${criticalCount}</strong>
            <small>${highCount} High Priority</small>
          </div>
          <div class="hud-metric-box">
            <span class="hud-label">ACTIVE TRAJECTORIES</span>
            <strong class="hud-val hud-amber">${threatTrajectories.length}</strong>
            <small>Live Arcs</small>
          </div>
          <div class="hud-metric-box">
            <span class="hud-label">INTERCEPT VOLUME</span>
            <strong class="hud-val hud-violet">${totalBw} GB</strong>
            <small>Last 24h</small>
          </div>
        </div>

        <div class="hud-actions">
          <button class="button button-secondary button-sm" id="btnMapConfig" title="Configure Map Tiles & API Key">
            ${icon("settings")} <span>MAP TILES & API KEY</span>
          </button>
          <button class="button button-secondary button-sm" id="btnToggleSim" title="Pause or Resume Trajectory Pulse">
            ${icon("play")} <span>LIVE STREAM</span>
          </button>
          <button class="button button-primary button-sm" id="btnResetMap" title="Reset World View">
            ${icon("globe")} <span>FIT WORLD</span>
          </button>
        </div>
      </header>

      <!-- Map Toolbar & Filters -->
      <div class="map-toolbar">
        <div class="map-search-box">
          ${icon("search")}
          <input id="mapSearchInput" placeholder="Search by city, country, IP or entity (e.g. Frankfurt, ALPHA-17, 185.220)…" autocomplete="off" />
        </div>

        <div class="map-filter-group">
          <span class="filter-label">SEVERITY:</span>
          <button class="filter-chip active" data-map-filter="ALL">ALL (${threatNodes.length})</button>
          <button class="filter-chip filter-critical" data-map-filter="CRITICAL">CRITICAL (${criticalCount})</button>
          <button class="filter-chip filter-high" data-map-filter="HIGH">HIGH (${highCount})</button>
          <button class="filter-chip filter-medium" data-map-filter="MEDIUM">MEDIUM</button>
        </div>

        <div class="map-quick-links">
          <button class="button button-ghost button-sm" data-route="network">${icon("share-2")} Network Graph</button>
          <button class="button button-ghost button-sm" data-route="alerts">${icon("triangle-alert")} Review Queue</button>
        </div>
      </div>

      <!-- Main Map Body with Canvas / Leaflet + Inspector Drawer -->
      <div class="map-stage-container">
        <div id="threatLeafletMap" class="threat-leaflet-stage"></div>

        <!-- Telemetry Intercept Stream (Bottom Left Ticker) -->
        <aside class="map-telemetry-panel">
          <div class="telemetry-header">
            <div>
              <span class="telemetry-dot"></span>
              <strong>SIGINT / OSINT TELEMETRY STREAM</strong>
            </div>
            <span class="telemetry-rate">24 evt/min</span>
          </div>
          <div class="telemetry-feed-scroll" id="telemetryFeedScroll">
            <!-- Dynamically populated -->
          </div>
        </aside>

        <!-- Right Tactical Intel Inspector Drawer -->
        <aside class="map-inspector-drawer" id="mapInspectorDrawer">
          ${renderInspectorContent(threatNodes.find((n) => n.id === activeSelectedNodeId) || threatNodes[0])}
        </aside>
      </div>
    </div>
  `;
}

function renderInspectorContent(node) {
  if (!node) return "";
  const severityClass = node.severity.toLowerCase();

  return `
    <div class="inspector-card">
      <div class="inspector-header">
        <div class="inspector-flag-box">
          <span class="inspector-flag">${node.flag}</span>
          <div>
            <div class="inspector-eyebrow">${escapeHtml(node.countryCode)} · ${escapeHtml(node.country.toUpperCase())}</div>
            <h3>${escapeHtml(node.city)}</h3>
          </div>
        </div>
        <button class="icon-button" id="btnCloseInspector" title="Close details">${icon("x")}</button>
      </div>

      <div class="inspector-badge-row">
        <span class="threat-severity-pill ${severityClass}">${icon("shield-alert")} ${node.severity}</span>
        <span class="threat-status-tag">${escapeHtml(node.status)}</span>
      </div>

      <!-- Threat Score Meter -->
      <div class="inspector-score-card">
        <div class="score-top">
          <span>THREAT SEVERITY INDEX</span>
          <strong>${node.riskScore}<span>/100</span></strong>
        </div>
        <div class="score-bar">
          <div class="score-bar-fill ${severityClass}" style="width: ${node.riskScore}%;"></div>
        </div>
        <div class="score-desc">Calculated from IP reputation, beaconing velocity and linked Orion records.</div>
      </div>

      <!-- Technical Telemetry Spec -->
      <div class="inspector-spec-grid">
        <div class="spec-row">
          <span>NODE ID</span>
          <b class="mono">${escapeHtml(node.id)}</b>
        </div>
        <div class="spec-row">
          <span>INFRASTRUCTURE</span>
          <b>${escapeHtml(node.type)}</b>
        </div>
        <div class="spec-row">
          <span>IP ADDRESS</span>
          <b class="mono">${escapeHtml(node.ip)}</b>
        </div>
        <div class="spec-row">
          <span>AUTONOMOUS SYSTEM</span>
          <small class="mono">${escapeHtml(node.asn)}</small>
        </div>
        <div class="spec-row">
          <span>COORDINATES</span>
          <small class="mono">${node.lat.toFixed(4)}°N, ${node.lng.toFixed(4)}°E</small>
        </div>
        <div class="spec-row">
          <span>BANDWIDTH OBSERVED</span>
          <b>${escapeHtml(node.bandwidth)}</b>
        </div>
        <div class="spec-row highlighted-row">
          <span>LINKED ENTITY</span>
          <button class="inspector-entity-link" data-open-entity="${node.entityId}">
            ${icon("fingerprint")} <strong>${escapeHtml(node.entityId)}</strong>
          </button>
        </div>
      </div>

      <!-- Intelligence Context -->
      <div class="inspector-analysis">
        <div class="analysis-label">${icon("file-text")} ANALYST BRIEFING</div>
        <p>${escapeHtml(node.description)}</p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="inspector-actions">
        <button class="button button-primary button-wide" id="btnInspectorGraph" data-entity-id="${node.entityId}">
          ${icon("share-2")} Inspect in Network Graph
        </button>
        <button class="button button-secondary button-wide" id="btnInspectorProfile" data-entity-id="${node.entityId}">
          ${icon("user-search")} View Full Entity Profile
        </button>
        <button class="button button-ghost button-wide" id="btnInspectorEvidence" data-node-id="${node.id}">
          ${icon("folder-plus")} Log Geolocation Evidence
        </button>
      </div>
    </div>
  `;
}

let resizeHandler = null;

export function initThreatMap() {
  const container = document.getElementById("threatLeafletMap");
  if (!container) return;

  // Clean up any stale map
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  // Initialize Leaflet Map with a tactical dark world center
  mapInstance = L.map("threatLeafletMap", {
    center: [28.0, 18.0],
    zoom: 2.6,
    minZoom: 2,
    maxZoom: 10,
    zoomControl: false,
    attributionControl: false,
    worldCopyJump: true
  });

  // Apply configured or failsafe Tiles
  const defaultProvider = (document.documentElement.getAttribute("data-theme") === "light") ? "carto-light" : "carto-dark";
  applyTileLayer(localStorage.getItem("tracex_map_provider") || defaultProvider);

  // Tactical Zoom Control in top-right
  L.control.zoom({ position: "topright" }).addTo(mapInstance);

  // Layers for Markers and Arcs
  arcsLayer = L.layerGroup().addTo(mapInstance);
  markersLayer = L.layerGroup().addTo(mapInstance);

  // Render elements
  renderMarkers();
  renderTrajectoryArcs();
  startArcPulseAnimation();
  startTelemetryFeed();
  setupEventListeners();

  // Handle map resizing and tile calculation
  resizeHandler = () => {
    if (mapInstance) mapInstance.invalidateSize();
  };
  window.addEventListener("resize", resizeHandler);

  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
    refreshMapIcons();
  }, 150);

  refreshMapIcons();
}

function renderMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  const filtered = threatNodes.filter((node) => {
    if (currentFilterSeverity === "ALL") return true;
    return node.severity === currentFilterSeverity;
  });

  filtered.forEach((node) => {
    const isSelected = node.id === activeSelectedNodeId;
    const severityClass = node.severity.toLowerCase();

    const customIcon = L.divIcon({
      className: "tactical-marker-wrap",
      html: `
        <div class="tactical-marker ${severityClass} ${isSelected ? "selected" : ""}" data-node-id="${node.id}">
          <div class="pulse-ring"></div>
          <div class="pulse-core"></div>
          <div class="marker-label">
            <span class="marker-flag">${node.flag}</span>
            <span class="marker-city">${node.city}</span>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const marker = L.marker([node.lat, node.lng], { icon: customIcon, riseOnHover: true });

    marker.on("click", () => {
      selectMapNode(node.id, true);
    });

    markersLayer.addLayer(marker);
  });
}

function computeCurvePoints(p1, p2, numPoints = 30) {
  const [lat1, lng1] = p1;
  const [lat2, lng2] = p2;

  // Midpoint with an offset to create a curved trajectory arc
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Elevate arc upward or outward proportional to distance
  const curvature = Math.min(dist * 0.18, 22);
  const controlLat = midLat + curvature;
  const controlLng = midLng - (dy > 0 ? curvature * 0.2 : -curvature * 0.2);

  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * controlLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * controlLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
}

function renderTrajectoryArcs() {
  if (!arcsLayer) return;
  arcsLayer.clearLayers();

  threatTrajectories.forEach((traj) => {
    const fromNode = threatNodes.find((n) => n.id === traj.from);
    const toNode = threatNodes.find((n) => n.id === traj.to);
    if (!fromNode || !toNode) return;

    // Filter check: only show if both or at least one is visible under current filter
    if (currentFilterSeverity !== "ALL") {
      if (fromNode.severity !== currentFilterSeverity && toNode.severity !== currentFilterSeverity) return;
    }

    const curvePoints = computeCurvePoints([fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]);

    // Background glow line
    const bgLine = L.polyline(curvePoints, {
      color: traj.color,
      weight: 4,
      opacity: 0.15,
      interactive: false,
      smoothFactor: 1
    });

    // Foreground animated tactical trajectory line
    const fgLine = L.polyline(curvePoints, {
      color: traj.color,
      weight: 1.8,
      dashArray: "6, 12",
      opacity: 0.85,
      className: "animated-trajectory-arc",
      interactive: true
    });

    fgLine.on("click", () => {
      pushToast(`Trajectory: ${fromNode.city} ➔ ${toNode.city} (${traj.type})`, "info");
      selectMapNode(fromNode.id, false);
    });

    arcsLayer.addLayer(bgLine);
    arcsLayer.addLayer(fgLine);
  });
}

function startArcPulseAnimation() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  let offset = 0;
  function animate() {
    if (isSimulationPlaying) {
      offset -= 0.65;
      const paths = document.querySelectorAll(".animated-trajectory-arc");
      paths.forEach((path) => {
        path.style.strokeDashoffset = offset;
      });
    }
    animationFrameId = requestAnimationFrame(animate);
  }
  animate();
}

function startTelemetryFeed() {
  if (telemetryTimer) clearInterval(telemetryTimer);

  const sampleEvents = [
    { entity: "ORION-NODE-03", city: "Frankfurt", text: "Encrypted payload exfiltrated to C2 (185.220.101.5)", sev: "CRITICAL", id: "NODE-FRA-01" },
    { entity: "ALPHA-17", city: "Reykjavik", text: "Onion mirror seed updated with new pseudonym entries", sev: "CRITICAL", id: "NODE-REYK-02" },
    { entity: "MARKET-NODE-08", city: "Zurich", text: "Automated crypto mixing settlement detected (4.2 BTC)", sev: "HIGH", id: "NODE-ZUR-03" },
    { entity: "BETA-04", city: "Singapore", text: "Proxy rendezvous established with Pacific cluster", sev: "HIGH", id: "NODE-SIN-04" },
    { entity: "EAST-EXCHANGE-04", city: "Tokyo", text: "Fiber tap telemetry matched Operation Orion signature", sev: "MEDIUM", id: "NODE-TYO-05" },
    { entity: "ORION-HUB-01", city: "New York", text: "Credential stuffing spike detected against financial API", sev: "CRITICAL", id: "NODE-NYC-06" },
    { entity: "MARKET-NODE-11", city: "Dubai", text: "P2P escrow liquidity burst flagged for review", sev: "HIGH", id: "NODE-DXB-08" },
    { entity: "DELTA-22", city: "Bucharest", text: "Port 443 scanning wave originated from M247 subnet", sev: "HIGH", id: "NODE-BUC-09" },
    { entity: "RELAY-NODE-14", city: "Mumbai", text: "Encrypted Wireguard tunnel linked with Frankfurt C2", sev: "HIGH", id: "NODE-MUM-12" },
    { entity: "NORTH-ROUTE-12", city: "Amsterdam", text: "Optical transit packet correlation confirmed", sev: "HIGH", id: "NODE-AMS-14" },
    { entity: "ZETA-88", city: "Stockholm", text: "Failover C2 database snapshot synchronized via encrypted pipeline", sev: "HIGH", id: "NODE-STK-15" },
    { entity: "ORION-HUB-01", city: "Toronto", text: "OAuth2 authentication token replay attack intercepted", sev: "HIGH", id: "NODE-TOR-16" },
    { entity: "MARKET-NODE-08", city: "Hong Kong", text: "High-frequency Monero dark pool conversion transaction verified", sev: "CRITICAL", id: "NODE-HKG-17" },
    { entity: "SOURCE-05", city: "Tel Aviv", text: "Zero-day payload signature intercepted on banking honeypot", sev: "MEDIUM", id: "NODE-TLV-18" },
    { entity: "KAPPA-09", city: "Johannesburg", text: "Subsea fiber optical metadata matched Operation Orion handshake", sev: "MEDIUM", id: "NODE-JNB-19" },
    { entity: "SOURCE-07", city: "Madrid", text: "Iberian fast-flux proxy rotation flagged by network heuristics", sev: "MEDIUM", id: "NODE-MAD-20" }
  ];

  const feedScroll = document.getElementById("telemetryFeedScroll");
  if (!feedScroll) return;

  // Pre-seed initial 4 events
  for (let i = 0; i < 4; i++) {
    pushTelemetryItem(sampleEvents[i % sampleEvents.length]);
  }

  let index = 4;
  telemetryTimer = setInterval(() => {
    if (!isSimulationPlaying) return;
    const evt = sampleEvents[index % sampleEvents.length];
    pushTelemetryItem(evt);
    index++;
  }, 4200);
}

function pushTelemetryItem(evt) {
  const feedScroll = document.getElementById("telemetryFeedScroll");
  if (!feedScroll) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const row = document.createElement("button");
  row.className = `telemetry-item-row sev-${evt.sev.toLowerCase()}`;
  row.dataset.flyToNode = evt.id;
  row.innerHTML = `
    <span class="tele-time">${timeStr}</span>
    <span class="tele-tag">${escapeHtml(evt.city)}</span>
    <span class="tele-msg"><b>${escapeHtml(evt.entity)}:</b> ${escapeHtml(evt.text)}</span>
    <span class="tele-sev">${evt.sev}</span>
  `;

  feedScroll.insertBefore(row, feedScroll.firstChild);

  // Keep max 15 items in DOM
  while (feedScroll.children.length > 15) {
    feedScroll.removeChild(feedScroll.lastChild);
  }
}

function selectMapNode(nodeId, flyTo = true) {
  activeSelectedNodeId = nodeId;
  const node = threatNodes.find((n) => n.id === nodeId);
  if (!node) return;

  // Update and reveal Inspector Drawer
  const inspector = document.getElementById("mapInspectorDrawer");
  if (inspector) {
    inspector.classList.remove("collapsed");
    inspector.innerHTML = renderInspectorContent(node);
    refreshMapIcons();
  }

  // Highlight Marker in DOM
  document.querySelectorAll(".tactical-marker").forEach((el) => {
    el.classList.toggle("selected", el.dataset.nodeId === nodeId);
  });

  if (flyTo && mapInstance) {
    mapInstance.flyTo([node.lat, node.lng], 5, {
      animate: true,
      duration: 1.2
    });
  }

  pushToast(`Tactical focus: ${node.city} (${node.id})`, "info");
}

function setupEventListeners() {
  // Severity filter buttons
  document.querySelectorAll("[data-map-filter]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll("[data-map-filter]").forEach((b) => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      currentFilterSeverity = e.currentTarget.dataset.mapFilter;
      renderMarkers();
      renderTrajectoryArcs();
      pushToast(`Filter applied: ${currentFilterSeverity} severity`, "info");
    });
  });

  // Search input
  const searchInput = document.getElementById("mapSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) return;

      const found = threatNodes.find(
        (n) =>
          n.city.toLowerCase().includes(q) ||
          n.country.toLowerCase().includes(q) ||
          n.ip.includes(q) ||
          n.entityId.toLowerCase().includes(q) ||
          n.id.toLowerCase().includes(q)
      );

      if (found) {
        selectMapNode(found.id, true);
      }
    });
  }

  // Telemetry row click to fly
  const feedScroll = document.getElementById("telemetryFeedScroll");
  if (feedScroll) {
    feedScroll.addEventListener("click", (e) => {
      const row = e.target.closest("[data-fly-to-node]");
      if (row) {
        selectMapNode(row.dataset.flyToNode, true);
      }
    });
  }

  // Toggle simulation play/pause
  const toggleBtn = document.getElementById("btnToggleSim");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      isSimulationPlaying = !isSimulationPlaying;
      toggleBtn.classList.toggle("active", isSimulationPlaying);
      toggleBtn.querySelector("span").textContent = isSimulationPlaying ? "LIVE STREAM" : "PAUSED";
      pushToast(isSimulationPlaying ? "Live trajectory stream active" : "Trajectory simulation paused", "info");
    });
  }

  // Map Tile & API Key configuration modal
  const configBtn = document.getElementById("btnMapConfig");
  if (configBtn) {
    configBtn.addEventListener("click", () => {
      openMapSettingsModal();
    });
  }

  // Reset map view
  const resetBtn = document.getElementById("btnResetMap");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (mapInstance) {
        mapInstance.flyTo([28.0, 18.0], 2.6, { duration: 1.0 });
      }
    });
  }

  // Inspector action buttons delegation
  const inspector = document.getElementById("mapInspectorDrawer");
  if (inspector) {
    inspector.addEventListener("click", (e) => {
      const closeBtn = e.target.closest("#btnCloseInspector");
      if (closeBtn) {
        inspector.classList.toggle("collapsed");
        return;
      }

      const graphBtn = e.target.closest("#btnInspectorGraph");
      if (graphBtn) {
        const entityId = graphBtn.dataset.entityId;
        selectEntity(entityId);
        navigate("network");
        return;
      }

      const profileBtn = e.target.closest("#btnInspectorProfile");
      if (profileBtn) {
        const entityId = profileBtn.dataset.entityId;
        selectEntity(entityId);
        navigate("entity");
        return;
      }

      const entityLink = e.target.closest("[data-open-entity]");
      if (entityLink) {
        const entityId = entityLink.dataset.openEntity;
        selectEntity(entityId);
        navigate("entity");
        return;
      }

      const evBtn = e.target.closest("#btnInspectorEvidence");
      if (evBtn) {
        const nodeId = evBtn.dataset.nodeId;
        recordAuditEvent("GEO_EVIDENCE_LOGGED", "threat_map", nodeId);
        pushToast(`Geolocation evidence logged for ${nodeId} · SHA-256 verified`, "success");
      }
    });
  }
}

export function destroyThreatMap() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (telemetryTimer) {
    clearInterval(telemetryTimer);
    telemetryTimer = null;
  }
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
  markersLayer = null;
  arcsLayer = null;
}
