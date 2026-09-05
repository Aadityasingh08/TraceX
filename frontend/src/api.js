const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  if (res.status === 401) {
    localStorage.removeItem("tracex_token");
    localStorage.removeItem("tracex_user");
    window.location.hash = "login";
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
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
  return {
    id: t.id,
    name: t.name,
    growth: t.growth_percent,
    confidence: t.confidence,
    entities: (t.entities || []).length,
    entityIds: (t.entities || []).map(String),
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
  getCategories: () => request("/categories"),
  getNotifications: () => request("/notifications"),
  getAuditLogs: async () => {
    const res = await request("/audit-logs");
    return (res.logs || []).map(mapAuditLog);
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
};