import { demoAuditLogs } from "./demo-data.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const sessionAuditEvents = [];

export function recordAuditEvent(action, resource, resourceId = null, actor = null) {
  let userActor = actor;
  if (!userActor) {
    try {
      const stored = localStorage.getItem("tracex_user");
      if (stored) {
        const u = JSON.parse(stored);
        userActor = u.name || "A. Patel";
      }
    } catch (_) {}
  }
  if (!userActor) userActor = "A. Patel";

  const entry = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    actor: userActor,
    action: action || "ANALYST_ACTION",
    resource: resource || "workspace",
    resourceId: resourceId ? String(resourceId) : null,
    timestamp: new Date().toISOString(),
  };

  sessionAuditEvents.unshift(entry);
  return entry;
}

function getToken() {
  return localStorage.getItem("tracex_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401 && !path.startsWith("/auth/")) {
    localStorage.removeItem("tracex_token");
    localStorage.removeItem("tracex_user");
    window.location.hash = "login";
    throw new Error("Session expired");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || `API error ${res.status}: ${path}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

function priorityToScore(label) {
  switch ((label || "").toUpperCase()) {
    case "CRITICAL": return 95;
    case "HIGH": return 80;
    case "MEDIUM": return 60;
    default: return 40;
  }
}

function formatWhy(why) {
  if (!why) return "";
  if (typeof why === "string") return why;
  if (Array.isArray(why.factors)) {
    const total = why.factors.reduce((sum, f) => sum + f.points, 0);
    return `${why.factors.map((f) => `+${f.points} ${f.label}`).join(" · ")} · Total: ${total}`;
  }
  return "";
}

function mapEntity(e) {
  return {
    id: String(e.id),
    code: e.name,
    type: e.type,
    aliases: e.aliases || [],
    sources: e.sources || [],
    priority: priorityToScore(e.priority),
    priorityLabel: e.priority,
    firstObserved: e.firstObserved,
    lastObserved: e.lastObserved,
    activity: e.activity ?? 0,
    community: e.community || null,
    description: e.description,
  };
}

function mapRelationship(r) {
  return {
    id: String(r.id),
    source: String(r.sourceId),
    target: String(r.targetId),
    type: r.type,
    timestamp: r.timestamp,
    confidence: r.confidence,
  };
}

function mapAlert(a) {
  return {
    id: String(a.id),
    type: a.type || "Analytical Signal",
    severity: a.severity,
    priority: a.priority,
    confidence: a.confidence,
    status: a.status,
    entityIds: (a.entityIds || []).map(String),
    evidenceIds: (a.evidenceIds || []).map(String),
    timestamp: a.timestamp,
    what: a.what,
    why: formatWhy(a.why),
    aiSummary: a.aiSummary,
  };
}

function mapTrend(t) {
  let entList = [];
  if (Array.isArray(t.entities)) {
    entList = t.entities;
  } else if (typeof t.entities === "string") {
    try { entList = JSON.parse(t.entities); } catch (_) { entList = []; }
  }
  return {
    id: t.id,
    name: t.name,
    growth: t.growth_percent ?? t.growth ?? 0,
    confidence: t.confidence ?? 0,
    entities: entList.length,
    entityIds: entList.map(String),
    status: t.status,
    color: t.color,
    description: t.description,
  };
}

function mapEvidence(e) {
  return {
    id: e.evidenceId,
    dbId: String(e.id),
    source: e.source,
    timestamp: e.timestamp,
    hash: e.hash,
    fullHash: e.fullHash,
    confidence: e.confidence,
    status: e.status,
    finding: e.finding,
  };
}

function mapInvestigation(inv) {
  return {
    id: String(inv.id),
    caseCode: inv.case_code,
    name: inv.title,
    status: inv.status,
    createdAt: inv.created_at,
  };
}

function mapAuditLog(log) {
  return {
    id: String(log.id),
    actor: log.actorName || "TRACE-X",
    action: log.action,
    resource: log.resource,
    resourceId: log.resourceId ? String(log.resourceId) : null,
    timestamp: log.timestamp,
  };
}

export const api = {
  getInvestigations: async () => {
    const res = await request("/investigations");
    return { ...res, investigations: (res.investigations || []).map(mapInvestigation) };
  },
  getInvestigationSummary: (id) => request(`/investigations/${id}/summary`),
  getEntities: async () => (await request("/entities")).map(mapEntity),
  getEntity: async (id) => mapEntity(await request(`/entities/${id}`)),
  getEntityScore: (id) => request(`/entities/${id}/score`),
  getEntityMatches: (id) => request(`/entities/${id}/matches`),
  getEntityNetworkMetrics: (id) => request(`/entities/${id}/network-metrics`),
  getRelationships: async () => (await request("/relationships")).map(mapRelationship),
  getAlerts: async () => (await request("/alerts")).map(mapAlert),
  getTrends: async () => (await request("/trends")).map(mapTrend),
  getEvidence: async () => (await request("/evidence")).map(mapEvidence),
  getRecords: () => request("/records"),
  getRecordCandidates: (id) => request(`/records/${id}/candidates`),
  analyzeRecord: (id) => request(`/records/${id}/analyze`, { method: "POST" }),
  getCategories: () => request("/categories"),
  getNotifications: () => request("/notifications"),
  getAuditLogs: async () => {
    let backendLogs = [];
    try {
      const res = await request("/audit-logs");
      if (res && Array.isArray(res.logs)) {
        backendLogs = res.logs.map(mapAuditLog);
      }
    } catch (err) {
      // Backend not running or offline, gracefully fallback to demo logs
      console.warn("Audit log backend request fallback to demo baseline:", err.message);
    }

    const baseline = backendLogs.length > 0 ? backendLogs : demoAuditLogs;
    const combined = [...sessionAuditEvents, ...baseline];
    // Deduplicate by ID if needed and sort descending by timestamp
    const seen = new Set();
    const unique = [];
    for (const log of combined) {
      if (!seen.has(log.id)) {
        seen.add(log.id);
        unique.push(log);
      }
    }
    return unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  register: (name, email, password) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),

  verifySignal: async (id) => {
    const res = await request(`/alerts/${id}/verify`, { method: "POST" });
    return { ...res, alert: mapAlert(res.alert), evidence: res.evidence ? mapEvidence(res.evidence) : null };
  },
  rejectSignal: async (id) => {
    const res = await request(`/alerts/${id}/reject`, { method: "POST" });
    return { ...res, alert: mapAlert(res.alert) };
  },
  requestMoreEvidence: async (id) => {
    const res = await request(`/alerts/${id}/request-evidence`, { method: "POST" });
    return { ...res, alert: mapAlert(res.alert) };
  },
  acknowledgeAlert: (id) => request(`/alerts/${id}/acknowledge`, { method: "POST" }).then(mapAlert),

  generateReport: () => request("/reports/generate", { method: "POST" }),
  queryCopilot: (query, context = {}, history = []) =>
    request("/ai/copilot", { method: "POST", body: JSON.stringify({ query, context, history }) }),
  createEntity: async (data) =>
    mapEntity(await request("/entities", { method: "POST", body: JSON.stringify(data) })),
  createRelationship: async (data) =>
    mapRelationship(await request("/relationships", { method: "POST", body: JSON.stringify(data) })),
  createInvestigation: async (data) => {
    try {
      const res = await request("/investigations", { method: "POST", body: JSON.stringify(data) });
      return res.investigation ? mapInvestigation(res.investigation) : { ...data, id: `CASE-${Date.now().toString().slice(-4)}` };
    } catch (err) {
      console.warn("Backend create investigation fallback to local state:", err.message);
      return {
        id: `CASE-${Date.now().toString().slice(-4)}`,
        caseCode: data.caseCode || data.case_code || `CASE-${Date.now().toString().slice(-4)}`,
        name: data.title || data.name || "New Investigation",
        status: data.status || "ACTIVE",
        entities: data.entitiesCount || 8,
        records: data.recordsCount || 35,
        relationships: data.relationshipsCount || 16,
        alerts: data.alertsCount || 3,
        trends: 2,
        updated: "Just now"
      };
    }
  },
};