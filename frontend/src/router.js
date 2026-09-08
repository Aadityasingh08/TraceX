const validRoutes = new Set(["dashboard", "investigations", "map", "threat-map", "entities", "entity", "network", "timeline", "records", "fusion", "trends", "alerts", "evidence", "reports", "audit", "login", "signup"]);
const listeners = new Set();

export function getRoute() {
  const value = window.location.hash.replace(/^#\/?/, "").split("/")[0] || "dashboard";
  if (value === "threat-map") return "map";
  return validRoutes.has(value) ? value : "dashboard";
}

export function navigate(route) {
  const target = route === "threat-map" ? "map" : route;
  const next = validRoutes.has(target) ? target : "dashboard";
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