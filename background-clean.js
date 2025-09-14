// Background service worker for Eden AI Sustainability Counter
const API_BASE = "https://hackmit2025-pf5p.onrender.com";
const STORAGE_KEY = "eden:latest";

chrome.runtime.onInstalled.addListener(() => {
  console.log('Eden AI Sustainability Counter installed');
});

// Handle side panel opening
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('Error opening side panel:', error);
    // Fallback: open popup
    chrome.action.openPopup();
  }
});

// API call to count tokens
async function handleCountFlow({ sessionId, text, model = 'claude-3-5-haiku-20241022', expectedOutputTokens = 200 }) {
  try {
    // 1) /count
    const countRes = await fetch(`${API_BASE}/count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model, expected_output_tokens: expectedOutputTokens })
    }).then(r => {
      if (!r.ok) throw new Error(`count failed: ${r.status} ${r.statusText}`);
      return r.json();
    });

    // 2) /session/ingest
    await fetch(`${API_BASE}/session/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        tokens_input: countRes.tokens_input,
        tokens_total: countRes.tokens_total_estimate
      })
    }).then(r => {
      if (!r.ok) throw new Error(`ingest failed: ${r.status} ${r.statusText}`);
    });

    // 3) /session/metrics
    const metrics = await fetch(`${API_BASE}/session/metrics?session_id=${encodeURIComponent(sessionId)}`);
    if (!metrics.ok) throw new Error(`metrics failed: ${metrics.status} ${metrics.statusText}`);
    const metricsData = await metrics.json();

    // 4) update local history
    await new Promise(res => {
      chrome.storage.local.get(['edenUsageHistory'], (store) => {
        const hist = store.edenUsageHistory || [];
        hist.unshift({
          tokens: countRes.tokens_total_estimate,
          energy_kwh: countRes.kwh,
          co2_kg: countRes.co2_kg,
          water_l: countRes.water_l,
          timestamp: new Date().toISOString(),
          preview: (text || '').slice(0, 100) + ((text || '').length > 100 ? '...' : '')
        });
        if (hist.length > 100) hist.length = 100;
        chrome.storage.local.set({ edenUsageHistory: hist }, res);
      });
    });

    // 5) persist and broadcast update
    const payload = {
      sessionId,
      turn: {
        tokens_input: countRes.tokens_input,
        tokens_total: countRes.tokens_total_estimate,
        kwh: countRes.kwh,
        co2_kg: countRes.co2_kg,
        water_l: countRes.water_l
      },
      totals: metricsData.totals,
      turns: metricsData.turns,
      ts: Date.now()
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: payload });
    return payload;
  } catch (error) {
    console.error('Error in handleCountFlow:', error);
    throw error;
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'countTokens') {
    // Immediately respond to keep channel alive
    sendResponse({ success: true, status: 'processing' });
    
    // Process in background
    handleCountFlow(request)
      .then(result => {
        chrome.runtime.sendMessage({
          type: 'EDEN_UPDATE',
          payload: result
        });
      })
      .catch(error => {
        console.error('Error processing tokens:', error);
        chrome.runtime.sendMessage({
          type: 'EDEN_ERROR',
          error: error.message
        });
      });
    return false; // Don't keep channel open
  }

  if (request.action === 'rewrite') {
    sendResponse({ success: true, status: 'processing' });
    fetch(`${API_BASE}/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: request.text })
    })
      .then(r => r.json())
      .then(data => {
        chrome.runtime.sendMessage({
          type: 'EDEN_REWRITE',
          payload: data
        });
      })
      .catch(error => {
        chrome.runtime.sendMessage({
          type: 'EDEN_ERROR',
          error: error.message
        });
      });
    return false;
  }

  if (request.action === 'whatif') {
    sendResponse({ success: true, status: 'processing' });
    fetch(`${API_BASE}/whatif`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.payload)
    })
      .then(r => r.json())
      .then(data => {
        chrome.runtime.sendMessage({
          type: 'EDEN_WHATIF',
          payload: data
        });
      })
      .catch(error => {
        chrome.runtime.sendMessage({
          type: 'EDEN_ERROR',
          error: error.message
        });
      });
    return false;
  }

  if (request.action === 'openSidebar') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  }
});
