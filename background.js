// Background service worker for Eden - AI Sustainability Counter

// Import modules
importScripts('api-config.js', 'config.js', 'energy-calculator.js');

// Initialize modules
const config = new Config();
const energyCalculator = new EnergyCalculator();

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'countTokens') {
    countTokens(request.text)
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('Token counting error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  } else if (request.action === 'setApiKey') {
    config.setApiKey(request.apiKey)
      .then(success => {
        sendResponse({ success: success });
      })
      .catch(error => {
        console.error('API key save error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

// Handle extension icon click (fallback for when popup doesn't work)
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked on tab:', tab.url);
  if (tab.url && tab.url.includes('claude.ai')) {
    try {
      // Enable and open side panel
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: true,
        path: 'sidepanel.html'
      });
      
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('Side panel opened for tab:', tab.id);
    } catch (error) {
      console.error('Error opening side panel:', error);
      // Fallback: open popup
      chrome.action.openPopup();
    }
  } else {
    console.log('Not on Claude.ai, opening popup instead');
    chrome.action.openPopup();
  }
});

// Enable side panel on Claude.ai
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('claude.ai')) {
    try {
      await chrome.sidePanel.setOptions({
        tabId: tabId,
        enabled: true,
        path: 'sidepanel.html'
      });
      console.log('Side panel enabled for Claude.ai on tab:', tabId);
    } catch (error) {
      console.error('Error enabling side panel:', error);
    }
  } else if (tab.url && !tab.url.includes('claude.ai')) {
    try {
      await chrome.sidePanel.setOptions({
        tabId: tabId,
        enabled: false
      });
      console.log('Side panel disabled for non-Claude tab:', tab.url);
    } catch (error) {
      console.error('Error disabling side panel:', error);
    }
  }
});

// Alternative method: Listen for side panel events
chrome.sidePanel.onPanelShown.addListener(({ tabId }) => {
  console.log('Side panel shown for tab:', tabId);
});

chrome.sidePanel.onPanelHidden.addListener(({ tabId }) => {
  console.log('Side panel hidden for tab:', tabId);
});

// Count tokens and calculate environmental impact
async function countTokens(text) {
  try {
    let tokenCount;
    
    // Try to use real Anthropic API if configured
    if (config.isApiKeyConfigured()) {
      try {
        tokenCount = await countTokensWithAPI(text);
        console.log(`Real token count from API: ${tokenCount}`);
      } catch (apiError) {
        console.warn('API call failed, falling back to estimation:', apiError);
        tokenCount = estimateTokens(text);
      }
    } else {
      // Fall back to estimation if no API key
      tokenCount = estimateTokens(text);
      console.log(`Estimated token count: ${tokenCount}`);
    }
    
    // Calculate comprehensive environmental impact using the energy calculator
    const impact = energyCalculator.calculateEnvironmentalImpact(tokenCount);
    
    return {
      tokens: impact.tokens,
      energy: impact.energy.total,
      carbon: impact.carbon.total,
      water: impact.water.total,
      inferenceTime: impact.energy.inferenceTime,
      breakdown: {
        energy: impact.energy,
        water: impact.water,
        carbon: impact.carbon,
        multipliers: impact.multipliers
      }
    };
  } catch (error) {
    throw new Error(`Failed to count tokens: ${error.message}`);
  }
}

// Count tokens using Anthropic API
async function countTokensWithAPI(text) {
  const response = await fetch(config.getTokenCountUrl(), {
    method: 'POST',
    headers: config.getApiHeaders(),
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      messages: [
        {
          role: 'user',
          content: text
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.usage?.input_tokens || 0;
}

// Simple token estimation (rough approximation)
function estimateTokens(text) {
  // Very rough estimation: ~4 characters per token for English text
  // This is just for demo - real implementation would use proper tokenization
  const words = text.split(/\s+/).length;
  const chars = text.length;
  return Math.max(words, Math.ceil(chars / 4));
}