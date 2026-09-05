const listeners = new Set();

export const appState = {
  user: { name: "A. Patel", role: "INVESTIGATOR", initials: "AP" },
  currentInvestigation: "OPERATION-ORION",
  selectedEntity: "ALPHA-17",
  selectedAlert: "ALERT-009",
  selectedEvidence: "EVD-0087",
  selectedTrend: "TREND-01",
  demoMode: false,
  route: "dashboard",
  sidebarCollapsed: false,
  filters: { range: "30d", severity: "ALL", alertStatus: "ALL", entityQuery: "" },
  notifications: [],
  toast: null,
  lastAction: null
};

export function getState() {
  return appState;
}

export function setState(patch = {}) {
  Object.assign(appState, patch);
  listeners.forEach((listener) => listener(appState));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function selectEntity(id) {
  setState({ selectedEntity: id, lastAction: `Selected ${id}` });
}

export function selectAlert(id) {
  setState({ selectedAlert: id, lastAction: `Opened ${id}` });
}

export function selectEvidence(id) {
  setState({ selectedEvidence: id, lastAction: `Opened ${id}` });
}

export function selectTrend(id) {
  setState({ selectedTrend: id, lastAction: `Opened ${id}` });
}

export function pushToast(message, tone = "info") {
  const toast = { message, tone, id: Date.now() };
  appState.toast = toast;
  window.dispatchEvent(new CustomEvent("trace-toast", { detail: toast }));
  listeners.forEach((listener) => listener(appState));
  window.setTimeout(() => {
    if (appState.toast?.id === toast.id) {
      appState.toast = null;
      listeners.forEach((listener) => listener(appState));
    }
  }, 3200);
}

export function markNotificationRead(id) {
  const notification = appState.notifications.find((item) => item.id === id);
  if (notification) notification.unread = false;
  listeners.forEach((listener) => listener(appState));
}

export function clearUnreadNotifications() {
  appState.notifications.forEach((notification) => { notification.unread = false; });
  listeners.forEach((listener) => listener(appState));
}