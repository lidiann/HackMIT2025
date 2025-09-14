// Content script for Eden AI Sustainability Counter
console.log("[CONTENT] Eden AI Sustainability Counter content script loaded");

// Auto-open sidebar when on Claude.ai
try {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    chrome.runtime.sendMessage({ action: "openSidebar" });
  }
} catch (e) {
  console.warn("[CONTENT] Cannot open sidebar:", e);
}

// Monitor for input changes on Claude.ai
const inputSelectors = [
  'textarea[placeholder*="Reply to Claude"]',
  'textarea[placeholder*="Talk to Claude"]',
  'textarea[data-testid="chat-input"]',
  'div[contenteditable="true"][role="textbox"]',
  "textarea.ProseMirror",
  'div.ProseMirror[contenteditable="true"]',
  'textarea[aria-label*="message"]',
  'div[contenteditable="true"]',
  "textarea",
  'input[type="text"]',
];

let lastInputValue = "";
let lastSentValue = "";
let isMonitoring = false;

const API_BASE = "https://hackmit2025-pf5p.onrender.com";

async function fetchDirectCount(
  text,
  model = "claude-3-5-haiku-20241022",
  expectedOutputTokens = 200
) {
  const res = await fetch(`${API_BASE}/count`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model,
      expected_output_tokens: expectedOutputTokens,
    }),
  });
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchScore(text) {
  const res = await fetch(`${API_BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`Score API failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function persistScore(text, scoreData) {
  try {
    chrome.storage.local.get(["edenPromptScores"], (result) => {
      const scores = result.edenPromptScores || [];
      const entry = {
        score: scoreData?.score ?? null,
        suggestions: scoreData?.suggestions ?? [],
        signals: scoreData?.signals ?? {},
        timestamp: new Date().toISOString(),
        text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      };
      scores.unshift(entry);
      if (scores.length > 200) scores.splice(200);
      chrome.storage.local.set({ edenPromptScores: scores });
    });
  } catch (e) {
    console.warn("[CONTENT] Failed to persist score:", e);
  }
}

function sendCount(
  text,
  model = "claude-3-5-haiku-20241022",
  expectedOutputTokens = 200
) {
  return new Promise((resolve, reject) => {
    // If the extension context is missing, fallback to direct API fetch
    if (!chrome || !chrome.runtime || !chrome.runtime.id) {
      console.warn(
        "[CONTENT] Extension context missing; using direct fetch fallback"
      );
      fetchDirectCount(text, model, expectedOutputTokens)
        .then(resolve)
        .catch(reject);
      return;
    }

    try {
      chrome.runtime.sendMessage(
        { action: "countTokens", text, model, expectedOutputTokens },
        (response) => {
          const lastErr = chrome.runtime.lastError;
          if (lastErr) {
            // Common during dev reloads: Extension context invalidated
            if (
              String(lastErr.message || "").includes(
                "Extension context invalidated"
              )
            ) {
              console.warn(
                "[CONTENT] Context invalidated; using direct fetch fallback"
              );
              fetchDirectCount(text, model, expectedOutputTokens)
                .then(resolve)
                .catch(reject);
              return;
            }
            return reject(new Error(lastErr.message));
          }
          if (response && response.success) return resolve(response.data);
          return reject(new Error(response?.error || "Failed to count tokens"));
        }
      );
    } catch (e) {
      if (String(e.message || e).includes("Extension context invalidated")) {
        console.warn(
          "[CONTENT] Caught invalidated context; using direct fetch fallback"
        );
        fetchDirectCount(text, model, expectedOutputTokens)
          .then(resolve)
          .catch(reject);
        return;
      }
      reject(e);
    }
  });
}

// Check if monitoring is enabled
chrome.storage.local.get(["edenMonitoringEnabled"], (result) => {
  isMonitoring = result.edenMonitoringEnabled !== false; // Default to true
  if (isMonitoring) {
    startMonitoring();
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.edenMonitoringEnabled) {
    isMonitoring = changes.edenMonitoringEnabled.newValue;
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
  }
});

function startMonitoring() {
  console.log("[CONTENT] Starting input monitoring...");

  // Monitor existing inputs
  inputSelectors.forEach((selector) => {
    const inputs = document.querySelectorAll(selector);
    inputs.forEach((input) => {
      addInputListener(input);
    });
  });

  // Monitor for new inputs (dynamic content)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          inputSelectors.forEach((selector) => {
            const inputs = node.querySelectorAll
              ? node.querySelectorAll(selector)
              : [];
            inputs.forEach((input) => addInputListener(input));
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also listen for send button clicks (some UIs send without blur/Enter)
  document.addEventListener("click", handlePossibleSendClick, true);
  // Attach a document-level keydown as a safety net
  document.addEventListener("keydown", handleDocumentKeydown, true);
}

function stopMonitoring() {
  console.log("[CONTENT] Stopping input monitoring...");
  // Remove all event listeners
  inputSelectors.forEach((selector) => {
    const inputs = document.querySelectorAll(selector);
    inputs.forEach((input) => {
      input.removeEventListener("input", handleInput);
      input.removeEventListener("keydown", handleKeydown, true);
      input.removeEventListener("blur", handleBlur);
    });
  });

  document.removeEventListener("click", handlePossibleSendClick, true);
  document.removeEventListener("keydown", handleDocumentKeydown, true);
}

function addInputListener(input) {
  if (input.dataset.edenListenerAdded) return;

  input.addEventListener("input", handleInput);
  input.addEventListener("keydown", handleKeydown, true);
  input.addEventListener("blur", handleBlur);
  input.dataset.edenListenerAdded = "true";
}

function handleInput(event) {
  if (!isMonitoring) return;

  const text = event.target.value || event.target.textContent || "";
  if (text.length > 10 && text !== lastInputValue) {
    // Only process meaningful text
    lastInputValue = text;
    console.log("[CONTENT] Input detected:", text.substring(0, 50) + "...");
  }
}

function handleBlur(event) {
  if (!isMonitoring) return;

  const text = event.target.value || event.target.textContent || "";
  if (text.length > 10 && text !== lastSentValue) {
    console.log(
      "[CONTENT] Processing input on blur:",
      text.substring(0, 50) + "..."
    );

    // Send via background, with fallback to direct fetch
    sendCount(text, "claude-3-5-haiku-20241022", 200)
      .then((data) => {
        console.log("[CONTENT] Token count result:", data);
        chrome.storage.local.get(["edenUsageHistory"], (result) => {
          const history = result.edenUsageHistory || [];
          const newEntry = {
            ...data,
            // Normalize for older UI builds
            tokens: data.tokens_total_estimate ?? data.tokens ?? 0,
            energy_kwh: data.kwh ?? data.energy_kwh ?? 0,
            timestamp: new Date().toISOString(),
            text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
          };
          history.unshift(newEntry);
          if (history.length > 100) history.splice(100);
          chrome.storage.local.set({ edenUsageHistory: history });
        });
        // score the prompt in parallel
        fetchScore(text)
          .then((scoreData) => persistScore(text, scoreData))
          .catch((err) =>
            console.warn("[CONTENT] Score error:", err?.message || err)
          );
        lastSentValue = text;
      })
      .catch((err) => {
        console.error("[CONTENT] Error counting tokens:", err?.message || err);
      });
  }
}

function handleKeydown(event) {
  if (!isMonitoring) return;
  if (event.key !== "Enter" || event.shiftKey) return; // ignore Shift+Enter
  const text = event.target.value || event.target.textContent || "";
  if (text.length <= 10) return;
  if (text === lastSentValue) return;
  console.log(
    "[CONTENT] Enter pressed, sending:",
    text.substring(0, 50) + "..."
  );
  sendCount(text, "claude-3-5-haiku-20241022", 200)
    .then((data) => {
      console.log("[CONTENT] Token count result:", data);
      chrome.storage.local.get(["edenUsageHistory"], (result) => {
        const history = result.edenUsageHistory || [];
        const newEntry = {
          ...data,
          tokens: data.tokens_total_estimate ?? data.tokens ?? 0,
          energy_kwh: data.kwh ?? data.energy_kwh ?? 0,
          timestamp: new Date().toISOString(),
          text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        };
        history.unshift(newEntry);
        if (history.length > 100) history.splice(100);
        chrome.storage.local.set({ edenUsageHistory: history });
      });
      fetchScore(text)
        .then((scoreData) => persistScore(text, scoreData))
        .catch((err) =>
          console.warn("[CONTENT] Score error:", err?.message || err)
        );
      lastSentValue = text;
    })
    .catch((err) => {
      console.error("[CONTENT] Error counting tokens:", err?.message || err);
    });
}

function handleDocumentKeydown(event) {
  if (!isMonitoring) return;
  if (event.key !== "Enter" || event.shiftKey) return;
  // Try to resolve the composer text from active element
  const active = document.activeElement;
  const text = (active && (active.value || active.textContent)) || "";
  if (text.length <= 10) return;
  if (text === lastSentValue) return;
  console.log(
    "[CONTENT] Document keydown Enter, sending:",
    text.substring(0, 50) + "..."
  );
  sendCount(text, "claude-3-5-haiku-20241022", 200)
    .then((data) => {
      console.log("[CONTENT] Token count result:", data);
      chrome.storage.local.get(["edenUsageHistory"], (result) => {
        const history = result.edenUsageHistory || [];
        const newEntry = {
          ...data,
          tokens: data.tokens_total_estimate ?? data.tokens ?? 0,
          energy_kwh: data.kwh ?? data.energy_kwh ?? 0,
          timestamp: new Date().toISOString(),
          text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        };
        history.unshift(newEntry);
        if (history.length > 100) history.splice(100);
        chrome.storage.local.set({ edenUsageHistory: history });
      });
      fetchScore(text)
        .then((scoreData) => persistScore(text, scoreData))
        .catch((err) =>
          console.warn("[CONTENT] Score error:", err?.message || err)
        );
      lastSentValue = text;
    })
    .catch((err) => {
      console.error("[CONTENT] Error counting tokens:", err?.message || err);
    });
}

function isSendControl(el) {
  if (!(el instanceof Element)) return false;
  const selectors = [
    'button[type="submit"]',
    'button[aria-label*="Send" i]',
    '[data-testid*="send" i]',
    '[aria-label*="Send message" i]',
  ];
  return selectors.some((sel) => el.closest(sel));
}

function getActiveComposerText(fromEl) {
  // Prefer the focused element if it matches an input selector
  const active = document.activeElement;
  const isMatch = (el) => {
    if (!el || !(el instanceof Element)) return false;
    return inputSelectors.some((sel) => el.matches(sel));
  };
  if (isMatch(active)) {
    return active.value || active.textContent || "";
  }
  // Otherwise, search near the clicked element for a composer
  const scope =
    fromEl instanceof Element ? fromEl.closest("body") || document : document;
  for (const sel of inputSelectors) {
    const candidate = scope.querySelector(sel);
    if (candidate) return candidate.value || candidate.textContent || "";
  }
  return "";
}

function handlePossibleSendClick(event) {
  if (!isMonitoring) return;
  if (!isSendControl(event.target)) return;
  const text = getActiveComposerText(event.target) || "";
  if (text.length <= 10) return;
  if (text === lastSentValue) return;
  console.log(
    "[CONTENT] Send click detected, sending:",
    text.substring(0, 50) + "..."
  );
  sendCount(text, "claude-3-5-haiku-20241022", 200)
    .then((data) => {
      console.log("[CONTENT] Token count result:", data);
      chrome.storage.local.get(["edenUsageHistory"], (result) => {
        const history = result.edenUsageHistory || [];
        const newEntry = {
          ...data,
          tokens: data.tokens_total_estimate ?? data.tokens ?? 0,
          energy_kwh: data.kwh ?? data.energy_kwh ?? 0,
          timestamp: new Date().toISOString(),
          text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        };
        history.unshift(newEntry);
        if (history.length > 100) history.splice(100);
        chrome.storage.local.set({ edenUsageHistory: history });
      });
      lastSentValue = text;
    })
    .catch((err) => {
      console.error("[CONTENT] Error counting tokens:", err?.message || err);
    });
}
