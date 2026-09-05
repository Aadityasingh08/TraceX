const validRoutes = new Set(["dashboard", "investigations", "entities", "entity", "network", "timeline", "fusion", "trends", "alerts", "evidence", "reports", "audit", "login", "signup"]);
const listeners = new Set();

export function getRoute() {
  const value = window.location.hash.replace(/^#\/?/, "").split("/")[0] || "dashboard";
  return validRoutes.has(value) ? value : "dashboard";
}

export function navigate(route) {
  const next = validRoutes.has(route) ? route : "dashboard";
  if (getRoute() === next) {
    listeners.forEach((listener) => listener(next));
    return;
  }
  window.location.hash = next;
}

export function subscribeRoute(listener) {
  listeners.add(listener);
  const handler = () => listener(getRoute());
  window.addEventListener("hashchange", handler);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("hashchange", handler);
  };
}