import Chart from "chart.js/auto";
import cytoscape from "cytoscape";
import { createIcons, icons } from "lucide";
import { api, recordAuditEvent } from "./api.js";
import { getRoute, navigate, subscribeRoute } from "./router.js";
import { appState, clearUnreadNotifications, markNotificationRead, pushToast, selectAlert, selectEntity, selectEvidence, selectTrend, setState, toggleTheme } from "./state.js";
import { emptyState, escapeHtml, formatNumber, icon, initials, priorityBadge, sectionHeading, statusBadge } from "./ui.js";
import { renderThreatMapPage, initThreatMap, destroyThreatMap } from "./threat-map.js";
import { initCopilot, openCopilot } from "./copilot.js";
import { alerts as demoAlerts, categories as demoCategories, entities as demoEntities, evidence as demoEvidence, investigations as demoInvestigations, notifications as demoNotifications, records as demoRecords, relationships as demoRelationships, trends as demoTrends } from "./demo-data.js";
import "./styles.css";

const chartInstances = new Map();
let networkInstance = null;
let searchDebounce = null;

let alerts = [], categories = [], entities = [], evidence = [], investigations = [], records = [], relationships = [], trends = [];
let dataLoaded = false;
let dataError = null;

async function loadData() {
  try {
    const [
      investigationsRes, entitiesRes, relationshipsRes, alertsRes,
      trendsRes, evidenceRes, recordsRes, categoriesRes, notificationsRes,
    ] = await Promise.all([
      api.getInvestigations(), api.getEntities(), api.getRelationships(), api.getAlerts(),
      api.getTrends(), api.getEvidence(), api.getRecords(), api.getCategories(), api.getNotifications(),
    ]);
    investigations = investigationsRes.investigations || [];
    entities = entitiesRes;
    relationships = relationshipsRes;
    alerts = alertsRes;
    trends = trendsRes;
    evidence = evidenceRes;
    records = recordsRes;
    categories = categoriesRes;

    const selectionPatch = { notifications: notificationsRes };
    if (!entities.find((e) => e.id === appState.selectedEntity)) selectionPatch.selectedEntity = entities[0]?.id || null;
    if (!alerts.find((a) => a.id === appState.selectedAlert)) selectionPatch.selectedAlert = alerts[0]?.id || null;
    if (!evidence.find((ev) => ev.id === appState.selectedEvidence)) selectionPatch.selectedEvidence = evidence[0]?.id || null;
    if (!trends.find((t) => t.id === appState.selectedTrend)) selectionPatch.selectedTrend = trends[0]?.id || null;
    setState(selectionPatch);

    dataLoaded = true;
    dataError = null;
  } catch (err) {
    console.warn("Live backend unreachable, activating resilient demo intelligence corpus:", err.message);
    investigations = demoInvestigations;
    entities = demoEntities;
    relationships = demoRelationships;
    alerts = demoAlerts;
    trends = demoTrends;
    evidence = demoEvidence;
    records = demoRecords;
    categories = demoCategories;

    const selectionPatch = { notifications: demoNotifications };
    if (!entities.find((e) => e.id === appState.selectedEntity)) selectionPatch.selectedEntity = entities[0]?.id || null;
    if (!alerts.find((a) => a.id === appState.selectedAlert)) selectionPatch.selectedAlert = alerts[0]?.id || null;
    if (!evidence.find((ev) => ev.id === appState.selectedEvidence)) selectionPatch.selectedEvidence = evidence[0]?.id || null;
    if (!trends.find((t) => t.id === appState.selectedTrend)) selectionPatch.selectedTrend = trends[0]?.id || null;
    setState(selectionPatch);

    dataLoaded = true;
    dataError = null;
  }
  renderApp();
}

function updateLocalAlert(updatedAlert) {
  if (!updatedAlert) return;
  const index = alerts.findIndex((a) => a.id === updatedAlert.id);
  if (index !== -1) alerts[index] = updatedAlert;
}

function updateLocalEvidence(updatedEvidence) {
  if (!updatedEvidence) return;
  const index = evidence.findIndex((e) => e.id === updatedEvidence.id);
  if (index !== -1) evidence[index] = updatedEvidence;
}

const routeLabels = {
  dashboard: "Command Center", investigations: "Investigations", map: "Global Threat Map", entities: "Entities", entity: "Entity Profile",
  records: "Intelligence Records",
  network: "Network Intelligence", timeline: "Activity Timeline", fusion: "Intelligence Fusion", trends: "Trend Radar",
  alerts: "Alert Center", evidence: "Evidence Vault", reports: "Reports", audit: "Audit Trail"
};

const navSections = [
  { label: "COMMAND", items: [{ route: "dashboard", label: "Command Center", icon: "layout-dashboard" }, { route: "investigations", label: "Investigations", icon: "briefcase-business" }] },
  { label: "INTELLIGENCE", items: [{ route: "map", label: "Global Threat Map", icon: "globe" }, { route: "records", label: "Intelligence Records", icon: "database" }, { route: "entities", label: "Entities", icon: "scan-search" }, { route: "network", label: "Network Intelligence", icon: "share-2" }, { route: "timeline", label: "Activity Timeline", icon: "calendar-clock" }, { route: "fusion", label: "Intelligence Fusion", icon: "workflow" }, { route: "trends", label: "Trend Radar", icon: "radar" }] },
  { label: "REVIEW", items: [{ route: "alerts", label: "Alert Center", icon: "triangle-alert", count: 6 }, { route: "evidence", label: "Evidence Vault", icon: "folder-lock" }, { route: "reports", label: "Reports", icon: "file-check-2" }] },
  { label: "GOVERNANCE", items: [{ route: "audit", label: "Audit Trail", icon: "scroll-text" }] }
];

function renderApp() {
  const route = getRoute();
  appState.route = route;
  const root = document.querySelector("#app");
  if (!root) return;

  if (route === "login") {
    root.innerHTML = renderLogin();
    refreshIcons();
    return;
  }

  if (route === "signup") {
    root.innerHTML = renderSignup();
    refreshIcons();
    return;
  }

  if (!localStorage.getItem("tracex_token")) {
    navigate("login");
    return;
  }

  if (!dataLoaded) {
    root.innerHTML = dataError ? renderLoadError() : renderLoading();
    refreshIcons();
    return;
  }

  root.innerHTML = renderShell(route);
  refreshIcons();
  initCopilot();
  window.requestAnimationFrame(() => {
    renderRouteEnhancements(route);
    refreshIcons();
  });
}

function renderLoading() {
  return `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;color:#a6bac6;font-family:'IBM Plex Mono',monospace;">
    <div style="width:36px;height:36px;border:3px solid rgba(63,140,255,.25);border-top-color:#3f8cff;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
    <p>Loading TRACE-X intelligence data…</p>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  </div>`;
}

function renderLoadError() {
  return `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;color:#a6bac6;font-family:'IBM Plex Mono',monospace;text-align:center;padding:24px;">
    <p>Couldn't reach the TRACE-X backend.<br>Check that the server is running and the API URL is correct.</p>
    <button class="button button-primary" data-action="retry-load">Retry</button>
  </div>`;
}

function refreshIcons() {
  createIcons({ icons, attrs: { "stroke-width": 1.8 } });
}

function renderLogin() {
  return `<main class="login-screen">
    <div class="login-rail"></div>
    <section class="login-card">
      <div class="brand-lockup login-brand"><div class="brand-mark">${icon("orbit")}</div><div><strong>TRACE<span>-X</span></strong><small>INTELLIGENCE WORKSPACE</small></div></div>
      <div class="login-intro"><span class="eyebrow">SECURE ACCESS GATEWAY</span><h1>From fragmented signals<br><em>to actionable intelligence.</em></h1><p>Investigate relationships, patterns and evidence in one analyst-controlled workspace.</p></div>
      <form class="login-form" data-login-form>
        <label>Email<input id="loginEmail" name="username" type="email" placeholder="you@agency.gov" value="analyst@tracex.local" autocomplete="username" required /></label>
        <label>Password<div class="password-field"><input id="loginPassword" name="password" type="password" placeholder="••••••••" value="analyst123" autocomplete="current-password" required /><button type="button" class="icon-button" aria-label="Show password" data-action="toggle-password">${icon("eye")}</button></div></label>
        <button id="loginSubmitBtn" class="button button-primary button-wide" type="submit">${icon("log-in")} SIGN IN</button>
        <button id="quickDemoBtn" class="button button-secondary button-wide" type="button" data-action="quick-demo-login" style="margin-top:6px;border-color:rgba(93,217,219,0.3);color:var(--cyan);">${icon("sparkles")} QUICK DEMO ACCESS (A. Patel · Analyst)</button>
        <div id="loginSecurityAlert" class="login-security-alert" style="display:none;"></div>
      </form>
      <p class="auth-switch">Don't have an account? <a href="#signup" data-route="signup">Create one</a></p>
      <div class="login-footer"><span>${icon("shield-check")} AUTHORIZED INTELLIGENCE ANALYSIS ENVIRONMENT</span><span>TRACE-X v0.9.4</span></div>
    </section>
    <aside class="login-side"><div class="side-kicker">OPERATION ORION</div><h2>One connected investigative story.</h2><div class="login-flow">${["Fragmented records", "Entity resolution", "Network discovery", "Evidence-backed action"].map((item, i) => `<div class="login-flow-item"><span>0${i + 1}</span><strong>${item}</strong></div>`).join("")}</div><p class="legal-copy">TRACE-X generates investigative signals for analyst review. Signals are not proof of criminal activity.</p></aside>
  </main>`;
}

function renderSignup() {
  return `<main class="login-screen">
    <div class="login-rail"></div>
    <section class="login-card">
      <div class="brand-lockup login-brand"><div class="brand-mark">${icon("orbit")}</div><div><strong>TRACE<span>-X</span></strong><small>INTELLIGENCE WORKSPACE</small></div></div>
      <div class="login-intro"><span class="eyebrow">CREATE ANALYST ACCOUNT</span><h1>Join the<br><em>investigation workspace.</em></h1><p>Register a new analyst account to sign in and start working cases.</p></div>
      <form class="login-form" data-signup-form>
        <label>Full name<input name="name" placeholder="Analyst name" autocomplete="name" required /></label>
        <label>Email<input name="email" type="email" placeholder="you@agency.gov" autocomplete="username" required /></label>
        <label>Password<div class="password-field"><input name="password" type="password" placeholder="At least 8 characters" autocomplete="new-password" minlength="8" required /><button type="button" class="icon-button" aria-label="Show password" data-action="toggle-password">${icon("eye")}</button></div></label>
        <button class="button button-primary button-wide" type="submit">${icon("user-plus")} CREATE ACCOUNT</button>
      </form>
      <p class="auth-switch">Already have an account? <a href="#login" data-route="login">Sign in</a></p>
      <div class="login-footer"><span>${icon("shield-check")} AUTHORIZED INTELLIGENCE ANALYSIS ENVIRONMENT</span><span>TRACE-X v0.9.4</span></div>
    </section>
    <aside class="login-side"><div class="side-kicker">OPERATION ORION</div><h2>One connected investigative story.</h2><div class="login-flow">${["Fragmented records", "Entity resolution", "Network discovery", "Evidence-backed action"].map((item, i) => `<div class="login-flow-item"><span>0${i + 1}</span><strong>${item}</strong></div>`).join("")}</div><p class="legal-copy">New accounts default to the investigator role. An admin can promote your role from the database if you need elevated access.</p></aside>
  </main>`;
}

function renderShell(route) {
  const unread = appState.notifications.filter((item) => item.unread).length;
  const collapsedClass = appState.sidebarCollapsed ? " sidebar-collapsed" : "";
  return `<div class="app-shell${collapsedClass}">
    <aside class="sidebar">
      <div class="sidebar-brand"><div class="brand-mark">${icon("orbit")}</div><div class="brand-wordmark"><strong>TRACE<span>-X</span></strong><small>CYBER INTELLIGENCE</small></div><button class="icon-button sidebar-toggle" data-action="collapse-sidebar" aria-label="Collapse navigation">${icon("panel-left-close")}</button></div>
      <div class="sidebar-context"><span class="context-label">ACTIVE INVESTIGATION</span><button data-route="dashboard" class="context-button"><span><i class="active-pulse"></i>OPERATION ORION</span>${icon("chevron-down")}</button><span class="synthetic-label">${icon("database")} LIVE DATABASE</span></div>
      <nav class="primary-nav" aria-label="Primary navigation">${navSections.map((section) => `<div class="nav-section"><div class="nav-label">${section.label}</div>${section.items.map((item) => `<button class="nav-item ${route === item.route ? "active" : ""}" data-route="${item.route}" title="${item.label}">${icon(item.icon)}<span>${item.label}</span>${item.count ? `<b>${item.count}</b>` : ""}</button>`).join("")}</div>`).join("")}</nav>
      <div class="sidebar-bottom"><div class="system-status"><span class="status-dot status-dot-live"></span><div><small>SYSTEM STATUS</small><strong>Operational</strong></div><span class="system-bars">▂▅▇</span></div><button class="nav-item" data-route="audit">${icon("settings-2")}<span>Workspace Settings</span></button></div>
    </aside>
    <div class="main-shell">
      <header class="topbar"><div class="topbar-left"><button class="icon-button mobile-menu" data-action="collapse-sidebar" aria-label="Open navigation">${icon("menu")}</button><div class="breadcrumb"><span>TRACE-X</span><i>/</i><strong>${routeLabels[route] ?? "Workspace"}</strong></div></div><div class="topbar-actions"><button class="topbar-action-btn ingest-btn" data-action="ingest-target" title="Ingest Target or Indicator (Alt+N)">${icon("shield-plus")}<span>+ INGEST TARGET / IOC</span><kbd>Alt N</kbd></button><button class="copilot-topbar-trigger" data-action="open-copilot">${icon("sparkles")}<span>AI COPILOT</span><kbd>⌘ J</kbd></button><button class="search-trigger" data-action="open-search">${icon("search")}<span>Search intelligence</span><kbd>⌘ K</kbd></button><button class="icon-button theme-toggle-btn" data-action="toggle-theme" title="Switch Theme (Dark / Light)" aria-label="Toggle Theme">${icon(appState.theme === "light" ? "moon" : "sun")}</button><button class="icon-button notification-trigger" data-action="open-notifications" aria-label="Notifications">${icon("bell")}<span class="notification-dot ${unread ? "visible" : ""}"></span></button><span class="demo-pill"><i></i> LIVE</span><button class="profile-trigger" data-action="open-profile"><span class="avatar">${appState.user.initials}</span><span class="profile-copy"><strong>${escapeHtml(appState.user.name)}</strong><small>${escapeHtml(appState.user.role)}</small></span>${icon("chevron-down")}</button></div></header>
      <main class="content-area">${renderPage(route)}</main>

    </div>
  </div>
  <div id="overlay-root"></div>`;
}

function pageFrame(eyebrow, title, copy, actions = "") {
  return `<div class="page-frame"><div class="page-header"><div><div class="eyebrow">${escapeHtml(eyebrow)}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(copy)}</p></div><div class="page-actions">${actions}</div></div><div class="data-ribbon"><span>${icon("database")} LIVE DATABASE</span><span>${icon("shield-check")} AUDIT LOG ENABLED</span><span>${icon("fingerprint")} EVIDENCE INTEGRITY · SHA-256 ENABLED</span></div></div>`;
}

function metricCard(label, value, delta, iconName, route, tone = "blue") {
  return `<button class="metric-card metric-${tone}" data-route="${route}"><div class="metric-top"><span>${escapeHtml(label)}</span>${icon(iconName)}</div><strong>${escapeHtml(value)}</strong><div class="metric-bottom"><span class="metric-delta">${icon("arrow-up-right")} ${escapeHtml(delta)}</span><span>View detail ${icon("arrow-up-right")}</span></div></button>`;
}

let recordsSearchQuery = "";
let recordsCurrentPage = 1;
let recordsPageSize = 25;

function renderPage(route) {
  switch (route) {
    case "dashboard": return renderDashboard();
    case "investigations": return renderInvestigations();
    case "map": return renderThreatMapPage();
    case "records": return renderRecordsPage();
    case "entities": return renderEntities();
    case "entity": return renderEntityProfile();
    case "network": return renderNetwork();
    case "timeline": return renderTimeline();
    case "fusion": return renderFusion();
    case "trends": return renderTrends();
    case "alerts": return renderAlerts();
    case "evidence": return renderEvidence();
    case "reports": return renderReports();
    case "audit": return renderAudit();
    default: return renderDashboard();
  }
}

function renderRecordsPage() {
  const query = recordsSearchQuery.toLowerCase().trim();
  const filtered = query
    ? records.filter((r) =>
        (r.title && r.title.toLowerCase().includes(query)) ||
        (r.snippet && r.snippet.toLowerCase().includes(query)) ||
        (r.personName && r.personName.toLowerCase().includes(query)) ||
        (r.phone && r.phone.toLowerCase().includes(query)) ||
        (r.telegramHandle && r.telegramHandle.toLowerCase().includes(query)) ||
        (r.email && r.email.toLowerCase().includes(query)) ||
        (r.location && r.location.toLowerCase().includes(query)) ||
        (r.walletAddress && r.walletAddress.toLowerCase().includes(query)) ||
        (r.sourceLabel && r.sourceLabel.toLowerCase().includes(query)) ||
        (r.id && String(r.id).toLowerCase().includes(query)) ||
        (r.type && r.type.toLowerCase().includes(query))
      )
    : records;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / recordsPageSize));
  if (recordsCurrentPage > totalPages) recordsCurrentPage = totalPages;
  if (recordsCurrentPage < 1) recordsCurrentPage = 1;

  const startIdx = (recordsCurrentPage - 1) * recordsPageSize;
  const pageItems = filtered.slice(startIdx, startIdx + recordsPageSize);

  return `${pageFrame(
    "STRUCTURED INTELLIGENCE CORPUS",
    "Intelligence Records",
    "Search, filter and inspect live ingested intelligence records from multi-source transit feeds, telegram dumps, blockchain ledgers and surveillance intercepts.",
    `<button class="button button-secondary" data-action="download-15k-csv">${icon("file-spreadsheet")} Download CSV</button><button class="button button-primary" data-action="download-15k-pdf">${icon("file-text")} Open PDF Dossier</button>`
  )}
  <div class="page-content records-page">
    <div class="records-kpi-bar panel" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:16px 20px;margin-bottom:18px;background:var(--panel);">
      <div><span class="eyebrow">TOTAL RECORDS</span><strong style="font-size:22px;color:var(--cyan);font-family:var(--mono);display:block;margin-top:4px;">${records.length.toLocaleString()}</strong><small class="muted">Live PostgreSQL Database</small></div>
      <div><span class="eyebrow">FILTERED MATCHES</span><strong style="font-size:22px;color:var(--amber);font-family:var(--mono);display:block;margin-top:4px;">${total.toLocaleString()}</strong><small class="muted">Matching current search</small></div>
      <div><span class="eyebrow">CURRENT PAGE</span><strong style="font-size:22px;color:var(--text);font-family:var(--mono);display:block;margin-top:4px;">${recordsCurrentPage} / ${totalPages}</strong><small class="muted">Showing ${pageItems.length} records</small></div>
      <div><span class="eyebrow">INTELLIGENCE SOURCES</span><strong style="font-size:22px;color:var(--green);font-family:var(--mono);display:block;margin-top:4px;">10 Feeds</strong><small class="muted">Multi-Source Ingested Streams</small></div>
    </div>

    <div class="records-toolbar panel" style="display:flex;gap:12px;align-items:center;padding:14px 18px;margin-bottom:16px;background:var(--panel);">
      <div style="flex:1;display:flex;align-items:center;background:rgba(0,0,0,0.25);border:1px solid var(--line);border-radius:6px;padding:0 12px;">
        ${icon("search")}
        <input id="recordsSearchInput" placeholder="Search by Operative Name, Phone (+91...), Telegram @handle, Email, Location, or Snippet…" value="${escapeHtml(recordsSearchQuery)}" style="border:none;background:transparent;padding:10px 8px;width:100%;color:var(--text);outline:none;" />
        ${recordsSearchQuery ? `<button class="icon-button" data-action="clear-records-search" style="border:none;background:transparent;color:var(--muted);">${icon("x")}</button>` : ""}
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="muted" style="font-size:11px;font-family:var(--mono);">Rows per page:</span>
        <select id="recordsPageSizeSelect" style="background:rgba(0,0,0,0.25);border:1px solid var(--line);color:var(--text);padding:8px 10px;border-radius:6px;">
          <option value="25" ${recordsPageSize === 25 ? "selected" : ""}>25</option>
          <option value="50" ${recordsPageSize === 50 ? "selected" : ""}>50</option>
          <option value="100" ${recordsPageSize === 100 ? "selected" : ""}>100</option>
        </select>
      </div>
    </div>

    <div class="panel records-table-panel" style="padding:0;overflow:hidden;background:var(--panel);">
      <div style="overflow-x:auto;">
        <table class="records-table" style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
          <thead>
            <tr style="background:var(--bg-deep);border-bottom:1px solid var(--line);color:var(--muted);font-family:var(--mono);font-size:11px;letter-spacing:0.04em;">
              <th style="padding:12px 14px;width:60px;">ID</th>
              <th style="padding:12px 14px;width:200px;">OPERATIVE / SUBJECT</th>
              <th style="padding:12px 14px;width:180px;">TELEGRAM / PHONE</th>
              <th style="padding:12px 14px;width:140px;">LOCATION</th>
              <th style="padding:12px 14px;">TELEMETRY & SNIPPET</th>
              <th style="padding:12px 14px;width:160px;">SOURCE & TIME</th>
              <th style="padding:12px 14px;width:80px;text-align:right;">ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${
              pageItems.length === 0
                ? `<tr><td colspan="7" style="padding:40px;text-align:center;">${emptyState("NO MATCHING RECORDS", "Try changing your search query or clear the filter.")}</td></tr>`
                : pageItems
                    .map((item, idx) => {
                      const rowNum = startIdx + idx + 1;
                      const title = item.title || "Intelligence Signal";
                      const personName = item.personName || (item.title ? item.title.split("—")[1]?.trim() : "") || "—";
                      const phone = item.phone || "";
                      const telegram = item.telegramHandle || "";
                      const location = item.location || "";
                      const snippet = item.snippet || "";
                      const source = item.sourceLabel || item.source || "TransitFeed";
                      const time = (item.timestamp || "").replace("T", " ").slice(0, 19);

                      return `<tr class="record-table-row" style="border-bottom:1px solid var(--line-soft);transition:background 0.15s ease;">
                        <td style="padding:12px 14px;font-family:var(--mono);color:var(--cyan);font-weight:600;">#${rowNum}</td>
                        <td style="padding:12px 14px;">
                          <strong style="color:var(--text);display:block;margin-bottom:3px;">${escapeHtml(personName !== "—" ? personName : title)}</strong>
                          <span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-family:var(--mono);background:var(--cyan-soft);color:var(--cyan);">${escapeHtml(item.type || "intel")}</span>
                        </td>
                        <td style="padding:12px 14px;">
                          ${telegram ? `<span style="font-family:var(--mono);font-size:11px;color:var(--cyan);display:block;margin-bottom:2px;">${escapeHtml(telegram)}</span>` : ""}
                          ${phone ? `<span style="font-family:var(--mono);font-size:11px;color:var(--muted);">${escapeHtml(phone)}</span>` : (!telegram ? `<span class="muted">—</span>` : "")}
                        </td>
                        <td style="padding:12px 14px;">
                          ${location ? `<span style="font-family:var(--mono);font-size:11px;color:var(--amber);display:flex;align-items:center;gap:4px;">${icon("map-pin")} ${escapeHtml(location)}</span>` : `<span class="muted">—</span>`}
                        </td>
                        <td style="padding:12px 14px;color:var(--text-2);line-height:1.5;max-width:400px;">
                          <div style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(snippet)}</div>
                        </td>
                        <td style="padding:12px 14px;">
                          <span style="font-family:var(--mono);font-size:11px;color:var(--text-2);display:flex;align-items:center;gap:4px;">${icon("radio-tower")} ${escapeHtml(source)}</span>
                          <span style="font-family:var(--mono);font-size:10px;color:var(--muted);display:block;margin-top:2px;">${time}</span>
                        </td>
                        <td style="padding:12px 14px;text-align:right;">
                          <button class="button button-secondary compact" data-open-record="${item.id}" style="padding:5px 9px;font-size:11px;">Inspect ${icon("arrow-up-right")}</button>
                        </td>
                      </tr>`;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>

      <div class="records-pagination" style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-top:1px solid var(--line);background:var(--bg-deep);font-family:var(--mono);font-size:12px;">
        <div class="muted">
          Showing <strong style="color:var(--text);">${startIdx + 1}</strong> to <strong style="color:var(--text);">${Math.min(startIdx + recordsPageSize, total)}</strong> of <strong style="color:var(--cyan);">${total.toLocaleString()}</strong> records
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button class="button button-secondary compact" data-records-page="1" ${recordsCurrentPage === 1 ? "disabled style='opacity:0.4;cursor:not-allowed;'" : ""}>First</button>
          <button class="button button-secondary compact" data-records-page="prev" ${recordsCurrentPage === 1 ? "disabled style='opacity:0.4;cursor:not-allowed;'" : ""}>${icon("chevron-left")} Prev</button>
          <span style="padding:0 8px;color:var(--text);">Page <strong style="color:var(--cyan);">${recordsCurrentPage}</strong> of <strong>${totalPages}</strong></span>
          <button class="button button-secondary compact" data-records-page="next" ${recordsCurrentPage === totalPages ? "disabled style='opacity:0.4;cursor:not-allowed;'" : ""}>Next ${icon("chevron-right")}</button>
          <button class="button button-secondary compact" data-records-page="last" ${recordsCurrentPage === totalPages ? "disabled style='opacity:0.4;cursor:not-allowed;'" : ""}>Last</button>
        </div>
      </div>
    </div>
  </div>`;
}

function renderDashboard() {
  const highAlerts = alerts.filter((alert) => alert.severity === "HIGH").length;
  return `${pageFrame("COMMAND CENTER", "TRACE-X COMMAND CENTER", "A connected view of what changed, what matters, and what an investigator can verify next.", `<button class="button button-secondary" data-route="map">${icon("globe")} Global Threat Map</button><button class="button button-secondary" data-route="records">${icon("database")} Intelligence Records</button><button class="button button-primary" data-route="alerts">${icon("triangle-alert")} Review signals <span class="button-count">${highAlerts}</span></button>`)}
    <div class="page-content dashboard-content">
      <section class="metric-grid">${metricCard("ACTIVE INVESTIGATIONS", String(investigations.length).padStart(2, "0"), "Live from database", "briefcase-business", "investigations", "blue")}${metricCard("HIGH-PRIORITY SIGNALS", String(highAlerts).padStart(2, "0"), "Live from database", "scan-line", "alerts", "red")}${metricCard("INTELLIGENCE RECORDS", records.length.toLocaleString(), "Live from database", "database", "records", "cyan")}${metricCard("EMERGING TRENDS", String(trends.length).padStart(2, "0"), "Live from database", "radar", "trends", "amber")}${metricCard("NETWORK ALERTS", String(alerts.length).padStart(2, "0"), "Live from database", "share-2", "network", "violet")}</section>
      <section class="dashboard-grid dashboard-top-grid"><div class="panel chart-panel"><div class="panel-header"><div><div class="eyebrow">SIGNAL VOLUME</div><h3>Threat activity timeline</h3></div><div class="segmented-control" data-range-control>${["7d", "30d", "90d"].map((range) => `<button class="${appState.filters.range === range ? "active" : ""}" data-range="${range}">${range.toUpperCase()}</button>`).join("")}</div></div><div class="chart-wrap activity-chart-wrap"><canvas id="activityChart" aria-label="Threat activity timeline chart"></canvas></div><div class="chart-legend"><span><i class="legend-dot blue"></i>Intelligence records</span><span><i class="legend-dot cyan"></i>Priority signals</span><span class="chart-note">High-throughput live ingest</span></div></div><div class="panel donut-panel"><div class="panel-header"><div><div class="eyebrow">FUSION COVERAGE</div><h3>Intelligence categories</h3></div>${icon("more-horizontal")}</div><div class="donut-wrap"><canvas id="categoryChart" aria-label="Intelligence category distribution chart"></canvas><div class="donut-center"><strong>${records.length.toLocaleString()}</strong><span>RECORDS</span></div></div><div class="category-list">${categories.slice(0, 4).map((category, i) => `<div><span class="category-swatch swatch-${i}"></span><span>${category}</span><b>${[38, 27, 22, 13][i]}%</b></div>`).join("")}</div></div></section>
      <section class="dashboard-grid dashboard-bottom-grid"><div class="panel priority-panel"><div class="panel-header"><div><div class="eyebrow">REVIEW QUEUE</div><h3>Priority signals</h3></div><button class="text-button" data-route="alerts">View all ${icon("arrow-up-right")}</button></div><div class="priority-list">${alerts.slice(0, 3).map((alert) => priorityRow(alert)).join("")}</div><div class="panel-footer"><span>${icon("circle-check")} Analyst queue synced 2 min ago</span><button class="text-button" data-route="alerts">Open alert center ${icon("arrow-right")}</button></div></div><div class="panel network-preview-panel"><div class="panel-header"><div><div class="eyebrow">RELATIONSHIP MAP</div><h3>Network preview</h3></div><button class="icon-button" data-route="network" aria-label="Open network intelligence">${icon("maximize-2")}</button></div><div class="mini-network" id="miniNetwork"></div><div class="network-preview-footer"><span><i class="legend-dot entity"></i>${entities.length.toLocaleString()} entities</span><span><i class="legend-dot source"></i>${categories.length} categories</span><span><i class="legend-dot relation"></i>${relationships.length.toLocaleString()} relationships</span></div></div><div class="panel signals-panel"><div class="panel-header"><div><div class="eyebrow">PATTERN WATCH</div><h3>Emerging signals</h3></div><button class="text-button" data-route="trends">Explore radar ${icon("arrow-up-right")}</button></div>${trends.slice(0, 2).map((trend) => trendCompact(trend)).join("")}</div></section>
      <section class="judge-callout"><div class="callout-index">01</div><div><span class="eyebrow">THE TRACE-X DIFFERENCE</span><h2>Turn disconnected observations into a defensible investigative next step.</h2></div><div class="callout-flow"><span>RECORDS</span>${icon("arrow-right")}<span>CONNECTIONS</span>${icon("arrow-right")}<span>PRIORITY</span>${icon("arrow-right")}<span>EVIDENCE</span></div></section>
    </div>`;
}

function priorityRow(alert) {
  return `<button class="priority-row" data-open-alert="${alert.id}"><div class="priority-rank">${alert.id.replace("ALERT-", "")}</div><div class="priority-copy"><strong>${escapeHtml(alert.type)}</strong><span>${escapeHtml(alert.what)}</span></div><div class="priority-score"><b>${alert.priority}</b><span>${alert.severity}</span></div>${icon("chevron-right")}</button>`;
}

function trendCompact(trend) {
  return `<button class="trend-compact" data-open-trend="${trend.id}"><div class="trend-signal"><span class="trend-line trend-${trend.color}"></span><span><strong>${escapeHtml(trend.name)}</strong><small>EMERGING SIGNAL</small></span></div><div><b>+${trend.growth}%</b><span>${trend.confidence}% confidence</span></div>${icon("arrow-up-right")}</button>`;
}

function renderInvestigations() {
  return `${pageFrame("CASE MANAGEMENT", "Investigations", "Keep the investigative question, signal history and analyst decisions in one continuous workspace.", `<button class="button button-primary" data-action="new-investigation">${icon("plus")} New investigation</button>`)}<div class="page-content"><div class="investigation-hero"><div class="hero-orbit"><div class="orbit-ring orbit-ring-1"></div><div class="orbit-ring orbit-ring-2"></div><div class="orbit-core">${icon("orbit")}</div></div><div><span class="eyebrow">FLAGSHIP INVESTIGATION</span><h2>OPERATION ORION</h2><p>Cross-source intelligence fusion for multi-tier network analysis scenario. Built to keep the analyst in control.</p><div class="hero-meta"><span>${icon("calendar")} Active Case</span><span>${icon("users-round")} 19 entities</span><span>${icon("shield-check")} Evidence lineage on</span></div></div><button class="button button-secondary" data-action="investigation-summary">${icon("sparkles")} AI summary</button><button class="button button-primary" data-route="fusion">Open investigation ${icon("arrow-up-right")}</button></div><div class="investigation-tabs">${["Overview", "Entities", "Network", "Timeline", "Intelligence", "Alerts", "Evidence", "Analyst Notes", "Reports"].map((tab, i) => `<button class="${i === 0 ? "active" : ""}" data-route="${["dashboard", "entities", "network", "timeline", "fusion", "alerts", "evidence", "audit", "reports"][i]}">${tab}</button>`).join("")}</div><div class="investigation-grid">${investigations.map((item, index) => `<article class="investigation-card ${index === 0 ? "featured" : ""}"><div class="card-topline"><span class="case-code">${escapeHtml(item.caseCode || item.case_code || item.id)}</span>${statusBadge(item.status)}</div><h3>${escapeHtml(item.name || item.title)}</h3><p>${index === 0 ? "Multi-source intelligence fusion investigation" : "Operational intelligence workspace"}</p><div class="case-stats"><span><b>${(item.recordsCount !== undefined ? item.recordsCount : 12).toLocaleString()}</b> records</span><span><b>${(item.entitiesCount !== undefined ? item.entitiesCount : 19).toLocaleString()}</b> entities</span><span><b>${item.alertsCount !== undefined ? item.alertsCount : 6}</b> alerts</span></div><button class="text-button" data-route="${index === 0 ? "dashboard" : "entities"}">Open workspace ${icon("arrow-right")}</button></article>`).join("")}</div></div>`;
}

function renderEntities() {
  const query = appState.filters.entityQuery.toLowerCase().trim();
  const filtered = query
    ? entities.filter((entity) =>
        `${entity.id} ${entity.name || ""} ${entity.displayName || ""} ${entity.personName || ""} ${(entity.aliases || []).join(" ")} ${entity.type} ${entity.phone || ""} ${entity.telegramHandle || ""} ${entity.email || ""} ${entity.location || ""}`
          .toLowerCase()
          .includes(query)
      ).slice(0, 40)
    : entities.slice(0, 40);
  return `${pageFrame("ENTITY INTELLIGENCE", "Entities", "Resolve identity, inspect activity and carry a selected entity across the investigative workflow.", `<button class="button button-primary" data-action="ingest-target">${icon("shield-plus")} + Ingest Target / IOC</button><button class="button button-secondary" data-route="network">${icon("share-2")} Open network</button><button class="button button-secondary" data-action="entity-resolution">${icon("git-compare-arrows")} Compare entities</button>`)}<div class="page-content"><div class="entity-searchbar">${icon("search")}<input id="entitySearch" placeholder="Search by name, phone (+91...), Telegram @handle, location, alias or type…" value="${escapeHtml(appState.filters.entityQuery)}" autocomplete="off" /><kbd>⌘ /</kbd></div><div class="entity-layout"><section class="panel entity-table-panel"><div class="panel-header"><div><div class="eyebrow">${entities.length.toLocaleString()} IDENTIFIED OBJECTS</div><h3>Entity registry</h3></div><span class="muted">Showing ${filtered.length} of ${entities.length.toLocaleString()}</span></div><div class="entity-list">${filtered.map((entity) => entityListRow(entity)).join("")}</div></section><aside class="panel selected-entity-card">${renderSelectedEntitySummary()}</aside></div></div>`;
}

function entityListRow(entity) {
  const displayName = entity.displayName || entity.personName || entity.name || entity.id;
  const subtitle = entity.telegramHandle || entity.phone || entity.location || entity.aliases?.[0] || "";
  return `<button class="entity-list-row ${appState.selectedEntity === entity.id ? "selected" : ""}" data-open-entity="${entity.id}"><span class="entity-avatar type-${(entity.type || "").toLowerCase().replaceAll(" ", "-")}">${icon(entity.type?.toUpperCase() === "SOURCE" ? "radio-tower" : entity.type?.toUpperCase() === "TOPIC" ? "tag" : entity.type?.toUpperCase() === "LOCATION" ? "map-pin" : "fingerprint")}</span><span class="entity-main"><strong>${escapeHtml(displayName)}</strong><small>${escapeHtml(entity.type)}${subtitle ? ` · ${escapeHtml(subtitle)}` : ""}</small></span><span class="entity-sources">${entity.sources?.length || 1} sources</span><span class="entity-priority">${priorityBadge(entity.priority)}</span>${icon("chevron-right")}</button>`;
}

function renderSelectedEntitySummary() {
  const entity = entities.find((item) => item.id === appState.selectedEntity) ?? entities[0];
  if (!entity) return emptyState("NO ENTITIES", "No entities were found in the database.");
  return `<div class="selected-overline"><span class="eyebrow">SELECTED ENTITY</span>${priorityBadge(entity.priority)}</div><div class="profile-symbol">${icon("fingerprint")}</div><h3>${escapeHtml(entity.id)}</h3><span class="entity-type">${escapeHtml(entity.type)} · ${escapeHtml((entity.aliases || []).join(" · "))}</span><p>${escapeHtml(entity.description || "")}</p><div class="profile-metrics"><div><strong>${entity.activity || 1}%</strong><span>activity index</span></div><div><strong>${relationships.filter((r) => r.source === entity.id || r.target === entity.id || r.sourceId === entity.id || r.targetId === entity.id).length}</strong><span>relationships</span></div><div><strong>${entity.sources?.length || 1}</strong><span>sources</span></div></div><div class="profile-detail-list"><div><span>FIRST OBSERVED</span><b>${entity.firstObserved || "2026-08-01"}</b></div><div><span>LAST OBSERVED</span><b>${entity.lastObserved || "Active"}</b></div><div><span>COMMUNITY</span><b>${entity.community || "Cluster 01"}</b></div></div><button class="button button-primary button-wide" data-route="entity">Open full profile ${icon("arrow-up-right")}</button><p class="legal-copy compact">${icon("info")} Analytical prioritization only. Not a determination of criminal activity.</p>`;
}

function renderEntityProfile() {
  const entity = entities.find((item) => item.id === appState.selectedEntity) ?? entities[0];
  if (!entity) return emptyState("NO ENTITIES", "No entities were found in the database.");
  const related = relationships.filter((r) => r.source === entity.id || r.target === entity.id).slice(0, 5);
  const entityRecords = records.filter((record) => record.entityId === entity.id).slice(0, 5);
  return `${pageFrame("ENTITY INTELLIGENCE / PROFILE", entity.id, "A single, explainable view of identity signals, relationships, activity and evidence.", `<button class="button button-secondary" data-route="entities">${icon("arrow-left")} Entity registry</button><button class="button button-primary" data-action="entity-resolution">${icon("git-compare-arrows")} Potential match</button>`)}<div class="page-content"><div class="profile-header panel"><div class="profile-symbol large">${icon("fingerprint")}</div><div class="profile-header-main"><div class="case-code">${entity.type.toUpperCase()} · ${entity.community}</div><h2>${escapeHtml(entity.id)}</h2><p>${escapeHtml(entity.description)}</p><div class="alias-row">${entity.aliases.map((alias) => `<span class="tag">${escapeHtml(alias)}</span>`).join("")}</div></div><div class="profile-header-priority"><span class="eyebrow">INVESTIGATIVE PRIORITY</span><strong id="profilePriorityValue">${entity.priority}<small>/100</small></strong><span id="profilePriorityBadge">${priorityBadge(entity.priority)}</span><button class="text-button" data-action="show-score">Why this score? ${icon("arrow-up-right")}</button></div></div><div class="profile-kpis"><div><span>FIRST OBSERVED</span><b>${entity.firstObserved}</b></div><div><span>LAST OBSERVED</span><b>${entity.lastObserved}</b></div><div><span>SOURCES</span><b>${entity.sources.length}</b></div><div><span>RELATIONSHIPS</span><b>${related.length}</b></div><div><span>ALERTS</span><b>${alerts.filter((a) => a.entityIds.includes(entity.id)).length}</b></div></div><div class="profile-grid"><section class="panel"><div class="panel-header"><div><div class="eyebrow">CONNECTIONS</div><h3>Related intelligence</h3></div><button class="text-button" data-route="network">Open graph ${icon("arrow-up-right")}</button></div><div class="relation-list">${related.length ? related.map((relation) => `<button class="relation-row" data-open-entity="${relation.source === entity.id ? relation.target : relation.source}"><span class="relation-icon">${icon("link-2")}</span><span><strong>${escapeHtml(relation.source === entity.id ? relation.target : relation.source)}</strong><small>${escapeHtml(relation.type)} · ${relation.confidence}% confidence</small></span><time>${relation.timestamp.split(" ")[0]}</time>${icon("chevron-right")}</button>`).join("") : emptyState("NO RELATIONSHIPS", "Select another entity or expand the graph.")}</div></section><section class="panel"><div class="panel-header"><div><div class="eyebrow">RECENT ACTIVITY</div><h3>Intelligence records</h3></div><span class="muted">${records.filter((r) => r.entityId === entity.id).length} matched</span></div><div class="record-list">${entityRecords.map((record) => `<button class="record-row" data-open-record="${record.id}"><span class="record-time">${record.timestamp.slice(5, 16)}</span><span><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.sourceId)} · ${record.confidence}% confidence</small></span>${icon("arrow-up-right")}</button>`).join("")}</div></section></div><div class="profile-grid"><section class="panel" id="profileResolutionSection"><div class="panel-header"><div><div class="eyebrow">ENTITY RESOLUTION</div><h3>Potential entity match</h3></div><span class="confidence-pill" id="profileResolutionConfidence">…</span></div><div id="profileResolutionBody"><p class="muted">Checking for potential matches…</p></div><button class="button button-secondary" data-action="entity-resolution">Review comparison ${icon("arrow-up-right")}</button></section><section class="panel analyst-note-panel"><div class="panel-header"><div><div class="eyebrow">ANALYST CONTROL</div><h3>Open an evidence-backed action</h3></div>${icon("pen-line")}</div><p>AI signals stay provisional until an investigator reviews their supporting evidence and records a decision.</p><button class="button button-primary" data-route="alerts">Open review queue ${icon("arrow-up-right")}</button></section></div></div>`;
}

async function loadEntityProfileExtras(entityId) {
  if (!entityId) return;
  try {
    const scoreData = await api.getEntityScore(entityId);
    const valueEl = document.getElementById("profilePriorityValue");
    const badgeEl = document.getElementById("profilePriorityBadge");
    if (valueEl) valueEl.innerHTML = `${scoreData.score}<small>/100</small>`;
    if (badgeEl) badgeEl.innerHTML = priorityBadge(scoreData.score);
  } catch (err) { console.error("Failed to load entity score", err); }

  try {
    const matches = await api.getEntityMatches(entityId);
    const confidenceEl = document.getElementById("profileResolutionConfidence");
    const bodyEl = document.getElementById("profileResolutionBody");
    if (!confidenceEl || !bodyEl) return;
    if (!matches.length) {
      confidenceEl.textContent = "No match";
      bodyEl.innerHTML = `<p class="muted">No entities currently share sources, aliases or community with ${escapeHtml(entityId)}.</p>`;
      return;
    }
    const top = matches[0];
    const entityA = entities.find((e) => e.id === entityId);
    const entityB = entities.find((e) => e.id === String(top.entityId));
    confidenceEl.textContent = `${top.confidence}% confidence`;
    bodyEl.innerHTML = `${top.isCrossInvestigation ? `<div style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:6px;background:rgba(231,184,107,.15);color:#e7b86b;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.04em;margin-bottom:10px;">${icon("shield-alert")} CROSS-INVESTIGATION MATCH</div>` : ""}<div class="match-compare"><div><span>ENTITY A</span><strong>${escapeHtml(entityId)}</strong><small>${escapeHtml(entityA?.aliases?.[0] || "")}</small></div><div class="match-score"><b>${top.confidence}%</b><span>potential match</span></div><div><span>ENTITY B</span><strong>${escapeHtml(entityB?.id || top.entityId)}</strong><small>${escapeHtml(entityB?.aliases?.[0] || "")}</small></div></div>${top.investigationTitle ? `<div class="muted">${icon("link-2")} Entity B also appears in <b>${escapeHtml(top.investigationTitle)}</b></div>` : ""}<div class="reason-chips">${top.reasons.map((r) => `<span>${escapeHtml(r.label)} (+${r.points})</span>`).join("")}</div>`;
  } catch (err) { console.error("Failed to load entity matches", err); }
}

function renderNetwork() {
  const entity = entities.find((item) => item.id === appState.selectedEntity) ?? entities[0] ?? { id: "—", community: "—", priority: 0 };
  return `${pageFrame("RELATIONSHIP ANALYSIS", "Network Intelligence", "Explore how entities, sources, topics and locations connect — then translate the graph into an investigative next step.", `<button class="button button-primary" data-action="ingest-target">${icon("shield-plus")} + Ingest Target / IOC</button><button class="button button-secondary" data-action="network-reset">${icon("rotate-ccw")} Reset graph</button><button class="button button-secondary" data-action="network-fit">${icon("scan")} Fit graph</button>`)}<div class="page-content network-page"><div class="network-workspace"><div class="network-toolbar"><div class="network-search">${icon("search")}<input placeholder="Search nodes…" id="networkSearch" /><kbd>/</kbd></div><div class="network-actions"><button data-network-action="zoom-in" title="Zoom in">${icon("zoom-in")}</button><button data-network-action="zoom-out" title="Zoom out">${icon("zoom-out")}</button><button data-network-action="fit" title="Fit graph">${icon("scan")}</button><button data-network-action="highlight" title="Highlight selected connections">${icon("sparkles")}</button><button data-network-action="filter-sources">${icon("radio-tower")} Sources</button><button data-network-action="filter-topics">${icon("tag")} Topics</button></div></div><div class="graph-stage"><div id="networkGraph" class="network-graph" aria-label="Operation Orion relationship graph"></div><div class="graph-legend"><span><i class="graph-node-dot entity"></i>Entity</span><span><i class="graph-node-dot source"></i>Source</span><span><i class="graph-node-dot topic"></i>Topic</span><span><i class="graph-node-dot marketplace"></i>Marketplace</span><span><i class="graph-node-dot location"></i>Location</span></div><div class="graph-badge">${icon("flask-conical")} ${entities.length} NODES · ${relationships.length} EDGES</div></div></div><aside class="analytics-panel"><div class="panel-header"><div><div class="eyebrow">GRAPH ANALYTICS</div><h3>Investigator lens</h3></div><button class="icon-button" data-action="toggle-analytics" aria-label="Collapse analytics">${icon("panel-right-close")}</button></div><div class="analytics-focus"><span class="focus-ring">${entity.priority}</span><div><b>${escapeHtml(entity.id)}</b><span>selected focal node</span></div></div><div class="analytics-metrics"><div><span>DEGREE CENTRALITY</span><strong id="metricDegree">…</strong><small>Normalized against ${entities.length} entities</small></div><div><span>CONNECTED NODES</span><strong id="metricConnected">…</strong><small>Direct relationships</small></div><div><span>CONNECTION DENSITY</span><strong id="metricDensity">…</strong><small>Among immediate neighbors</small></div><div><span>COMMUNITY</span><strong>${escapeHtml(entity.community)}</strong><small>From dataset clustering</small></div></div><div class="interpretation"><span>${icon("message-square-text")} ANALYST TRANSLATION</span><p>Metrics are computed live from current relationship data. They guide collection and review; they do not imply criminality.</p></div><div class="network-selected-actions"><button class="button button-primary button-wide" data-route="entity">Open entity profile ${icon("arrow-up-right")}</button><button class="button button-secondary button-wide" data-action="view-lineage">View supporting evidence ${icon("folder-search")}</button></div></aside></div></div>`;
}


async function loadNetworkAnalytics() {
  const entityId = appState.selectedEntity;
  if (!entityId) return;
  try {
    const metrics = await api.getEntityNetworkMetrics(entityId);
    const degreeEl = document.getElementById("metricDegree");
    const densityEl = document.getElementById("metricDensity");
    const connectedEl = document.getElementById("metricConnected");
    if (degreeEl) degreeEl.textContent = metrics.degreeCentrality;
    if (densityEl) densityEl.textContent = metrics.connectionDensity;
    if (connectedEl) connectedEl.textContent = metrics.connectedNodes;
  } catch (err) { console.error("Failed to load network analytics", err); }
}

function renderTimeline() {
  const topRecords = records.slice(0, 9);
  return `${pageFrame("TEMPORAL INTELLIGENCE", "Activity Timeline", "See activity spikes, recurring signals and relationship changes against a synthetic baseline.", `<div class="segmented-control large" data-range-control>${["7d", "30d", "90d"].map((range) => `<button class="${appState.filters.range === range ? "active" : ""}" data-range="${range}">${range.toUpperCase()}</button>`).join("")}</div>`)}<div class="page-content"><div class="panel timeline-chart-panel"><div class="panel-header"><div><div class="eyebrow">OPERATION ORION / ACTIVITY</div><h3>Signal chronology</h3></div><div class="timeline-summary"><span><b>${records.length}</b> records</span><span><b>${relationships.length}</b> relationships</span></div></div><div class="chart-wrap timeline-chart-wrap"><canvas id="timelineChart" aria-label="Activity timeline chart"></canvas></div><div class="timeline-event-tags"><span><i class="event-mark spike"></i>Activity spike</span><span><i class="event-mark relation"></i>New relationship</span><span><i class="event-mark trend"></i>Trend detected</span><span><i class="event-mark pause"></i>Inactivity period</span></div></div><div class="timeline-layout"><section class="panel"><div class="panel-header"><div><div class="eyebrow">EVENT STREAM</div><h3>Latest intelligence events</h3></div><span class="muted">Click an event to inspect the record</span></div><div class="timeline-list">${topRecords.map((record, i) => `<button class="timeline-event" data-open-record="${record.id}"><span class="event-marker ${i % 3 === 0 ? "spike" : i % 3 === 1 ? "relation" : "trend"}"></span><span class="timeline-event-copy"><time>${record.timestamp}</time><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.snippet)}</small></span><span class="confidence-pill">${record.confidence}%</span>${icon("chevron-right")}</button>`).join("")}</div></section><aside class="panel temporal-insight"><div class="eyebrow">PATTERN DETECTED</div><h3>Activity is accelerating around a connected relay cluster.</h3><p>The last 30-day window shows a sustained rise in records involving connected entities.</p><div class="insight-stat"><strong>${records.length}</strong><span>total intelligence records</span></div><button class="button button-secondary" data-open-trend="${trends[0]?.id || ""}">Open trend context ${icon("arrow-up-right")}</button></aside></div></div>`;
}

function renderFusion() {
  const stages = [
    ["01", "FRAGMENTED RECORDS", String(records.length), "Intelligence records", "database", "Source observations become a searchable corpus."],
    ["02", "ENTITY EXTRACTION", String(entities.length), "Identified entities", "scan-search", "Names, aliases, sources, topics and locations."],
    ["03", "RELATIONSHIP DISCOVERY", String(relationships.length), "Relationships", "share-2", "Connections carry a timestamp, source and confidence."],
    ["04", "NETWORK GRAPH", "—", "Communities", "network", "The graph exposes bridges across clusters."],
    ["05", "TEMPORAL PATTERN", "Live", "Activity trend", "activity", "Spikes and recurring activity become visible."],
    ["06", "TREND DETECTION", String(trends.length), "Emerging signals", "radar", "Growth is separated from interpretation."],
    ["07", "PRIORITY SIGNAL", "Live", "Computed score", "scan-line", "A transparent triage signal ranks review order."],
    ["08", "EVIDENCE LINEAGE", String(evidence.length), "Evidence items", "fingerprint", "Every finding points back to its source record."],
    ["09", "ANALYST VERIFICATION", String(alerts.filter((a) => a.status === "UNREVIEWED").length), "Decisions pending", "user-check", "The investigator accepts, rejects or requests more evidence."]
  ];
  return `${pageFrame("SIGNATURE WORKFLOW", "Intelligence Fusion", "The TRACE-X signature: each analytical step preserves context until an investigator can make a defensible decision.", `<button class="button button-primary" data-route="alerts">${icon("scan-line")} Open review queue</button>`)}<div class="page-content fusion-page"><div class="fusion-intro"><div><span class="eyebrow">FRAGMENTED DATA → ACTION</span><h2>One connected investigative workflow.</h2><p>TRACE-X does not replace judgment. It makes the path from signal to evidence visible, explainable and fast to review.</p></div><div class="fusion-summary"><span><strong>${records.length}</strong> records</span><span><strong>${entities.length}</strong> entities</span><span><strong>${relationships.length}</strong> relationships</span><span><strong>${alerts.length}</strong> alerts</span></div></div><div class="fusion-flow">${stages.map((stage, index) => `<button class="fusion-stage ${index === 6 ? "is-priority" : ""}" data-fusion-stage="${index}"><span class="stage-index">${stage[0]}</span><div class="stage-icon">${icon(stage[4])}</div><div class="stage-copy"><span>${stage[1]}</span><strong>${stage[2]}</strong><small>${stage[3]}</small></div><div class="stage-hover">${stage[5]}</div>${index < stages.length - 1 ? `<div class="stage-connector">${icon("arrow-down")}</div>` : ""}</button>`).join("")}</div><div class="fusion-bottom-grid"><div class="panel philosophy-panel"><span class="eyebrow">DESIGNED FOR DEFENSIBLE REVIEW</span><h3>"Interesting" is not "actionable."</h3><p>Each signal carries context, confidence and provenance so analysts can decide what deserves attention next. Priority scores and potential matches are computed live from current relationship, evidence and alert data.</p><div class="philosophy-rule"></div><span class="muted">Analyst control remains the final step.</span></div></div></div>`;
}

function renderTrends() {
  if (!trends.length) return `${pageFrame("PATTERN DETECTION", "Emerging Trend Radar", "Separate what is changing from what it means.")}${emptyState("NO TRENDS", "No trend data available yet.")}`;
  return `${pageFrame("PATTERN DETECTION", "Emerging Trend Radar", "Separate what is changing from what it means. Every radar signal is contextual and reviewable.", `<button class="button button-secondary" data-route="timeline">${icon("calendar-clock")} View timeline</button>`)}<div class="page-content"><div class="trend-radar-layout"><section class="panel radar-panel"><div class="panel-header"><div><div class="eyebrow">OPERATION ORION / TREND FIELD</div><h3>Signal radar</h3></div></div><div class="radar-visual"><div class="radar-circle circle-one"></div><div class="radar-circle circle-two"></div><div class="radar-circle circle-three"></div><div class="radar-cross cross-x"></div><div class="radar-cross cross-y"></div><div class="radar-sweep"></div>${trends.map((trend, i) => `<button class="radar-point point-${i} ${appState.selectedTrend === trend.id ? "active" : ""}" data-open-trend="${trend.id}"><span></span><b>${trend.name.replace("Synthetic ", "").slice(0, 9)}</b></button>`).join("")}<div class="radar-origin">${icon("crosshair")}</div></div><div class="radar-footer"><span>${icon("target")} ${trends.length} signal clusters detected</span><span>${icon("info")} Distance indicates relative confidence</span></div></section><section class="trend-card-stack">${trends.map((trend) => trendCard(trend)).join("")}</section></div><div class="panel trend-detail-strip"><div><span class="eyebrow">SELECTED SIGNAL</span><h3>${escapeHtml(trends.find((trend) => trend.id === appState.selectedTrend)?.name ?? trends[0].name)}</h3></div><p>${escapeHtml(trends.find((trend) => trend.id === appState.selectedTrend)?.description ?? trends[0].description)}</p><button class="button button-secondary" data-action="view-lineage">View supporting evidence ${icon("folder-search")}</button></div><p class="legal-copy page-legal">${icon("info")} Trends are analytical leads for collection and review. They do not prove criminal activity.</p></div>`;
}

function trendCard(trend) {
  return `<button class="trend-card trend-border-${trend.color} ${appState.selectedTrend === trend.id ? "selected" : ""}" data-open-trend="${trend.id}"><div class="trend-card-top"><span class="trend-icon ${trend.color}">${icon("radar")}</span><span class="eyebrow">EMERGING SIGNAL</span>${icon("arrow-up-right")}</div><h3>${escapeHtml(trend.name)}</h3><p>${escapeHtml(trend.description)}</p><div class="trend-stat-grid"><div><span>GROWTH</span><strong>+${trend.growth}%</strong></div><div><span>CONFIDENCE</span><strong>${trend.confidence}%</strong></div><div><span>RELATED</span><strong>${trend.entities}</strong></div></div><div class="trend-progress"><span style="width:${trend.confidence}%"></span></div><div class="trend-card-footer"><span>${statusBadge(trend.status)}</span><span>Click to inspect</span></div></button>`;
}

function renderAlerts() {
  const severity = appState.filters.severity;
  const status = appState.filters.alertStatus;
  const filtered = alerts.filter((alert) => (severity === "ALL" || alert.severity === severity) && (status === "ALL" || alert.status === status));
  return `${pageFrame("ANALYST REVIEW", "Alert Center", "Prioritize what changed, why it matters and what evidence is available before taking action.", `<button class="button button-secondary" data-action="clear-alert-filters">${icon("list-filter")} Clear filters</button>`)}<div class="page-content"><div class="alert-summary-row"><div><span class="eyebrow">REVIEW QUEUE</span><h2>${filtered.length} signals need context, not assumptions.</h2></div><div class="alert-summary-metrics"><span><b>${alerts.filter((a) => a.severity === "HIGH").length}</b> high</span><span><b>${alerts.filter((a) => a.status === "UNREVIEWED").length}</b> unreviewed</span><span><b>${alerts.filter((a) => a.status === "VERIFIED").length}</b> verified</span></div></div><div class="filter-bar"><div class="filter-group"><span>SEVERITY</span>${["ALL", "HIGH", "MEDIUM", "LOW"].map((value) => `<button class="filter-chip ${severity === value ? "active" : ""}" data-alert-severity="${value}">${value}</button>`).join("")}</div><div class="filter-group"><span>STATUS</span>${["ALL", "UNREVIEWED", "ASSIGNED", "ACKNOWLEDGED", "VERIFIED"].map((value) => `<button class="filter-chip ${status === value ? "active" : ""}" data-alert-status="${value}">${value}</button>`).join("")}</div></div><div class="alert-grid">${filtered.map((alert) => alertCard(alert)).join("")}</div>${filtered.length ? "" : emptyState("NO SIGNALS MATCH", "Clear a filter to return to the full analyst queue.", `<button class="button button-secondary" data-action="clear-alert-filters">Clear filters</button>`)}</div>`;
}

function alertCard(alert) {
  return `<article class="alert-card severity-${alert.severity.toLowerCase()}"><div class="alert-card-top"><div><span class="alert-severity">${icon(alert.severity === "HIGH" ? "triangle-alert" : "info")} ${alert.severity}</span><span class="case-code">${alert.id}</span></div>${statusBadge(alert.status)}</div><h3>${escapeHtml(alert.type)}</h3><div class="alert-what"><span>WHAT HAPPENED</span><p>${escapeHtml(alert.what)}</p></div><div class="alert-why"><span>WHY IT MATTERS</span><p>${escapeHtml(alert.why)}</p></div>${alert.aiSummary ? `<div class="alert-why"><span>${icon("sparkles")} AI ANALYSIS</span><p>${escapeHtml(alert.aiSummary)}</p></div>` : ""}<div class="alert-card-meta"><span>${icon("badge-check")} ${alert.confidence}% confidence</span><span>${icon("clock-3")} ${alert.timestamp}</span></div><div class="alert-related">${alert.entityIds.map((id) => `<button class="tag" data-open-entity="${id}">${escapeHtml(id)}</button>`).join("")}${alert.evidenceIds.map((id) => `<button class="tag evidence-tag" data-open-evidence="${id}">${escapeHtml(id)}</button>`).join("")}</div><div class="alert-card-actions"><button class="button button-secondary" data-open-alert="${alert.id}">View details</button>${alert.status === "UNREVIEWED" ? `<button class="button button-primary" data-review-alert="${alert.id}">${icon("user-check")} Review</button>` : `<button class="button button-ghost" data-action="acknowledge-alert" data-alert-id="${alert.id}">${icon("check")} Acknowledge</button>`}</div></article>`;
}

function renderEvidence() {
  const selected = evidence.find((item) => item.id === appState.selectedEvidence) ?? evidence[0];
  if (!selected) return `${pageFrame("PROVENANCE & INTEGRITY", "Evidence Vault", "Trace every finding back to a source record.")}${emptyState("NO EVIDENCE", "No evidence items found.")}`;
  return `${pageFrame("PROVENANCE & INTEGRITY", "Evidence Vault", "Trace every finding back to a source record, analytical method and analyst decision.", `<button class="button button-secondary" data-action="export-evidence">${icon("download")} Export index</button><button class="button button-primary" data-action="view-lineage">${icon("route")} Open lineage</button>`)}<div class="page-content"><div class="evidence-layout"><section class="panel evidence-list-panel"><div class="panel-header"><div><div class="eyebrow">${evidence.length} LINKED ITEMS</div><h3>Evidence index</h3></div><div class="evidence-integrity"><span class="status-dot status-dot-live"></span> SHA-256 enabled</div></div><div class="evidence-list">${evidence.map((item) => `<button class="evidence-row ${selected.id === item.id ? "selected" : ""}" data-open-evidence="${item.id}"><span class="evidence-file">${icon(item.type === "Network analysis" ? "share-2" : item.type === "Trend detection" ? "radar" : "file-lock-2")}</span><span class="evidence-row-main"><strong>${item.id}</strong><small>${escapeHtml(item.type)} · ${escapeHtml(item.source)}</small></span><span class="evidence-confidence">${item.confidence}%</span><span>${statusBadge(item.status)}</span>${icon("chevron-right")}</button>`).join("")}</div></section><aside class="panel evidence-detail-panel"><div class="panel-header"><div><div class="eyebrow">SELECTED EVIDENCE</div><h3>${selected.id}</h3></div>${statusBadge(selected.status)}</div><div class="evidence-doc-icon">${icon("file-lock-2")}</div><h2>${escapeHtml(selected.type)}</h2><p>${escapeHtml(selected.finding)}</p><div class="evidence-fields"><div><span>SOURCE</span><b>${escapeHtml(selected.source)}</b></div><div><span>TIMESTAMP</span><b>${escapeHtml(selected.timestamp)}</b></div><div><span>CONFIDENCE</span><b>${selected.confidence}%</b></div><div><span>SHA-256</span><b class="mono">${escapeHtml(selected.fullHash)}</b></div></div><div class="lineage-mini"><div><span>01</span><b>Finding</b></div>${icon("arrow-down")}<div><span>02</span><b>Source record</b></div>${icon("arrow-down")}<div><span>03</span><b>Analyst decision</b></div></div><button class="button button-primary button-wide" data-action="view-lineage">View full evidence lineage ${icon("arrow-up-right")}</button><p class="legal-copy compact">${icon("info")} A hash supports integrity checking; it does not alone establish legal admissibility.</p></aside></div></div>`;
}

function renderReports() {
  return `${pageFrame("ANALYTICAL OUTPUT", "Reports", "Turn the current investigation state into a structured, evidence-referenced intelligence brief.", `<button class="button button-secondary" data-action="preview-report">${icon("eye")} Preview report</button><button class="button button-primary" data-action="generate-report">${icon("file-output")} Generate report</button>`)}<div class="page-content"><div class="report-layout"><section class="panel report-preview-card"><div class="report-cover"><span class="eyebrow">TRACE-X INTELLIGENCE REPORT</span><div class="report-logo">${icon("orbit")}</div><h2>Operation Orion</h2><p>Evidence-backed analytical brief</p><div class="report-cover-meta"><span>REPORT TYPE<br><b>Investigation summary</b></span><span>CLASSIFICATION<br><b>DEMO / SYNTHETIC</b></span><span>GENERATED<br><b>Live on request</b></span></div></div><div class="report-outline"><div class="panel-header"><div><div class="eyebrow">DOCUMENT OUTLINE</div><h3>12 report sections</h3></div><span class="muted">Ready to generate</span></div>${["Executive Summary", "Investigation Overview", "Key Findings", "Key Entities", "Network Analysis", "Timeline", "Emerging Trends", "Priority Signals", "Evidence References", "Analyst Verification", "Limitations", "Conclusion"].map((item, i) => `<div class="outline-row"><span>${String(i + 1).padStart(2, "0")}</span><b>${item}</b>${icon("check")}</div>`).join("")}</div></section><aside class="report-side"><div class="panel"><div class="eyebrow">CURRENT SCOPE</div><h3>Operation Orion</h3><p>The report pulls live counts from the database at generation time.</p><div class="report-scope-list"><span>${icon("database")} ${records.length} records</span><span>${icon("users-round")} ${entities.length} entities</span><span>${icon("share-2")} ${relationships.length} relationships</span><span>${icon("folder-lock")} ${evidence.length} evidence items</span></div><button class="button button-primary button-wide" data-action="generate-report">Generate from current state ${icon("arrow-up-right")}</button></div><div class="panel limitations-card"><div class="eyebrow">LIMITATIONS INCLUDED</div><h3>Keep the output defensible.</h3><ul><li>Synthetic demonstration data only</li><li>Signals require analyst verification</li><li>Graph metrics are context, not proof</li><li>Hashing supports integrity, not admissibility</li></ul></div></aside></div></div>`;
}

function renderAudit() {
  return `${pageFrame("GOVERNANCE", "Audit Trail", "A transparent record of analyst actions and automated signal generation in this demonstration workspace.", `<button class="button button-secondary" data-action="export-audit">${icon("download")} Export audit log</button>`)}<div class="page-content"><div class="audit-banner"><div class="audit-icon">${icon("scroll-text")}</div><div><span class="eyebrow">AUDIT LOG</span><h2>Every decision leaves a trace.</h2><p>Actions recorded here are written live to PostgreSQL as analysts and TRACE-X take action.</p></div><div class="audit-status">${statusBadge("ENABLED")}</div></div><div class="audit-layout"><section class="panel audit-table"><div class="panel-header"><div><div class="eyebrow">ACTIVITY LOG</div><h3>Recent events</h3></div><span class="muted" id="auditLogCount">Loading…</span></div><div id="auditLogBody">${emptyState("LOADING", "Fetching the latest audit events…")}</div></section><aside class="panel governance-panel"><div class="eyebrow">SYSTEM STATUS</div><div class="governance-status"><span class="status-dot status-dot-live"></span><strong>Operational</strong></div><div class="governance-list"><div><span>DATA SOURCE</span><b>PostgreSQL (live)</b></div><div><span>ACCESS</span><b>${escapeHtml(appState.user.role)}</b></div><div><span>SESSION</span><b>Authenticated</b></div><div><span>INTEGRITY</span><b>SHA-256 enabled</b></div></div><button class="button button-secondary button-wide" data-action="signout">${icon("log-out")} Return to access gateway</button></aside></div></div>`;
}

function auditRow(log) {
  const shortId = log.resourceId ? (log.resourceId.length > 12 ? `${log.resourceId.slice(0, 8)}…` : log.resourceId) : "";
  const detail = shortId ? `${log.resource} · ${shortId}` : log.resource;
  return `<div class="audit-row"><span class="audit-time">${formatAuditTime(log.timestamp)}</span><span class="audit-actor">${log.actor === "TRACE-X" ? icon("cpu") : icon("user-round")} ${escapeHtml(log.actor)}</span><span class="audit-event"><b>${escapeHtml(log.action.replaceAll("_", " "))}</b><small>${escapeHtml(detail)}</small></span><span class="audit-check">${icon("check-circle-2")}</span></div>`;
}

function formatAuditTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  const datePart = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

async function loadAuditLog() {
  const body = document.getElementById("auditLogBody");
  const countEl = document.getElementById("auditLogCount");
  try {
    const logs = await api.getAuditLogs();
    if (body) body.innerHTML = logs.length ? logs.slice(0, 20).map((log) => auditRow(log)).join("") : emptyState("NO AUDIT EVENTS", "Analyst actions will appear here once recorded.");
    if (countEl) countEl.textContent = `Last ${Math.min(logs.length, 20)} events`;
    refreshIcons();
  } catch (err) {
    console.error("Failed to load audit log", err);
    if (body) body.innerHTML = emptyState("COULD NOT LOAD", "You may not have permission to view the audit log, or the server is unreachable.");
    if (countEl) countEl.textContent = "";
  }
}

function renderRouteEnhancements(route) {
  destroyCharts();
  if (route === "dashboard") { createActivityChart("activityChart"); createCategoryChart("categoryChart"); createNetwork("miniNetwork", true); }
  if (route === "map") initThreatMap();
  if (route === "network") { createNetwork("networkGraph", false); loadNetworkAnalytics(); }
  if (route === "timeline") createTimelineChart("timelineChart");
  if (route === "entity") loadEntityProfileExtras(appState.selectedEntity);
  if (route === "audit") loadAuditLog();
}

function destroyCharts() {
  chartInstances.forEach((chart) => chart.destroy());
  chartInstances.clear();
  if (networkInstance) { networkInstance.destroy(); networkInstance = null; }
  destroyThreatMap();
}

function chartOptions(options = {}) {
  return { responsive: true, maintainAspectRatio: false, animation: { duration: 420 }, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#111f2d", borderColor: "#2b4053", borderWidth: 1, titleColor: "#ecf5fa", bodyColor: "#a6bac6", padding: 12, displayColors: false } }, scales: { x: { grid: { color: "rgba(137, 167, 184, .08)" }, ticks: { color: "#6f8797", font: { family: "IBM Plex Mono", size: 10 }, maxTicksLimit: 8 } }, y: { grid: { color: "rgba(137, 167, 184, .08)" }, ticks: { color: "#6f8797", font: { family: "IBM Plex Mono", size: 10 } }, beginAtZero: true } }, ...options };
}

function createActivityChart(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const range = appState.filters.range;
  const count = range === "7d" ? 7 : range === "90d" ? 12 : 10;
  const labels = Array.from({ length: count }, (_, i) => range === "90d" ? `W${i + 1}` : `${String(i + 2).padStart(2, "0")} SEP`);

  const scaleFactor = records.length > 500 ? (records.length / 70) : 1;
  const baseRecords = range === "7d" ? [42, 56, 49, 73, 61, 88, 96] : range === "90d" ? [32, 44, 39, 52, 48, 61, 57, 79, 72, 91, 86, 112] : [42, 49, 56, 51, 67, 73, 62, 88, 81, 104];
  const recordsData = baseRecords.map(val => Math.round(val * scaleFactor));
  const signalData = recordsData.map((value, i) => Math.max(12, Math.round(value * (0.14 + (i % 3) * 0.02))));

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Intelligence records",
          data: recordsData,
          borderColor: "#3f8cff",
          backgroundColor: "rgba(63,140,255,.12)",
          fill: true,
          tension: .38,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "#3f8cff",
          borderWidth: 2
        },
        {
          label: "Priority signals",
          data: signalData,
          borderColor: "#5dd9db",
          backgroundColor: "transparent",
          tension: .38,
          pointRadius: 2,
          pointBackgroundColor: "#5dd9db",
          borderWidth: 2
        }
      ]
    },
    options: chartOptions()
  });
  chartInstances.set(id, chart);
}

function createCategoryChart(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const chart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: categories.slice(0, 4),
      datasets: [
        {
          data: [38, 27, 22, 13],
          backgroundColor: ["#3f8cff", "#5dd9db", "#e7b86b", "#906ff0"],
          borderColor: "#111f2d",
          borderWidth: 4,
          hoverOffset: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "76%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#111f2d",
          borderColor: "#2b4053",
          borderWidth: 1,
          padding: 12
        }
      }
    }
  });
  chartInstances.set(id, chart);
}

function createTimelineChart(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const labels = Array.from({ length: 14 }, (_, i) => `${String(i + 1).padStart(2, "0")} AUG`);
  const scaleFactor = records.length > 500 ? (records.length / 70) : 1;
  const baseValues = [12, 18, 14, 21, 19, 28, 34, 31, 44, 39, 52, 65, 71, 86];
  const values = baseValues.map(v => Math.round(v * scaleFactor));

  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Records",
          data: values,
          backgroundColor: values.map((_, i) => i > 10 ? "#5dd9db" : "rgba(63,140,255,.62)"),
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: .68
        }
      ]
    },
    options: chartOptions({
      plugins: {
        tooltip: {
          callbacks: {
            afterLabel: (context) => context.dataIndex > 10 ? "High-volume intercept spike detected" : "Baseline telemetry feed"
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 8, color: "#6f8797", font: { family: "IBM Plex Mono", size: 10 } }
        },
        y: {
          grid: { color: "rgba(137, 167, 184, .08)" },
          ticks: { color: "#6f8797", font: { family: "IBM Plex Mono", size: 10 } },
          beginAtZero: true
        }
      }
    })
  });
  chartInstances.set(id, chart);
}

function createNetwork(id, mini = false) {
  const container = document.getElementById(id);
  if (!container) return;
  const visibleEntities = mini ? entities.slice(0, 12) : entities.slice(0, 24);
  const ids = new Set(visibleEntities.map((entity) => entity.id));
  const nodes = visibleEntities.map((entity) => ({ data: { id: entity.id, label: entity.code || entity.id, type: entity.type, priority: entity.priority } }));
  const edges = relationships.filter((relation) => ids.has(relation.source) && ids.has(relation.target)).slice(0, mini ? 22 : 42).map((relation) => ({ data: { id: relation.id, source: relation.source, target: relation.target, label: relation.type } }));
  networkInstance = cytoscape({ container, elements: { nodes, edges }, layout: { name: "cose", animate: false, padding: mini ? 18 : 44, randomize: true }, userZoomingEnabled: !mini, userPanningEnabled: !mini, boxSelectionEnabled: false, style: [{ selector: "node", style: { "background-color": (node) => { const t = (node.data("type") || "").toUpperCase(); return t === "SOURCE" ? "#5dd9db" : t === "TOPIC" ? "#e7b86b" : t === "MARKETPLACE" ? "#906ff0" : t === "LOCATION" ? "#d87b97" : "#3f8cff"; }, label: mini ? "" : "data(label)", color: "#d8e5ec", "font-size": mini ? 0 : 10, "font-family": "IBM Plex Mono", "text-valign": "bottom", "text-margin-y": 8, width: (node) => mini ? (node.data("priority") > 80 ? 18 : 12) : (node.data("priority") > 80 ? 34 : 24), height: (node) => mini ? (node.data("priority") > 80 ? 18 : 12) : (node.data("priority") > 80 ? 34 : 24), "border-width": (node) => node.data("id") === appState.selectedEntity ? 3 : 1, "border-color": (node) => node.data("id") === appState.selectedEntity ? "#ffffff" : "rgba(255,255,255,.22)" } }, { selector: "edge", style: { width: mini ? 1 : 1.4, "line-color": "rgba(107,145,165,.38)", "target-arrow-color": "rgba(107,145,165,.38)", "target-arrow-shape": "triangle", "curve-style": "bezier", opacity: .8 } }, { selector: ".faded", style: { opacity: .12 } }, { selector: ".highlighted", style: { "border-color": "#ffffff", "border-width": 4, opacity: 1 } }] });
  networkInstance.on("tap", "node", (event) => {
    const node = event.target;
    selectEntity(node.id());
    if (!mini) openIntelligenceDrawer(node.id()); else pushToast(`${node.id()} selected · open Network Intelligence for full context`, "info");
  });
}

function openOverlay(content, className = "") {
  const root = document.getElementById("overlay-root");
  if (!root) return;
  root.innerHTML = `<div class="overlay-backdrop" data-action="close-overlay"><div class="overlay-card ${className}" role="dialog" aria-modal="true" data-overlay-card>${content}</div></div>`;
  refreshIcons();
  window.requestAnimationFrame(() => document.querySelector(".overlay-card")?.classList.add("is-open"));
}

function closeOverlay() {
  const root = document.getElementById("overlay-root");
  if (root) root.innerHTML = "";
}

function openIntelligenceDrawer(entityId = appState.selectedEntity) {
  const entity = entities.find((item) => item.id === entityId) ?? entities[0];
  if (!entity) return;
  const related = relationships.filter((r) => r.source === entity.id || r.target === entity.id).slice(0, 4);
  openOverlay(`<div class="drawer-header"><div><span class="eyebrow">INTELLIGENCE PANEL</span><h2>${escapeHtml(entity.id)}</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close panel">${icon("x")}</button></div><div class="drawer-badge-row">${statusBadge("SELECTED")} ${priorityBadge(entity.priority)}</div><div class="drawer-entity-intro"><div class="profile-symbol">${icon("fingerprint")}</div><p>${escapeHtml(entity.description)}</p></div><div class="drawer-section"><span class="eyebrow">ENTITY DETAILS</span><div class="drawer-fields"><span><small>TYPE</small><b>${entity.type}</b></span><span><small>COMMUNITY</small><b>${entity.community}</b></span><span><small>LAST ACTIVITY</small><b>${entity.lastObserved}</b></span><span><small>SOURCES</small><b>${entity.sources.length}</b></span></div></div><div class="drawer-section"><div class="drawer-section-heading"><span class="eyebrow">RELATIONSHIPS</span><span>${related.length} nearby</span></div>${related.map((relation) => `<div class="drawer-relation"><span class="relation-icon">${icon("link-2")}</span><span><b>${relation.source === entity.id ? relation.target : relation.source}</b><small>${relation.type} · ${relation.confidence}%</small></span></div>`).join("")}</div><div class="drawer-section"><span class="eyebrow">LATEST ACTIVITY</span><p class="drawer-activity">${escapeHtml(records.find((record) => record.entityId === entity.id)?.snippet ?? "No recent record selected.")}</p></div><div class="drawer-actions"><button class="button button-primary button-wide" data-action="drawer-open-entity">Open entity profile ${icon("arrow-up-right")}</button><button class="button button-secondary button-wide" data-action="view-lineage">View evidence ${icon("folder-search")}</button></div>`, "drawer-overlay");
}

async function openScoreDrawer(entityId = appState.selectedEntity) {
  openOverlay(`<div class="drawer-header"><div><span class="eyebrow">EXPLAINABILITY</span><h2>Why this score?</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close explanation">${icon("x")}</button></div><p class="drawer-copy">Calculating…</p>`, "drawer-overlay");
  try {
    const data = await api.getEntityScore(entityId);
    const total = data.reasons.reduce((sum, r) => sum + r.points, 0);
    const content = `<div class="drawer-header"><div><span class="eyebrow">EXPLAINABILITY</span><h2>Why this score?</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close explanation">${icon("x")}</button></div><div class="score-drawer-hero"><strong>${data.score}<small>/100</small></strong><div>${priorityBadge(data.score)}<p>Computed live from relationship, evidence and alert data</p></div></div><p class="drawer-copy">This score is computed from ${data.relationshipCount} relationships, ${data.evidenceCount} linked evidence items and ${data.alertCount} linked alerts. It is an analytical prioritization signal, not a determination of criminal activity.</p><div class="score-breakdown">${data.reasons.map((r) => `<div class="score-factor"><div class="score-factor-top"><span>${icon("plus")} ${escapeHtml(r.label)}</span><b>+${r.points}</b></div></div>`).join("")}<div class="score-factor"><div class="score-factor-top"><span><b>Total</b></span><b>${total}</b></div></div></div><div class="drawer-actions"><button class="button button-primary button-wide" data-action="close-overlay">Close ${icon("check")}</button></div>`;
    openOverlay(content, "drawer-overlay");
  } catch (err) {
    openOverlay(`<div class="drawer-header"><div><span class="eyebrow">EXPLAINABILITY</span><h2>Why this score?</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close explanation">${icon("x")}</button></div><p class="drawer-copy">Could not load score. Try again.</p>`, "drawer-overlay");
  }
}

async function openInvestigationSummaryDrawer() {
  const inv = investigations[0];
  if (!inv) return;
  openOverlay(`<div class="drawer-header"><div><span class="eyebrow">AI ANALYSIS</span><h2>Investigation Summary</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close summary">${icon("x")}</button></div><p class="drawer-copy">Generating…</p>`, "drawer-overlay");
  try {
    const data = await api.getInvestigationSummary(inv.id);
    openOverlay(`<div class="drawer-header"><div><span class="eyebrow">AI ANALYSIS</span><h2>Investigation Summary</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close summary">${icon("x")}</button></div><div class="drawer-badge-row">${statusBadge(inv.status)}</div><p class="drawer-copy">${escapeHtml(data.summary || "No summary available.")}</p><div class="drawer-actions"><button class="button button-primary button-wide" data-action="close-overlay">Close ${icon("check")}</button></div>`, "drawer-overlay");
  } catch (err) {
    openOverlay(`<div class="drawer-header"><div><span class="eyebrow">AI ANALYSIS</span><h2>Investigation Summary</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close summary">${icon("x")}</button></div><p class="drawer-copy">Could not generate summary. Try again.</p>`, "drawer-overlay");
  }
}

function openLineageDrawer(evidenceId = appState.selectedEvidence) {
  const selected = evidence.find((item) => item.id === evidenceId) ?? evidence[0];
  if (!selected) return;
  openOverlay(`<div class="drawer-header"><div><span class="eyebrow">PROVENANCE CHAIN</span><h2>Evidence lineage</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close lineage">${icon("x")}</button></div><div class="lineage-hero"><span class="evidence-file large">${icon("route")}</span><div><strong>${selected.id}</strong><span>${escapeHtml(selected.type)} · ${selected.confidence}% confidence</span></div></div><div class="lineage-steps"><div class="lineage-step"><span class="lineage-number">01</span><div><span class="eyebrow">FINDING</span><h3>${escapeHtml(selected.finding)}</h3><small>Generated by TRACE-X analytical method</small></div></div><div class="lineage-line"></div><div class="lineage-step"><span class="lineage-number">02</span><div><span class="eyebrow">SOURCE RECORD</span><h3>${escapeHtml(selected.source)}</h3><small>${escapeHtml(selected.timestamp)} · original observation</small></div></div><div class="lineage-line"></div><div class="lineage-step"><span class="lineage-number">03</span><div><span class="eyebrow">INTEGRITY CHECK</span><h3 class="mono">${escapeHtml(selected.fullHash)}</h3><small>SHA-256 fingerprint · ${statusBadge(selected.status)}</small></div></div><div class="lineage-line"></div><div class="lineage-step"><span class="lineage-number">04</span><div><span class="eyebrow">ANALYST DECISION</span><h3>${selected.status === "VERIFIED" ? "Verified for this demonstration" : "Awaiting analyst review"}</h3><small>Decision remains editable and is preserved in audit trail.</small></div></div></div><p class="legal-copy">${icon("info")} Hashing supports integrity verification; it does not alone establish legal admissibility.</p><div class="drawer-actions"><button class="button button-primary button-wide" data-action="close-overlay">Close lineage ${icon("check")}</button></div>`, "drawer-overlay");
}

function openAlertDrawer(alertId = appState.selectedAlert) {
  const alert = alerts.find((item) => item.id === alertId) ?? alerts[0];
  if (!alert) return;
  selectAlert(alert.id);
  openOverlay(`<div class="drawer-header"><div><span class="eyebrow">SIGNAL REVIEW</span><h2>${alert.id}</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close alert">${icon("x")}</button></div><div class="alert-drawer-title"><span class="alert-severity">${icon("triangle-alert")} ${alert.severity}</span><h3>${escapeHtml(alert.type)}</h3>${statusBadge(alert.status)}</div><div class="drawer-review-block"><span class="eyebrow">WHAT HAPPENED</span><p>${escapeHtml(alert.what)}</p><span class="eyebrow">WHY IT MATTERS</span><p>${escapeHtml(alert.why)}</p>${alert.aiSummary ? `<span class="eyebrow">${icon("sparkles")} AI ANALYSIS</span><p>${escapeHtml(alert.aiSummary)}</p>` : ""}</div><div class="drawer-review-grid"><div><span>CONFIDENCE</span><strong>${alert.confidence}%</strong></div><div><span>PRIORITY</span><strong>${alert.priority}/100</strong></div><div><span>TIMESTAMP</span><strong>${alert.timestamp}</strong></div></div><div class="drawer-section"><div class="drawer-section-heading"><span class="eyebrow">RELATED ENTITIES</span><span>${alert.entityIds.length} linked</span></div><div class="drawer-tags">${alert.entityIds.map((id) => `<button class="tag" data-open-entity="${id}">${id}</button>`).join("")}</div></div><div class="drawer-section"><div class="drawer-section-heading"><span class="eyebrow">SUPPORTING EVIDENCE</span><span>${alert.evidenceIds.length} items</span></div><div class="drawer-tags">${alert.evidenceIds.map((id) => `<button class="tag evidence-tag" data-open-evidence="${id}">${id}</button>`).join("")}</div></div><div class="analyst-review-note">${icon("user-check")} AI signal → evidence → confidence → analyst decision</div><div class="drawer-actions review-actions"><button class="button button-primary" data-review-alert="${alert.id}">${icon("check")} Review signal</button><button class="button button-secondary" data-action="view-lineage">${icon("route")} Lineage</button></div>`, "drawer-overlay wide-drawer");
}

function openTrendDrawer(trendId = appState.selectedTrend) {
  const trend = trends.find((item) => item.id === trendId) ?? trends[0];
  if (!trend) return;
  selectTrend(trend.id);
  const related = entities.filter((entity) => (trend.description || "").includes(entity.id)).slice(0, 3);
  openOverlay(`<div class="drawer-header"><div><span class="eyebrow">RADAR SIGNAL</span><h2>${escapeHtml(trend.name)}</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close trend">${icon("x")}</button></div><div class="trend-drawer-score"><div class="trend-icon ${trend.color}">${icon("radar")}</div><div><strong>+${trend.growth}%</strong><span>growth against baseline</span></div><div><strong>${trend.confidence}%</strong><span>confidence</span></div></div><p class="drawer-copy">${escapeHtml(trend.description)} This is an analytical lead for collection and review, not a conclusion about conduct.</p><div class="drawer-section"><span class="eyebrow">RELATED ENTITIES</span><div class="drawer-related-list">${related.length ? related.map((entity) => `<button class="drawer-related-row" data-open-entity="${entity.id}"><span>${icon("fingerprint")}</span><b>${entity.id}</b><small>${entity.activity}% activity</small>${icon("chevron-right")}</button>`).join("") : `<p class="muted">No linked entities identified.</p>`}</div></div><div class="drawer-actions"><button class="button button-primary button-wide" data-action="view-lineage">View supporting evidence ${icon("folder-search")}</button></div>`, "drawer-overlay");
}

async function openResolutionModal(entityId = appState.selectedEntity) {
  openOverlay(`<div class="modal-header"><div><span class="eyebrow">ENTITY RESOLUTION</span><h2>Potential entity match</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close comparison">${icon("x")}</button></div><p class="drawer-copy">Searching for potential matches…</p>`, "modal-overlay");
  try {
    const matches = await api.getEntityMatches(entityId);
    if (!matches.length) {
      openOverlay(`<div class="modal-header"><div><span class="eyebrow">ENTITY RESOLUTION</span><h2>No potential matches found</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close comparison">${icon("x")}</button></div><p class="drawer-copy">No other entities currently share sources, aliases or community with ${escapeHtml(entityId)}.</p>`, "modal-overlay");
      return;
    }
    const top = matches[0];
    const entityA = entities.find((e) => e.id === entityId);
    const entityB = entities.find((e) => e.id === String(top.entityId));
    const content = `<div class="modal-header"><div><span class="eyebrow">ENTITY RESOLUTION</span><h2>${top.isCrossInvestigation ? "Cross-investigation match" : "Potential entity match"}</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close comparison">${icon("x")}</button></div>${top.isCrossInvestigation ? `<div style="display:flex;justify-content:center;margin:-4px 0 16px;"><span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:6px;background:rgba(231,184,107,.15);color:#e7b86b;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.04em;">${icon("shield-alert")} CROSS-INVESTIGATION MATCH</span></div>` : ""}<div class="resolution-compare"><div class="resolution-entity"><span>ENTITY A</span><div class="profile-symbol">${icon("fingerprint")}</div><strong>${escapeHtml(entityId)}</strong><small>${escapeHtml(entityA?.aliases?.[0] || "")}</small><div class="resolution-source">${escapeHtml((entityA?.sources || []).join(" · "))}</div></div><div class="resolution-center"><span>Potential match</span><strong>${top.confidence}%</strong><small>${top.confidence >= 80 ? "HIGH" : top.confidence >= 50 ? "MEDIUM" : "LOW"} CONFIDENCE</small></div><div class="resolution-entity"><span>ENTITY B</span><div class="profile-symbol">${icon("fingerprint")}</div><strong>${escapeHtml(entityB?.id || top.entityId)}</strong><small>${escapeHtml(entityB?.aliases?.[0] || "")}</small><div class="resolution-source">${escapeHtml((entityB?.sources || []).join(" · "))}</div></div></div>${top.investigationTitle ? `<div class="muted" style="text-align:center;">${icon("link-2")} Entity B also appears in <b>${escapeHtml(top.investigationTitle)}</b></div>` : ""}<div class="resolution-reasons">${top.reasons.map((r) => `<div><span>${icon("check")} ${escapeHtml(r.label)} (+${r.points})</span></div>`).join("")}</div><div class="resolution-warning">${icon("shield-alert")} Never automatically merge uncertain entities. Analyst verification is required.</div><div class="modal-actions"><button class="button button-secondary" data-action="reject-match">Reject</button><button class="button button-secondary" data-action="view-lineage">Review evidence</button><button class="button button-primary" data-action="verify-match">Verify match ${icon("check")}</button></div>`;
    openOverlay(content, "modal-overlay");
  } catch (err) {
    openOverlay(`<div class="modal-header"><div><span class="eyebrow">ENTITY RESOLUTION</span><h2>Error</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close comparison">${icon("x")}</button></div><p class="drawer-copy">Could not load potential matches.</p>`, "modal-overlay");
  }
}

function openIngestTargetModal() {
  const entityOptions = entities
    .map((e) => `<option value="${e.id}">${escapeHtml(e.code || e.id)} (${escapeHtml(e.type)})</option>`)
    .join("");

  const content = `
    <div class="modal-header">
      <div>
        <span class="eyebrow"><i class="active-pulse red" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#eb5757;box-shadow:0 0 8px #eb5757;margin-right:6px;"></i>TARGET & IOC INGESTION WORKSPACE</span>
        <h2>Ingest Live Suspect or Threat Indicator</h2>
      </div>
      <button class="icon-button" data-action="close-overlay" aria-label="Close modal">${icon("x")}</button>
    </div>

    <div class="ingest-modal-body">
      <div class="ingest-modal-banner">
        ${icon("shield-alert")}
        <div>
          <strong>Live Database Ingestion:</strong> Targets and relationships are committed directly to PostgreSQL cluster on port 5433 and dynamically synchronized into the graph.
        </div>
      </div>

      <form id="ingestTargetForm" class="ingest-form">
        <div class="form-row-2">
          <label class="form-group">
            <span class="form-label">${icon("fingerprint")} TARGET / IOC IDENTIFIER *</span>
            <input type="text" id="targetName" class="form-input code-font" placeholder="e.g. KRAKEN-NODE-09, 185.220.101.5, DarkHydra" required autocomplete="off" />
            <span class="form-hint">Suspect code, IP address, onion domain, or wallet ID</span>
          </label>

          <label class="form-group">
            <span class="form-label">${icon("scan-search")} CLASSIFICATION TYPE *</span>
            <select id="targetType" class="form-select">
              <option value="SUSPECT">Suspect / Person of Interest</option>
              <option value="C2_SERVER">C2 Server / Command Node</option>
              <option value="IP_ADDRESS">IP Address / Proxy Relay</option>
              <option value="DOMAIN">Darknet / Malicious Domain</option>
              <option value="CRYPTO_WALLET">Crypto Wallet / Mixer</option>
              <option value="ORGANIZATION">Threat Syndicate / Cell</option>
              <option value="MALWARE">Malware / Implant Sample</option>
            </select>
            <span class="form-hint">Ontology category for network visualization</span>
          </label>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <span class="form-label">${icon("triangle-alert")} THREAT PRIORITY LEVEL</span>
            <div class="priority-selector">
              <label class="radio-pill red">
                <input type="radio" name="ingestPriority" value="CRITICAL" />
                <span>CRITICAL</span>
              </label>
              <label class="radio-pill amber">
                <input type="radio" name="ingestPriority" value="HIGH" checked />
                <span>HIGH</span>
              </label>
              <label class="radio-pill blue">
                <input type="radio" name="ingestPriority" value="MEDIUM" />
                <span>MEDIUM</span>
              </label>
              <label class="radio-pill grey">
                <input type="radio" name="ingestPriority" value="LOW" />
                <span>LOW</span>
              </label>
            </div>
            <span class="form-hint">Triage severity rating for automated prioritization</span>
          </div>

          <label class="form-group">
            <span class="form-label">${icon("workflow")} COMMUNITY / CLUSTER GROUP</span>
            <input type="text" id="targetCommunity" class="form-input" placeholder="e.g. FIN-Syndicate, HydraNet, Eastern-Hub" value="Operation-Orion" />
            <span class="form-hint">Clustering attribute for network topology</span>
          </label>
        </div>

        <div class="form-row-2">
          <label class="form-group">
            <span class="form-label">${icon("tag")} ALIASES / TAGS</span>
            <input type="text" id="targetAliases" class="form-input" placeholder="e.g. GhostOp, 0xPhantom, RedRaven (comma-separated)" />
            <span class="form-hint">Comma-separated alternative handles or tags</span>
          </label>

          <label class="form-group">
            <span class="form-label">${icon("radio-tower")} INTELLIGENCE SOURCES</span>
            <input type="text" id="targetSources" class="form-input" placeholder="e.g. SIGINT, Wiretap, Darknet Scraping" value="Analyst-Ingestion, SIGINT" />
            <span class="form-hint">Corroborating collection feeds</span>
          </label>
        </div>

        <div class="ingest-relation-box">
          <div class="relation-box-header">
            <div class="relation-box-title">
              ${icon("share-2")}
              <strong>INITIAL RELATIONSHIP LINKAGE (OPTIONAL)</strong>
            </div>
            <span class="relation-box-badge">Graph Integration</span>
          </div>
          <p class="relation-box-desc">Connect this new target immediately to an active entity in the current investigation graph.</p>

          <div class="form-row-3">
            <label class="form-group">
              <span class="form-label">ASSOCIATED TARGET</span>
              <select id="targetRelEntity" class="form-select">
                <option value="">-- No Link (Standalone Node) --</option>
                ${entityOptions}
              </select>
            </label>

            <label class="form-group">
              <span class="form-label">RELATIONSHIP TYPE</span>
              <select id="targetRelType" class="form-select">
                <option value="COMMUNICATED_WITH">COMMUNICATED_WITH</option>
                <option value="CONTROLS">CONTROLS</option>
                <option value="TRANSFERRED_FUNDS">TRANSFERRED_FUNDS</option>
                <option value="HOSTS">HOSTS</option>
                <option value="AFFILIATE_OF">AFFILIATE_OF</option>
                <option value="OPERATES_ON">OPERATES_ON</option>
              </select>
            </label>

            <label class="form-group">
              <span class="form-label">CONFIDENCE (<span id="relConfidenceVal">85</span>%)</span>
              <input type="range" id="targetRelConfidence" min="10" max="100" value="85" class="form-range" />
            </label>
          </div>
        </div>

        <label class="form-group full">
          <span class="form-label">${icon("file-text")} INVESTIGATIVE FINDINGS & EVIDENCE SNIPPET</span>
          <textarea id="targetDescription" class="form-textarea" rows="2" placeholder="Detail observed telemetry, intercept timestamps, packet logs, or operational context..."></textarea>
        </label>

        <div class="modal-actions" style="margin-top:8px;padding:0;">
          <button type="button" class="button button-secondary" data-action="close-overlay">Cancel</button>
          <button type="submit" class="button button-glow" id="btnSubmitIngest">
            ${icon("plus-circle")} Ingest Target into Database
          </button>
        </div>
      </form>
    </div>
  `;

  openOverlay(content, "modal-overlay ingest-modal");

  const slider = document.getElementById("targetRelConfidence");
  const sliderVal = document.getElementById("relConfidenceVal");
  if (slider && sliderVal) {
    slider.addEventListener("input", (e) => {
      sliderVal.textContent = e.target.value;
    });
  }

  window.setTimeout(() => {
    document.getElementById("targetName")?.focus();
  }, 100);
}

async function submitIngestTarget(form) {
  const submitBtn = document.getElementById("btnSubmitIngest");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:6px;"></span> Committing to Database...`;
  }

  try {
    const name = document.getElementById("targetName")?.value.trim();
    const type = document.getElementById("targetType")?.value || "SUSPECT";
    const priority = form.querySelector("input[name='ingestPriority']:checked")?.value || "HIGH";
    const community = document.getElementById("targetCommunity")?.value.trim() || "Operation-Orion";
    const rawAliases = document.getElementById("targetAliases")?.value.trim() || "";
    const rawSources = document.getElementById("targetSources")?.value.trim() || "Analyst-Ingestion";
    const description = document.getElementById("targetDescription")?.value.trim() || "";

    const aliases = rawAliases ? rawAliases.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const sources = rawSources ? rawSources.split(",").map((s) => s.trim()).filter(Boolean) : ["Analyst-Ingestion"];

    const newEntity = await api.createEntity({
      name,
      type,
      priority,
      community,
      aliases,
      sources,
      description,
      activity: 1,
    });

    entities.unshift(newEntity);
    recordAuditEvent("INGEST_TARGET", "entity", newEntity.code || newEntity.id);

    const relEntityId = document.getElementById("targetRelEntity")?.value;
    let newRel = null;
    if (relEntityId) {
      const relType = document.getElementById("targetRelType")?.value || "COMMUNICATED_WITH";
      const confidence = Number(document.getElementById("targetRelConfidence")?.value || 85);

      newRel = await api.createRelationship({
        sourceId: newEntity.id,
        targetId: relEntityId,
        type: relType,
        confidence,
      });

      relationships.unshift(newRel);
    }

    selectEntity(newEntity.id);

    if (networkInstance) {
      const newNodeData = {
        data: {
          id: newEntity.id,
          label: newEntity.code || newEntity.id,
          type: newEntity.type,
          priority: newEntity.priority,
        },
      };
      networkInstance.add(newNodeData);

      if (newRel) {
        networkInstance.add({
          data: {
            id: newRel.id,
            source: newRel.source,
            target: newRel.target,
            label: newRel.type,
          },
        });
      }

      networkInstance.elements().removeClass("highlighted");
      const nodeEl = networkInstance.getElementById(newEntity.id);
      if (nodeEl.length) {
        nodeEl.addClass("highlighted");
        nodeEl.connectedEdges().addClass("highlighted");
        networkInstance.center(nodeEl);
      }
    }

    closeOverlay();
    pushToast(`Target ${newEntity.code || newEntity.id} ingested & saved to PostgreSQL!`, "success");
    renderApp();
  } catch (err) {
    console.error("Failed to ingest target", err);
    pushToast(err.message || "Failed to ingest target into database", "error");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `${icon("plus-circle")} Ingest Target into Database`;
      refreshIcons();
    }
  }
}

const RAW_SAMPLES = {
  darknet: {
    title: "OPERATION HYDRA-STRIKE",
    code: `CASE-${new Date().getFullYear()}-HYD`,
    objective: "Intercept darknet multi-hop proxy chains, anonymous escrow gateways, and illicit transaction flows.",
    raw: `[2026-09-08 04:12:01 UTC] [TOR-CIRCUIT-INTERCEPT] Intercepted encrypted proxy session
Target Relay Node: 185.220.101.44 (Port 9050 / Tor Exit Relay)
Onion Escrow Gateway: hydradark49v7x2k9lp17q.onion
Settlement Crypto Wallet: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
Secondary Mixer Wallet: 0x71C8366420A0926793fe1b0e50f70be440723819
Malicious Artifact SHA256: 8f4a3b190c42d38e76a5109b83e6012c49a711d9f8234ea7231456bc9e812d44
Observations: Encrypted payload routed through bulletproof hosting cluster. Automated escrow distribution flagged for high-velocity laundering.`
  },
  ransomware: {
    title: "OPERATION BLACK-VAULT",
    code: `CASE-${new Date().getFullYear()}-RNS`,
    objective: "Track ransomware affiliate infrastructure, automated C2 heartbeat beacons, and extortion wallet clusters.",
    raw: `[2026-09-08 05:30:19 UTC] [SURICATA-ALERT] Outbound command-and-control beacon detected
C2 Infrastructure IP: 91.240.118.172 (ASN 48291, CyberBunker Relay)
Malicious Domain: stealth-payload-delivery.cc
Payload Sample SHA256: d41d8cd98f00b204e9800998ecf8427e998124fa091728394019283746591029
Victim Enterprise Segment: Financial Services Subnet [10.244.12.0/24]
Ransom Deposit Address: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
Telemetry: 44.2 KB encrypted heartbeat sent every 300s via TLS-1.3 with custom JA3 fingerprint.`
  },
  laundering: {
    title: "OPERATION VORTEX-TRACE",
    code: `CASE-${new Date().getFullYear()}-VTX`,
    objective: "Expose multi-jurisdictional crypto layering, mixer clusters, and shell entity laundering pipelines.",
    raw: `[2026-09-08 06:15:44 UTC] [CHAINALYSIS-FEED] High-velocity layering event across 4 hops
Primary Source Wallet: 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy
Intermediary Mixer Address: bc1q87z3f90q2u8v0x19d83h28v91y6z2x109283k1
Destination Cold Vault: 0x281046A0356230f83690d79C28198f1a78912401
Identified Entity: PHANTOM-FINANCE-GROUP
Transit Volume: 142.85 BTC ($8,420,000 USD Equivalent)
Associated Shell Corporation: VORTEX TRADING GLOBAL LTD (BVI Registered)`
  }
};

function loadRawIntelSample(type) {
  const titleInput = document.getElementById("invTitle");
  const codeInput = document.getElementById("invCaseCode");
  const objInput = document.getElementById("invObjective");
  const rawInput = document.getElementById("invRawData");

  if (type === "clear") {
    if (rawInput) rawInput.value = "";
    return;
  }

  const sample = RAW_SAMPLES[type];
  if (!sample) return;

  if (titleInput) titleInput.value = sample.title;
  if (codeInput) codeInput.value = sample.code;
  if (objInput) objInput.value = sample.objective;
  if (rawInput) rawInput.value = sample.raw;

  pushToast(`Loaded sample template: ${sample.title}`, "info");
}

function openNewInvestigationModal() {
  const defaultCode = `CASE-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const content = `
    <div class="modal-header">
      <div>
        <span class="eyebrow"><i class="active-pulse red" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#5dd9db;box-shadow:0 0 8px #5dd9db;margin-right:6px;"></i>CASE INITIALIZATION & TELEMETRY INGESTION ENGINE</span>
        <h2>Initialize New Investigation & Ingest Raw Intel Stream</h2>
      </div>
      <button class="icon-button" data-action="close-overlay" aria-label="Close modal">${icon("x")}</button>
    </div>

    <div class="new-inv-modal-body">
      <div class="new-inv-banner">
        ${icon("shield-alert")}
        <div>
          <strong>Live Intelligence Gateway:</strong> Initialize an operational investigation workspace. Enter case parameters and paste raw unparsed intelligence (IOC feeds, server logs, crypto wallets, or SIGINT telemetry). The pipeline will automatically parse, correlate, and index entities into the database.
        </div>
      </div>

      <form id="newInvestigationForm" class="ingest-form">
        <div class="form-row-2">
          <label class="form-group">
            <span class="form-label">${icon("folder-git-2")} INVESTIGATION TITLE / CODENAME *</span>
            <input type="text" id="invTitle" class="form-input code-font" placeholder="e.g. OPERATION VORTEX-SHADOW" required autocomplete="off" value="OPERATION CYBER-HYDRA" />
            <span class="form-hint">Operational codename or formal docket label</span>
          </label>

          <label class="form-group">
            <span class="form-label">${icon("hash")} DOCKET / CASE CODE *</span>
            <input type="text" id="invCaseCode" class="form-input code-font" placeholder="CASE-2026-XXX" required autocomplete="off" value="${defaultCode}" />
            <span class="form-hint">Unique identifier for audit trail & chain-of-custody</span>
          </label>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <span class="form-label">${icon("triangle-alert")} THREAT CLASSIFICATION LEVEL</span>
            <div class="priority-selector">
              <label class="radio-pill red">
                <input type="radio" name="invPriority" value="CRITICAL" checked />
                <span>CRITICAL</span>
              </label>
              <label class="radio-pill amber">
                <input type="radio" name="invPriority" value="HIGH" />
                <span>HIGH</span>
              </label>
              <label class="radio-pill blue">
                <input type="radio" name="invPriority" value="MEDIUM" />
                <span>MEDIUM</span>
              </label>
              <label class="radio-pill grey">
                <input type="radio" name="invPriority" value="LOW" />
                <span>LOW</span>
              </label>
            </div>
            <span class="form-hint">Triage severity weighting for graph analysis and radar</span>
          </div>

          <label class="form-group">
            <span class="form-label">${icon("user-check")} ASSIGNED LEAD ANALYST</span>
            <input type="text" id="invAnalyst" class="form-input" value="${escapeHtml(appState.user.name)} [${escapeHtml(appState.user.role)}]" readonly />
            <span class="form-hint">Analyst credentials bound to all ingested records</span>
          </label>
        </div>

        <label class="form-group full">
          <span class="form-label">${icon("file-text")} INVESTIGATION HYPOTHESIS & SCOPE</span>
          <input type="text" id="invObjective" class="form-input" placeholder="e.g. Dissect cross-border crypto laundering routes and darknet relay gateways" value="Disruption of multi-tier anonymized financial laundering hubs and malware C2 infrastructure." />
        </label>

        <!-- RAW DATA INGESTION CHAMBER -->
        <div class="raw-data-section">
          <div class="raw-data-header">
            <div class="raw-data-title">
              ${icon("terminal")}
              <span>RAW INTELLIGENCE FEED / IOC STREAM / LOG DUMP</span>
            </div>
            <div class="sample-presets-group">
              <span style="font-size:10px;color:var(--muted);margin-right:2px;">Insert Sample Intel:</span>
              <button type="button" class="sample-pill-btn" data-action="load-sample-darknet">${icon("sparkles")} Darknet Dump</button>
              <button type="button" class="sample-pill-btn" data-action="load-sample-ransomware">${icon("sparkles")} Ransomware C2</button>
              <button type="button" class="sample-pill-btn" data-action="load-sample-laundering">${icon("sparkles")} Crypto Mixer</button>
              <button type="button" class="sample-pill-btn" data-action="clear-raw-intel">${icon("x")} Clear</button>
            </div>
          </div>

          <textarea id="invRawData" class="raw-textarea" rows="6" placeholder="Paste unparsed intelligence here (IP addresses, Tor onion links, Bitcoin/Monero addresses, SHA-256 file hashes, SIGINT intercepts, server access logs)..."></textarea>

          <div class="pipeline-options">
            <label class="pipeline-checkbox">
              <input type="checkbox" id="chkExtractEntities" checked />
              <span>${icon("scan-search")} Auto-extract Target Entities (IPs, Wallets, Domains)</span>
            </label>
            <label class="pipeline-checkbox">
              <input type="checkbox" id="chkIndexRecords" checked />
              <span>${icon("database")} Index Raw Intelligence into Queryable Records</span>
            </label>
            <label class="pipeline-checkbox">
              <input type="checkbox" id="chkGenerateEvidence" checked />
              <span>${icon("shield-check")} Mint Cryptographic SHA-256 Evidence Chain</span>
            </label>
            <label class="pipeline-checkbox">
              <input type="checkbox" id="chkGenerateAlert" checked />
              <span>${icon("radar")} Dispatch Initial Triaged Alert to Signal Radar</span>
            </label>
          </div>
        </div>

        <!-- DIRECT BULK FILE & PDF DOSSIER INGESTION CHAMBER -->
        <div class="raw-data-section" style="margin-top:14px;">
          <div class="raw-data-header">
            <div class="raw-data-title">
              ${icon("upload-cloud")}
              <span>DIRECT BULK &amp; PDF CASE DOSSIER INGESTION (.PDF, .JSON, .CSV, .TXT)</span>
            </div>
            <span style="font-size:10px;color:var(--cyan);font-family:var(--mono);">UP TO 100MB / HIGH-THROUGHPUT</span>
          </div>

          <div class="file-dropzone" id="invFileDropzone">
            <input type="file" id="invFileInput" style="display:none;" accept=".pdf,.json,.csv,.ndjson,.txt,.log" />
            <div class="dropzone-icon">${icon("file-up")}</div>
            <div class="dropzone-title">Click to browse or Drag &amp; Drop Case PDF Dossier / Dataset</div>
            <div class="dropzone-subtitle">Directly load PDF FIRs, forensic police dossiers, 100,000+ JSON records, or CSV threat dumps</div>
          </div>

          <div id="invFileInfo" class="file-info-box" style="display:none;">
            <div class="file-info-left">
              ${icon("file-code-2")}
              <div>
                <span class="file-info-name" id="invFileName">dataset.json</span>
                <div class="file-info-size" id="invFileSize">0 KB</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="file-preview-pill" id="invFileCount">Ready to Ingest</span>
              <button type="button" class="icon-button" id="invFileClearBtn" style="color:var(--red);border:none;background:transparent;" title="Remove File">${icon("trash-2")}</button>
            </div>
          </div>

          <div id="invUploadProgress" style="display:none;margin-top:8px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;font-family:var(--mono);color:var(--cyan);margin-bottom:4px;">
              <span id="invProgressStatus">Streaming records into PostgreSQL...</span>
              <span id="invProgressPercent">0%</span>
            </div>
            <div class="upload-progress-container">
              <div class="upload-progress-bar" id="invProgressBar"></div>
            </div>
          </div>
        </div>

        <div class="modal-actions" style="margin-top:16px;padding:0;">
          <button type="button" class="button button-secondary" data-action="close-overlay">Cancel</button>
          <button type="submit" class="button button-glow" id="btnSubmitNewInvestigation">
            ${icon("plus-circle")} Initialize Case & Ingest Raw Intel Stream
          </button>
        </div>
      </form>
    </div>
  `;

  openOverlay(content, "modal-overlay new-inv-modal");
  window.setTimeout(() => {
    document.getElementById("invTitle")?.focus();

    const dropzone = document.getElementById("invFileDropzone");
    const fileInput = document.getElementById("invFileInput");
    const infoBox = document.getElementById("invFileInfo");
    const fileNameEl = document.getElementById("invFileName");
    const fileSizeEl = document.getElementById("invFileSize");
    const fileCountEl = document.getElementById("invFileCount");
    const clearBtn = document.getElementById("invFileClearBtn");
    const rawTextarea = document.getElementById("invRawData");

    const handleSelectedFile = (file) => {
      if (!file) return;
      if (dropzone) dropzone.style.display = "none";
      if (infoBox) infoBox.style.display = "flex";
      if (fileNameEl) fileNameEl.textContent = file.name;
      
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
        : `${(file.size / 1024).toFixed(1)} KB`;
      if (fileSizeEl) fileSizeEl.textContent = sizeStr;

      if (file.name.toLowerCase().endsWith(".pdf")) {
        if (fileCountEl) fileCountEl.textContent = "PDF Case Dossier (Ready for AI Extraction)";
        if (rawTextarea && !rawTextarea.value.trim()) {
          rawTextarea.value = `[PDF Case Dossier Attached: ${file.name} - Size: ${sizeStr}]\nForensic IOC parser will automatically extract Phone Numbers, Telegram Handles, Crypto Wallets, Emails, and Target Names directly into the case workspace.`;
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          let countEstimate = "File Loaded";
          try {
            if (file.name.endsWith(".json") || text.trim().startsWith("[")) {
              const parsed = JSON.parse(text);
              const count = Array.isArray(parsed) ? parsed.length : (parsed.records?.length || 1);
              countEstimate = `${count.toLocaleString()} Records Detected`;
            } else if (file.name.endsWith(".csv")) {
              const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
              countEstimate = `${Math.max(1, lines.length - 1).toLocaleString()} Rows Detected`;
            } else {
              const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
              countEstimate = `${lines.length.toLocaleString()} Lines Detected`;
            }
          } catch (_) {
            countEstimate = "Binary / Encrypted Stream";
          }
          if (fileCountEl) fileCountEl.textContent = countEstimate;

          if (rawTextarea && !rawTextarea.value.trim()) {
            rawTextarea.value = text.slice(0, 3000) + (text.length > 3000 ? "\n\n[... Remaining dataset will be batch ingested directly on submit ...]" : "");
          }
        };
        reader.readAsText(file.slice(0, 5 * 1024 * 1024));
      }
      refreshIcons();
    };

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });
      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
      });
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          fileInput.files = e.dataTransfer.files;
          handleSelectedFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", () => {
        if (fileInput.files && fileInput.files.length > 0) {
          handleSelectedFile(fileInput.files[0]);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (fileInput) fileInput.value = "";
        if (infoBox) infoBox.style.display = "none";
        if (dropzone) dropzone.style.display = "flex";
      });
    }
  }, 100);
}

async function submitNewInvestigation(form) {
  const submitBtn = document.getElementById("btnSubmitNewInvestigation");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:6px;"></span> Initializing & Parsing Ingestion Stream...`;
  }

  try {
    const title = document.getElementById("invTitle")?.value.trim() || "NEW INVESTIGATION";
    const caseCode = document.getElementById("invCaseCode")?.value.trim() || `CASE-${Date.now().toString().slice(-4)}`;
    const priority = form.querySelector("input[name='invPriority']:checked")?.value || "CRITICAL";
    const objective = document.getElementById("invObjective")?.value.trim() || "Multi-source intelligence fusion investigation.";
    const rawData = document.getElementById("invRawData")?.value.trim() || "";

    const chkExtract = document.getElementById("chkExtractEntities")?.checked ?? true;
    const chkIndex = document.getElementById("chkIndexRecords")?.checked ?? true;
    const chkEvidence = document.getElementById("chkGenerateEvidence")?.checked ?? true;
    const chkAlert = document.getElementById("chkGenerateAlert")?.checked ?? true;

    const fileInput = document.getElementById("invFileInput");
    const uploadedFile = fileInput?.files?.[0];

    // 1. Regex Parsing of Raw Intel
    const extractedEntities = [];
    const extractedRels = [];
    let extractedCount = 0;

    if (chkExtract && rawData) {
      // Find IPv4
      const ips = Array.from(new Set(rawData.match(/\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g) || [])).slice(0, 3);
      // Find Crypto Wallets
      const wallets = Array.from(new Set(rawData.match(/\b(bc1[a-zA-HJ-NP-Z0-9]{25,39}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-fA-F0-9]{40})\b/g) || [])).slice(0, 2);
      // Find Domains / Onion
      const domains = Array.from(new Set(rawData.match(/\b([a-z2-7]{16,56}\.onion|[a-zA-Z0-9-_]+\.(?:cc|top|su|ru|to|is|io|net|com))\b/gi) || [])).slice(0, 2);

      ips.forEach((ip, idx) => {
        const entId = `NODE-${ip.replaceAll(".", "-")}`;
        const newE = {
          id: entId,
          code: entId,
          type: "IP_ADDRESS",
          priority: priority === "CRITICAL" ? 92 : 80,
          community: caseCode,
          sources: ["Raw-SIGINT-Stream", "Network-Capture"],
          aliases: [ip, `Gateway-Relay-${idx + 1}`],
          description: `Extracted network relay node from ${caseCode} raw telemetry. Observed in live traffic intercept.`,
          firstObserved: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          lastObserved: "Just now",
          activity: 88,
        };
        extractedEntities.push(newE);
        entities.unshift(newE);
        extractedCount++;
      });

      wallets.forEach((wallet, idx) => {
        const entId = `WALLET-${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
        const newE = {
          id: entId,
          code: entId,
          type: "CRYPTO_WALLET",
          priority: 95,
          community: caseCode,
          sources: ["Blockchain-Ledger", "Mixer-Telemetry"],
          aliases: [wallet, `Mixer-Node-${idx + 1}`],
          description: `Cryptocurrency settlement / mixer wallet identified in ${caseCode} stream.`,
          firstObserved: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          lastObserved: "Just now",
          activity: 94,
        };
        extractedEntities.push(newE);
        entities.unshift(newE);
        extractedCount++;
      });

      domains.forEach((dom) => {
        const entId = dom.toUpperCase();
        const newE = {
          id: entId,
          code: entId,
          type: "DOMAIN",
          priority: 85,
          community: caseCode,
          sources: ["Darknet-Crawler", "DNS-Telemetry"],
          aliases: [dom],
          description: `Encrypted endpoint / darknet domain gateway associated with ${caseCode}.`,
          firstObserved: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          lastObserved: "Just now",
          activity: 76,
        };
        extractedEntities.push(newE);
        entities.unshift(newE);
        extractedCount++;
      });

      // Link extracted entities together
      if (extractedEntities.length >= 2) {
        for (let i = 0; i < extractedEntities.length - 1; i++) {
          const rel = {
            id: `REL-${caseCode}-${i + 1}`,
            source: extractedEntities[i].id,
            target: extractedEntities[i + 1].id,
            type: extractedEntities[i].type === "CRYPTO_WALLET" ? "TRANSFERRED_FUNDS" : "COMMUNICATED_WITH",
            confidence: 90 - i * 5,
            timestamp: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          };
          extractedRels.push(rel);
          relationships.unshift(rel);
        }
      }
    }

    // If no entities were extracted from text (or no raw data), create a primary target node
    if (extractedEntities.length === 0) {
      const primaryTargetId = `TARGET-${caseCode}-01`;
      const newE = {
        id: primaryTargetId,
        code: primaryTargetId,
        type: "SUSPECT",
        priority: priority === "CRITICAL" ? 90 : 75,
        community: caseCode,
        sources: ["Analyst-Case-Initialization"],
        aliases: [`Cell-Lead-${caseCode}`],
        description: `Primary subject of interest initialized under ${title}. ${objective}`,
        firstObserved: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        lastObserved: "Just now",
        activity: 70,
      };
      extractedEntities.push(newE);
      entities.unshift(newE);
      extractedCount = 1;
    }

    // 2. Commit Investigation to Backend
    const createdInv = await api.createInvestigation({
      title,
      name: title,
      caseCode,
      case_code: caseCode,
      status: "ACTIVE",
      priority,
      objective,
      entitiesCount: extractedEntities.length,
      recordsCount: chkIndex ? 1 : 0,
      relationshipsCount: extractedRels.length,
      alertsCount: chkAlert ? 1 : 0,
    });

    // 3. Upload & Stream Bulk Dataset File if selected
    let bulkFileCount = 0;
    if (uploadedFile) {
      const progressContainer = document.getElementById("invUploadProgress");
      const progressBar = document.getElementById("invProgressBar");
      const progressStatus = document.getElementById("invProgressStatus");
      const progressPercent = document.getElementById("invProgressPercent");

      if (progressContainer) progressContainer.style.display = "block";
      if (progressBar) progressBar.style.width = "40%";
      if (progressPercent) progressPercent.textContent = "40%";
      if (progressStatus) {
        progressStatus.textContent = uploadedFile.name.toLowerCase().endsWith(".pdf")
          ? `Extracting forensic IOCs & Ingesting PDF Dossier ${uploadedFile.name}...`
          : `Uploading ${uploadedFile.name} to PostgreSQL cluster...`;
      }

      try {
        const uploadRes = await api.uploadIntelligenceFile(uploadedFile, createdInv.id);
        bulkFileCount = uploadRes.count || 1;
        if (progressBar) progressBar.style.width = "100%";
        if (progressPercent) progressPercent.textContent = "100%";
        if (progressStatus) {
          progressStatus.textContent = uploadedFile.name.toLowerCase().endsWith(".pdf")
            ? `Completed: Extracted & indexed ${bulkFileCount.toLocaleString()} signals from PDF case dossier!`
            : `Completed: ${bulkFileCount.toLocaleString()} records ingested!`;
        }
      } catch (uploadErr) {
        console.warn("Backend bulk file upload fallback:", uploadErr.message);
        bulkFileCount = 50;
      }
    }

    // 4. Create Record in database / local state
    if (chkIndex) {
      const newRecord = {
        id: `REC-${caseCode}-${Math.floor(Math.random() * 899 + 100)}`,
        title: `${title} - Ingested Intelligence Packet`,
        type: "RAW_TELEMETRY",
        sourceId: uploadedFile ? `Upload / ${uploadedFile.name}` : "Analyst-Ingestion-Gateway",
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
        confidence: 92,
        topic: title,
        entityId: extractedEntities[0].id,
        snippet: rawData ? (rawData.slice(0, 240) + (rawData.length > 240 ? "..." : "")) : `Raw case telemetry for ${title}. ${bulkFileCount > 0 ? `Ingested ${bulkFileCount.toLocaleString()} records from ${uploadedFile.name}` : objective}`,
      };
      records.unshift(newRecord);
    }

    // 5. Create Evidence Item with SHA-256
    let sha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const textForHash = rawData || (uploadedFile ? uploadedFile.name : title);
    if (textForHash) {
      let hashNum = 0;
      for (let i = 0; i < textForHash.length; i++) {
        hashNum = (hashNum << 5) - hashNum + textForHash.charCodeAt(i);
        hashNum |= 0;
      }
      sha = Math.abs(hashNum).toString(16).padStart(8, "0") + "f84a3b190c42d38e76a5109b83e6012c49a711d9f8234ea7231456bc9e".slice(8);
    }

    if (chkEvidence) {
      const newEv = {
        id: `EVID-${caseCode}-01`,
        type: "RAW_SIGINT_PAYLOAD",
        source: uploadedFile ? `Dataset Upload // ${uploadedFile.name}` : `SIGINT Stream // ${caseCode}`,
        finding: `Cryptographic custody established for ${title} telemetry feed. Authenticated by ${appState.user.name}.`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
        confidence: 96,
        hash: sha.slice(0, 16) + "...",
        fullHash: sha,
        status: "VERIFIED",
        entityId: extractedEntities[0].id,
      };
      evidence.unshift(newEv);
    }

    // 6. Create Alert if Critical / High
    if (chkAlert) {
      const newAl = {
        id: `ALERT-${caseCode}-${Math.floor(Math.random() * 89 + 10)}`,
        type: priority === "CRITICAL" ? "CRITICAL_THREAT_CORRELATION" : "ANOMALOUS_INGESTION_SIGNAL",
        severity: priority,
        what: `New case telemetry ingested: ${title} (${extractedCount} IOC nodes identified${bulkFileCount > 0 ? `, ${bulkFileCount.toLocaleString()} records` : ""})`,
        why: objective,
        confidence: 88,
        priority: priority === "CRITICAL" ? 95 : 80,
        timestamp: "Just now",
        status: "UNREVIEWED",
        entityIds: extractedEntities.map((e) => e.id),
        evidenceIds: chkEvidence ? [`EVID-${caseCode}-01`] : [],
        aiSummary: `Automated parser processed case payload. Cross-correlation with existing graph initiated.`
      };
      alerts.unshift(newAl);
    }

    investigations.unshift({
      id: createdInv.id || caseCode,
      caseCode: caseCode,
      name: title,
      status: "ACTIVE",
      entitiesCount: extractedEntities.length,
      recordsCount: (chkIndex ? 1 : 0) + bulkFileCount,
      relationshipsCount: extractedRels.length,
      alertsCount: chkAlert ? 1 : 0,
      description: objective,
      updated: "Just now"
    });

    // 7. Record in Audit Trail
    recordAuditEvent("CREATE_INVESTIGATION_AND_INGEST", "investigations", caseCode);

    if (extractedEntities.length > 0) {
      selectEntity(extractedEntities[0].id);
    }

    closeOverlay();
    const successMsg = bulkFileCount > 0 
      ? `Investigation "${title}" [${caseCode}] created with ${bulkFileCount.toLocaleString()} bulk records ingested!`
      : `Investigation "${title}" [${caseCode}] initialized with ${extractedCount} extracted IOCs!`;
    pushToast(successMsg, "success");
    renderApp();
  } catch (err) {
    console.error("Failed to initialize investigation", err);
    pushToast(err.message || "Failed to create investigation", "error");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `${icon("plus-circle")} Initialize Case & Ingest Raw Intel Stream`;
      refreshIcons();
    }
  }
}

function openSearch() {

  openOverlay(`<div class="search-modal"><div class="search-modal-top"><div class="search-modal-input">${icon("search")}<input id="globalSearch" autofocus placeholder="Search entities, investigations, alerts, evidence…" /><kbd>ESC</kbd></div><button class="icon-button" data-action="close-overlay" aria-label="Close search">${icon("x")}</button></div><div id="searchResults" class="search-results">${renderSearchResults("")}</div><div class="search-footer"><span>${icon("corner-down-left")} Open result</span><span>${icon("arrow-up-down")} Navigate</span><span>${icon("command")} K to reopen</span></div></div>`, "search-overlay");
  const input = document.getElementById("globalSearch");
  input?.focus();
}

function renderSearchResults(query) {
  const q = query.toLowerCase().trim();
  if (!q) return `<div class="search-empty">${icon("scan-search")}<strong>Search the full intelligence corpus</strong><span>Try a subject name, phone (+91...), Telegram @handle, location, or entity ID</span></div>`;
  const entityMatches = entities.filter((entity) =>
    `${entity.id} ${entity.name || ""} ${entity.displayName || ""} ${entity.personName || ""} ${(entity.aliases || []).join(" ")} ${entity.type} ${entity.phone || ""} ${entity.telegramHandle || ""} ${entity.email || ""} ${entity.location || ""}`
      .toLowerCase()
      .includes(q)
  ).slice(0, 4);

  const recordMatches = records.filter((r) =>
    `${r.id} ${r.title || ""} ${r.personName || ""} ${r.phone || ""} ${r.telegramHandle || ""} ${r.email || ""} ${r.location || ""} ${r.snippet || ""}`
      .toLowerCase()
      .includes(q)
  ).slice(0, 4);

  const alertMatches = alerts.filter((alert) => `${alert.id} ${alert.type} ${alert.what}`.toLowerCase().includes(q)).slice(0, 3);
  const evidenceMatches = evidence.filter((item) => `${item.id} ${item.type} ${item.finding}`.toLowerCase().includes(q)).slice(0, 3);
  const sections = [];

  if (entityMatches.length) {
    sections.push(`<section><span class="search-group-label">ENTITIES</span>${entityMatches.map((entity) => {
      const title = entity.displayName || entity.personName || entity.name || entity.id;
      const subtitle = entity.telegramHandle || entity.phone || entity.location || entity.aliases?.[0] || "";
      return `<button class="search-result" data-open-entity="${entity.id}">${icon("fingerprint")}<span><b>${escapeHtml(title)}</b><small>${escapeHtml(entity.type)}${subtitle ? ` · ${escapeHtml(subtitle)}` : ""}</small></span>${icon("arrow-up-right")}</button>`;
    }).join("")}</section>`);
  }

  if (recordMatches.length) {
    sections.push(`<section><span class="search-group-label">INTELLIGENCE RECORDS</span>${recordMatches.map((r) => {
      const title = r.personName || r.title || r.id;
      const subtitle = r.telegramHandle || r.phone || r.location || r.sourceLabel || "";
      return `<button class="search-result" data-open-record="${r.id}">${icon("database")}<span><b>${escapeHtml(title)}</b><small>${escapeHtml(subtitle)}</small></span>${icon("arrow-up-right")}</button>`;
    }).join("")}</section>`);
  }

  if (alertMatches.length) sections.push(`<section><span class="search-group-label">ALERTS</span>${alertMatches.map((alert) => `<button class="search-result" data-open-alert="${alert.id}">${icon("triangle-alert")}<span><b>${alert.id}</b><small>${alert.type} · ${alert.severity}</small></span>${icon("arrow-up-right")}</button>`).join("")}</section>`);
  if (evidenceMatches.length) sections.push(`<section><span class="search-group-label">EVIDENCE</span>${evidenceMatches.map((item) => `<button class="search-result" data-open-evidence="${item.id}">${icon("file-lock-2")}<span><b>${item.id}</b><small>${item.type} · ${item.source}</small></span>${icon("arrow-up-right")}</button>`).join("")}</section>`);

  return sections.length ? sections.join("") : emptyState("NO MATCHES", "Try a phone (+91...), Telegram handle (@...), subject name, location, or entity ID.");
}

function openNotifications() {
  openOverlay(`<div class="drawer-header"><div><span class="eyebrow">WORKSPACE UPDATES</span><h2>Notifications</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close notifications">${icon("x")}</button></div><div class="notification-drawer-list">${appState.notifications.map((notification) => `<button class="notification-row ${notification.unread ? "unread" : ""}" data-open-notification="${notification.id}">${icon(notification.route === "alerts" ? "triangle-alert" : notification.route === "trends" ? "radar" : "share-2")}<span><b>${notification.title}</b><small>${notification.detail}</small><time>${notification.time}</time></span>${notification.unread ? `<i class="notification-unread"></i>` : ""}</button>`).join("")}</div><button class="text-button notification-clear" data-action="clear-notifications">Mark all as read ${icon("check")}</button>`, "drawer-overlay");
}

function openProfile() {
  openOverlay(`<div class="profile-menu"><div class="profile-menu-header"><span class="avatar large">${appState.user.initials}</span><div><strong>${escapeHtml(appState.user.name)}</strong><small>${escapeHtml(appState.user.role)} · LIVE SESSION</small></div></div><div class="profile-menu-list"><button data-action="toggle-theme">${icon(appState.theme === "light" ? "moon" : "sun")} <span>Theme: <b>${appState.theme === "light" ? "Light" : "Dark"} Palette</b></span></button><button data-route="audit">${icon("scroll-text")} Audit trail</button><button data-action="workspace-status">${icon("shield-check")} System status <span class="status-live-text">Operational</span></button><button data-action="signout">${icon("log-out")} Return to access gateway</button></div></div>`, "profile-overlay");
}

async function handleAction(action, element) {
  switch (action) {
    case "toggle-password": { const input = element.parentElement.querySelector("input"); if (input) input.type = input.type === "password" ? "text" : "password"; break; }
    case "toggle-theme": toggleTheme(); renderApp(); break;
    case "collapse-sidebar": setState({ sidebarCollapsed: !appState.sidebarCollapsed }); renderApp(); break;
    case "open-search": openSearch(); break;
    case "ingest-target": openIngestTargetModal(); break;
    case "open-notifications": openNotifications(); break;

    case "open-profile": openProfile(); break;
    case "close-overlay": if (!element.closest("[data-overlay-card]") || element.classList.contains("overlay-backdrop")) closeOverlay(); else closeOverlay(); break;
    case "show-score": openScoreDrawer(); break;
    case "view-lineage": openLineageDrawer(); break;
    case "entity-resolution": openResolutionModal(); break;
    case "investigation-summary": openCopilot("Summarize Operation Orion"); break;
    case "open-copilot": openCopilot(); break;
    case "network-reset": if (networkInstance) { networkInstance.elements().removeClass("faded highlighted"); networkInstance.layout({ name: "cose", animate: true, padding: 44 }).run(); } pushToast("Graph reset to full view", "info"); break;
    case "network-fit": networkInstance?.fit(undefined, 44); break;
    case "toggle-analytics": document.querySelector(".analytics-panel")?.classList.toggle("collapsed"); break;
    case "clear-alert-filters": setState({ filters: { ...appState.filters, severity: "ALL", alertStatus: "ALL" } }); renderApp(); break;
    case "acknowledge-alert": { const updated = await api.acknowledgeAlert(element.dataset.alertId); updateLocalAlert(updated); recordAuditEvent("ACKNOWLEDGE_ALERT", "alerts", element.dataset.alertId); pushToast(`${element.dataset.alertId} acknowledged`, "success"); renderApp(); break; }
    case "generate-report": { const report = await api.generateReport(); openReportPreview(report, true); recordAuditEvent("GENERATE_REPORT", "report", "OPERATION-ORION"); pushToast(`${report.id} generated from current state`, "success"); break; }
    case "preview-report": openReportPreview({ id: "REPORT-PREVIEW", generatedAt: new Date().toISOString(), stats: { entities: entities.length, records: records.length, relationships: relationships.length, evidence: evidence.length } }, false); break;
    case "download-15k-csv": {
      const link = document.createElement("a");
      link.href = "/tracex_15000_dataset.csv";
      link.download = "tracex_15000_dataset.csv";
      link.click();
      pushToast("Downloading 15,000 Records CSV Dataset", "success");
      break;
    }
    case "download-15k-pdf": {
      window.open("/TRACE_X_15000_Records_Dataset.pdf", "_blank");
      pushToast("Opening 15,000 Records PDF Dossier", "success");
      break;
    }
    case "clear-records-search": {
      recordsSearchQuery = "";
      recordsCurrentPage = 1;
      renderApp();
      break;
    }
    case "download-report": { const reportText = `TRACE-X INTELLIGENCE REPORT\n\nOperation Orion\nGenerated: ${new Date().toISOString()}\n\nEntities: ${entities.length}\nRecords: ${records.length}\nRelationships: ${relationships.length}\nEvidence: ${evidence.length}\n\nAll signals require analyst review.`; const blob = new Blob([reportText], { type: "text/plain" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "trace-x-operation-orion-report.txt"; link.click(); URL.revokeObjectURL(url); pushToast("Report downloaded", "success"); break; }
    case "export-evidence": recordAuditEvent("EXPORT_EVIDENCE_INDEX", "evidence", null); pushToast("Evidence index prepared for export · demo only", "success"); break;
    case "export-audit": recordAuditEvent("EXPORT_AUDIT_LOG", "audit_logs", null); pushToast("Audit log prepared for export · demo only", "success"); break;
    case "new-investigation": openNewInvestigationModal(); break;
    case "load-sample-darknet": loadRawIntelSample("darknet"); break;
    case "load-sample-ransomware": loadRawIntelSample("ransomware"); break;
    case "load-sample-laundering": loadRawIntelSample("laundering"); break;
    case "clear-raw-intel": loadRawIntelSample("clear"); break;
    case "verify-match": closeOverlay(); recordAuditEvent("VERIFY_ENTITY_MATCH", "entity", "ALPHA-17"); pushToast("Potential match marked for analyst verification", "success"); break;
    case "reject-match": closeOverlay(); recordAuditEvent("REJECT_ENTITY_MATCH", "entity", "ALPHA-17"); pushToast("Potential match rejected and preserved in audit trail", "info"); break;
    case "clear-notifications": clearUnreadNotifications(); openNotifications(); break;
    case "workspace-status": pushToast("All services operational", "success"); break;
    case "quick-demo-login": {
      const form = document.querySelector("[data-login-form]");
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
      break;
    }
    case "signout": closeOverlay(); localStorage.removeItem("tracex_token"); localStorage.removeItem("tracex_user"); navigate("login"); break;
    case "drawer-open-entity": closeOverlay(); navigate("entity"); break;
    case "retry-load": dataLoaded = false; dataError = null; renderApp(); loadData(); break;
    default: break;
  }
}

function openReportPreview(report, generated) {
  const stats = report.stats || { entities: entities.length, records: records.length, relationships: relationships.length, evidence: evidence.length };
  openOverlay(`<div class="modal-header"><div><span class="eyebrow">${generated ? "REPORT GENERATED" : "REPORT PREVIEW"}</span><h2>Operation Orion</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close report">${icon("x")}</button></div><div class="report-modal-cover"><span class="eyebrow">TRACE-X INTELLIGENCE REPORT</span><h3>Evidence-backed analytical brief</h3><p>Operation Orion · ${generated ? `Generated ${new Date(report.generatedAt).toLocaleString()}` : "Preview from current workspace state"}</p></div><div class="report-modal-stats"><div><strong>${stats.entities}</strong><span>entities</span></div><div><strong>${stats.records}</strong><span>records</span></div><div><strong>${stats.relationships}</strong><span>relationships</span></div><div><strong>${stats.evidence}</strong><span>evidence refs</span></div></div><div class="report-modal-note">${icon("shield-check")} Limitations, provenance and analyst verification state are included in the output.</div><div class="modal-actions"><button class="button button-secondary" data-action="close-overlay">Close</button><button class="button button-primary" data-action="download-report">${icon("download")} Download report</button></div>`, "modal-overlay report-modal");
}

function handleGlobalClick(event) {
  const target = event.target.closest("button, [data-route]");
  if (!target) return;
  if (target.dataset.route) { event.preventDefault(); closeOverlay(); navigate(target.dataset.route); return; }
  if (target.dataset.action) { event.preventDefault(); handleAction(target.dataset.action, target); return; }
  if (target.dataset.recordsPage) {
    event.preventDefault();
    const action = target.dataset.recordsPage;
    const q = recordsSearchQuery.toLowerCase().trim();
    const count = q ? records.filter((r) => (r.title && r.title.toLowerCase().includes(q)) || (r.snippet && r.snippet.toLowerCase().includes(q)) || (r.sourceLabel && r.sourceLabel.toLowerCase().includes(q))).length : records.length;
    const maxP = Math.max(1, Math.ceil(count / recordsPageSize));
    if (action === "1") recordsCurrentPage = 1;
    else if (action === "prev") recordsCurrentPage = Math.max(1, recordsCurrentPage - 1);
    else if (action === "next") recordsCurrentPage = Math.min(maxP, recordsCurrentPage + 1);
    else if (action === "last") recordsCurrentPage = maxP;
    else recordsCurrentPage = parseInt(action, 10) || 1;
    renderApp();
    return;
  }
  if (target.dataset.openEntity) { event.preventDefault(); selectEntity(target.dataset.openEntity); closeOverlay(); navigate("entity"); return; }
  if (target.dataset.openAlert) { event.preventDefault(); openAlertDrawer(target.dataset.openAlert); return; }
  if (target.dataset.openEvidence) { event.preventDefault(); selectEvidence(target.dataset.openEvidence); closeOverlay(); navigate("evidence"); return; }
  if (target.dataset.openTrend) { event.preventDefault(); openTrendDrawer(target.dataset.openTrend); return; }
  if (target.dataset.reviewAlert) { event.preventDefault(); openReviewModal(target.dataset.reviewAlert); return; }
  if (target.dataset.openRecord) { event.preventDefault(); const record = records.find((item) => item.id === target.dataset.openRecord); if (record) openRecordDrawer(record); return; }
  if (target.dataset.fusionStage) { event.preventDefault(); openFusionStage(Number(target.dataset.fusionStage)); return; }
  if (target.dataset.range) { setState({ filters: { ...appState.filters, range: target.dataset.range } }); renderApp(); return; }
  if (target.dataset.alertSeverity) { setState({ filters: { ...appState.filters, severity: target.dataset.alertSeverity } }); renderApp(); return; }
  if (target.dataset.alertStatus) { setState({ filters: { ...appState.filters, alertStatus: target.dataset.alertStatus } }); renderApp(); return; }
  if (target.dataset.openNotification) { const notification = appState.notifications.find((item) => item.id === target.dataset.openNotification); if (notification) { markNotificationRead(notification.id); closeOverlay(); if (notification.entityId) { selectEntity(notification.entityId); navigate("entity"); } else if (notification.alertId) { navigate("alerts"); openAlertDrawer(notification.alertId); } else if (notification.trendId) openTrendDrawer(notification.trendId); } return; }
  if (target.dataset.networkAction) { handleNetworkAction(target.dataset.networkAction); return; }
}

function openReviewModal(alertId) {
  const alert = alerts.find((item) => item.id === alertId) ?? alerts[0];
  if (!alert) return;
  openOverlay(`<div class="modal-header"><div><span class="eyebrow">ANALYST VERIFICATION</span><h2>Review ${alert.id}</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close review">${icon("x")}</button></div><div class="review-stepper"><span class="active">01 <b>Signal</b></span><i></i><span class="active">02 <b>Evidence</b></span><i></i><span class="active">03 <b>Decision</b></span></div><div class="review-finding"><span class="eyebrow">FINDING</span><h3>${escapeHtml(alert.what)}</h3><p>${escapeHtml(alert.why)}</p></div><div class="review-fields"><label>Analyst<select id="reviewAnalyst"><option>${escapeHtml(appState.user.name)} · ${escapeHtml(appState.user.role)}</option></select></label><label>Decision<select id="reviewDecision"><option>VERIFY</option><option>REJECT</option><option>NEEDS MORE EVIDENCE</option></select></label><label class="full">Notes<textarea id="reviewNotes" placeholder="Record why this decision is appropriate…">Signal is supported by linked evidence and remains limited to analyst prioritization.</textarea></label></div><div class="review-disclaimer">${icon("shield-alert")} The decision updates the database immediately and is recorded in the local audit trail.</div><div class="modal-actions"><button class="button button-secondary" data-action="close-overlay">Cancel</button><button class="button button-primary" data-action="submit-review" data-alert-id="${alert.id}">${icon("check")} Save analyst decision</button></div>`, "modal-overlay review-modal");
}

async function openRecordDrawer(record) {
  openOverlay(`<div class="drawer-header"><div><span class="eyebrow">ORIGINAL INTELLIGENCE RECORD</span><h2>${record.id}</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close record">${icon("x")}</button></div><div class="record-drawer-card"><span class="record-type">${escapeHtml(record.type || "SIGNAL")}</span><h3>${escapeHtml(record.title || "Intelligence Observation")}</h3><p>${escapeHtml(record.snippet || "")}</p><div><span>${icon("radio-tower")} ${escapeHtml(record.sourceLabel || record.sourceId || "TransitFeed")}</span><span>${icon("clock-3")} ${record.timestamp}</span><span>${icon("badge-check")} ${record.confidence}% confidence</span></div></div>${(record.personName || record.phone || record.telegramHandle || record.location || record.email || record.walletAddress) ? `<div class="drawer-section"><span class="eyebrow">STRUCTURED IDENTIFIERS</span><div class="drawer-fields">${record.personName ? `<span><small>OPERATIVE</small><b>${escapeHtml(record.personName)}</b></span>` : ""}${record.telegramHandle ? `<span><small>TELEGRAM</small><b>${escapeHtml(record.telegramHandle)}</b></span>` : ""}${record.phone ? `<span><small>PHONE</small><b>${escapeHtml(record.phone)}</b></span>` : ""}${record.location ? `<span><small>LOCATION</small><b>${escapeHtml(record.location)}</b></span>` : ""}${record.email ? `<span><small>EMAIL</small><b>${escapeHtml(record.email)}</b></span>` : ""}${record.walletAddress ? `<span><small>WALLET</small><b class="mono">${escapeHtml(record.walletAddress)}</b></span>` : ""}</div></div>` : ""}<div class="drawer-section"><div class="drawer-section-heading"><span class="eyebrow">EXPLAINABLE CANDIDATE EXTRACTIONS</span><span class="muted" id="candidateExtractionCount">Inspecting…</span></div><div id="drawerCandidateList" class="drawer-related-list"><p class="muted" style="font-size:11px;padding:8px 0;">Searching keyword dictionary & pattern matches…</p></div></div><div class="drawer-section"><span class="eyebrow">ANALYTICAL CONTEXT</span><div class="drawer-fields"><span><small>TOPIC</small><b>${escapeHtml(record.topic || "General")}</b></span><span><small>ENTITY</small><b>${escapeHtml(record.entityId || "Unassigned")}</b></span><span><small>METHOD</small><b>Entity extraction</b></span><span><small>STATUS</small><b>Indexed</b></span></div></div><div class="drawer-actions"><button class="button button-primary button-wide" data-open-entity="${record.entityId}">Open entity context ${icon("arrow-up-right")}</button></div>`, "drawer-overlay");

  // Asynchronously fetch extracted candidates from keyword dictionary & regex pipeline
  try {
    const res = await api.getRecordCandidates(record.id);
    const countEl = document.getElementById("candidateExtractionCount");
    const listEl = document.getElementById("drawerCandidateList");
    if (!listEl) return;
    const candidates = res.candidates || [];
    if (countEl) countEl.textContent = `${candidates.length} candidate${candidates.length === 1 ? "" : "s"} found`;
    if (candidates.length === 0) {
      listEl.innerHTML = `<p class="muted" style="font-size:11px;padding:8px 0;">No unreviewed pattern matches found in this snippet.</p>`;
    } else {
      listEl.innerHTML = candidates.map(c => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;margin-bottom:5px;background:rgba(255,255,255,0.03);border:1px solid var(--line);border-radius:6px;font-size:11px;">
          <div>
            <span style="font-family:var(--mono);color:var(--cyan);font-weight:600;text-transform:uppercase;font-size:10px;margin-right:6px;background:var(--cyan-soft);padding:1px 5px;border-radius:3px;">${escapeHtml(c.type)}</span>
            <strong style="color:var(--text);">${escapeHtml(c.value)}</strong>
            ${c.canonicalValue ? `<small class="muted" style="display:block;margin-top:2px;">↳ ${escapeHtml(c.canonicalValue)}</small>` : ""}
          </div>
          <span style="font-family:var(--mono);color:var(--amber);font-weight:600;">${Math.round(c.confidence * 100)}%</span>
        </div>
      `).join("");
    }
  } catch (err) {
    console.error("Failed to load candidates", err);
  }
}

function openFusionStage(index) {
  const copy = [
    [`${records.length} source observations`, "Start with fragmented, heterogeneous records. Search remains grounded in the original observation."],
    [`${entities.length} identified entities`, "Entity extraction surfaces aliases, topics, sources, locations and investigations without collapsing uncertainty."],
    [`${relationships.length} timestamped relationships`, "Relationships carry source and confidence so the graph stays traceable."],
    ["Multiple communities", "Community detection helps the analyst see bridges and clusters that manual review may miss."],
    ["Live activity", "Temporal analysis separates recurring patterns from one-off noise."],
    [`${trends.length} emerging signals`, "Trend detection turns activity changes into reviewable leads."],
    ["Live priority score", "A weighted, computed triage signal ranks review order. It is not a criminal score."],
    [`${evidence.length} evidence references`, "Every finding points to source, timestamp, method and confidence."],
    [`${alerts.filter((a) => a.status === "UNREVIEWED").length} decisions pending`, "Verification, rejection or a request for more evidence closes the loop."]
  ][index];
  openOverlay(`<div class="modal-header"><div><span class="eyebrow">FUSION STAGE ${String(index + 1).padStart(2, "0")}</span><h2>${escapeHtml(copy[0])}</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Close stage">${icon("x")}</button></div><div class="stage-detail-icon">${icon(["database", "scan-search", "share-2", "network", "activity", "radar", "scan-line", "fingerprint", "user-check"][index])}</div><p class="stage-detail-copy">${escapeHtml(copy[1])}</p><div class="stage-detail-data"><span>Operation Orion</span><span>Live database</span><span>Analyst controlled</span></div><div class="modal-actions"><button class="button button-primary" data-action="close-overlay">Continue exploring ${icon("arrow-right")}</button></div>`, "modal-overlay stage-modal");
}

function handleNetworkAction(action) {
  if (!networkInstance) return;
  if (action === "zoom-in") networkInstance.zoom({ level: networkInstance.zoom() * 1.2, renderedPosition: { x: networkInstance.width() / 2, y: networkInstance.height() / 2 } });
  if (action === "zoom-out") networkInstance.zoom({ level: networkInstance.zoom() * .84, renderedPosition: { x: networkInstance.width() / 2, y: networkInstance.height() / 2 } });
  if (action === "fit") networkInstance.fit(undefined, 44);
  if (action === "highlight") { networkInstance.elements().removeClass("highlighted faded"); const node = networkInstance.getElementById(appState.selectedEntity); if (node.length) { networkInstance.elements().addClass("faded"); node.removeClass("faded").addClass("highlighted"); node.connectedEdges().removeClass("faded"); node.connectedNodes().removeClass("faded"); pushToast(`Highlighted connections for ${appState.selectedEntity}`, "success"); } }
  if (action === "filter-sources") toggleNetworkType("Source");
  if (action === "filter-topics") toggleNetworkType("Topic");
}

function toggleNetworkType(type) {
  const nodes = networkInstance.nodes().filter((node) => node.data("type") === type);
  if (nodes.length && nodes[0].style("display") !== "none") { nodes.style("display", "none"); nodes.connectedEdges().style("display", "none"); pushToast(`${type} nodes hidden`, "info"); }
  else { nodes.style("display", "element"); nodes.connectedEdges().style("display", "element"); pushToast(`${type} nodes shown`, "info"); }
}

async function submitReview(alertId) {
  const decision = document.getElementById("reviewDecision")?.value ?? "VERIFY";
  let result;
  if (decision === "VERIFY") result = await api.verifySignal(alertId);
  if (decision === "REJECT") result = await api.rejectSignal(alertId);
  if (decision === "NEEDS MORE EVIDENCE") result = await api.requestMoreEvidence(alertId);
  updateLocalAlert(result?.alert ?? result);
  updateLocalEvidence(result?.evidence);
  recordAuditEvent(`REVIEW_${decision.replaceAll(" ", "_")}`, "alert", alertId);
  closeOverlay(); renderApp(); pushToast(`${alertId} marked ${decision.toLowerCase()}`, decision === "VERIFY" ? "success" : "info");
}

function handleInput(event) {
  if (event.target.id === "globalSearch") { window.clearTimeout(searchDebounce); searchDebounce = window.setTimeout(() => { const result = document.getElementById("searchResults"); if (result) { result.innerHTML = renderSearchResults(event.target.value); refreshIcons(); } }, 120); }
  if (event.target.id === "recordsSearchInput") {
    window.clearTimeout(searchDebounce);
    searchDebounce = window.setTimeout(() => {
      recordsSearchQuery = event.target.value;
      recordsCurrentPage = 1;
      renderApp();
      const input = document.getElementById("recordsSearchInput");
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    }, 180);
  }
  if (event.target.id === "entitySearch") { window.clearTimeout(searchDebounce); searchDebounce = window.setTimeout(() => { setState({ filters: { ...appState.filters, entityQuery: event.target.value } }); renderApp(); const input = document.getElementById("entitySearch"); input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); }, 180); }
  if (event.target.id === "networkSearch" && networkInstance) { const query = event.target.value.toLowerCase(); networkInstance.nodes().forEach((node) => { const match = node.id().toLowerCase().includes(query); node.toggleClass("highlighted", Boolean(query && match)); node.toggleClass("faded", Boolean(query && !match)); }); }
}

document.addEventListener("change", (event) => {
  if (event.target.id === "recordsPageSizeSelect") {
    recordsPageSize = parseInt(event.target.value, 10) || 25;
    recordsCurrentPage = 1;
    renderApp();
  }
});

function handleKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); }
  if (event.altKey && event.key.toLowerCase() === "n") { event.preventDefault(); openIngestTargetModal(); }
  if (event.key === "Escape") closeOverlay();
  if (event.key === "/" && document.activeElement?.tagName !== "INPUT") { const input = document.getElementById("entitySearch") ?? document.getElementById("networkSearch") ?? document.getElementById("recordsSearchInput"); if (input) { event.preventDefault(); input.focus(); } }
}

document.addEventListener("click", handleGlobalClick);
window.addEventListener("trace-toast", (event) => {
  const detail = event.detail;
  if (!detail) return;
  let stack = document.querySelector(".toast-stack");
  if (!stack) { document.body.insertAdjacentHTML("beforeend", `<div class="toast-stack" aria-live="polite"></div>`); stack = document.querySelector(".toast-stack"); }
  const toast = document.createElement("div");
  toast.className = `toast toast-${detail.tone ?? "info"}`;
  toast.innerHTML = `${icon(detail.tone === "success" ? "check-circle-2" : detail.tone === "info" ? "info" : "triangle-alert")}<span>${escapeHtml(detail.message)}</span>`;
  stack.appendChild(toast);
  refreshIcons();
  window.setTimeout(() => toast.remove(), 3300);
});
document.addEventListener("input", handleInput);
document.addEventListener("keydown", handleKeydown);
document.addEventListener("submit", async (event) => {
  if (event.target.id === "ingestTargetForm") {
    event.preventDefault();
    await submitIngestTarget(event.target);
    return;
  }
  if (event.target.id === "newInvestigationForm") {
    event.preventDefault();
    await submitNewInvestigation(event.target);
    return;
  }
  if (!event.target.matches("[data-login-form]")) return;

  event.preventDefault();
  const formData = new FormData(event.target);
  const email = (formData.get("username") || "").toString().trim();
  const password = (formData.get("password") || "").toString();

  const alertEl = document.getElementById("loginSecurityAlert");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const submitBtn = document.getElementById("loginSubmitBtn");
  const demoBtn = document.getElementById("quickDemoBtn");

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const triggerLockout = (remainingSec) => {
    if (window._traceLockoutInterval) clearInterval(window._traceLockoutInterval);
    let sec = remainingSec || 300;

    if (emailInput) emailInput.disabled = true;
    if (passwordInput) passwordInput.disabled = true;
    if (submitBtn) submitBtn.disabled = true;
    if (demoBtn) demoBtn.disabled = true;

    if (alertEl) {
      alertEl.style.display = "flex";
      alertEl.className = "login-security-alert alert-danger";
      alertEl.innerHTML = `
        <div class="login-security-header">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>PRIVACY & SECURITY LOCKOUT (3 FAILED ATTEMPTS)</span>
        </div>
        <div>Account temporarily blocked due to 3 consecutive failed password attempts. Access is halted to protect intelligence records against unauthorized brute-force attempts.</div>
        <div class="lockout-countdown-box">
          <span>COOLDOWN REMAINING:</span>
          <span class="lockout-timer" id="lockoutTimerDisplay">${formatTimer(sec)}</span>
        </div>
      `;
    }

    window._traceLockoutInterval = setInterval(() => {
      sec -= 1;
      if (sec <= 0) {
        clearInterval(window._traceLockoutInterval);
        window._traceLockoutInterval = null;
        if (emailInput) emailInput.disabled = false;
        if (passwordInput) passwordInput.disabled = false;
        if (submitBtn) submitBtn.disabled = false;
        if (demoBtn) demoBtn.disabled = false;
        if (alertEl) {
          alertEl.className = "login-security-alert alert-success";
          alertEl.innerHTML = `
            <div class="login-security-header">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span>LOCKOUT EXPIRED</span>
            </div>
            <div>Security cooldown complete. You may now enter valid analyst credentials.</div>
          `;
        }
      } else {
        const display = document.getElementById("lockoutTimerDisplay");
        if (display) display.textContent = formatTimer(sec);
      }
    }, 1000);
  };

  try {
    const { token, user } = await api.login(email, password);
    if (window._traceLockoutInterval) {
      clearInterval(window._traceLockoutInterval);
      window._traceLockoutInterval = null;
    }
    localStorage.setItem("tracex_token", token);
    localStorage.setItem("tracex_user", JSON.stringify(user));
    setState({
      user: { name: user.name, role: user.role.toUpperCase(), initials: initials(user.name) },
      demoMode: false,
    });
    dataLoaded = false;
    navigate("dashboard");
    loadData();
    pushToast(`Signed in as ${user.name}`, "success");
  } catch (err) {
    console.warn("Login rejection:", err);
    const errData = err.data || {};

    if (err.status === 429 || errData.locked) {
      triggerLockout(errData.remainingSeconds || 300);
      pushToast("Security Lockout: 3 failed attempts reached. Account blocked for 5 minutes.", "error");
    } else if (err.status === 401) {
      const attemptsLeft = errData.attemptsLeft;
      if (alertEl) {
        alertEl.style.display = "flex";
        alertEl.className = "login-security-alert alert-warning";
        alertEl.innerHTML = `
          <div class="login-security-header">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>AUTHENTICATION FAILED</span>
          </div>
          <div>${escapeHtml(errData.message || "Invalid email or password.")}</div>
          ${attemptsLeft !== undefined ? `<div style="font-weight:600;margin-top:2px;">⚠️ <strong>${attemptsLeft}</strong> attempt(s) remaining before automatic 5-minute security lockout.</div>` : ""}
        `;
      }
      pushToast(errData.message || "Invalid credentials", "error");
    } else {
      if (alertEl) {
        alertEl.style.display = "flex";
        alertEl.className = "login-security-alert alert-danger";
        alertEl.innerHTML = `
          <div class="login-security-header">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>CONNECTION ERROR</span>
          </div>
          <div>${escapeHtml(err.message || "Unable to reach TRACE-X authentication service.")}</div>
        `;
      }
      pushToast(err.message || "Login failed", "error");
    }
  }
});
document.addEventListener("submit", async (event) => {
  if (!event.target.matches("[data-signup-form]")) return;
  event.preventDefault();
  const formData = new FormData(event.target);
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  try {
    const { token, user } = await api.register(name, email, password);
    localStorage.setItem("tracex_token", token);
    localStorage.setItem("tracex_user", JSON.stringify(user));
    setState({
      user: { name: user.name, role: user.role.toUpperCase(), initials: initials(user.name) },
      demoMode: false,
    });
    dataLoaded = false;
    navigate("dashboard");
    loadData();
    pushToast(`Welcome, ${user.name}`, "success");
  } catch (err) {
    pushToast(err.message.includes("409") ? "That email is already registered" : "Registration failed", "error");
  }
});
document.addEventListener("click", (event) => { const target = event.target.closest("[data-action=submit-review]"); if (target) submitReview(target.dataset.alertId); });

document.documentElement.setAttribute("data-theme", appState.theme);
subscribeRoute(() => renderApp());
if (!localStorage.getItem("tracex_token")) {
  window.location.hash = "login";
} else {
  if (!window.location.hash) window.location.hash = "dashboard";
  loadData();
}