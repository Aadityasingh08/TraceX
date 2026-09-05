export function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
}

export function icon(name, label = "") {
  return `<i data-lucide="${escapeHtml(name)}"${label ? ` aria-label="${escapeHtml(label)}"` : " aria-hidden=\"true\""}></i>`;
}

export function statusBadge(status, extraClass = "") {
  const normalized = String(status).toLowerCase().replaceAll(" ", "-");
  return `<span class="status-badge status-${normalized} ${extraClass}"><span class="status-dot"></span>${escapeHtml(status)}</span>`;
}

export function priorityBadge(priority) {
  const label = priority >= 85 ? "HIGH" : priority >= 65 ? "MEDIUM" : "LOW";
  return `<span class="priority-badge priority-${label.toLowerCase()}">${label} · ${priority}</span>`;
}

export function emptyState(title, body, action = "") {
  return `<div class="empty-state">${icon("inbox")}<strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p>${action}</div>`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function sectionHeading(eyebrow, title, copy = "", action = "") {
  return `<div class="section-heading"><div><div class="eyebrow">${escapeHtml(eyebrow)}</div><h2>${escapeHtml(title)}</h2>${copy ? `<p>${escapeHtml(copy)}</p>` : ""}</div>${action}</div>`;
}

export function renderIcons() {
  if (window.lucide?.createIcons) window.lucide.createIcons();
}
