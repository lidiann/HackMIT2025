// Background service worker for Eden AI Sustainability Counter
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

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'countTokens') {
    countTokensWithAPI(request.text, request.model, request.expectedOutputTokens)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'openSidebar') {
    // Auto-open sidebar when on Claude.ai
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  }
});

// API call to count tokens
async function countTokensWithAPI(text, model = 'claude-3-5-haiku-20241022', expectedOutputTokens = 200) {
  try {
    const response = await fetch('https://hackmit2025-pf5p.onrender.com/count', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model: model,
        expected_output_tokens: expectedOutputTokens
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error counting tokens:', error);
    throw error;
  }
}
