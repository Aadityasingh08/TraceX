import { api } from "./api.js";
import { icon, escapeHtml } from "./ui.js";
import { pushToast, selectEntity } from "./state.js";
import { navigate } from "./router.js";

let isCopilotOpen = false;
let isTyping = false;
let chatHistory = [];

const DEFAULT_WELCOME_MESSAGE = {
  role: "assistant",
  content: `### 🤖 TRACE-X AI Intelligence Analyst Online
I am your automated case intelligence copilot for **Operation Orion**.

**How I can assist your investigation:**
- 📋 Synthesize **case briefings** & executive intelligence summaries
- 🎯 Calculate **highest-risk threat nodes** and bridge operators
- 🚨 Triage **unreviewed priority alerts** and recommend review order
- 🌍 Correlate **cross-border telemetry** on the Global Threat Map
- 🔎 Trace connections and anomalous patterns between suspects

*Click one of the tactical chips below or type your inquiry:*`,
  threatLevel: "ELEVATED",
  entities: ["ORION-NODE-03", "ALPHA-17", "MARKET-NODE-08"],
  suggestedActions: [
    { label: "Executive Briefing", query: "Summarize Operation Orion", icon: "file-text" },
    { label: "Highest Risk Targets", query: "Who are the highest risk entities?", icon: "target" },
    { label: "Global Threat Map", route: "map", icon: "globe" }
  ]
};

export function initCopilot() {
  if (document.getElementById("copilotLauncher")) return;

  // Append launcher button and drawer container to DOM
  const launcherHtml = `
    <button id="copilotLauncher" class="copilot-floating-launcher" title="Open TRACE-X AI Copilot (⌘ J)">
      <span class="copilot-pulse-dot"></span>
      <span class="copilot-icon">${icon("sparkles")}</span>
      <span class="copilot-text">AI ANALYST</span>
      <kbd class="copilot-kbd">⌘ J</kbd>
    </button>

    <aside id="copilotDrawer" class="copilot-drawer" aria-label="TRACE-X AI Copilot">
      <header class="copilot-header">
        <div class="copilot-header-brand">
          <span class="copilot-status-dot"></span>
          <div>
            <div class="copilot-eyebrow">INTELLIGENCE COPILOT · DUAL ENGINE</div>
            <h3>TRACE-X AI ANALYST</h3>
          </div>
        </div>
        <div class="copilot-header-actions">
          <button class="icon-button" id="btnCopilotClear" title="Clear conversation">${icon("rotate-ccw")}</button>
          <button class="icon-button" id="btnCopilotClose" title="Close Copilot (ESC)">${icon("x")}</button>
        </div>
      </header>

      <!-- Threat Level Banner -->
      <div class="copilot-threat-banner" id="copilotThreatBanner">
        <span class="threat-indicator">${icon("shield-alert")} THREAT LEVEL: <strong id="copilotThreatLevel">CRITICAL</strong></span>
        <span class="case-tag">OPERATION ORION</span>
      </div>

      <!-- Quick Prompt Chips -->
      <div class="copilot-chips-wrap">
        <div class="copilot-chips-scroll">
          <button class="copilot-chip" data-copilot-prompt="Summarize Operation Orion">
            ${icon("file-text")} Executive Briefing
          </button>
          <button class="copilot-chip" data-copilot-prompt="Who are the highest risk entities?">
            ${icon("target")} Highest Risk Entities
          </button>
          <button class="copilot-chip" data-copilot-prompt="Triage unreviewed high priority signals">
            ${icon("triangle-alert")} Review Signals
          </button>
          <button class="copilot-chip" data-copilot-prompt="Where are the global threat hotspots?">
            ${icon("globe")} Global Threat Hubs
          </button>
          <button class="copilot-chip" data-copilot-prompt="Tell me about ALPHA-17 and its infrastructure">
            ${icon("fingerprint")} Trace ALPHA-17
          </button>
        </div>
      </div>

      <!-- Message Feed -->
      <div class="copilot-messages-container" id="copilotMessagesContainer">
        <!-- Rendered dynamically -->
      </div>

      <!-- Typing Indicator -->
      <div class="copilot-typing-indicator" id="copilotTypingIndicator" style="display: none;">
        <span></span><span></span><span></span>
        <small>TRACE-X AI analyzing database intelligence…</small>
      </div>

      <!-- Input Bar -->
      <form class="copilot-input-form" id="copilotForm">
        <div class="copilot-input-wrap">
          <input
            id="copilotInput"
            type="text"
            placeholder="Ask AI Analyst (e.g. 'Summarize Operation Orion' or 'Who is ALPHA-17?')..."
            autocomplete="off"
          />
          <button type="submit" class="button button-primary copilot-send-btn" id="btnCopilotSend">
            ${icon("arrow-up")}
          </button>
        </div>
        <div class="copilot-input-footnote">
          <span>${icon("shield-check")} Grounded in active PostgreSQL database</span>
          <kbd>Press ↵</kbd>
        </div>
      </form>
    </aside>
  `;

  document.body.insertAdjacentHTML("beforeend", launcherHtml);

  // Initialize conversation with welcome message
  chatHistory = [DEFAULT_WELCOME_MESSAGE];
  renderCopilotMessages();
  setupCopilotListeners();
}

export function openCopilot(prefilledQuery = "") {
  isCopilotOpen = true;
  const drawer = document.getElementById("copilotDrawer");
  const launcher = document.getElementById("copilotLauncher");
  if (drawer) drawer.classList.add("open");
  if (launcher) launcher.classList.add("active");

  const input = document.getElementById("copilotInput");
  if (input) {
    if (prefilledQuery) {
      input.value = prefilledQuery;
      handleCopilotSubmit(prefilledQuery);
    } else {
      input.focus();
    }
  }
}

export function closeCopilot() {
  isCopilotOpen = false;
  const drawer = document.getElementById("copilotDrawer");
  const launcher = document.getElementById("copilotLauncher");
  if (drawer) drawer.classList.remove("open");
  if (launcher) launcher.classList.remove("active");
}

export function toggleCopilot() {
  if (isCopilotOpen) closeCopilot();
  else openCopilot();
}

function renderCopilotMessages() {
  const container = document.getElementById("copilotMessagesContainer");
  if (!container) return;

  container.innerHTML = chatHistory
    .map((msg) => {
      const isUser = msg.role === "user";
      const formattedContent = isUser ? escapeHtml(msg.content) : parseMarkdown(msg.content);

      return `
        <div class="copilot-msg ${isUser ? "user" : "assistant"}">
          <div class="copilot-msg-avatar">
            ${isUser ? icon("user") : icon("bot")}
          </div>
          <div class="copilot-msg-bubble">
            <div class="copilot-msg-content">${formattedContent}</div>

            ${
              msg.suggestedActions && msg.suggestedActions.length > 0
                ? `
              <div class="copilot-msg-actions">
                ${msg.suggestedActions
                  .map(
                    (action) => `
                  <button class="copilot-action-btn" ${action.route ? `data-route="${action.route}"` : `data-copilot-prompt="${escapeHtml(action.query)}"`}>
                    ${icon(action.icon || "arrow-up-right")} <span>${escapeHtml(action.label)}</span>
                  </button>
                `
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");

  container.scrollTop = container.scrollHeight;
}

function parseMarkdown(text) {
  if (!text) return "";

  let html = text
    // Headers
    .replace(/^### (.*$)/gim, "<h4>$1</h4>")
    .replace(/^## (.*$)/gim, "<h3>$1</h3>")
    .replace(/^# (.*$)/gim, "<h2>$1</h2>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`(.*?)`/g, "<code>$1</code>")
    // Lists
    .replace(/^\s*-\s+(.*$)/gim, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>")
    // Line breaks
    .replace(/\n\n/g, "<p></p>")
    .replace(/\n/g, "<br>");

  // Transform Entity codes into interactive clickable tags
  const knownEntities = [
    "ALPHA-17",
    "BETA-04",
    "ORION-NODE-03",
    "MARKET-NODE-08",
    "MARKET-NODE-11",
    "SOURCE-07",
    "NORTH-ROUTE-12",
    "EAST-EXCHANGE-04",
    "DELTA-22",
    "KAPPA-09",
    "ORION-HUB-01",
    "RELAY-NODE-14",
    "ECHO-11"
  ];

  knownEntities.forEach((ent) => {
    const reg = new RegExp(`\\b${ent}\\b`, "g");
    html = html.replace(
      reg,
      `<button class="copilot-entity-pill" data-open-entity="${ent}" title="View entity profile">${icon("fingerprint")} ${ent}</button>`
    );
  });

  return html;
}

async function handleCopilotSubmit(query) {
  const q = query.trim();
  if (!q || isTyping) return;

  // Append user message
  chatHistory.push({ role: "user", content: q });
  renderCopilotMessages();

  // Clear input
  const input = document.getElementById("copilotInput");
  if (input) input.value = "";

  // Show typing indicator
  isTyping = true;
  const indicator = document.getElementById("copilotTypingIndicator");
  if (indicator) indicator.style.display = "flex";

  const container = document.getElementById("copilotMessagesContainer");
  if (container) container.scrollTop = container.scrollHeight;

  try {
    const response = await api.queryCopilot(q, {}, chatHistory);

    // Hide indicator
    if (indicator) indicator.style.display = "none";
    isTyping = false;

    // Update Threat Banner if present
    if (response.threatLevel) {
      const bannerLevel = document.getElementById("copilotThreatLevel");
      if (bannerLevel) bannerLevel.textContent = response.threatLevel;
    }

    // Append AI response
    chatHistory.push({
      role: "assistant",
      content: response.reply,
      threatLevel: response.threatLevel,
      entities: response.entities || [],
      suggestedActions: response.suggestedActions || []
    });

    renderCopilotMessages();
  } catch (err) {
    if (indicator) indicator.style.display = "none";
    isTyping = false;

    chatHistory.push({
      role: "assistant",
      content: "⚠️ **Connection Error:** Could not reach the TRACE-X AI Analyst service. Please confirm the backend server is operational on port 5000.",
      suggestedActions: [{ label: "Retry Query", query: q, icon: "rotate-ccw" }]
    });
    renderCopilotMessages();
  }
}

function setupCopilotListeners() {
  // Launcher click
  const launcher = document.getElementById("copilotLauncher");
  if (launcher) {
    launcher.addEventListener("click", toggleCopilot);
  }

  // Close button
  const closeBtn = document.getElementById("btnCopilotClose");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeCopilot);
  }

  // Clear button
  const clearBtn = document.getElementById("btnCopilotClear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      chatHistory = [DEFAULT_WELCOME_MESSAGE];
      renderCopilotMessages();
      pushToast("AI Copilot conversation cleared", "info");
    });
  }

  // Form submit
  const form = document.getElementById("copilotForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("copilotInput");
      if (input && input.value) {
        handleCopilotSubmit(input.value);
      }
    });
  }

  // Quick chip click
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-copilot-prompt]");
    if (chip) {
      const prompt = chip.dataset.copilotPrompt;
      handleCopilotSubmit(prompt);
      return;
    }

    // Entity pill click inside message
    const pill = e.target.closest(".copilot-entity-pill");
    if (pill) {
      const entityId = pill.dataset.openEntity;
      selectEntity(entityId);
      navigate("entity");
      closeCopilot();
      pushToast(`Opened profile for ${entityId}`, "info");
      return;
    }

    // Action button with route
    const actionBtn = e.target.closest("[data-route]");
    if (actionBtn && actionBtn.closest("#copilotDrawer")) {
      const route = actionBtn.dataset.route;
      navigate(route);
      closeCopilot();
      return;
    }
  });

  // Global Keyboard Shortcut: Ctrl + J or Cmd + J
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
      e.preventDefault();
      toggleCopilot();
    }
    if (e.key === "Escape" && isCopilotOpen) {
      closeCopilot();
    }
  });
}
